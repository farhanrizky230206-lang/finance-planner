/* Arus Finance — Foto Profil V1.0
   Membutuhkan di app.html (di dalam script utama setelah deklarasi client):
   window.ARUS_APP_CLIENT = client;
   dan sebelum </body> (setelah script utama):
   <script src="./assets/arus-profile-avatar.js" defer></script>
   Tidak menambah Supabase client kedua, tidak menyimpan foto di localStorage.
*/
(() => {
  'use strict';
  if (window.__arusPhotoProfileReady) return;
  window.__arusPhotoProfileReady = true;

  const client = window.ARUS_APP_CLIENT;
  const shell = document.getElementById('appShell');
  if (!client || !shell) {
    console.warn('[Arus Avatar] Supabase client belum tersedia. Tambahkan window.ARUS_APP_CLIENT = client di app.html.');
    return;
  }

  const BUCKET = 'arus-profile-photos';
  const MAX_BYTES = 5 * 1024 * 1024;
  const ACCEPTED = new Map([['image/jpeg','jpg'], ['image/png','png'], ['image/webp','webp']]);
  let userId = null, userName = 'A', avatarPath = null, photoURL = null, uploading = false, syncId = 0;
  let message = '', messageIsError = false, expiryTimer = null;

  const css = document.createElement('style');
  css.textContent = `
    .topbar .heading { position: relative; padding-right: 58px; min-width: 0; }
    .arus-photo-header { position: absolute; top: 0; right: 0; width: 44px; height: 44px;
      display: grid; place-items: center; padding: 0; border: 2px solid #fff; border-radius: 50%;
      background: linear-gradient(135deg,#155a43,#2b8061); color: #fff; font-size: 17px; font-weight: 800;
      box-shadow: 0 4px 18px rgba(19,65,47,.17); cursor: pointer; overflow: hidden;
      -webkit-tap-highlight-color: transparent; }
    .arus-photo-header img, .profile-badge img { width: 100%; height: 100%; display: block;
      object-fit: cover; border-radius: 50%; }
    .arus-photo-header:focus-visible, .arus-photo-btn:focus-visible { outline: 3px solid #85c89e; outline-offset: 3px; }
    .profile-badge { overflow: hidden; flex-shrink: 0; }
    .arus-photo-tools { background: #f7faf5; border: 1px solid #e3ece2; border-radius: 16px;
      padding: 16px; margin: 5px 0 20px; display: flex; align-items: center; gap: 13px; flex-wrap: wrap; }
    .arus-photo-info { flex: 1 1 190px; }
    .arus-photo-info strong { display: block; color: #204c38; font-size: 13px; }
    .arus-photo-info small { display: block; margin-top: 3px; color: #7b9483; font-size: 11px; line-height: 1.4; }
    .arus-photo-actions { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
    .arus-photo-btn { border: 1px solid #cfe0d3; border-radius: 11px; padding: 9px 13px;
      background: #fff; color: #205941; cursor: pointer; font: 700 12px 'DM Sans',system-ui,sans-serif; }
    .arus-photo-btn.primary { background:#17503b; border-color:#17503b; color:white; }
    .arus-photo-btn.danger { color:#a34841; background:#fffafa; border-color:#f0d9d7; }
    .arus-photo-btn:disabled { opacity: .55; cursor: wait; }
    .arus-photo-status { flex: 1 1 100%; font-size: 11px; line-height: 1.5;
      color:#26784f; }
    .arus-photo-status.error { color: #b5493d; }
    @media(max-width:720px){
      #mobileNav [data-view="profile"] { display: none !important; }
      .topbar .heading { flex: 1 1 100%; padding-right: 58px; }
      .arus-photo-header { width: 42px; height: 42px; }
      .arus-photo-tools { align-items: flex-start; }
    }
  `;
  document.head.appendChild(css);

  const filePicker = document.createElement('input');
  filePicker.type = 'file';
  filePicker.accept = 'image/jpeg,image/png,image/webp';
  filePicker.hidden = true;
  filePicker.setAttribute('aria-label','Pilih foto profil');
  document.body.appendChild(filePicker);

  function photoImg(className = '') {
    const img = document.createElement('img');
    img.src = photoURL;
    img.alt = 'Foto profil';
    img.className = className;
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';
    return img;
  }
  function firstLetter() {
    const name = document.getElementById('pName')?.value || userName || 'A';
    return (name.trim().charAt(0) || 'A').toLocaleUpperCase('id');
  }
  function fillAvatar(node) {
    const marker = `${userId || 'demo'}|${photoURL || ''}|${firstLetter()}`;
    if (node.dataset.arusPhotoState === marker) return;
    node.dataset.arusPhotoState = marker;
    node.replaceChildren(photoURL ? photoImg() : document.createTextNode(firstLetter()));
  }
  function setMessage(value, error = false) {
    message = value;
    messageIsError = error;
    paint();
  }
  function paint() {
    if (shell.hidden) return;
    const heading = shell.querySelector('.topbar .heading');
    if (heading) {
      let b = heading.querySelector('.arus-photo-header');
      if (!b) {
        b = document.createElement('button');
        b.type = 'button';
        b.className = 'arus-photo-header';
        b.title = 'Buka profil dan atur foto';
        b.setAttribute('aria-label', 'Buka profil dan atur foto');
        b.addEventListener('click', () => {
          const profileButton = document.querySelector('#desktopNav button[data-view="profile"]') ||
                                document.querySelector('#mobileNav button[data-view="profile"]');
          if (profileButton) profileButton.click();
        });
        heading.appendChild(b);
      }
      fillAvatar(b);
    }
    const badge = document.querySelector('#page .profile-badge');
    if (!badge) return;
    fillAvatar(badge);
    const form = document.getElementById('profileForm');
    if (!form) return;
    let tools = document.getElementById('arus-photo-tools');
    if (!tools) {
      tools = document.createElement('section');
      tools.id = 'arus-photo-tools';
      tools.className = 'arus-photo-tools';
      tools.innerHTML = `
        <div class="arus-photo-info"><strong>Foto profil</strong><small>JPG, PNG, atau WEBP • maksimal 5 MB. Hanya akunmu yang dapat mengubah foto.</small></div>
        <div class="arus-photo-actions">
          <button class="arus-photo-btn primary" type="button" data-arus-photo="choose">Pilih / ganti foto</button>
          <button class="arus-photo-btn danger" type="button" data-arus-photo="remove">Hapus foto</button>
        </div>
        <div class="arus-photo-status" role="status" aria-live="polite"></div>`;
      form.parentNode.insertBefore(tools, form);
    }
    const choose = tools.querySelector('[data-arus-photo="choose"]');
    const remove = tools.querySelector('[data-arus-photo="remove"]');
    const status = tools.querySelector('.arus-photo-status');
    choose.disabled = uploading || !userId;
    choose.textContent = uploading ? 'Menyimpan foto…' : 'Pilih / ganti foto';
    remove.hidden = !avatarPath;
    remove.disabled = uploading;
    status.classList.toggle('error', messageIsError);
    const note = !userId ? 'Masuk ke akun Arus Finance untuk mengunggah foto.' : '';
    status.textContent = message || note;
  }

  async function getSignedUrl(path) {
    const {data,error} = await client.storage.from(BUCKET).createSignedUrl(path,3600);
    if (error) throw error;
    return data.signedUrl;
  }
  async function refreshSignedUrl(mySyncId, path) {
    if (!path) { photoURL = null; paint(); return; }
    try {
      const url = await getSignedUrl(path);
      if (mySyncId !== syncId || avatarPath !== path) return;
      photoURL = url;
      paint();
      clearTimeout(expiryTimer);
      expiryTimer = setTimeout(() => {
        if (!document.hidden && userId) void refreshSignedUrl(syncId, avatarPath);
      }, 50 * 60 * 1000);
    } catch (e) {
      if (mySyncId !== syncId) return;
      photoURL = null;
      setMessage('Foto belum dapat ditampilkan: ' + (e?.message || 'akses ditolak'), true);
    }
  }
  async function syncUser() {
    const mySyncId = ++syncId;
    try {
      const {data, error} = await client.auth.getUser();
      if (error || !data?.user) {
        userId = null; userName = 'A'; avatarPath = null; photoURL = null; message = '';
        clearTimeout(expiryTimer);
        paint();
        return;
      }
      const id = data.user.id;
      if (userId !== id) { photoURL = null; avatarPath = null; message = ''; }
      userId = id;
      userName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'A';
      paint();
      const {data:profile, error:profileError} = await client.from('profiles')
        .select('avatar_path,full_name').eq('id',id).maybeSingle();
      if (mySyncId !== syncId) return;
      if (profileError) throw profileError;
      if (profile?.full_name) userName = profile.full_name;
      const nextPath = profile?.avatar_path || null;
      if (avatarPath !== nextPath || (!photoURL && nextPath)) {
        avatarPath = nextPath;
        await refreshSignedUrl(mySyncId, nextPath);
      }
      paint();
    } catch (e) {
      if (mySyncId === syncId) setMessage('Tidak dapat memuat foto profil: ' + (e?.message||'error'), true);
    }
  }

  async function upload(file) {
    if (!userId) return setMessage('Masuk ke akun untuk mengunggah foto.', true);
    const ext = ACCEPTED.get(file?.type);
    if (!ext) return setMessage('Gunakan gambar JPG, PNG, atau WEBP.', true);
    if (!file.size || file.size > MAX_BYTES) return setMessage('Ukuran foto maksimal 5 MB.', true);
    try {
      // Memeriksa file dapat dibuka sebagai gambar sebelum mengirim ke Storage.
      const blobURL = URL.createObjectURL(file);
      try { await new Promise((resolve,reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Berkas bukan foto yang valid.'));
        img.src = blobURL;
      }); } finally { URL.revokeObjectURL(blobURL); }
    } catch (e) { return setMessage(e.message, true); }

    uploading = true; setMessage('Mengunggah foto…');
    const id = userId;
    const prevPath = avatarPath;
    const newPath = `${id}/avatar-${Date.now()}-${Math.random().toString(36).slice(2,9)}.${ext}`;
    try {
      const {error:uploadError} = await client.storage.from(BUCKET)
        .upload(newPath, file, {contentType:file.type, cacheControl:'3600', upsert:false});
      if (uploadError) throw uploadError;
      const {data:row,error:saveError} = await client.from('profiles')
        .update({avatar_path:newPath}).eq('id',id).select('avatar_path').maybeSingle();
      if (saveError || !row) {
        await client.storage.from(BUCKET).remove([newPath]);
        throw saveError || new Error('Profil belum tersimpan. Lengkapi data profil dahulu.');
      }
      if (userId !== id) return;
      avatarPath = newPath;
      photoURL = null;
      await refreshSignedUrl(syncId,newPath);
      setMessage('Foto profil berhasil disimpan.');
      if (prevPath && prevPath !== newPath) {
        const {error:oldError} = await client.storage.from(BUCKET).remove([prevPath]);
        if (oldError) console.warn('[Arus Avatar] Foto lama gagal dibersihkan:',oldError.message);
      }
    } catch (e) { setMessage('Gagal menyimpan foto: ' + (e?.message || 'error'),true); }
    finally { uploading = false; paint(); }
  }

  async function removePhoto() {
    if (!userId || !avatarPath || uploading) return;
    if (!confirm('Hapus foto profil dan kembali menggunakan inisial nama?')) return;
    uploading = true; paint();
    const id = userId, old = avatarPath;
    try {
      const {error:dbError} = await client.from('profiles').update({avatar_path:null}).eq('id',id);
      if (dbError) throw dbError;
      const {error:storageError} = await client.storage.from(BUCKET).remove([old]);
      if (storageError) console.warn('[Arus Avatar] File lama gagal dihapus:',storageError.message);
      if (userId === id) { avatarPath=null; photoURL=null; clearTimeout(expiryTimer); setMessage('Foto profil dihapus.'); }
    } catch (e) { setMessage('Gagal menghapus foto: ' + (e?.message||'error'),true); }
    finally { uploading=false; paint(); }
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-arus-photo]');
    if (!btn) return;
    if (btn.dataset.arusPhoto === 'choose') filePicker.click();
    if (btn.dataset.arusPhoto === 'remove') void removePhoto();
  });
  filePicker.addEventListener('change', () => {
    const file = filePicker.files?.[0];
    filePicker.value = '';
    if (file && !uploading) void upload(file);
  });
  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
      setTimeout(() => { void syncUser(); }, 0);
    }
  });

  const page = document.getElementById('page');
  let paintScheduled = false;
  if (page) new MutationObserver(() => {
    if (paintScheduled) return;
    paintScheduled = true;
    requestAnimationFrame(() => { paintScheduled=false; paint(); });
  }).observe(page, {childList:true,subtree:true});
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && userId && avatarPath) void refreshSignedUrl(syncId, avatarPath);
  });
  setTimeout(() => { void syncUser(); paint(); }, 0);
})();
