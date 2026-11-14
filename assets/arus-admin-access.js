/*
  Arus Finance — Admin Access V6
  Hanya menampilkan tautan admin setelah Supabase mengonfirmasi keanggotaan
  pada public.arus_support_admins. Kebijakan RLS di database tetap wajib.
  Tempel ke app.html tepat sebelum </body>:
  <script src="./assets/arus-admin-access.js" defer></script>
  Pasang setelah JavaScript utama app.html yang mendefinisikan client:
  window.ARUS_APP_CLIENT = client;
*/
(() => {
  'use strict';
  if (window.ArusAdminAccessV6) return;

  const currentScript = document.currentScript;
  if (currentScript?.src && !document.getElementById('af-admin-access-style')) {
    const style = document.createElement('link');
    style.id = 'af-admin-access-style';
    style.rel = 'stylesheet';
    style.href = new URL('arus-admin-access.css', currentScript.src).href;
    document.head.appendChild(style);
  }

  const svg = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>`;
  const pageURL = './admin.html';
  const byId = (id) => document.getElementById(id);
  let client;
  let enabled = false;
  let userId = null;
  let checkVersion = 0;
  let desktop;
  let profile;
  let pageObserver;

  function makeLink(target, id, label) {
    const a = document.createElement('a');
    a.id = id;
    a.href = pageURL;
    a.setAttribute('aria-label', 'Buka Panel Admin Arus Finance');
    a.className = target === 'desktop' ? 'af-admin-sidebar' : 'af-admin-profile';
    a.innerHTML = `<span class="af-admin-icon">${svg}</span><span class="af-admin-copy"><span class="af-admin-eyebrow">KHUSUS ADMINISTRATOR</span><strong>Panel Admin</strong><small>${label}</small></span><span class="af-admin-arrow" aria-hidden="true">↗</span>`;
    return a;
  }

  function ensureDesktop() {
    if (desktop?.isConnected) return;
    const nav = byId('desktopNav');
    if (!nav) return;
    desktop = makeLink('desktop', 'af-admin-link-desktop', 'Kelola pengaduan & balasan');
    desktop.hidden = true;
    nav.insertAdjacentElement('afterend', desktop);
  }

  function syncProfile() {
    ensureDesktop();
    const appShell = byId('appShell');
    const loggedInArea = !!appShell && !appShell.hidden;
    const canShow = enabled && loggedInArea;
    if (desktop) desktop.hidden = !canShow;
    const form = byId('profileForm');
    if (!canShow || !form) {
      if (profile?.isConnected) profile.remove();
      profile = null;
      return;
    }
    // Profil digambar ulang oleh fungsi render() dashboard. Tautan perlu
    // dipasang ulang tanpa mengubah logika penyimpanan form asli.
    if (profile?.isConnected && profile.parentElement === form.parentElement) return;
    profile = makeLink('profile', 'af-admin-link-profile', 'Tiket, pesan, bukti & notulensi');
    profile.hidden = false;
    form.insertAdjacentElement('beforebegin', profile);
  }

  function reset() {
    ++checkVersion;
    enabled = false;
    userId = null;
    syncProfile();
  }

  async function checkAdmin() {
    const version = ++checkVersion;
    enabled = false;
    syncProfile();
    try {
      // Identitas diverifikasi ulang via Supabase Auth, bukan dibaca dari email
      // pada HTML atau localStorage buatan kita.
      const {data: authData, error: authError} = await client.auth.getUser();
      if (version !== checkVersion || authError || !authData?.user) return;
      const uid = authData.user.id;
      const {data, error} = await client.from('arus_support_admins')
        .select('user_id').eq('user_id', uid).maybeSingle();
      if (version !== checkVersion || error) {
        if (error) console.warn('[Arus Admin] Tidak dapat memeriksa akses: periksa tabel arus_support_admins dan RLS.');
        return;
      }
      enabled = data?.user_id === uid;
      userId = uid;
      syncProfile();
    } catch (err) {
      if (version === checkVersion) {
        enabled = false;
        syncProfile();
        console.warn('[Arus Admin] Pengecekan hak admin gagal.', err);
      }
    }
  }

  function init() {
    if (window.ArusAdminAccessV6?.started) return;
    // Direkomendasikan: di dalam script utama, sesudah const client selesai:
    // window.ARUS_APP_CLIENT = client;
    client = window.ARUS_APP_CLIENT;
    if (!client?.auth || typeof client.from !== 'function') {
      console.warn('[Arus Admin] Supabase client belum dibagikan. Tambahkan window.ARUS_APP_CLIENT = client; tepat setelah const client dalam app.html.');
      return;
    }
    window.ArusAdminAccessV6.started = true;
    ensureDesktop();
    const page = byId('page');
    if (page) {
      pageObserver = new MutationObserver(syncProfile);
      pageObserver.observe(page, {childList:true, subtree:false});
    }
    const appShell = byId('appShell');
    if (appShell) {
      new MutationObserver(() => {
        if (appShell.hidden) reset();
        else void checkAdmin();
      }).observe(appShell, {attributes:true, attributeFilter:['hidden']});
    }
    // Jangan await database query dari dalam callback Supabase Auth.
    client.auth.onAuthStateChange((event, session) => {
      if (!session || event === 'SIGNED_OUT') reset();
      else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        reset();
        setTimeout(() => { void checkAdmin(); }, 0);
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) void checkAdmin();
    });
    void checkAdmin();
  }

  window.ArusAdminAccessV6 = {started:false, refresh:() => client && checkAdmin()};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
