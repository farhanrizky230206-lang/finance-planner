ARUS FINANCE — LANDING PAGE PUBLIK (VERSI TAMBAHAN)

PENTING: Jangan menghapus atau mengganti konfigurasi Supabase.
Paket ini sengaja TIDAK memuat app.html/config.js agar aplikasi kamu yang sudah berjalan tidak tertimpa versi lama.

LANGKAH DI GITHUB — lakukan berurutan:
1. Masuk repository finance-planner, pilih file index.html LAMA (berisi login + dashboard).
2. Klik Edit (ikon pensil), klik kolom nama file di atas editor, ubah dari index.html menjadi app.html.
   (Jika GitHub tidak memungkinkan rename melalui editor, download index.html kamu lalu upload ulang sebagai app.html,
   cek sudah tersimpan, baru ganti index.html.)
3. Commit changes. Pastikan URL https://finance-planner-psi-seven.vercel.app/app.html bisa membuka halaman login/dashboard LAMA.
4. Baru upload isi ZIP landing ini ke ROOT repository lewat Add file -> Upload files.
   Jika GitHub tidak mengekstrak ZIP, ekstrak di laptop dulu dan upload file-file di dalamnya.
   Pastikan index.html baru, assets/, tentang.html, panduan.html, privasi.html, ketentuan.html, kontak.html, ads.txt ada
   sejajar dengan app.html dan config.js.
5. Commit changes. Tunggu Vercel Deployment = Ready. Refresh root https://finance-planner-psi-seven.vercel.app/
6. Tes: landing -> tombol Masuk/Daftar -> app.html -> login Google/email -> dashboard -> transaksi tetap ada.
7. Supabase Authentication > URL Configuration: pastikan Site URL memakai domain Vercel yang benar. Tambahkan
   Redirect URL: https://finance-planner-psi-seven.vercel.app/app.html (jika belum ada).
   Jika redirect lama masih ke /, gunakan wildcard yang aman atau callback khusus /app.html.
8. Buka domain utama, pastikan halaman privasi/guide bisa dibuka tanpa login.
9. Di AdSense periksa status peninjauan; kode yang dipasang bukan jaminan persetujuan.

HAL WAJIB DICEK SEBELUM SITUS PUBLIK:
- Edit kontak.html dan ganti placeholder email dukungan dengan email resmi kamu.
- Pastikan kode AdSense ca-pub-5734159545290989 sesuai ID akun AdSense kamu.
- Sesuaikan isi kebijakan privasi/ketentuan dengan layanan yang benar-benar kamu gunakan.
- Beri mekanisme persetujuan iklan/cookie sesuai lokasi pengunjung apabila diperlukan.
- Jika domain berubah, edit canonical pada index.html + halaman pendukung dan sitemap.xml.
- Cek pengiriman notifikasi WA dan keputusan privasi; jangan menyatakan fitur bekerja jika bot offline.

PENTING: FILE LAMA config.js JANGAN DIHAPUS ATAU DITIMPA. File bot WhatsApp juga tidak perlu diubah.
Jika aplikasi lama memakai referensi file relatif, pemindahan ke app.html di root yang sama mempertahankan path tersebut.
Jika pengguna baru konfirmasi email, redirect akan diarahkan ke app.html oleh kode aplikasi yang mengacu location.pathname.

PUBLIKASI YANG AMAN: Jika ragu, backup dulu repo GitHub (download ZIP via Code > Download ZIP).
