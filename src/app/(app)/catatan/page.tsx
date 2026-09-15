'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useNotes } from '@/components/NotesProvider';
import { Topbar } from '@/components/Shell';
import { Meter } from '@/components/Charts';
import { NoteModal } from '@/components/NoteModal';
import { printNote } from '@/components/PrintSheet';
import { toast } from '@/components/Toast';
import { fmtDate, deptLabel, progLabel, jenisLabel, download } from '@/lib/format';
import { scoreNote } from '@/lib/scoring';
import { ASPEK } from '@/lib/taxonomy';
import type { Note } from '@/lib/types';

export default function CatatanPage() {
  const { notes, loading, deleteNote, profile, may } = useNotes();
  const router = useRouter();
  const [f, setF] = useState({ q: '', prog: '', dept: '', stat: '' });
  const [open, setOpen] = useState<Note | null>(null);

  const progs = useMemo(() => Array.from(new Set(notes.map(progLabel))).filter(Boolean).sort(), [notes]);
  const depts = useMemo(() => Array.from(new Set(notes.map(deptLabel))).filter(Boolean).sort(), [notes]);

  const rows = useMemo(() => {
    const t = f.q.toLowerCase();
    return notes.filter(n => {
      if (f.prog && progLabel(n) !== f.prog) return false;
      if (f.dept && deptLabel(n) !== f.dept) return false;
      if (f.stat && n.status !== f.stat) return false;
      if (t) {
        const hay = [n.judul, n.kabkota, n.kecdesa, n.institusi, n.ringkasan, n.tujuan, progLabel(n),
          ...(n.pihak || []).map(p => `${p.nama} ${p.jabatan} ${p.instansi}`)].join(' ').toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    }).sort((a, b) => (b.tglKegiatan || '').localeCompare(a.tglKegiatan || ''));
  }, [notes, f]);

  function exportCSV() {
    if (!rows.length) { toast('Tidak ada catatan untuk diekspor.', 'err'); return; }
    const cols = ['Judul', 'Tanggal kegiatan', 'Tanggal selesai', 'Hari kerja', 'Kab/Kota', 'Kec/Desa', 'Institusi',
      'Email TF', 'Level', 'Departemen', 'Program', 'Jenis kegiatan', 'Jumlah narasumber', 'Narasumber',
      'Tujuan', 'Alasan lokasi', 'Ringkasan',
      ...ASPEK.flatMap(a => [`Fakta ${a.n}`, `Interpretasi ${a.n}`]),
      'Tindak lanjut', 'RTL terbuka', 'Skor kualitas', 'Status'];
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
    const body = rows.map(n => { const s = scoreNote(n); return [
      n.judul, n.tglKegiatan, n.tglSelesai, s.wd ?? '', n.kabkota, n.kecdesa, n.institusi,
      n.emailTF, n.deptLevel, deptLabel(n), progLabel(n), jenisLabel(n),
      (n.pihak || []).length, (n.pihak || []).map(p => `${p.nama} (${p.jabatan}, ${p.instansi})`).join('; '),
      n.tujuan, n.alasan, n.ringkasan,
      ...ASPEK.flatMap(a => [n.obs?.[a.id]?.f, n.obs?.[a.id]?.i]),
      (n.rtl || []).map(r => `${r.aksi} [${r.pic || '-'}, ${r.target || '-'}, ${r.status}]`).join(' | '),
      (n.rtl || []).filter(r => r.status !== 'selesai').length, s.total, n.status
    ].map(cell).join(','); });
    download(`FIND-catatan-${new Date().toISOString().slice(0, 10)}.csv`,
      '\uFEFF' + cols.map(cell).join(',') + '\n' + body.join('\n'), 'text/csv;charset=utf-8');
    toast(`${rows.length} catatan diekspor.`);
  }

  async function hapus(n: Note) {
    if (!confirm(`Hapus catatan "${n.judul || '(tanpa judul)'}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    if (await deleteNote(n.id)) toast('Catatan dihapus.');
  }

  const actions = <>
    {may('exportAll') && <button className="btn btn-sm" onClick={exportCSV}>Ekspor CSV</button>}
    <Link className="btn btn-p btn-sm" href="/catatan/baru">+ Catatan baru</Link>
  </>;

  return (
    <>
      <Topbar title="Catatan lapangan" sub="Semua catatan yang dapat Anda akses" actions={actions} />
      <main className="content">
        <div className="filters">
          <input type="text" className="grow" placeholder="Cari judul, lokasi, ringkasan, atau narasumber…"
            value={f.q} onChange={e => setF({ ...f, q: e.target.value })} />
          <select value={f.prog} onChange={e => setF({ ...f, prog: e.target.value })}>
            <option value="">Semua program</option>{progs.map(p => <option key={p}>{p}</option>)}</select>
          <select value={f.dept} onChange={e => setF({ ...f, dept: e.target.value })}>
            <option value="">Semua departemen</option>{depts.map(p => <option key={p}>{p}</option>)}</select>
          <select value={f.stat} onChange={e => setF({ ...f, stat: e.target.value })}>
            <option value="">Semua status</option><option value="draft">Draf</option><option value="submitted">Terkirim</option></select>
          <button className="btn btn-sm" onClick={() => setF({ q: '', prog: '', dept: '', stat: '' })}>Reset</button>
        </div>

        <div className="card">
          {loading ? (
            <div className="card-b flex"><span className="spin" /><span className="small muted">Memuat catatan…</span></div>
          ) : !rows.length ? (
            <div className="empty"><div className="e-t">Tidak ada catatan yang cocok</div>
              <div className="e-d">Ubah kata kunci atau kosongkan filter untuk melihat seluruh catatan.</div>
              <button className="btn" onClick={() => setF({ q: '', prog: '', dept: '', stat: '' })}>Kosongkan filter</button></div>
          ) : (
            <>
              <div className="tbl-wrap"><table>
                <thead><tr><th>Kegiatan</th><th>Program</th><th>Jenis</th><th>Lokasi</th><th>Tanggal</th>
                  <th>Kualitas</th><th>RTL</th><th /></tr></thead>
                <tbody>{rows.map(n => { const s = scoreNote(n);
                  const openR = (n.rtl || []).filter(r => r.status !== 'selesai').length;
                  return (
                    <tr key={n.id}>
                      <td className="tbl-click" onClick={() => setOpen(n)}><b>{n.judul || '(tanpa judul)'}</b>
                        <div className="tiny muted">{n.emailTF} · {deptLabel(n)}</div></td>
                      <td>{progLabel(n)}</td>
                      <td className="small">{jenisLabel(n).slice(0, 34)}</td>
                      <td>{n.kabkota || '—'}<div className="tiny muted">{n.institusi}</div></td>
                      <td className="nowrap num">{fmtDate(n.tglKegiatan)}</td>
                      <td><div className="flex"><Meter value={s.total} width="3rem" /><span className="num tiny">{s.total}</span></div></td>
                      <td className="num">{openR ? <span className="pill p-a">{openR} terbuka</span>
                        : (n.rtl || []).length ? <span className="pill p-g">selesai</span> : '—'}</td>
                      <td className="nowrap right">
                        <button className="btn btn-sm" onClick={() => printNote(n, profile.name)}>Cetak</button>
                        <button className="btn btn-sm" onClick={() => router.push(`/catatan/${n.id}`)}>Ubah</button>
                        {(may('deleteAny') || n.authorId === profile.id) &&
                          <button className="btn btn-sm btn-d" onClick={() => hapus(n)}>Hapus</button>}
                      </td>
                    </tr>); })}</tbody></table></div>
              <div className="card-h" style={{ borderBottom: 'none', borderTop: '1px solid var(--line-2)' }}>
                <span className="hint">{rows.length} dari {notes.length} catatan ditampilkan</span></div>
            </>
          )}
        </div>
      </main>
      {open && <NoteModal note={open} onClose={() => setOpen(null)} />}
    </>
  );
}
