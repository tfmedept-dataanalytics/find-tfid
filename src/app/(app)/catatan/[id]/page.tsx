'use client';
import { useParams, useRouter } from 'next/navigation';
import { NoteForm } from '@/components/NoteForm';
import { useNotes } from '@/components/NotesProvider';
import { Topbar } from '@/components/Shell';

export default function UbahCatatanPage() {
  const { id } = useParams<{ id: string }>();
  const { notes, loading } = useNotes();
  const router = useRouter();
  const note = notes.find(n => n.id === id);

  if (loading) return (<><Topbar title="Ubah catatan" sub="Memuat data catatan" />
    <main className="content"><div className="card"><div className="card-b flex">
      <span className="spin" /><span className="small muted">Memuat catatan…</span></div></div></main></>);

  if (!note) return (<><Topbar title="Ubah catatan" sub="Catatan tidak ditemukan" />
    <main className="content"><div className="card"><div className="card-b empty">
      <div className="e-t">Catatan tidak ditemukan</div>
      <div className="e-d">Catatan mungkin sudah dihapus, atau Anda tidak punya akses ke catatan ini.</div>
      <button className="btn" onClick={() => router.push('/catatan')}>Kembali ke daftar catatan</button>
    </div></div></main></>);

  return <NoteForm initial={note} isEdit />;
}
