/* Arus Finance Help Center v4. No service key/WhatsApp token belongs here. */
(() => {
  'use strict';
  if (window.ArusHelpCore) return;
  const script = document.currentScript;
  const root = new URL('../', script.src);
  const css = new URL('arus-help.css', script.src).href;
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet'; cssLink.href = css;
  document.head.appendChild(cssLink);
  const faq = [
    ['akun','Bagaimana cara daftar akun Arus Finance?','Klik Buka Aplikasi, pilih Daftar, lengkapi email, kata sandi, dan profil. Jika diminta, verifikasi email sebelum masuk.'],
    ['akun','Kenapa email verifikasi tidak masuk atau tautannya kedaluwarsa?','Cek Spam/Promosi, pastikan alamat benar, dan gunakan opsi kirim ulang email. Jika dialihkan ke localhost atau muncul otp_expired, laporkan alamat halaman error tanpa menyalin access_token.'],
    ['akun','Bagaimana masuk menggunakan Google?','Klik Lanjutkan dengan Google pada halaman aplikasi. Jika gagal, pastikan pop-up dan redirect diizinkan, lalu coba ulang atau gunakan email.'],
    ['akun','Saya lupa kata sandi, bagaimana?','Gunakan fasilitas reset kata sandi jika tersedia pada aplikasi. Jangan pernah mengirim kata sandi maupun OTP kepada admin.'],
    ['transaksi','Bagaimana menambah pemasukan dan pengeluaran?','Masuk ke aplikasi, buka Transaksi, pilih Tambah, tentukan jenis, jumlah, kategori dan tanggal, kemudian simpan.'],
    ['transaksi','Kenapa transaksi hilang setelah refresh?','Cek apakah login pada akun yang sama, bulan yang dipilih benar, dan koneksi internet aktif. Jika masih bermasalah, buat tiket dengan waktu dan langkah kejadian.'],
    ['grafik','Mengapa chart mingguan belum berubah?','Pastikan transaksi berada dalam bulan yang sedang dibuka, muat ulang halaman, lalu coba arahkan mouse atau ketuk batang grafik. Jika tetap tidak sesuai, laporkan tanggal transaksi dan kategorinya tanpa mencantumkan data sensitif.'],
    ['grafik','Bagaimana mengatur batas anggaran bulanan?','Buka menu Rencana/Anggaran di dashboard, masukkan batas pengeluaran dan target tabungan, lalu simpan.'],
    ['whatsapp','Bagaimana mengaktifkan pengingat WhatsApp?','Isi nomor di Profil, berikan persetujuan pengingat, dan selesaikan verifikasi nomor. Bot WhatsApp harus aktif di server agar pesan bisa terkirim.'],
    ['whatsapp','Bot WhatsApp tidak membalas STATUS atau sering terputus?','Pastikan bot sedang berjalan dan nomor yang mengirim sudah teraktivasi. Laporkan waktu kejadian dan kode error terminal, tanpa menyertakan QR pairing atau file sesi.'],
    ['whatsapp','Bagaimana menghentikan pesan pengingat?','Nonaktifkan izin pengingat dari Profil. Jika bot sedang terhubung, gunakan perintah STOP sesuai petunjuk bot.'],
    ['privasi','Siapa yang dapat melihat catatan keuangan saya?','Setiap pengguna hanya dapat melihat catatan keuangannya sendiri sesuai aturan akses Supabase. Admin bantuan hanya mengakses tiket pengaduan, bukan isi buku keuangan.'],
    ['privasi','Apakah admin akan meminta OTP, password, atau secret key?','Tidak. Jangan pernah mengirim kata sandi, OTP, recovery code, access token, atau key Supabase melalui chat pengaduan.'],
    ['privasi','Bagaimana menghapus akun dan data saya?','Gunakan fitur Hapus Akun di Profil jika tersedia. Simpan cadangan data terlebih dahulu dan laporkan jika proses gagal.'],
    ['lainnya','Bagaimana melihat balasan dari developer?','Masuk ke akun yang sama, buka tombol Bantuan & Pengaduan, pilih tab Pesanku, lalu buka tiket yang dibuat. Balasan baru akan tampil saat halaman percakapan dibuka atau diperbarui.'],
    ['akun','Bisakah saya mengirim tiket pengaduan tanpa login?','Saat ini pengiriman chat membutuhkan login untuk mengurangi spam dan memastikan riwayat hanya terlihat oleh pemilik akun. FAQ tetap dapat dibaca tanpa login.'],
    ['saran','Bagaimana mengusulkan fitur baru?','Pilih kategori Saran Fitur, ceritakan masalah pengguna yang ingin diselesaikan, dan usulkan alur fitur yang kamu inginkan.'],
    ['lainnya','Apakah chat developer dibalas langsung 24 jam?','Tidak dijanjikan real-time 24 jam. Pesan tersimpan sebagai tiket dan akan dibalas saat admin tersedia. Periksa status tiket secara berkala.']
  ];
  const names = {akun:'Akun & Login',transaksi:'Transaksi',grafik:'Grafik & Anggaran',whatsapp:'Bot WhatsApp',privasi:'Privasi & Keamanan',saran:'Saran Fitur',lainnya:'Lainnya'};
  const templates = [
    {category:'akun', title:'Tidak bisa masuk ke akun',body:'Halo Tim Arus, saya mengalami kesulitan login.\nMetode login: [email/Google]\nPesan error: [tuliskan tanpa token]\nSudah saya coba: [langkah]'},
    {category:'akun', title:'Email verifikasi bermasalah',body:'Halo Tim Arus, tautan verifikasi email saya tidak berhasil.\nKendala: [jelaskan]\nWaktu kejadian: [tanggal/jam]\nSudah saya coba: [langkah]'},
    {category:'transaksi', title:'Transaksi tidak tersimpan',body:'Halo Tim Arus, transaksi saya tidak muncul dengan benar.\nJenis transaksi: [masuk/keluar]\nBulan yang dipilih: [bulan]\nKendala: [jelaskan tanpa membagikan rekening/nomor sensitif]'},
    {category:'grafik', title:'Grafik atau anggaran tidak sesuai',body:'Halo Tim Arus, saya menemukan kendala pada grafik/anggaran.\nBagian yang bermasalah: [grafik mingguan/anggaran]\nHasil yang terlihat: [jelaskan]\nHasil yang diharapkan: [jelaskan]'},
    {category:'whatsapp', title:'Pengingat WhatsApp tidak masuk',body:'Halo Tim Arus, pengingat WhatsApp saya belum berfungsi.\nStatus verifikasi nomor: [sudah/belum]\nPerintah yang dicoba: [STATUS/AKTIFKAN/dll]\nKendala: [jelaskan]'},
    {category:'privasi', title:'Bantuan keamanan dan data akun',body:'Halo Tim Arus, saya membutuhkan bantuan mengenai privasi atau keamanan akun.\nKendala: [jelaskan tanpa OTP/password/token]\nWaktu kejadian: [tanggal]'},
    {category:'saran', title:'Usulan fitur Arus Finance',body:'Halo Tim Arus, saya ingin mengusulkan fitur baru.\nMasalah yang ingin diselesaikan: [jelaskan]\nIde fitur: [jelaskan]\nManfaat untuk pengguna: [jelaskan]'},
    {category:'lainnya', title:'Pertanyaan untuk developer',body:'Halo Tim Arus, saya ingin bertanya mengenai Arus Finance.\nPertanyaan atau kendala: [jelaskan]\nLangkah yang sudah dicoba: [jika ada]'}
  ];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ts = v => {try{return new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(new Date(v));}catch{return '-';}};
  const statusText = {open:'Baru',pending:'Menunggu',resolved:'Selesai'};
  const rupiah = n=>'Rp'+new Intl.NumberFormat('id-ID').format(Number(n)||0);
  const addScript = src => new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=()=>reject(new Error('Gagal memuat '+src));document.head.appendChild(el);});
  let clientPromise;
  async function client(){
    if (!clientPromise) clientPromise=(async()=>{
      if (!window.ARUS_CONFIG) await addScript(new URL('config.js',root).href);
      if (!window.supabase?.createClient) await addScript('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
      const c=window.ARUS_CONFIG||{};
      if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(c.supabaseUrl||'')||!(c.supabasePublishableKey||'').trim()) throw Error('Konfigurasi Supabase belum tersedia pada config.js.');
      return window.supabase.createClient(c.supabaseUrl,c.supabasePublishableKey,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}});
    })();
    return clientPromise;
  }
  async function user(){const c=await client();const {data,error}=await c.auth.getUser();if(error)throw error;return data.user||null;}
  window.ArusHelpCore={root,faq,names,templates,esc,ts,statusText,rupiah,client,user};
})();
/* Arus Help Center V5 — embeds into landing/dashboard and opens on bantuan.html.
   Uses same Supabase config as Arus Finance, no secret keys here. */
