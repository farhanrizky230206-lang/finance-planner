// OTP WhatsApp: kode enam digit dibuktikan lewat pesan WhatsApp masuk.
import { createClient } from 'npm:@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, x-client-info, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const digest=async(code:string,pepper:string)=>{
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pepper),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const buffer=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(code));
  return [...new Uint8Array(buffer)].map(x=>x.toString(16).padStart(2,'0')).join('');
};
Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  const url=Deno.env.get('SUPABASE_URL')||'',pub=Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||'',svc=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||Deno.env.get('SUPABASE_SECRET_KEY')||'',pepper=Deno.env.get('WA_VERIFY_PEPPER')||'';
  if(!url||!pub||!svc||pepper.length<20)return reply({error:'Verifikasi WhatsApp belum dikonfigurasi'},503);
  const jwt=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  const auth=createClient(url,pub,{auth:{persistSession:false}});
  const {data:{user},error}=await auth.auth.getUser(jwt);
  if(error||!user)return reply({error:'Login diperlukan'},401);
  const admin=createClient(url,svc,{auth:{persistSession:false}});
  const {data:p,error:profileErr}=await admin.from('profiles').select('whatsapp_number,whatsapp_verified_at').eq('id',user.id).maybeSingle();
  if(profileErr||!p?.whatsapp_number)return reply({error:'Simpan nomor WA di Profil dahulu'},400);
  if(p.whatsapp_verified_at)return reply({ok:true,already_verified:true});
  const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1_000_000).padStart(6,'0');
  const expires=new Date(Date.now()+10*60*1000).toISOString();
  const hash=await digest(`${user.id}:${code}`,pepper);
  const {error:writeErr}=await admin.from('profiles').update({wa_challenge_hash:hash,wa_challenge_expires:expires}).eq('id',user.id);
  if(writeErr)return reply({error:'Tidak bisa membuat kode'},500);
  return reply({ok:true,code,expires_in_seconds:600});
});
