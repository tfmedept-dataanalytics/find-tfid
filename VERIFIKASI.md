# Cek cepat sebelum deploy ke Vercel

Error `Couldn't find any 'pages' or 'app' directory` berarti Next.js tidak menemukan
folder `app` di root repositori maupun di `src/`. Jalankan pemeriksaan berikut di
repositori Anda **setelah** commit dan push.

```bash
# 1. Harus muncul 38 berkas. Kalau 0, folder src belum ter-commit.
git ls-files src | wc -l

# 2. Harus ada file layout dan page utama.
git ls-files "src/app/layout.tsx" "src/app/(app)/page.tsx"

# 3. package.json harus berada di root repositori, bukan di dalam subfolder.
git ls-files package.json
```

Struktur yang benar di root repositori:

```
package.json
next.config.mjs
tsconfig.json
src/
  app/
  components/
  lib/
  middleware.ts
public/logo-tf.png
supabase/schema.sql
```

Jika `git ls-files src` kosong, jalankan:

```bash
git add -A
git commit -m "Tambahkan folder src"
git push
```

Jika `package.json` berada di dalam subfolder (misalnya `find-nextjs/package.json`),
buka Vercel → Project Settings → General → **Root Directory**, isi dengan nama
subfolder tersebut, lalu Redeploy.
