/* Arus Finance — Profile Modern V2
  Adaptasi visual pada profilePage() asli, bukan mengganti sistem profil/Supabase.
  Pasang di app.html SETELAH script utama dan setelah plugin foto profil (jika ada):
  <script src="./assets/arus-profile-modern.js" defer></script>
*/
(() => {
  'use strict';
  if (window.__arusModernProfileV2) return;
  window.__arusModernProfileV2 = true;

  // Memuat CSS dari folder yang sama dengan file JS ini.
  const script = document.currentScript;
  if (script?.src && !document.querySelector('[data-arus-profile-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('arus-profile-modern.css', script.src).href;
    link.dataset.arusProfileCss = '1';
    document.head.appendChild(link);
  }

  const page = document.getElementById('page');
  if (!page) return;

  const iconPaths = {
    name: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/>',
    wa: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 9 9 0 0 1-3.8-.9L3 21l1.9-5.7a9 9 0 0 1-.9-3.8A8.5 8.5 0 0 1 12.5 3h.5a8.5 8.5 0 0 1 8 8v.5Z"/><path d="M9 10c.7 2.1 1.9 3.3 4 4l1.2-1"/>',
    gender: '<circle cx="9" cy="15" r="5"/><path d="m12.5 11.5 7-7M14 4.5h5.5V10"/>',
    birthday: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>'
  };
  function icon(name) {
    const el = document.createElement('span');
    el.className = 'arus-field-icon';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name]}</svg>`;
    return el;
  }
  function updateHero() {
    const card = page.querySelector('.arus-profile-modern');
    if (!card) return;
    const input = card.querySelector('#pName');
    const heading = card.querySelector('.profile-top h2');
    const checked = Boolean(card.querySelector('input[name="whatsapp_opt_in"]')?.checked);
    const status = card.querySelector('.arus-profile-status');
    if (heading) heading.textContent = input?.value?.trim() || 'Profil Arus Finance';
    if (status) {
      const label = status.querySelector('.arus-status-label');
      if (label) label.textContent = checked ? 'Pengingat WhatsApp: Aktif' : 'Pengingat WhatsApp: Nonaktif';
      status.classList.toggle('is-off',!checked);
    }
  }
  function decorate() {
    const form = page.querySelector('#profileForm');
    if (!form) {page.classList.remove('arus-profile-page');return;}
    const card = form.closest('.surface');
    if (!card) return;
    page.classList.add('arus-profile-page');
    if (card.dataset.arusModernized === '1') return;
    card.dataset.arusModernized = '1';
    card.classList.add('arus-profile-modern');

    const hero = card.querySelector('.profile-top');
    const heading = hero?.querySelector('.account-row h2');
    if (heading) {
      const kicker = document.createElement('div');
      kicker.className = 'arus-profile-kicker';
      kicker.textContent = 'PROFIL ARUS FINANCE';
      heading.before(kicker);
    }
    const accountText = hero?.querySelector('.account-row > div:last-child');
    if (accountText) {
      const badge = document.createElement('span');
      badge.className = 'arus-profile-status';
      badge.innerHTML = '<span class="arus-status-dot" aria-hidden="true"></span><span class="arus-status-label"></span>';
      accountText.appendChild(badge);
    }

    // Memakai tombol upload milik arus-profile-avatar.js; tidak mengunggah berkas dari patch visual ini.
    const avatar = hero?.querySelector('.profile-badge');
    if (avatar) {
      avatar.setAttribute('role','button');
      avatar.setAttribute('tabindex','0');
      avatar.setAttribute('title','Pilih atau ganti foto profil');
      avatar.setAttribute('aria-label','Pilih atau ganti foto profil');
    }

    const grid = form.querySelector('.profile-grid');
    if (grid) {
      const section = document.createElement('section');
      section.className = 'arus-personal-card';
      const head = document.createElement('div');
      head.className = 'arus-details-head';
      head.innerHTML = '<h3>Informasi Pribadi</h3><p>Kelola informasi akun dan data pribadi kamu.</p>';
      section.appendChild(head);
      grid.before(section);
      section.appendChild(grid);
      [ ['pName','name'], ['pWA','wa'], ['pGender','gender'], ['pBirth','birthday'] ].forEach(([id,type]) => {
        const input = grid.querySelector('#'+id);
        const field = input?.closest('.field');
        if(field && !field.querySelector('.arus-field-icon')) field.prepend(icon(type));
      });
    }
    const switches = form.querySelectorAll('.switch-card');
    switches[0]?.classList.add('arus-reminder-card');
    switches[1]?.classList.add('arus-verify-card');
    updateHero();
  }

  page.addEventListener('input', e => {if(e.target?.id==='pName') updateHero();});
  page.addEventListener('change', e => {if(e.target?.name==='whatsapp_opt_in') updateHero();});
  page.addEventListener('click', e => {
    const avatar = e.target.closest('.arus-profile-modern .profile-badge');
    if (!avatar) return;
    const choose = page.querySelector('[data-arus-photo="choose"]');
    if (choose && !choose.disabled) choose.click();
  });
  page.addEventListener('keydown',e => {
    const badge = e.target.closest?.('.arus-profile-modern .profile-badge');
    if (!badge || (e.key!=='Enter' && e.key!==' ')) return;
    e.preventDefault();
    const choose = page.querySelector('[data-arus-photo="choose"]');
    if(choose && !choose.disabled) choose.click();
  });
  // app.html melakukan page.innerHTML ketika render(). Amati hanya anak langsung
  // agar perubahan DOM dari plugin foto tidak menyebabkan observer berulang.
  const observer = new MutationObserver(() => decorate());
  observer.observe(page, {childList:true});
  decorate();
})();
