# Menyematkan FIND ke halaman SharePoint

## 1. Kode embed

Tempelkan di web part **Embed** pada halaman SharePoint:

```html
<iframe
  src="https://find-tfid.vercel.app"
  title="FIND — Field Insights & Notes Dashboard"
  width="100%"
  height="1400"
  style="border:0;display:block"
  loading="lazy"
  allow="clipboard-write"
  referrerpolicy="strict-origin-when-cross-origin">
</iframe>
```

Beberapa halaman SharePoint memberi tinggi terbatas pada web part. Bila tampilan
terpotong, naikkan angka `height` atau atur tinggi web part lewat panel properti.
FIND tidak dapat menyesuaikan tinggi iframe sendiri karena iframe berada di domain
yang berbeda.

Untuk membuka satu menu langsung, tambahkan path pada `src`, misalnya
`https://find-tfid.vercel.app/analisis` atau `.../catatan`.

## 2. Izinkan domainnya di SharePoint

Web part Embed hanya menerima iframe dari domain yang diizinkan tenant.
SharePoint Admin Center → **Settings** → **Custom Script / HTML Field Security**,
tambahkan `https://find-tfid.vercel.app` ke daftar sumber iframe yang diizinkan.
Tanpa langkah ini SharePoint menolak kodenya dengan pesan bahwa penyematan
dari domain tersebut tidak diizinkan.

## 3. Izinkan penyematan dari sisi FIND

Aplikasi menolak disematkan oleh domain yang tidak terdaftar. Di Vercel →
Project Settings → Environment Variables, tambahkan:

| Variabel | Nilai |
|---|---|
| `ALLOWED_FRAME_ANCESTORS` | `'self' https://<tenant>.sharepoint.com` |
| `NEXT_PUBLIC_EMBED_MODE` | `1` |

Ganti `<tenant>` dengan nama tenant Anda, misalnya `tanoto`. Tanda kutip pada
`'self'` ikut ditulis.

Setelah menambahkan keduanya, jalankan **Redeploy**. Ini wajib, bukan opsional:
daftar domain ditanamkan ke dalam konfigurasi rute pada saat build, sehingga
mengubah nilai variabel tanpa membangun ulang tidak berpengaruh sama sekali.
Sudah diuji: dengan variabel terpasang saat build, respons membawa header
`Content-Security-Policy: frame-ancestors 'self' https://<tenant>.sharepoint.com;`

`NEXT_PUBLIC_EMBED_MODE=1` mengubah cookie sesi Supabase menjadi
`SameSite=None; Secure`. Tanpa itu, cookie sesi tidak ikut terkirim di dalam
iframe lintas domain dan pengguna tidak akan pernah dianggap sudah masuk.

## 4. Batasan yang perlu diketahui sebelum memutuskan

**Pemblokiran cookie pihak ketiga.** Di dalam iframe, cookie FIND dihitung
sebagai cookie pihak ketiga. Safari memblokirnya secara bawaan dan tidak dapat
dilonggarkan oleh situs. Chrome dan Edge masih mengizinkan pada konfigurasi
bawaan saat ini, tetapi pengguna yang mengaktifkan pemblokiran cookie pihak
ketiga akan gagal masuk. Gejalanya khas: setelah menekan Masuk, halaman kembali
ke form masuk tanpa pesan galat.

**Login di dalam iframe.** Pengguna harus mengisi email dan kata sandi di dalam
iframe yang sempit. Ini berfungsi, tetapi pengelola kata sandi browser sering
tidak menawarkan isian otomatis pada konteks lintas domain.

**Alternatif yang lebih andal.** Bila keandalan lebih penting daripada tampilan
menyatu, gunakan web part **Quick links** atau tombol yang membuka
`https://find-tfid.vercel.app` di tab baru. Cara ini bebas dari seluruh masalah
cookie pihak ketiga dan memberi ruang layar penuh untuk tabel dan form yang lebar.

**Jalan tengah.** Sematkan iframe untuk tampilan baca — misalnya arahkan ke
`/analisis` — dan sediakan tautan "Buka di tab baru" tepat di bawahnya untuk
pekerjaan input dan cetak.
