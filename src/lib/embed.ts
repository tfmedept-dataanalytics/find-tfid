import type { CookieOptions } from '@supabase/ssr';

/**
 * Mode sematan (embed).
 *
 * Saat FIND dibuka di dalam <iframe> pada domain lain — misalnya SharePoint —
 * cookie sesi Supabase menjadi cookie pihak ketiga. Cookie ber-SameSite=Lax
 * (bawaan) tidak ikut terkirim pada konteks itu, sehingga pengguna tidak
 * pernah dianggap login. Menyetel SameSite=None + Secure membuatnya terkirim.
 *
 * Diaktifkan dengan environment variable NEXT_PUBLIC_EMBED_MODE=1.
 * Biarkan mati bila aplikasi tidak disematkan: SameSite=Lax lebih aman.
 */
export const EMBED_MODE = process.env.NEXT_PUBLIC_EMBED_MODE === '1';

export const cookieOptions: CookieOptions = EMBED_MODE
  ? { sameSite: 'none', secure: true, path: '/' }
  : { sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' };
