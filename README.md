# Arus. Pro — Keuangan + Akun + Bot WhatsApp

Website siap di-host statis di Vercel, Netlify, atau GitHub Pages. **Autentikasi dan pengiriman WA belum aktif sampai layanan eksternal dikonfigurasi.**

## Yang tersedia

- Daftar (nama lengkap, email, password, nomor WA, jenis kelamin, tanggal lahir, persetujuan pengingat).
- Masuk email/password, masuk/daftar lewat Google. Pendaftar Google diarahkan melengkapi profil WA/gender/tanggal lahir jika kosong.
- Profil bisa diedit (termasuk persetujuan pesan), logout, dan hapus akun lengkap dengan seluruh data.
- Transaksi tambah/edit/hapus, dashboard, rencana dan kategori anggaran, target tabungan, impor/ekspor backup, pencarian.
- Isolasi data per akun dengan Supabase Row Level Security (RLS); akun berbeda tidak dapat melihat data satu sama lain.
- Kode verifikasi nomor WhatsApp: pengguna meminta kode di Profil, lalu mengirim `VERIFIKASI 123456` dari nomor tersebut ke bot. Nomor tidak mendapat notifikasi sampai diverifikasi.
- Pengingat WhatsApp Cloud API bila pengeluaran dalam bulan berjalan mencapai **80%** atau **melewati 100%** dari *jumlah batas belanja pada seluruh kategori*. Maksimal **satu pesan 80%** dan **satu pesan melebihi anggaran** per bulan per akun. Hanya jika pengguna sudah centang persetujuan, WhatsApp Business telah diaktifkan, dan Meta menerima template.
- Bot WA: `VERIFIKASI <kode>`, `STATUS`, `STOP`/`BERHENTI`, `BANTUAN`/`HELP`. Bot menanggapi pesan masuk dengan teks biasa sesuai jendela layanan WhatsApp.

## Persiapan Supabase

