/*
 * Arus Finance — otomatis keluar setelah 15 menit tidak aktif (v1)
 * Dipasang di app.html setelah skrip utama.
 * Membutuhkan variabel Supabase `client` dari app.html yang sudah ada.
 * Tidak pernah memuat key rahasia dan tidak menyentuh data keuangan.
 */
(() => {
  'use strict';
  if (window.__arusIdleLogoutInstalled) return;
  window.__arusIdleLogoutInstalled = true;

  const BATAS_MS = 15 * 60 * 1000;
  const KUNCI = 'arus-finance:last-active:v1';
  const PESAN = 'Sesi berakhir setelah 15 menit tidak aktif. Silakan masuk kembali.';
  const supabaseClient = typeof client !== 'undefined' ? client : null;
  if (!supabaseClient?.auth) {
    console.warn('[Arus] Auto-logout: Supabase belum dikonfigurasi.');
    return;
  }

  let userId = null;
  let siap = false;
  let sedangKeluar = false;
  let terakhirDitulis = 0;

  function bacaWaktu() {
    try {
      const data = JSON.parse(localStorage.getItem(KUNCI) || 'null');
      return data?.userId === userId && Number.isFinite(data?.at) ? data.at : null;
    } catch { return null; }
  }

  function simpanAktivitas(paksa = false) {
    if (!userId || sedangKeluar) return;
    const sekarang = Date.now();
    if (!paksa && sekarang - terakhirDitulis < 5000) return;
    try { localStorage.setItem(KUNCI, JSON.stringify({userId, at: sekarang})); } catch {}
    terakhirDitulis = sekarang;
  }

  async function keluarkanAkun() {
    if (!userId || sedangKeluar) return;
    sedangKeluar = true;
    try {
      // 'local' = hanya sesi pada browser/perangkat ini, bukan seluruh perangkat.
      const {error} = await supabaseClient.auth.signOut({scope: 'local'});
      if (error) console.warn('[Arus] Logout:', error.message);
    } catch (err) {
      console.warn('[Arus] Logout belum berhasil:', err);
    } finally {
      userId = null;
      try { localStorage.removeItem(KUNCI); } catch {}
      // Memakai UI login yang sudah disediakan website Arus Finance.
      if (typeof showAuth === 'function') showAuth();
      if (typeof renderAuth === 'function' && typeof authMessage !== 'undefined') {
        authMessage = PESAN;
        renderAuth();
      }
      sedangKeluar = false;
    }
  }

  function periksa(ev) {
    if (!siap || !userId || sedangKeluar) return false;
    const terakhir = bacaWaktu();
    if (terakhir !== null && Date.now() - terakhir >= BATAS_MS) {
      // Jangan jalankan klik pada dashboard kalau masa sesi sudah habis.
      if (ev?.cancelable) ev.preventDefault();
      ev?.stopImmediatePropagation?.();
      void keluarkanAkun();
      return true;
    }
    return false;
  }

  function aktivitas(ev) {
    if (!siap || !userId || sedangKeluar) return;
    if (periksa(ev)) return;
    if (!document.hidden) simpanAktivitas();
  }

  // Aktivitas di website memperpanjang hitungan 15 menit.
  document.addEventListener('pointerdown', aktivitas, true);
  document.addEventListener('keydown', aktivitas, true);
  document.addEventListener('scroll', aktivitas, {capture: true, passive: true});

  // Periksa juga ketika pindah tab, kembali, atau membuka ulang browser.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) periksa();
  });
  window.addEventListener('focus', () => periksa());
  window.addEventListener('pageshow', () => periksa());
  window.setInterval(() => periksa(), 10000);

  async function mulai() {
    try {
      const {data, error} = await supabaseClient.auth.getSession();
      if (error) console.warn('[Arus] Pemeriksaan sesi:', error.message);
      userId = data?.session?.user?.id || null;
      siap = true;
      if (userId && !periksa()) simpanAktivitas(true);
    } catch (err) {
      siap = true;
      console.warn('[Arus] Gagal membaca sesi:', err);
    }

    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        userId = null;
        try { localStorage.removeItem(KUNCI); } catch {}
      } else if (event === 'SIGNED_IN' && session?.user?.id) {
        // Login yang baru berhasil: mulai hitungan dari awal.
        if (userId !== session.user.id) {
          userId = session.user.id;
          simpanAktivitas(true);
        }
      }
    });
  }
  void mulai();
})();
