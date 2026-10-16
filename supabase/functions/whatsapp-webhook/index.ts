// WhatsApp Cloud API Webhook: verifikasi Meta + terima perintah STOP, STATUS, BANTUAN.
// Deploy dengan verify_jwt=false karena Meta tidak memakai token Supabase.
// POST tetap diamankan via HMAC X-Hub-Signature-256 dan META_APP_SECRET.
import { createClient } from 'npm:@supabase/supabase-js@2';

const url=Deno.env.get('SUPABASE_URL')||'';
const adminKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||Deno.env.get('SUPABASE_SECRET_KEY')||'';
const verifyToken=Deno.env.get('WA_VERIFY_TOKEN')||'';
const appSecret=Deno.env.get('META_APP_SECRET')||'';
const accessToken=Deno.env.get('WA_ACCESS_TOKEN')||'';
const pepper=Deno.env.get('WA_VERIFY_PEPPER')||'';
const phoneId=Deno.env.get('WA_PHONE_NUMBER_ID')||'';
const version=Deno.env.get('WA_API_VERSION')||'v24.0';
const db=createClient(url,adminKey,{auth:{persistSession:false}});

const validSignature=async(raw:string,signature:string)=>{
  if(!appSecret||!/^sha256=[a-f0-9]{64}$/i.test(signature))return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(appSecret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  const hex=signature.substring(7);
  const bytes=new Uint8Array(hex.match(/.{2}/g)!.map(x=>parseInt(x,16)));
  return crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(raw));
};
const replyWA=async(to:string,text:string)=>{
  if(!accessToken||!phoneId)return;
  await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`,{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',to,type:'text',text:{body:text}})});
};
const fmt=(n:number)=>`Rp${Math.round(n).toLocaleString('id-ID')}`;
const digest=async(raw:string)=>{const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(raw));return [...new Uint8Array(sig)].map(b=>b.toString(16).padStart(2,'0')).join('');};

Deno.serve(async(req:Request)=>{
  const uri=new URL(req.url);
  if(req.method==='GET'){
    const mode=uri.searchParams.get('hub.mode');
    const token=uri.searchParams.get('hub.verify_token');
    if(verifyToken&&mode==='subscribe'&&token===verifyToken)return new Response(uri.searchParams.get('hub.challenge')||'');
    return new Response('Forbidden',{status:403});
  }
  if(req.method!=='POST')return new Response('Method not allowed',{status:405});
  const raw=await req.text();
  if(!(await validSignature(raw,req.headers.get('x-hub-signature-256')||'')))return new Response('Invalid signature',{status:403});
  const event=JSON.parse(raw);
  for(const entry of event.entry||[]){for(const change of entry.changes||[]){
    for(const msg of change.value?.messages||[]){
      if(msg.type!=='text')continue;
      const from=String(msg.from||'').replace(/\D/g,'');
      const input=String(msg.text?.body||'').trim().toUpperCase();
      if(!/^62[1-9][0-9]{7,12}$/.test(from))continue;
      if(!['STOP','BERHENTI','STATUS','BANTUAN','HELP'].includes(input)&&!/^VERIFIKASI\s+\d{6}$/.test(input))continue;
      const {data:profiles}=await db.from('profiles').select('id,whatsapp_opt_in,whatsapp_verified_at,wa_challenge_hash,wa_challenge_expires').eq('whatsapp_number',from).limit(50);
      if(!profiles?.length){await replyWA(from,'Nomor ini belum terdaftar di Arus. Daftar dulu di website Arus.');continue;}
      if(input.startsWith('VERIFIKASI ')){
        const code=input.split(/\s+/)[1];let accepted=false;
        if(pepper){for(const profile of profiles){
          if(!profile.wa_challenge_hash||!profile.wa_challenge_expires||Date.parse(profile.wa_challenge_expires)<Date.now())continue;
          const h=await digest(`${profile.id}:${code}`);
          if(h===profile.wa_challenge_hash){
            const {error:e}=await db.from('profiles').update({whatsapp_verified_at:new Date().toISOString(),wa_challenge_hash:null,wa_challenge_expires:null}).eq('id',profile.id);
            if(!e)accepted=true;
          }
        }}
        await replyWA(from,accepted?'✅ Nomor WhatsApp berhasil diverifikasi. Pengingat aktif bila kamu mengizinkannya di Profil Arus.':'Kode salah atau sudah kedaluwarsa. Minta kode baru dari menu Profil Arus.');
      }else if(input==='STOP'||input==='BERHENTI'){
        await db.from('profiles').update({whatsapp_opt_in:false}).eq('whatsapp_number',from);
        await replyWA(from,'Pengingat WhatsApp Arus sudah dimatikan. Kamu bisa mengaktifkannya lagi lewat menu Profil di website.');
      }else if(input==='STATUS'){
        const verified=profiles.find((x:any)=>x.whatsapp_verified_at);if(!verified){await replyWA(from,'Verifikasi nomor WhatsApp lebih dulu lewat menu Profil di website Arus.');continue;}const id=verified.id;
        const nowParts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit'}).formatToParts(new Date());
        const value=(t:string)=>nowParts.find(p=>p.type===t)?.value||'';
        const month=`${value('year')}-${value('month')}`;
        const {data:book}=await db.from('finance_books').select('content').eq('user_id',id).maybeSingle();
        const c=book?.content;
        const budget=(Object.values(c?.months?.[month]?.budgets||{}) as unknown[]).reduce<number>((n,x)=>n+Math.max(0,Number(x)||0),0);
        const expense=(c?.transactions||[]).filter((t:any)=>t.type==='expense'&&String(t.date).slice(0,7)===month).reduce((a:number,t:any)=>a+Math.max(0,Number(t.amount)||0),0);
        await replyWA(from,budget>0?`Arus ${month}\nPengeluaran: ${fmt(expense)}\nAnggaran: ${fmt(budget)}\nSisa anggaran: ${fmt(budget-expense)}\n${expense>budget?'⚠️ Melebihi anggaran. Yuk berhemat!':'Tetap jaga pengeluaran, ya!'}`:'Belum ada anggaran bulanan. Atur dulu di menu Rencana pada website Arus.');
      }else{
        await replyWA(from,'Bot Arus: kirim STATUS untuk cek pengeluaran, STOP untuk mematikan pesan otomatis. Verifikasi nomor dari menu Profil (kirim VERIFIKASI kode). Untuk mengaktifkan lagi, buka website Arus > Profil.');
      }
    }
  }}
  return new Response('EVENT_RECEIVED',{status:200});
});
