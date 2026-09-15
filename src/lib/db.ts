/* ============================================================
   Lapisan akses data — Supabase Postgres.
   Query dijalankan dengan sesi pengguna, sehingga Row Level
   Security di database menjadi lapisan pertahanan terakhir
   di samping pemeriksaan peran di route handler.
   ============================================================ */
import { createClient } from './supabase/server';
import { createAdminClient } from './supabase/admin';
import { toNote } from './serialize';
import type { Note, Profile, Role, AiInsight } from './types';

const NOTE_COLS = '*';

export async function listNotes(): Promise<Note[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from('notes')
    .select(NOTE_COLS)
    .order('tgl_kegiatan', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toNote);
}

export async function getNote(id: string): Promise<Note | null> {
  const sb = createClient();
  const { data, error } = await sb.from('notes').select(NOTE_COLS).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toNote(data) : null;
}

export async function createNote(values: Record<string, unknown>, authorId: string): Promise<Note> {
  const sb = createClient();
  const { data, error } = await sb
    .from('notes')
    .insert({ ...values, author_id: authorId })
    .select(NOTE_COLS)
    .single();
  if (error) throw new Error(error.message);
  return toNote(data);
}

export async function updateNote(id: string, values: Record<string, unknown>): Promise<Note> {
  const sb = createClient();
  const { data, error } = await sb.from('notes').update(values).eq('id', id).select(NOTE_COLS).single();
  if (error) throw new Error(error.message);
  return toNote(data);
}

export async function updateNoteAi(id: string, ai: AiInsight | null): Promise<Note> {
  return updateNote(id, { ai });
}

export async function deleteNote(id: string): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from('notes').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ---------- Profil ---------- */

export async function getProfile(id: string): Promise<Profile | null> {
  const sb = createClient();
  const { data, error } = await sb.from('profiles').select('id,email,name,role').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? { id: data.id, email: data.email, name: data.name, role: data.role as Role } : null;
}

/** Dipakai hanya bila trigger handle_new_user belum terpasang di database. */
export async function ensureProfile(id: string, email: string, name: string): Promise<Profile> {
  const admin = createAdminClient();
  const { count } = await admin.from('profiles').select('id', { count: 'exact', head: true });
  const role: Role = (count ?? 0) === 0 ? 'admin' : 'field';
  const { data, error } = await admin
    .from('profiles')
    .upsert({ id, email, name, role }, { onConflict: 'id' })
    .select('id,email,name,role')
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id, email: data.email, name: data.name, role: data.role as Role };
}

export async function listProfilesWithCounts() {
  const sb = createClient();
  const [{ data: profiles, error: e1 }, { data: notes, error: e2 }] = await Promise.all([
    sb.from('profiles').select('id,email,name,role,created_at').order('created_at', { ascending: true }),
    sb.from('notes').select('author_id')
  ]);
  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);
  const tally = new Map<string, number>();
  (notes ?? []).forEach((n: { author_id: string }) => tally.set(n.author_id, (tally.get(n.author_id) ?? 0) + 1));
  return (profiles ?? []).map((p: any) => ({
    id: p.id, email: p.email, name: p.name, role: p.role as Role, notes: tally.get(p.id) ?? 0
  }));
}

export async function countAdmins(): Promise<number> {
  const sb = createClient();
  const { count, error } = await sb.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function updateProfileRole(id: string, role: Role): Promise<Profile> {
  const sb = createClient();
  const { data, error } = await sb.from('profiles').update({ role }).eq('id', id).select('id,email,name,role').single();
  if (error) throw new Error(error.message);
  return { id: data.id, email: data.email, name: data.name, role: data.role as Role };
}

export async function listNotesByIds(ids: string[]): Promise<Note[]> {
  const sb = createClient();
  const { data, error } = await sb.from('notes').select(NOTE_COLS).in('id', ids);
  if (error) throw new Error(error.message);
  return (data ?? []).map(toNote);
}
