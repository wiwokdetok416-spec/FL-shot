# FL-shot (FireLight-shot)

Website yang menampilkan layar berkedip hitam ke putih dengan suara mengganggu.
Kecepatan kedip dan kebisingan suara bisa diatur sendiri.

## PERINGATAN
Kedipan cepat bisa memicu kejang pada penderita epilepsi fotosensitif. Suara keras bisa merusak pendengaran.
Jangan dipakai untuk mengagetkan orang lain tanpa sepengetahuan mereka.

## Fitur
- Peringatan wajib dicentang sebelum apa pun bisa dimulai
- Tidak ada autoplay: kedipan dan suara baru jalan setelah tombol Mulai ditekan
- Mode aman bawaan: maksimum 3 kedipan per detik. Mode cepat (maks 10/detik) harus dibuka manual
- Slider kebisingan suara 0-100%, volume awal 15%, suara naik pelan saat mulai, ada batas maksimum
- Tombol Berhenti, tombol Esc, dan berhenti otomatis saat tab ditinggalkan
- Menghormati pengaturan "reduce motion": mode cepat dinonaktifkan
- Suara dibuat dengan Web Audio API, tanpa file audio

## Cara pakai
Buka `index.html` di browser. Tidak perlu instalasi.

## Hosting di GitHub Pages
1. Upload semua file ke repository
2. Settings > Pages > pilih branch `main` dan folder `/ (root)`
3. Buka link yang diberikan GitHub
