import { createClient } from './supabase/server';
import { getProfile, ensureProfile } from './db';
import type { Profile } from './types';

/** Profil pengguna aktif. null bila belum masuk. */
export async function currentProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const p = await getProfile(user.id);
  if (p) return p;

  // Fallback bila trigger handle_new_user belum terpasang di database.
  return ensureProfile(
    user.id,
    user.email ?? '',
    (user.user_metadata?.name as string) || (user.email ?? '').split('@')[0]
  );
}

export async function requireProfile(): Promise<Profile> {
  const p = await currentProfile();
  if (!p) throw new Error('UNAUTHORIZED');
  return p;
}
