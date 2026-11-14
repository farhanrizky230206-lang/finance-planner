/* Arus Finance — UI informasi aktivasi WhatsApp otomatis.
   Tidak mengirim pesan langsung dari browser. Bot server membaca antrean di Supabase.
   Jangan pasang bersamaan dengan arus-wa-mudah.js (hapus script lamanya dahulu).
*/
(() => {
  'use strict';
  if (window.__arusWaAutoUI) return;
  window.__arusWaAutoUI = true;
  const page = document.getElementById('page');
  if (!page) return;
  const styles = document.createElement('style');
  styles.textContent = `
    .arus-wa-auto { margin:12px 0 18px;padding:14px 17px;border:1px solid #d9e9d5;
      background:linear-gradient(120deg,#f5fbf2,#e6f4e4);border-radius:16px;color:#174b38;
      font:500 12px/1.55 'DM Sans',system-ui,sans-serif; }
    .arus-wa-auto strong{font-size:13px;display:block;margin-bottom:3px}
    .arus-wa-auto p{margin:0;color:#577661}
    .arus-wa-auto .arus-wa-status{color:#226444;font-size:11px;font-weight:700;margin-top:7px}
    .arus-wa-hide-old{display:none!important}
  `;
  document.head.appendChild(styles);
  const client = () => window.ARUS_APP_CLIENT;
  let busy = false;
  let queued = false;
  function showMessage(text, status) {
    const el=page.querySelector('.arus-wa-auto'); if(!el) return;
    el.querySelector('[data-message]').textContent=text;
    el.querySelector('[data-status]').textContent=status;
  }
  async function update() {
    if (busy || !client() || !page.querySelector('.arus-wa-auto')) return;
    busy = true;
    try {
      const { data: { user }, error: authError } = await client().auth.getUser();
      if (authError || !user) return;
      const { data: p, error } = await client().from('profiles')
        .select('whatsapp_number,whatsapp_opt_in,whatsapp_verified_at')
        .eq('id',user.id).maybeSingle();
      if (error) throw error;
      if (!p?.whatsapp_opt_in) showMessage('Centang pengingat dan klik Simpan profil. Bot tidak mengirim pesan saat pengingat mati.','Belum diaktifkan');
      else if (p.whatsapp_verified_at) showMessage('Nomor sudah dikonfirmasi. Pengingat anggaran bisa berjalan selama bot online.','✓ Pengingat aktif');
      else showMessage('Bot akan mengirim pesan selamat datang setelah perubahan tersimpan. Saat diterima, cukup balas YA satu kali untuk melindungi data keuanganmu.','Permintaan pengingat tersimpan');
    } catch (err) {
      showMessage('Tidak bisa mengecek status. Periksa koneksi dan coba buka Profil kembali.','Koneksi perlu diperiksa');
      console.warn('Arus WA auto:',err?.message||err);
    } finally {busy=false;}
  }
  function decorate() {
    const form=page.querySelector('#profileForm'); if(!form) return;
    const verifyButton=form.querySelector('[data-action="wa-verify-start"],[data-action="wa-verify-refresh"]');
    const old=verifyButton?.closest('.switch-card');
    if(old)old.classList.add('arus-wa-hide-old');
    const opt=form.querySelector('input[name="whatsapp_opt_in"]');
    if(!opt) return;
    const wrap=opt.closest('.switch-card')||opt.parentElement;
    if(!form.querySelector('.arus-wa-auto')) {
      const note=document.createElement('div');note.className='arus-wa-auto';
      note.innerHTML='<strong>💬 Sambutan WhatsApp otomatis</strong><p data-message>Simpan pengingat untuk meminta pesan dari bot Arus Finance.</p><div class="arus-wa-status" data-status>Memeriksa izin...</div>';
      wrap.after(note);
    }
    if(!queued){queued=true;queueMicrotask(()=>{queued=false;void update();});}
  }
  new MutationObserver(decorate).observe(page,{childList:true});
  page.addEventListener('change',ev=>{
    if(ev.target.matches?.('input[name="whatsapp_opt_in"]')){
      showMessage(ev.target.checked?'Klik Simpan profil untuk mengirim permintaan sambutan otomatis.':'Pengingat akan dimatikan setelah profil disimpan.',ev.target.checked?'Belum disimpan':'Belum disimpan');
    }
  });
  page.addEventListener('submit',ev=>{
    if(ev.target?.id==='profileForm')for(const ms of [900,2000,4500])setTimeout(()=>void update(),ms);
  });
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void update();});
  setInterval(()=>{if(!document.hidden&&page.querySelector('.arus-wa-auto'))void update();},20000);
  decorate();
})();
