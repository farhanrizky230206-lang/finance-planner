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
