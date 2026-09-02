# FIND — Field Insights & Notes Dashboard

Versi Next.js dari FIND, siap dipublikasikan ke **Vercel** dengan database **Supabase**.
Tampilan antarmuka identik dengan versi single-file HTML: berkas `src/app/globals.css`
dipindahkan apa adanya, dan setiap komponen memakai kelas CSS yang sama.

Struktur catatan mengikuti **Catatan Lapangan Tanoto Foundation — Template v2**
(A. Identifikasi · B. Ringkasan · C. Observasi Fakta vs Interpretasi · D. Rencana Tindak Lanjut).

---

## 1. Apa yang berbeda dari versi HTML

| | HTML single-file | Next.js |
|---|---|---|
| Penyimpanan | `localStorage` di satu browser | Postgres Supabase, terpusat dan multi-user |
| Login | pemilih peran tanpa autentikasi | Supabase Auth (email + kata sandi) |
| Pembatasan akses | hanya di sisi tampilan | Row Level Security di database + pemeriksaan peran di server |
| Kunci Anthropic | dimasukkan pengguna di browser | environment variable di server, tidak pernah sampai ke browser |
| Manajemen pengguna | Pengaturan → Pengguna (data lokal) | Pengaturan → Pengguna, terhubung Supabase Auth |
| Ganti kata sandi | menu **Akun** di sidebar | menu **Akun** di sidebar, lewat Supabase Auth |

Rubrik penilaian kualitas, mesin analisis terstruktur, prompt AI, dan lembar cetak dipindahkan
tanpa perubahan logika, sehingga hasil dari kedua versi dapat dibandingkan langsung.

## Dua lapis analisis

**Lapis 1 — analisis terstruktur (`src/lib/rules.ts`).** Deterministik, tanpa panggilan API,
tanpa biaya, selalu berjalan. Menghasilkan cakupan dan keterwakilan, kekuatan bukti agregat,
tema berulang lewat leksikon M&E, faktor penghambat dan pendorong lewat frasa penanda,
pola tindak lanjut, serta usulan learning agenda yang diturunkan dari kesenjangan struktural.
Batasnya jelas dan dinyatakan di antarmuka: pencocokan bersifat harfiah, mesin tidak memahami
makna kalimat.

Laporan lapis 1 dapat disalin atau diunduh sebagai Markdown langsung dari menu Analisis,
sehingga bisa dilampirkan ke laporan program tanpa menyalakan AI sama sekali.

**Lapis 2 — sintesis AI (`/api/ai`).** Opsional. Tombolnya aktif **hanya bila
`ANTHROPIC_API_KEY` terpasang di server**; keberadaannya diperiksa di `app/(app)/layout.tsx`
dan dialirkan ke UI sebagai flag boolean — nilai kuncinya sendiri tidak pernah dikirim ke
browser. Tanpa kunci, tombol dinonaktifkan dengan keterangan yang jelas dan seluruh menu
lain tetap berfungsi penuh. Menyalakan AI belakangan hanya perlu menambah environment
variable di Vercel lalu redeploy — tidak ada kode yang perlu diubah.

---

## 2. Menyiapkan Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, tempel seluruh isi `supabase/schema.sql`, jalankan.
   Skrip ini membuat tabel `profiles` dan `notes`, trigger pembuatan profil otomatis,
   serta seluruh policy Row Level Security.
3. Buka **Authentication → Users → Add user**, buat akun pertama Anda.
   Pengguna pertama otomatis mendapat peran **Administrator**.
4. (Opsional) Jalankan `supabase/seed.sql` untuk memasukkan satu catatan contoh.
   Ganti dulu alamat email di dalam berkas dengan email akun Anda.

Peran pengguna berikutnya diatur dari dalam aplikasi: **Pengaturan → Pengguna**.
Menu **Pengaturan** hanya tampil untuk Administrator. Peran lain mengganti kata sandi dan
skala tampilan lewat tombol **Akun** di bagian bawah sidebar.

### Cakupan akses per peran