1. Buat project di [supabase.com](https://supabase.com). Masuk **SQL Editor** dan jalankan file `supabase/schema.sql` **sekali**. File ini membuat `profiles`, `finance_books`, `notification_logs`, trigger registrasi, dan kebijakan RLS.
2. Buka **Authentication → Providers → Email** dan atur metode verifikasi email sesuai kebutuhan. Direkomendasikan **Enable email confirmations**. Pastikan template email dan URL redirect diatur dengan benar.
3. Masuk **Authentication → URL Configuration**. Masukkan URL hosting sebenarnya sebagai **Site URL** dan **Redirect URLs** (misalnya `https://namamu.vercel.app/**`). `localhost` harus di-allowlist untuk pengujian lokal.
4. Aktifkan **Authentication → Providers → Google**. Di Google Cloud Console buat OAuth Client jenis Web. Authorized redirect URI **harus** persis URL callback Supabase yang ditampilkan di panel provider (`https://<project-ref>.supabase.co/auth/v1/callback`). Tempel Client ID dan Client Secret ke **Supabase Dashboard saja**, bukan file website. Atur authorized JavaScript origins sesuai petunjuk Google Cloud. Rujukan: https://supabase.com/docs/guides/auth/social-login/auth-google
5. Copy **Project URL** dan **publishable key** (`sb_publishable_...`) atau *anon public key* (lama) dari Supabase API keys ke `config.js` di dua properti berikut:
   ```js
   window.ARUS_CONFIG = { supabaseUrl: 'https://xxxx.supabase.co', supabasePublishableKey: 'sb_publishable_xxx', businessWhatsAppNumber: '628xxxxxxxxxx' };
   ```
   Jangan memasukkan `service_role`, secret key, Meta token, atau Google Client Secret ke kode yang di-host.
6. Upload `index.html` dan `config.js` ke repo GitHub, deploy lewat Vercel (framework **Other**, root directory **/**). Pastikan `config.js` ditemukan dari domain dan folder yang sama dengan `index.html`.

## Persiapan WhatsApp Business Platform resmi (Meta)

1. Buat akun **Meta Developer / WhatsApp Business Platform** dan hubungkan nomor pengirim WhatsApp Business yang diizinkan. Siapkan **WhatsApp Business Account**, `Phone Number ID`, dan access token dengan izin yang diperlukan. Untuk produksi perlu proses Meta yang berlaku (termasuk verifikasi, onboarding, batas pengiriman dan biaya pesan).
2. Minta persetujuan **message template** tipe *utility*, misalnya bernama `arus_budget_warning` dengan bahasa `id` dan **empat placeholder di body**. Contoh isi (teks persis template yang disetujui Meta):
   > Hai {{1}}, pengeluaranmu pada {{2}} sudah mencapai {{3}} dari anggaran {{4}}. Yuk mulai berhemat dan cek kembali rencana keuanganmu di Arus.

   Buat template dulu di WhatsApp Manager dan tunggu status **Approved**. Kirim pesan pertama / pesan di luar 24 jam hanya menggunakan template yang disetujui. User harus secara sadar mencentang persetujuan pengingat di form daftar/profil. Persetujuan default **nonaktif**.
3. Set Supabase **Edge Function Secrets** (CLI atau Dashboard):
   ```text
   WA_ACCESS_TOKEN=EAAG...  (JANGAN DISIMPAN DALAM REPO)
   WA_PHONE_NUMBER_ID=...
   WA_API_VERSION=v24.0   (ganti ke versi Graph API yang masih didukung pada akun Meta kamu)
   WA_TEMPLATE_NAME=arus_budget_warning
   WA_TEMPLATE_LANG=id
   META_APP_SECRET=...  (dari Meta Developer App)
   WA_VERIFY_TOKEN=buat-token-acak-yang-kuat
   WA_VERIFY_PEPPER=buat-rahasia-panjang-minimal-20-karakter
   ```
   Supabase umumnya memasok `SUPABASE_URL`, `SUPABASE_ANON_KEY` dan `SUPABASE_SERVICE_ROLE_KEY` ke Edge Functions. Fungsi juga mengenali `SUPABASE_PUBLISHABLE_KEY` dan `SUPABASE_SECRET_KEY` sebagai alternatif. **Pastikan variabel yang sesuai tersedia di environment Functions project kamu**; jangan mengirim secret key ke browser. Jangan pernah menaruh service role di browser.
4. Install Supabase CLI lalu login, link proyek, dan deploy:
   ```bash
   npx supabase login
   npx supabase link --project-ref REF_PROYEK_KAMU
   npx supabase functions deploy budget-alert
   npx supabase functions deploy delete-account
   npx supabase functions deploy start-wa-verification
   npx supabase functions deploy whatsapp-webhook --no-verify-jwt
   ```
   Gunakan perintah `npx supabase secrets set KEY=VALUE ...` atau menu Secrets di Dashboard.
5. Untuk bot 2 arah: pada Meta **Webhooks → WhatsApp Business Account → messages**, daftarkan callback URL:
   ```text
   https://REF_PROYEK_KAMU.supabase.co/functions/v1/whatsapp-webhook
   ```
   Masukkan verify token yang sama dengan `WA_VERIFY_TOKEN`. Function GET memvalidasi challenge dan POST memverifikasi `X-Hub-Signature-256` menggunakan `META_APP_SECRET`.
6. **Verifikasi nomor dari menu Profil**: isi `businessWhatsAppNumber` dalam `config.js` dengan nomor pengirim WA Business (bukan Phone Number ID), klik **Buat kode verifikasi**, kirim `VERIFIKASI 123456` dari nomor WA yang didaftarkan. Tunggu jawaban bot dan klik **Perbarui status**. Kode berlaku 10 menit; OTP disimpan sebagai HMAC hash di database. Baru setelah status verified dan opt-in aktif, pengingat bisa terkirim.
7. **Uji dengan nomor WhatsApp yang diizinkan** oleh mode pengembangan Meta. Buat rencana anggaran Rp1.000.000, centang persetujuan di profil, tambah pengeluaran Rp800.000 (pengingat 80%), lalu tambah Rp300.000 (pengingat >100%). Periksa table `notification_logs` untuk status sent/failed, dan Edge Function logs jika pesan tak terkirim. Teks template harus sesuai Meta, jangan kirim pesan langsung dari JS browser.

## Detail penting

- Aplikasi meminta jenis kelamin dan tanggal lahir untuk profil; keduanya tidak menentukan skor atau batas anggaran, dan tidak dibagikan ke Meta. Nama, nomor WA dan total belanja/anggaran hanya dikirim ke Meta ketika notifikasi dipicu dengan opt-in.
- Jika pengiriman pesan gagal (`notification_logs.status = failed`), pengiriman tidak otomatis diulang untuk threshold yang sama. Admin harus menyelidiki log dan menentukan cara retry secara aman; jangan langsung menghapus log tanpa memeriksa apakah Meta sebenarnya telah menerima pesan.
- Karena operasi keuangan disimpan sebagai dokumen JSON tiap akun, dua perangkat yang mengedit *bersamaan* dapat menimpa perubahan terakhir; gunakan satu perangkat per waktu, atau lakukan pengembangan normalisasi transaksi/optimistic concurrency untuk produksi banyak pengguna.
- Pengingat adalah notifikasi berbasis **input transaksi / simpan rencana** pada aplikasi, bukan layanan yang memonitor mutasi rekening bank. Tanpa transaksi yang dicatat, aplikasi tidak dapat mengetahui pengeluaran sebenarnya. Jika Meta API sedang gagal, data transaksi tetap tersimpan dan status pengiriman akan tercatat di `notification_logs`.
- Pengingat dikirim hanya untuk **bulan berjalan berdasarkan zona Asia/Jakarta**, tidak untuk impor backup historis. Setelah berhasil dikirim satu kali untuk ambang tertentu pada bulan itu, pengiriman tidak diulang.
- `notification_logs` tidak diekspos ke pengguna; service_role saja dapat menulis/membaca. RLS melindungi data profil dan keuangan setiap pengguna.
- Kode `VERIFIKASI` diperlukan karena mencentang persetujuan saja tidak membuktikan nomor WhatsApp dimiliki pengguna. Penggantian nomor membatalkan verifikasi lama.
- Balasan `STOP` mengubah `whatsapp_opt_in` ke `false` (jika nomor sama dipakai lebih dari satu akun, semua akun dengan nomor tersebut dimatikan). Pesan `STATUS` membaca catatan akun yang terkait nomor WA. Sebaiknya hindari memakai nomor yang sama untuk lebih dari satu akun; untuk produksi multi-tenant, terapkan kepemilikan nomor unik & verifikasi OTP.
- Penghapusan akun menggunakan Edge Function terautentikasi; menghapus pengguna di Auth secara otomatis menghapus data terkait melalui foreign key `ON DELETE CASCADE`.
- Saat digunakan publik, tambahkan kebijakan privasi, ketentuan penghapusan/retensi data, perlindungan pengguna di bawah umur, serta monitoring kegagalan pesan sesuai kewajiban yang berlaku.
- Perubahan profil disimpan terpisah dari credential password. Untuk mengganti password/email perlu alur Supabase Auth; tombol ubah kredensial belum dibuat.
- Mode demo di halaman login hanya menyimpan data lokal dan **tidak mengirim WhatsApp**. Setelah konfigurasi selesai, login baru memuat data akun cloud. Bila ada catatan dari versi lama, saat pertama login akan ditawarkan menyalin data tersebut ke akun.

## Referensi

- Supabase Auth Google: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Edge Functions auth: https://supabase.com/docs/guides/functions/auth
- WhatsApp Business Platform API: https://developers.facebook.com/docs/whatsapp/cloud-api/
