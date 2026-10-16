// Supabase Edge Function: budget-alert (dipanggil setelah transaksi/rencana disimpan).
// Kunci WA dan service_role hanya boleh ada di Supabase Secrets.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods':'POST, OPTIONS' };
const reply = (body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const base=(Deno.env.get('SUPABASE_URL')||'');
const pub=(Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||'');
const service=(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||Deno.env.get('SUPABASE_SECRET_KEY')||'');
const tokenWA=(Deno.env.get('WA_ACCESS_TOKEN')||'');
const phoneId=(Deno.env.get('WA_PHONE_NUMBER_ID')||'');
const version=(Deno.env.get('WA_API_VERSION')||'v24.0');
const template=(Deno.env.get('WA_TEMPLATE_NAME')||'arus_budget_warning');
const lang=(Deno.env.get('WA_TEMPLATE_LANG')||'id');
const admin=createClient(base,service,{auth:{persistSession:false,autoRefreshToken:false}});
const rupiah=(n:number)=>`Rp${Math.round(n).toLocaleString('id-ID')}`;

Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return reply({error:'Method tidak didukung'},405);
  if(!base||!pub||!service)return reply({error:'Supabase Secrets belum siap'},503);
  const bearer=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  if(!bearer)return reply({error:'Harus login'},401);
  const auth=createClient(base,pub,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:{user},error:authError}=await auth.auth.getUser(bearer);
  if(authError||!user)return reply({error:'Sesi tidak valid'},401);
  const {month_key:monthKey}=await req.json().catch(()=>({month_key:''}));
  // Jangan kirim alert retrospektif untuk transaksi bulan-bulan lama.
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit'}).formatToParts(new Date());
  const part=(type:string)=>parts.find(x=>x.type===type)?.value||'';
  const jakartaMonth=`${part('year')}-${part('month')}`;
  if(monthKey!==jakartaMonth)return reply({ok:true,skipped:'not-current-month'});
  const [profileResult,bookResult]=await Promise.all([
    admin.from('profiles').select('full_name, whatsapp_number, whatsapp_opt_in, whatsapp_verified_at').eq('id',user.id).maybeSingle(),
    admin.from('finance_books').select('content').eq('user_id',user.id).maybeSingle()
  ]);
  if(profileResult.error||bookResult.error)return reply({error:'Gagal membaca anggaran'},500);
  const profile=profileResult.data, book=bookResult.data?.content;
  if(!profile?.whatsapp_opt_in||!profile.whatsapp_number)return reply({ok:true,skipped:'no-consent'});
  if(!profile.whatsapp_verified_at)return reply({ok:true,skipped:'phone-not-verified'});
  const plans=book?.months?.[monthKey];
  const budget=(Object.values(plans?.budgets||{}) as unknown[]).reduce<number>((sum,v)=>sum+(Number.isFinite(Number(v))&&Number(v)>0?Number(v):0),0);
  if(!Number.isFinite(budget)||budget<=0)return reply({ok:true,skipped:'no-budget'});
  const spent=(Array.isArray(book?.transactions)?book.transactions:[])
    .filter((x:any)=>x&&x.type==='expense'&&typeof x.date==='string'&&x.date.slice(0,7)===monthKey)
    .reduce((sum:number,x:any)=>sum+(Number.isFinite(Number(x.amount))&&Number(x.amount)>0?Number(x.amount):0),0);
  let kind:'warning_80'|'over_100'|null=null;
  if(spent>budget)kind='over_100';
  else if(spent>=budget*0.8)kind='warning_80';
  if(!kind)return reply({ok:true,skipped:'under-threshold'});
  if(!tokenWA||!phoneId)return reply({ok:false,skipped:'whatsapp-not-configured'},503);
  // Claim unique key before sending; same month+kind cannot dispatch twice.
  const {data:claimed,error:claimError}=await admin.from('notification_logs').insert({user_id:user.id,month_key:monthKey,kind,status:'pending'}).select('id').single();
  if(claimError){if(claimError.code==='23505')return reply({ok:true,skipped:'already-notified'});return reply({error:'Gagal reservasi notifikasi'},500);}
  const logId=claimed.id;
  const name=String(profile.full_name||'teman').slice(0,60);
  const payload={messaging_product:'whatsapp',to:profile.whatsapp_number,type:'template',template:{name:template,language:{code:lang},components:[{type:'body',parameters:[
    {type:'text',text:name},
    {type:'text',text:monthKey},
    {type:'text',text:rupiah(spent)},
    {type:'text',text:rupiah(budget)}
  ]}]}};
  try{
    const resp=await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`,{method:'POST',headers:{Authorization:`Bearer ${tokenWA}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const result=await resp.json().catch(()=>({}));
    if(!resp.ok){await admin.from('notification_logs').update({status:'failed',last_error:JSON.stringify(result).slice(0,400)}).eq('id',logId);return reply({ok:false,error:'WhatsApp API menolak pesan. Periksa Secrets, template, dan izin nomor.'},502);}
    await admin.from('notification_logs').update({status:'sent',api_message_id:result.messages?.[0]?.id||null}).eq('id',logId);
    return reply({ok:true,kind,sent:true});
  }catch(err){await admin.from('notification_logs').update({status:'failed',last_error:String(err).slice(0,400)}).eq('id',logId);return reply({ok:false,error:'Jaringan WhatsApp gagal'},502);}
});
