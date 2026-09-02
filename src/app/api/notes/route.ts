import { NextResponse } from 'next/server';
import { currentProfile } from '@/lib/auth';
import { listNotes, createNote } from '@/lib/db';
import { fromPayload } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentProfile();
  if (!me) return NextResponse.json({ error: 'Belum masuk.' }, { status: 401 });
  // Cakupan baris ditentukan Row Level Security: Field Officer hanya melihat catatannya sendiri.
  try {
    return NextResponse.json({ notes: await listNotes() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const me = await currentProfile();
  if (!me) return NextResponse.json({ error: 'Belum masuk.' }, { status: 401 });

  const body = await req.json();
  const data = fromPayload(body);
  if (!data.judul.trim()) return NextResponse.json({ error: 'Judul kegiatan wajib diisi.' }, { status: 400 });

  try {
    const note = await createNote({ ...data, email_tf: data.email_tf || me.email }, me.id);
    return NextResponse.json({ note }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
