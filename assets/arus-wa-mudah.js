/* Arus Finance • Aktivasi WA satu-ketuk untuk bot QR/Baileys lama.
   Tidak mengubah status verifikasi melalui browser.
   Verifikasi hanya terjadi setelah bot menerima pesan dari nomor yang bersangkutan.
   Integrasi: app.html -> setelah script utama dan arus-profile-modern.js.
*/
(() => {
  'use strict';
  if (window.__arusWaMudahInstalled) return;
  window.__arusWaMudahInstalled = true;

  const CSS = `
    .arus-wa-easy {border:1px solid #dce9db;border-radius:17px;padding:15px 17px;
      margin:13px 0 20px;background:linear-gradient(130deg,#f7fbf3,#e9f6e8);
      color:#184634;font:500 13px/1.55 'DM Sans',system-ui,sans-serif;}
    .arus-wa-easy-top {display:flex;align-items:flex-start;gap:11px;}
    .arus-wa-easy-icon {width:39px;height:39px;display:grid;place-items:center;border-radius:13px;
      background:#d7ecd3;flex-shrink:0;font-size:20px;}
    .arus-wa-easy-text {flex:1;min-width:0;}
    .arus-wa-easy strong {font-size:14px;font-weight:800;display:block;color:#153e31;}
    .arus-wa-easy p {margin:3px 0 0;color:#648273;font-size:12px;}
    .arus-wa-easy-btn {border:0;border-radius:12px;background:#174b38;color:#fff;font:800 13px 'DM Sans',system-ui,sans-serif;
      padding:11px 15px;margin-top:12px;width:100%;cursor:pointer;}
    .arus-wa-easy-btn:disabled {opacity:.5;cursor:not-allowed;}
    .arus-wa-easy-message {font-size:11px!important;margin-top:9px!important;}
    .arus-wa-easy--ok {border-color:#c6e3c5;background:#eaf7e9;}
    .arus-wa-legacy {display:none!important;}
  `;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const page = document.getElementById('page');
  if (!page) return;
  let scheduled = false;
  let checking = false;
  let lastPoll = 0;
  let waitingUntil = 0;
  let currentUid = '';
  const norm = (v) => {
    let s = String(v || '').replace(/\D/g, '');
    if (s.startsWith('0')) s = '62' + s.slice(1);
    if (s.startsWith('8')) s = '62' + s;
    return /^62[1-9][0-9]{7,12}$/.test(s) ? s : '';
  };
  const config = () => window.ARUS_CONFIG || {};
  const client = () => window.ARUS_APP_CLIENT || null;

  function card() { return page.querySelector('#arus-wa-easy'); }
  function updateText(title, description, buttonLabel, disabled, ok = false) {
    const root = card();
    if (!root) return;
    // Label kecil pada kartu Profil Modern mengikuti hasil aktual, bukan sekadar checkbox.
    const pill = page.querySelector('.arus-profile-status .arus-status-label');
    if (pill) pill.textContent = ok ? 'Pengingat WhatsApp: Terhubung' : 'Pengingat WhatsApp: Belum terhubung';
    root.querySelector('[data-wa-title]').textContent = title;
    root.querySelector('[data-wa-desc]').textContent = description;
    root.classList.toggle('arus-wa-easy--ok', ok);
    const button = root.querySelector('[data-wa-connect]');
    button.textContent = buttonLabel;
    button.disabled = Boolean(disabled);
    button.hidden = Boolean(ok);
  }

  function decorate() {
    const form = page.querySelector('#profileForm');
    if (!form) return;
    // Hanya sembunyikan kartu verifikasi lama, bukan checkbox persetujuan WA.
    const legacyBtn = form.querySelector('[data-action="wa-verify-start"], [data-action="wa-verify-refresh"]');
    const legacyCard = legacyBtn?.closest('.switch-card');
    if (legacyCard) legacyCard.classList.add('arus-wa-legacy');
    if (card()) return;
    const root = document.createElement('section');
    root.id = 'arus-wa-easy';
    root.className = 'arus-wa-easy';
    root.setAttribute('aria-label', 'Sambungkan pengingat WhatsApp');
    root.innerHTML = '<div class="arus-wa-easy-top"><div class="arus-wa-easy-icon" aria-hidden="true">💬</div><div class="arus-wa-easy-text"><strong data-wa-title>Pengingat WhatsApp</strong><p data-wa-desc>Memeriksa akun...</p></div></div><button type="button" class="arus-wa-easy-btn" data-wa-connect>Hubungkan WhatsApp</button><p class="arus-wa-easy-message">Tidak perlu mengetik kode atau memeriksa status manual. Pengingat hanya aktif setelah nomor berhasil dikonfirmasi.</p>';
    const opt = form.querySelector('input[name="whatsapp_opt_in"]');
    const switchCard = opt?.closest('.switch-card');
    if (legacyCard?.parentNode) legacyCard.after(root);
    else if (switchCard?.parentNode) switchCard.after(root);
    else form.prepend(root);
    void refresh();
  }

  async function refresh(force = false) {
    const root = card();
    if (!root || !client() || checking) return;
    const now = Date.now();
    if (!force && now - lastPoll < 3000) return;
    checking = true;
    lastPoll = now;
    try {
      const {data: {user}, error: authErr} = await client().auth.getUser();
      if (authErr || !user) { currentUid = ''; updateText('Masuk untuk menghubungkan', 'Silakan login ke Arus Finance terlebih dahulu.', 'Hubungkan WhatsApp', true); return; }
      currentUid = user.id;
      const {data: prof, error} = await client().from('profiles')
        .select('whatsapp_number,whatsapp_opt_in,whatsapp_verified_at')
        .eq('id', user.id).maybeSingle();
      if (error) throw error;
      const opt = card()?.closest('form')?.querySelector('input[name="whatsapp_opt_in"]');
      const phone = card()?.closest('form')?.querySelector('input[name="whatsapp_number"]');
      const pending = !!opt?.checked;
      const typed = norm(phone?.value);
      const saved = norm(prof?.whatsapp_number);
      if (!pending) {
        updateText('Pengingat WhatsApp nonaktif','Centang izin pengingat di atas jika kamu ingin menerima pemberitahuan anggaran.','Hubungkan WhatsApp',true);
      } else if (!saved || typed !== saved || !prof?.whatsapp_opt_in) {
        updateText('Simpan profil terlebih dahulu','Pastikan nomor WhatsApp sudah benar, lalu klik Simpan profil & preferensi.','Hubungkan WhatsApp',true);
      } else if (prof.whatsapp_verified_at) {
        waitingUntil = 0;
        updateText('Pengingat WhatsApp siap ✅','Nomor terhubung. Peringatan anggaran akan dikirim otomatis saat bot berjalan.','Terhubung',true,true);
      } else if (!norm(config().businessWhatsAppNumber)) {
        updateText('Bot belum dikonfigurasi','Pengelola harus mengisi businessWhatsAppNumber di config.js dengan nomor bot Arus.','Hubungkan WhatsApp',true);
      } else {
        updateText('Hubungkan WhatsApp satu kali','Tekan tombol berikut, lalu kirim pesan yang sudah terisi di WhatsApp. Setelah itu Arus akan mengecek secara otomatis.',waitingUntil > Date.now() ? 'Buka WhatsApp lagi' : 'Hubungkan WhatsApp',false);
      }
    } catch (err) {
      updateText('Tidak dapat memeriksa nomor', 'Cek internet atau koneksi Supabase, lalu buka Profil kembali.','Hubungkan WhatsApp',true);
      console.warn('Arus WA: gagal memeriksa status', err?.message || err);
    } finally { checking = false; }
  }

  page.addEventListener('click', (event) => {
    const btn = event.target.closest?.('[data-wa-connect]');
    if (!btn || btn.disabled) return;
    const bot = norm(config().businessWhatsAppNumber);
    if (!bot) return;
    const waLink = `https://wa.me/${bot}?text=${encodeURIComponent('AKTIFKAN')}`;
    waitingUntil = Date.now() + 3 * 60 * 1000;
    // Dipicu secara langsung oleh klik sehingga tidak diblokir sebagai popup otomatis.
    window.open(waLink, '_blank', 'noopener,noreferrer');
    void refresh(true);
  });

  page.addEventListener('change', (event) => {
    if (event.target.matches?.('input[name="whatsapp_opt_in"], input[name="whatsapp_number"]')) void refresh(true);
  });
  page.addEventListener('input', (event) => {
    if (event.target.matches?.('input[name="whatsapp_number"]')) void refresh(true);
  });
  page.addEventListener('submit', (event) => {
    if (event.target?.id === 'profileForm') {
      // Handler lama menyimpan profil. Baca ulang data setelah prosesnya selesai.
      for (const delay of [700, 1700, 3500]) setTimeout(() => void refresh(true), delay);
    }
  });

  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; decorate(); });
  });
  observer.observe(page, {childList: true, subtree: false});
  window.addEventListener('focus', () => void refresh(true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void refresh(true); });
  setInterval(() => {
    if (!document.hidden && card() && (waitingUntil > Date.now() || Date.now() - lastPoll > 45000)) void refresh(true);
  }, 5000);
  decorate();
})();
