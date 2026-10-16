import { createClient } from 'npm:@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, apikey, x-client-info, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
Deno.serve(async(req:Request)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
  if(req.method!=='POST')return reply({error:'Method'},405);
  const body=await req.json().catch(()=>({}));
  if(body.confirmation!=='HAPUS')return reply({error:'Konfirmasi diperlukan'},400);
  const jwt=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
  const url=Deno.env.get('SUPABASE_URL')||'',pub=Deno.env.get('SUPABASE_ANON_KEY')||Deno.env.get('SUPABASE_PUBLISHABLE_KEY')||'',secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||Deno.env.get('SUPABASE_SECRET_KEY')||'';
  if(!url||!pub||!secret)return reply({error:'Server tidak dikonfigurasi'},503);
  const auth=createClient(url,pub,{auth:{persistSession:false}});
  const {data:{user},error}=await auth.auth.getUser(jwt);
  if(error||!user)return reply({error:'Unauthorized'},401);
  const admin=createClient(url,secret,{auth:{persistSession:false}});
  const {error:deleteErr}=await admin.auth.admin.deleteUser(user.id);
  if(deleteErr)return reply({error:'Penghapusan gagal'},500);
  return reply({ok:true});
});
