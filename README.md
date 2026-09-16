# Patungan — Split Bill

Website split bill berbahasa Indonesia: upload foto struk, koreksi hasil OCR, tambahkan nama, lalu pilih pemilik setiap pesanan atau bagi rata ke beberapa orang.

## Fitur

- OCR di browser memakai Tesseract.js, tanpa API key.
- Input dan koreksi item manual.
- Pajak, service, dan diskon dibagi proporsional berdasarkan pesanan.
- Pembulatan rupiah dengan jumlah bagian yang tetap sama dengan total tagihan.
- Pemeriksaan total terhadap struk dan salin ringkasan ke chat.
- Tampilan responsif untuk HP dan desktop.

## Jalankan lokal

Tidak membutuhkan instalasi npm atau proses build. Dari root repository:

```sh
python3 -m http.server 8000 --directory dist
```

Buka http://localhost:8000. Gunakan HTTP server; jangan membuka index.html langsung melalui file:// karena aplikasi memakai JavaScript modules.

## Deploy statis

Seluruh file website siap pakai ada di `dist/`:

- `index.html`
- `style.css`
- `app.js`
- `calc.mjs`

Pada hosting statis seperti Cloudflare Pages, gunakan `dist` sebagai direktori output dan kosongkan build command. Tidak ada environment variable atau API key yang diperlukan.

File `.openai/hosting.json` mempertahankan konfigurasi deployment Sites asal; hosting lain cukup menggunakan isi `dist/`.

## Privasi dan batasan

Foto struk diproses di perangkat melalui OCR. Koneksi internet diperlukan untuk mengunduh library dan model OCR. Hasil OCR dapat salah, terutama untuk foto buram atau tata letak struk yang rumit, sehingga nama item, harga, pajak, service, dan total perlu diperiksa.

Harga item adalah total per baris, sudah termasuk jumlah barang. Satu item yang dipilih beberapa orang dibagi rata. Data tagihan berada di memori halaman dan akan hilang saat halaman dimuat ulang.