(() => {
  'use strict';
  if (window.__ARUS_HELP_V5) return;
  window.__ARUS_HELP_V5 = true;
  const C = window.ArusHelpCore;
  if (!C) return;
  const page = document.getElementById('arus-help-page');
  const mount = page || document.createElement('div');
  if (!page) { mount.className = 'ah-widget ah-v5'; document.body.appendChild(mount); }
  else mount.classList.add('ah-v5');
  const {esc,ts,faq,templates,names,statusText} = C;
  const BUCKET = 'arus-support-evidence';
  const accepts = new Set(['image/jpeg','image/png','image/webp','application/pdf']);
  const MAX_SIZE = 5 * 1024 * 1024;
  const state = {
    open:!!page, mode:'new', step:1, user:null, client:null, busy:false, error:'', success:'',
    faqFilter:'semua', faqQuery:'', tickets:[], active:null, messages:[], evidence:[], minutes:[],
    reply:'', replyFiles:[],
    draft:{name:'',email:'',category:'akun',subject:'',body:'',files:[]}
  };
  const tag = s=>`<span class="ah-tag ${esc(s)}">${esc(statusText[s]||s)}</span>`;
  const iconFor = (mime)=>mime==='application/pdf'?'▣':'▧';
  function alerts(){return `${state.error?`<div role="alert" class="ah-alert error">${esc(state.error)}</div>`:''}${state.success?`<div role="status" class="ah-alert ok">${esc(state.success)}</div>`:''}`;}
  function faqHtml(){
    const q = state.faqQuery.trim().toLowerCase();
    const items = faq.filter(([cat,title,answer])=>(state.faqFilter==='semua'||cat===state.faqFilter)&&(!q||(title+' '+answer).toLowerCase().includes(q)));
    return `<div class="ah-search"><input class="ah-input" id="ah-faq-search" type="search" placeholder="Cari jawaban…" value="${esc(state.faqQuery)}" aria-label="Cari FAQ"></div>
      <div class="ah-faq-cat">${[['semua','Semua'],['akun','Akun'],['transaksi','Transaksi'],['whatsapp','WhatsApp'],['privasi','Privasi']].map(([k,t])=>`<button type="button" data-ah="filterfaq" data-value="${k}" class="${state.faqFilter===k?'is-active':''}">${esc(t)}</button>`).join('')}</div>
      ${items.length?items.map(([cat,title,answer])=>`<details class="ah-faq-item"><summary>${esc(title)}</summary><p>${esc(answer)}</p></details>`).join(''):'<p class="ah-empty">Tidak ada FAQ yang cocok.</p>'}
      <div class="ah-help-footnote"><strong>Privasi lebih dulu.</strong> Tim Arus tidak pernah meminta kata sandi, OTP, token, atau data rekening lengkap.</div>`;
  }
  function stepBar(){return `<div class="ah-progress"><span data-n="1" class="${state.step>=1?'is-active':''}">Identitas</span><i></i><span data-n="2" class="${state.step>=2?'is-active':''}">Pengaduan</span><i></i><span data-n="3" class="${state.step>=3?'is-active':''}">Konfirmasi</span></div>`;}
  function step1(){return `${stepBar()}<h3 style="font:800 18px Manrope;margin:0 0 6px">Kenalan dulu, yuk 👋</h3>
    <p class="ah-helper" style="margin:0 0 17px">Isi nama dan email sebelum membuat pengaduan. Notulensi akan dikirim ke email akun yang sudah diverifikasi.</p>
    <label class="ah-field"><span class="ah-label">Nama lengkap <span aria-hidden="true">*</span></span><input type="text" class="ah-input" name="name" autocomplete="name" minlength="2" maxlength="70" required placeholder="Nama sesuai akunmu" value="${esc(state.draft.name)}"></label>
    <label class="ah-field"><span class="ah-label">Alamat email <span aria-hidden="true">*</span></span><input type="email" class="ah-input" name="email" autocomplete="email" maxlength="254" required placeholder="nama@gmail.com" value="${esc(state.draft.email)}"></label>
    <div class="ah-auth-notice">${state.user?`<strong>Akun terhubung:</strong> ${esc(state.user.email)}<br>Email pengaduan harus sama dengan email akun Arus yang terverifikasi.`:`<strong>Belum login?</strong> Kamu boleh menyiapkan formulir, tetapi perlu <a href="app.html">masuk ke Arus Finance</a> untuk mengirim chat dan mengamankan riwayatnya.`}</div>
    <div class="ah-buttons"><span class="ah-helper">Data ini hanya untuk penanganan laporan.</span><button type="button" class="ah-primary" data-ah="next1">Lanjutkan →</button></div>`;}
  function fileList(files){return [...files].map(f=>`<div class="ah-file-row">${iconFor(f.type)} ${esc(f.name)} <span style="color:#8c9a8d">· ${(f.size/1024/1024).toFixed(2)} MB</span></div>`).join('');}
  function step2(){return `${stepBar()}<h3 style="font:800 18px Manrope;margin:0 0 8px">Apa yang bisa kami bantu?</h3>
    <span class="ah-label">Pilih template cepat</span><div class="ah-template-list">${templates.slice(0,6).map((t,i)=>`<button type="button" class="ah-template" data-ah="template" data-idx="${i}">${esc(t.title)}</button>`).join('')}</div>
    <label class="ah-field"><span class="ah-label">Kategori</span><select class="ah-select" name="category">${Object.entries(names).map(([v,n])=>`<option value="${esc(v)}" ${state.draft.category===v?'selected':''}>${esc(n)}</option>`).join('')}</select></label>
    <label class="ah-field"><span class="ah-label">Judul kendala <span aria-hidden="true">*</span></span><input class="ah-input" name="subject" maxlength="140" minlength="5" required placeholder="Contoh: transaksi tidak muncul" value="${esc(state.draft.subject)}"></label>
    <label class="ah-field"><span class="ah-label">Ceritakan masalahnya <span aria-hidden="true">*</span></span><textarea class="ah-area" name="body" maxlength="4000" minlength="15" required placeholder="Jelaskan kendala, langkah yang sudah dicoba, dan hasil yang diharapkan…">${esc(state.draft.body)}</textarea></label>
    <label class="ah-uploads"><strong>📎 Lampirkan bukti (opsional)</strong><small>Screenshot atau PDF · maksimal 3 file · masing-masing 5 MB</small>
      <input name="files" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" multiple aria-label="Unggah bukti pengaduan"></label>
    <div id="ah-file-list">${fileList(state.draft.files)}</div>
    <div class="ah-buttons"><button type="button" class="ah-secondary" data-ah="back1">← Kembali</button><button type="button" class="ah-primary" data-ah="next2">Tinjau laporan →</button></div>`;}
  function step3(){return `${stepBar()}<h3 style="font:800 18px Manrope;margin:0 0 12px">Periksa sebelum mengirim</h3>
    <dl class="ah-review"><dt>Nama</dt><dd>${esc(state.draft.name)}</dd><dt>Email untuk notulensi</dt><dd>${esc(state.draft.email)}</dd>
    <dt>Kategori & Judul</dt><dd>${esc(names[state.draft.category]||state.draft.category)} — ${esc(state.draft.subject)}</dd>
    <dt>Isi laporan</dt><dd>${esc(state.draft.body)}</dd><dt>Bukti</dt><dd>${state.draft.files.length} file</dd></dl>
    <label class="ah-field" style="display:flex;align-items:flex-start;gap:9px"><input type="checkbox" id="ah-consent" style="margin-top:5px"><span style="font-size:12px">Saya setuju data laporan dan bukti diproses oleh admin untuk menyelesaikan kendala. Saya tidak menyertakan OTP/password.</span></label>
    <div class="ah-buttons"><button class="ah-secondary" type="button" data-ah="back2">← Edit</button><button type="button" class="ah-primary" data-ah="send" ${state.busy?'disabled':''}>${state.busy?'Mengirim…':'Kirim pengaduan ↗'}</button></div>`;}
  function ticketRows(){return `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px"><strong>Riwayat pengaduan</strong><button class="ah-secondary" type="button" data-ah="reload">↻ Refresh</button></div>
    ${state.tickets.length?`<div class="ah-ticket-list">${state.tickets.map(t=>`<button type="button" class="ah-ticket-card" data-ah="ticket" data-id="${esc(t.id)}"><div class="ah-ticket-top"><small>#${esc(t.id.slice(0,8))} · ${esc(ts(t.created_at))}</small>${tag(t.status)}</div><strong>${esc(t.subject)}</strong><small>${esc(names[t.category]||t.category)} · ${esc(t.display_name)}</small></button>`).join('')}</div>`:'<div class="ah-empty">Belum ada laporan. Klik Buat Pengaduan untuk memulai.</div>'}`;}
  const messageItem=m=>`<div class="ah-bubble ${m.sender_kind==='user'?'mine':''}"><strong>${m.sender_kind==='admin'?'Tim Arus Finance':'Kamu'}</strong><p>${esc(m.body)}</p><small>${esc(ts(m.created_at))}</small></div>`;
  const attachItem=f=>`<div class="ah-attachment"><b>${iconFor(f.file_type)} ${esc(f.filename)}</b><button type="button" data-ah="file" data-path="${esc(f.storage_path)}">Lihat bukti ↗</button></div>`;
  function conversation(){const t=state.active;if(!t)return ticketRows();const m=state.minutes[0];return `<div class="ah-thread-header"><div><button class="ah-secondary" type="button" data-ah="back-tickets">← Semua laporan</button><h3>${esc(t.subject)}</h3><small>#${esc(t.id.slice(0,8))} · ${esc(t.display_name)} · ${esc(t.contact_email||'')}</small></div>${tag(t.status)}</div>
    <div class="ah-conversation" role="log" aria-live="polite">${state.messages.map(messageItem).join('')||'<p class="ah-empty">Belum ada pesan.</p>'}</div>
    ${state.evidence.length?`<div><strong style="font-size:12px">📎 Lampiran bukti (${state.evidence.length})</strong>${state.evidence.map(attachItem).join('')}</div>`:''}
    ${m?`<div class="ah-minutes"><strong>📝 Notulensi penyelesaian</strong><p>${esc(m.summary)}</p><p><b>Tindak lanjut:</b> ${esc(m.next_steps||'Tidak ada.')}</p><small>Email: ${m.email_status==='sent'?'Diterima layanan pengirim':m.email_status==='failed'?'Gagal diproses':'Dalam proses'} · ${esc(m.recipient_email)}</small></div>`:''}
    <div style="margin-top:17px"><span class="ah-label">Balas percakapan${t.status==='resolved'?' (membuka kembali tiket)':''}</span><textarea class="ah-area" name="reply" maxlength="4000" placeholder="Tulis balasan untuk developer…">${esc(state.reply)}</textarea>
    <label class="ah-field" style="font-size:12px"><span class="ah-label">Tambah bukti (opsional)</span><input name="reply-files" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" multiple></label><div id="ah-reply-file-list">${fileList(state.replyFiles)}</div>
    <div class="ah-buttons"><small class="ah-helper">Balasan diperbarui berkala saat halaman terbuka.</small><button type="button" class="ah-primary" data-ah="reply" ${state.busy?'disabled':''}>Kirim balasan ↗</button></div></div>`;}
  function controls(){return `<div class="ah-support-tabs"><button type="button" data-ah="mode" data-value="new" class="${state.mode==='new'?'is-active':''}">＋ Buat Pengaduan</button><button type="button" data-ah="mode" data-value="tickets" class="${state.mode!=='new'?'is-active':''}">☷ Pesan Saya</button></div>
    <div class="ah-inner">${alerts()}${state.mode==='new'?(state.step===1?step1():state.step===2?step2():step3()):state.mode==='chat'?conversation():ticketRows()}</div>`;}
  function render(){
    if(page){mount.innerHTML=`<div class="ah-main"><section class="ah-hero"><div><div class="ah-eyebrow">ARUS FINANCE · CARE CENTER</div><h1>Butuh bantuan?<br><em>Kami siap mendengar.</em></h1><p>Satu tempat untuk bertanya, mengirim bukti kendala, berbicara dengan tim developer, dan menerima notulensi penyelesaian.</p><div class="ah-hero-note"><span>✓ Pengaduan tercatat</span><span>✓ Bukti privat</span><span>✓ Notulensi ke email</span></div></div><div class="ah-hero-art" aria-hidden="true"><div class="ah-paper"><div class="ah-paper-head">Arus Support <span class="ah-paper-status">● Selesai</span></div><div class="ah-paper-line"></div><div class="ah-paper-line"></div><div class="ah-paper-message">“Kendala berhasil ditangani. Notulensi sudah disiapkan untuk email Anda.”</div><div class="ah-paper-icons"><i></i><i></i><i></i></div></div></div></section>
      <div class="ah-metrics"><div class="ah-metric"><div class="num">01</div><div><strong>Temukan jawaban</strong><span>FAQ dengan pencarian cepat</span></div></div><div class="ah-metric"><div class="num">02</div><div><strong>Kirim bukti & chat</strong><span>Nama, email, dan laporan</span></div></div><div class="ah-metric"><div class="num">03</div><div><strong>Terima notulensi</strong><span>Setelah admin menyelesaikan tiket</span></div></div></div>
      <div class="ah-layout"><section class="ah-section"><div class="ah-section-head"><span class="ah-chip">PUSAT PENGETAHUAN</span><h2>Sering ditanyakan</h2><p>Cari solusi mandiri sebelum membuat pengaduan.</p></div><div class="ah-faq-zone" id="ah-faq-zone">${faqHtml()}</div></section>
      <section class="ah-section"><div class="ah-section-head"><span class="ah-chip">HUBUNGI TIM ARUS</span><h2>Lapor kendala, kami bantu</h2><p>Catatan kasus tersimpan dengan aman dan bisa dilanjutkan kapan saja.</p></div><div id="ah-controls">${controls()}</div></section></div></div>`;
    } else {
      mount.innerHTML=`<button type="button" class="ah-widget-toggle" data-ah="toggle" aria-expanded="${state.open}">☏ Bantuan & Pengaduan</button>
      <section class="ah-widget-panel ${state.open?'is-open':''}" role="dialog" aria-label="Pusat Bantuan Arus Finance" aria-modal="false"><div class="ah-widget-head"><div><b>arus. support</b><div style="font-size:11px;opacity:.8">Ada kendala? Ceritakan di sini.</div></div><button type="button" data-ah="toggle" aria-label="Tutup">✕</button></div><div class="ah-support-body" id="ah-controls">${controls()}</div></section>`;
    }
  }
  function rerenderControls(){if(page){const el=mount.querySelector('#ah-controls');if(el)el.innerHTML=controls();}else render();}
  function errText(e){return e?.message || String(e);}
  async function initializeUser(){try{state.client=await C.client();state.user=await C.user();if(state.user){const name=state.user.user_metadata?.full_name||state.user.user_metadata?.name||'';if(!state.draft.name)state.draft.name=String(name).slice(0,70);if(!state.draft.email)state.draft.email=state.user.email||'';}}catch(e){state.error='Tidak dapat memeriksa sesi. Pastikan config.js dan koneksi Supabase tersedia. '+errText(e);}render();}
  function validateFiles(list){const files=[...list];if(files.length>3)throw Error('Maksimal 3 file untuk sekali unggah.');for(const f of files){if(!accepts.has(f.type))throw Error('Hanya JPG, PNG, WEBP, atau PDF yang diterima.');if(f.size<1||f.size>MAX_SIZE)throw Error('Setiap file harus lebih kecil dari atau sama dengan 5 MB.');}return files;}
  function field(name){return mount.querySelector(`[name="${name}"]`);}
  function checkIdentity(){const name=state.draft.name.trim(),email=state.draft.email.trim();if(name.length<2||name.length>70)throw Error('Isi nama lengkap (2–70 karakter).');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Isi alamat email yang valid.');if(state.user && email.toLowerCase() !== (state.user.email||'').toLowerCase())throw Error('Email harus sama dengan email akun Arus yang telah diverifikasi.');}
  function checkReport(){if(!names[state.draft.category]||state.draft.subject.trim().length<5||state.draft.body.trim().length<15)throw Error('Pilih kategori, judul minimal 5 karakter, dan detail minimal 15 karakter.');validateFiles(state.draft.files);}
  async function getTickets(){try{const c=state.client||await C.client();const u=await C.user();state.user=u;if(!u){state.tickets=[];return;}const {data,error}=await c.from('arus_support_tickets').select('id,subject,display_name,contact_email,category,status,priority,created_at,last_message_at').order('last_message_at',{ascending:false}).limit(70);if(error)throw error;state.tickets=data||[];}catch(e){state.error='Gagal memuat tiket: '+errText(e);}}
  async function loadConversation(id){try{const c=state.client||await C.client();const t=state.tickets.find(x=>x.id===id);if(!t)throw Error('Pengaduan tidak ditemukan.');const [mr,er,nt]=await Promise.all([
      c.from('arus_support_messages').select('id,sender_kind,body,created_at').eq('ticket_id',id).order('id',{ascending:true}),
      c.from('arus_support_evidence').select('id,filename,storage_path,file_type,file_size,created_at').eq('ticket_id',id).order('id',{ascending:true}),
      c.from('arus_support_minutes').select('summary,next_steps,email_status,recipient_email,created_at').eq('ticket_id',id).order('resolution_version',{ascending:false}).limit(1)
    ]);for(const q of [mr,er,nt])if(q.error)throw q.error;state.active=t;state.messages=mr.data||[];state.evidence=er.data||[];state.minutes=nt.data||[];state.mode='chat';rerenderControls();const log=mount.querySelector('.ah-conversation');if(log)log.scrollTop=log.scrollHeight;
  }catch(e){state.error='Gagal membuka percakapan: '+errText(e);rerenderControls();}}
  async function uploadEvidence(ticketId,files){const c=state.client||await C.client(),u=await C.user();if(!u)throw Error('Sesi login tidak ditemukan.');for(const file of files){const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'}[file.type];const path=`${u.id}/${ticketId}/${crypto.randomUUID()}.${ext}`;const uploaded=await c.storage.from(BUCKET).upload(path,file,{contentType:file.type,cacheControl:'3600',upsert:false});if(uploaded.error)throw Error('Upload bukti gagal: '+uploaded.error.message);const {error}=await c.from('arus_support_evidence').insert({ticket_id:ticketId,user_id:u.id,storage_path:path,filename:file.name.slice(0,180),file_type:file.type,file_size:file.size});if(error)throw Error('Bukti diunggah, tetapi pencatatan gagal: '+error.message);}}
  async function sendReport(){if(state.busy)return;try{checkIdentity();checkReport();if(!mount.querySelector('#ah-consent')?.checked)throw Error('Centang persetujuan pemrosesan laporan terlebih dahulu.');state.user=await C.user();if(!state.user)throw Error('Masuk ke akun Arus Finance dulu untuk mengirim laporan.');if(!state.user.email_confirmed_at)throw Error('Verifikasi email akun Arus terlebih dahulu.');checkIdentity();state.busy=true;state.error='';rerenderControls();const c=state.client||await C.client();const {data:t,error:te}=await c.from('arus_support_tickets').insert({user_id:state.user.id,display_name:state.draft.name.trim(),contact_email:state.draft.email.trim(),category:state.draft.category,subject:state.draft.subject.trim()}).select('id').single();if(te)throw te;
    const {error:me}=await c.from('arus_support_messages').insert({ticket_id:t.id,sender_id:state.user.id,sender_kind:'user',body:state.draft.body.trim()});if(me)throw Error('Tiket dibuat namun pesan belum tersimpan. Buka Pesan Saya. '+me.message);
    let warning='';try{await uploadEvidence(t.id,state.draft.files);}catch(e){warning='Tiket berhasil dibuat, tetapi sebagian bukti gagal diunggah: '+errText(e);}
    state.draft={name:state.draft.name,email:state.draft.email,category:'akun',subject:'',body:'',files:[]};await getTickets();state.success=warning||'Pengaduan berhasil dibuat. Admin akan membalas melalui percakapan ini.';await loadConversation(t.id);
  }catch(e){state.error=errText(e);}finally{state.busy=false;rerenderControls();}}
  async function sendReply(){if(state.busy||!state.active)return;const body=state.reply.trim();if(!body) {state.error='Tulis pesan balasan terlebih dahulu.';rerenderControls();return;}state.busy=true;state.error='';try{const u=await C.user();if(!u)throw Error('Sesi login berakhir. Silakan masuk kembali.');const c=state.client||await C.client();const {error}=await c.from('arus_support_messages').insert({ticket_id:state.active.id,sender_id:u.id,sender_kind:'user',body});if(error)throw error;let warning='';try{await uploadEvidence(state.active.id,state.replyFiles);}catch(e){warning='Pesan terkirim, tetapi bukti gagal diunggah: '+errText(e);}state.reply='';state.replyFiles=[];await getTickets();await loadConversation(state.active.id);state.success=warning||'Balasan berhasil dikirim.';}catch(e){state.error=errText(e);}finally{state.busy=false;rerenderControls();}}
  async function viewFile(path){const popup=window.open('about:blank','_blank');try{const c=state.client||await C.client();const {data,error}=await c.storage.from(BUCKET).createSignedUrl(path,120,{download:true});if(error||!data?.signedUrl)throw error||Error('Tautan gagal dibuat.');if(popup)popup.location.href=data.signedUrl;else window.location.href=data.signedUrl;}catch(e){popup?.close();state.error='Tidak dapat membuka bukti: '+errText(e);rerenderControls();}}
  mount.addEventListener('input',event=>{const node=event.target;if(node.name&&Object.hasOwn(state.draft,node.name)&&node.type!=='file')state.draft[node.name]=node.value;if(node.name==='reply')state.reply=node.value;if(node.id==='ah-faq-search'){state.faqQuery=node.value;const zone=mount.querySelector('#ah-faq-zone');if(zone){const q=node.value.toLowerCase();zone.querySelectorAll('.ah-faq-item').forEach(d=>d.hidden=!d.textContent.toLowerCase().includes(q));}}});
  mount.addEventListener('change',event=>{const n=event.target;if(n.name==='files'||n.name==='reply-files'){try{const files=validateFiles(n.files||[]);if(n.name==='files')state.draft.files=files;else state.replyFiles=files;const list=mount.querySelector(n.name==='files'?'#ah-file-list':'#ah-reply-file-list');if(list)list.innerHTML=fileList(files);state.error='';}catch(e){n.value='';state.error=errText(e);rerenderControls();}}});
  mount.addEventListener('click',async event=>{const b=event.target.closest('[data-ah]');if(!b)return;const action=b.dataset.ah;state.error='';state.success='';try{
    if(action==='toggle'){state.open=!state.open;if(state.open)await getTickets();render();return;}
    if(action==='filterfaq'){state.faqFilter=b.dataset.value;const zone=mount.querySelector('#ah-faq-zone');if(zone)zone.innerHTML=faqHtml();return;}
    if(action==='mode'){state.mode=b.dataset.value;state.step=1;if(state.mode==='tickets')await getTickets();rerenderControls();return;}
    if(action==='next1'){checkIdentity();state.step=2;rerenderControls();return;}
    if(action==='back1'){state.step=1;rerenderControls();return;}
    if(action==='next2'){checkReport();state.step=3;rerenderControls();return;}
    if(action==='back2'){state.step=2;rerenderControls();return;}
    if(action==='template'){const t=templates[Number(b.dataset.idx)];if(t){state.draft.category=t.category;state.draft.subject=t.title;state.draft.body=t.body;rerenderControls();}return;}
    if(action==='send'){await sendReport();return;}
    if(action==='reload'){await getTickets();rerenderControls();return;}
    if(action==='ticket'){await loadConversation(b.dataset.id);return;}
    if(action==='back-tickets'){state.mode='tickets';state.active=null;await getTickets();rerenderControls();return;}
    if(action==='reply'){await sendReply();return;}
    if(action==='file'){await viewFile(b.dataset.path);return;}
  }catch(e){state.error=errText(e);rerenderControls();}});
  setInterval(async()=>{if((!page&&!state.open)||document.hidden||state.mode!=='chat'||!state.active)return;try{const id=state.active.id;const c=state.client||await C.client();const {data,error}=await c.from('arus_support_messages').select('id').eq('ticket_id',id).order('id',{ascending:false}).limit(1);if(error)return;const latest=data?.[0]?.id;const current=state.messages.at(-1)?.id;const {data:t}=await c.from('arus_support_tickets').select('status').eq('id',id).single();if(latest!==current||t?.status!==state.active.status){await getTickets();await loadConversation(id);}}catch{}},9000);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{render();initializeUser();},{once:true});else{render();initializeUser();}
  // Add a discoverable navbar link on the old landing page without altering the app.
  if(!page){const addNav=()=>{const nav=document.querySelector('.nav-links');if(!nav)return;for(const link of nav.querySelectorAll('a')){if(/^\s*Masuk ke dashboard\s*$/i.test(link.textContent||'')){link.textContent='Buka Aplikasi';link.href='app.html';}}if(!nav.querySelector('[data-arus-help-link]')){const a=document.createElement('a');a.href='bantuan.html';a.textContent='Bantuan & Pengaduan';a.dataset.arusHelpLink='1';nav.appendChild(a);}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addNav,{once:true});else addNav();}
})();
