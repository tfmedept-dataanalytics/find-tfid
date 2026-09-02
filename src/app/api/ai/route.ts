import { NextResponse } from 'next/server';
import { currentProfile } from '@/lib/auth';
import { can } from '@/lib/taxonomy';
import { listNotesByIds, updateNoteAi } from '@/lib/db';
import { SYS_MNE, promptOne, promptMany } from '@/lib/ai-prompts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  const me = await currentProfile();
  if (!me) return NextResponse.json({ error: 'Belum masuk.' }, { status: 401 });
  if (!can(me.role, 'analyze'))
    return NextResponse.json({ error: 'Analisis AI hanya tersedia untuk MLE Analyst dan Administrator.' }, { status: 403 });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key)
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY belum diatur di environment variable Vercel. Penilaian kualitas dan seluruh ringkasan statistik tetap berfungsi tanpa AI.' }, { status: 503 });

  const { mode, ids, ctx } = (await req.json()) as { mode: 'one' | 'many'; ids: string[]; ctx?: string };
  if (!Array.isArray(ids) || !ids.length)
    return NextResponse.json({ error: 'Tidak ada catatan yang dipilih.' }, { status: 400 });

  // Row Level Security sudah membatasi baris yang terbaca sesuai peran pengguna.
  const notes = await listNotesByIds(ids);
  if (!notes.length) return NextResponse.json({ error: 'Catatan tidak ditemukan atau tidak dapat Anda akses.' }, { status: 404 });
  const prompt = mode === 'one' ? promptOne(notes[0]) : promptMany(notes, ctx || 'seluruh catatan yang dapat diakses');

  let res: Response;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: SYS_MNE,
        messages: [{ role: 'user', content: prompt }]
      })
    });
  } catch {
    return NextResponse.json({ error: 'Layanan AI tidak dapat dihubungi dari server.' }, { status: 502 });
  }

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    return NextResponse.json({ error: `Layanan AI menolak permintaan (${res.status}). ${t.slice(0, 180)}` }, { status: 502 });
  }

  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
  if (!text) return NextResponse.json({ error: 'Layanan AI tidak mengembalikan teks.' }, { status: 502 });

  // Insight per catatan disimpan agar bisa dicetak ulang
  if (mode === 'one') {
    await updateNoteAi(notes[0].id, { text, at: new Date().toISOString(), scope: 'single' });
  }
  return NextResponse.json({ text, count: notes.length });
}