| Peran | Catatan yang terlihat | Analisis AI | Kualitas | Hapus | Kelola pengguna |
|---|---|---|---|---|---|
| Field Officer | miliknya sendiri | – | – | miliknya sendiri | – |
| MLE Analyst | seluruhnya | ya | ya | miliknya sendiri | – |
| Administrator | seluruhnya | ya | ya | seluruhnya | ya |

Pembatasan ini ditegakkan dua kali: di route handler dan di policy database.
Walaupun seseorang memanggil API secara langsung, Postgres tetap menolak baris di luar haknya.

---

## 3. Menjalankan secara lokal

```bash
cp .env.example .env.local   # isi nilainya
npm install
npm run dev                  # http://localhost:3000
```

Environment variable:

| Variabel | Wajib | Keterangan |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ya | Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ya | Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ya | cadangan pembuatan profil pertama; hanya dipakai di server |
| `ANTHROPIC_API_KEY` | tidak | tanpa ini seluruh aplikasi tetap berfungsi; menu Analisis tetap menghasilkan laporan terstruktur, hanya lapisan sintesis AI yang nonaktif |
| `ANTHROPIC_MODEL` | tidak | default `claude-sonnet-4-6` |

---

## 4. Publikasi ke Vercel

1. Dorong repositori ini ke GitHub.
2. Di Vercel: **Add New → Project**, pilih repositorinya. Framework terdeteksi otomatis
   sebagai Next.js; tidak ada pengaturan build yang perlu diubah.
3. Masukkan keempat environment variable di atas untuk environment
   *Production*, *Preview*, dan *Development*.
4. **Deploy**.
5. Di Supabase, buka **Authentication → URL Configuration**, isi *Site URL*
   dengan domain Vercel Anda agar tautan autentikasi mengarah ke domain yang benar.

Route `/api/ai` diberi `maxDuration = 60` karena sintesis lintas catatan bisa
memakan waktu lebih dari batas bawaan.

---

## 5. Peta berkas

```
src/
  app/
    (app)/                    ruang kerja setelah login
      page.tsx                Ringkasan
      catatan/                daftar, form baru, ubah
      analisis/               sintesis AI lintas catatan
      kualitas/               penilaian rubrik per catatan
      tindak-lanjut/          pelacakan komitmen
      pengaturan/             tampilan, data, pengguna
    api/
      notes/                  CRUD catatan
      users/                  daftar & perubahan peran (Administrator)
      ai/                     pemanggilan Anthropic dari sisi server
    login/                    halaman masuk Supabase Auth
    globals.css               dipindahkan apa adanya dari versi HTML
  components/
    Shell.tsx                 sidebar dan kerangka aplikasi
    NotesProvider.tsx         state catatan di sisi klien
    NoteForm.tsx              form A–D + pemeriksaan kualitas langsung
    NoteModal.tsx             detail catatan
    PrintSheet.tsx            lembar cetak A4 lengkap
    RuleReport.tsx            penyaji laporan analisis terstruktur
    Charts.tsx                grafik SVG tanpa pustaka eksternal
  lib/
    taxonomy.ts               daftar departemen, program, jenis kegiatan, peran
    scoring.ts                rubrik kualitas deterministik
    rules.ts                  mesin analisis terstruktur (rule-based, tanpa AI)
    ai-prompts.ts             system prompt dan struktur keluaran sintesis AI
    db.ts                     akses data Supabase
    serialize.ts              pemetaan kolom Postgres ↔ bentuk UI
supabase/
  schema.sql                  tabel, trigger, dan policy RLS
  seed.sql                    catatan contoh (opsional)
```

---

## 6. Catatan penggunaan

Isi catatan lapangan yang dianalisis dikirim ke Anthropic API pada saat analisis dijalankan.
Jangan memasukkan data pribadi penerima manfaat yang dapat mengidentifikasi individu
ke dalam catatan.

Skor kualitas dihitung dengan rubrik tetap, bukan dengan AI. Skor tinggi berarti catatan
**layak dianalisis** — bukan berarti temuannya positif atau programnya berhasil.
Keluaran AI adalah hipotesis awal untuk didiskusikan tim, bukan temuan evaluasi tervalidasi.
