# Memastikan build terbaru benar-benar ter-deploy

Versi paket ini: **FIND v1.1.0** (2026-09-02).

## 1. Cek dari aplikasi

Setelah push dan redeploy, lihat pojok kiri bawah sidebar. Di bawah nama peran
harus tertulis **FIND v1.1.0**. Nomor versi juga muncul di footer halaman masuk.

Kalau tulisan itu tidak ada sama sekali, yang berjalan masih build lama —
push atau redeploy-nya belum masuk.

## 2. Ciri build lama vs build baru pada menu Analisis

| | Build lama | v1.1.0 |
|---|---|---|
| Tombol kanan atas | "Jalankan sintesis AI" | "Sintesis AI (opsional)", nonaktif bila `ANTHROPIC_API_KEY` kosong |
| Kartu setelah strip statistik | langsung "Hasil analisis" | "Analisis terstruktur", "Tema berulang", "Faktor penghambat/pendorong", "Pola tindak lanjut", "Usulan learning agenda" |
| Ekspor | tidak ada | tombol "Salin laporan" dan "Unduh .md" |
| Detail satu catatan | tidak ada bagian analisis | bagian "Analisis catatan" di dalam modal |

## 3. Cek dari repositori

Berkas berikut hanya ada pada v1.1.0. Kalau salah satu tidak ditemukan di GitHub,
berarti isi paket belum seluruhnya ter-push:

```bash
git ls-files src/lib/rules.ts src/components/RuleReport.tsx src/lib/version.ts
```

Ketiganya harus muncul. Bila kosong:

```bash
git add -A
git commit -m "FIND v1.1.0 — analisis dua lapis"
git push
```

## 4. Cek dari Vercel

Buka Vercel → Deployments. Pastikan deployment paling atas berstatus **Ready**,
berlabel **Production**, dan commit hash-nya sama dengan commit terakhir di GitHub.
Jika deployment terbaru masih Preview, promosikan ke Production atau lakukan
Redeploy pada branch produksi.

Vercel tidak otomatis membangun ulang bila tidak ada commit baru. Menambahkan
environment variable saja **tidak** memicu build — setelah menambah
`ANTHROPIC_API_KEY`, tetap jalankan Redeploy agar nilainya terbaca.
