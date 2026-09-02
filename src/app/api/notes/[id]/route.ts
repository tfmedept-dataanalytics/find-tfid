import { NextResponse } from 'next/server';
import { currentProfile } from '@/lib/auth';
import { can } from '@/lib/taxonomy';
import { getNote, updateNote, updateNoteAi, deleteNote } from '@/lib/db';
import { fromPayload } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

async function load(id: string) {
  const me = await currentProfile();
  if (!me) return { err: NextResponse.json({ error: 'Belum masuk.' }, { status: 401 }) };
  const note = await getNote(id);
  if (!note) return { err: NextResponse.json({ error: 'Catatan tidak ditemukan.' }, { status: 404 }) };
  return { me, note };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const g = await load(params.id);
  if (g.err) return g.err;
  return NextResponse.json({ note: g.note });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const g = await load(params.id);
  if (g.err) return g.err;
  const { me, note } = g;
  if (note!.authorId !== me!.id && !can(me!.role, 'viewAll'))
    return NextResponse.json({ error: 'Tidak punya akses mengubah catatan ini.' }, { status: 403 });

  const body = await req.json();
  try {
    // Simpan insight AI tanpa menyentuh isi catatan
    const upd = body.__aiOnly
      ? await updateNoteAi(params.id, body.ai ?? null)
      : await updateNote(params.id, fromPayload(body));
    return NextResponse.json({ note: upd });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const g = await load(params.id);
  if (g.err) return g.err;
  const { me, note } = g;
  if (note!.authorId !== me!.id && !can(me!.role, 'deleteAny'))
    return NextResponse.json({ error: 'Hanya penulis catatan atau administrator yang dapat menghapus.' }, { status: 403 });

  try {
    await deleteNote(params.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
