'use client';
import { useState } from 'react';
import { useNotes } from '@/components/NotesProvider';
import { Topbar } from '@/components/Shell';
import { NoteModal } from '@/components/NoteModal';
import { fmtDate, progLabel, todayISO } from '@/lib/format';
import type { Note } from '@/lib/types';

export default function TindakLanjutPage() {
  const { notes, loading, patchRtlStatus } = useNotes();
  const [open, setOpen] = useState<Note | null>(null);
  const today = todayISO();

  const rows = notes.flatMap(n => (n.rtl || []).map((r, i) => ({ r, i, n })))
    .sort((a, b) => (a.r.target || '9999').localeCompare(b.r.target || '9999'));

  if (loading) return (<><Topbar title="Tindak lanjut" sub="Pelacakan komitmen dari seluruh kunjungan" />
    <main className="content"><div className="card"><div className="card-b flex"><span className="spin" />
      <span className="small muted">Memuat catatan…</span></div></div></main></>);

  if (!rows.length) return (<><Topbar title="Tindak lanjut" sub="Pelacakan komitmen dari seluruh kunjungan" />
    <main className="content"><div className="card"><div className="card-b empty">
      <div className="e-t">Belum ada tindak lanjut tercatat</div>
      <div className="e-d">Tindak lanjut diisi di bagian D setiap catatan lapangan dan otomatis muncul di sini.</div>
    </div></div></main></>);

  const openR = rows.filter(x => x.r.status !== 'selesai');
  const late = openR.filter(x => x.r.target && x.r.target < today);

  return (
    <>
      <Topbar title="Tindak lanjut" sub="Pelacakan komitmen dari seluruh kunjungan" />
      <main className="content">
        <div className="stats mb">
          <div className="stat"><div className="v">{rows.length}</div><div className="k">Total tindak lanjut</div></div>
          <div className="stat acc-a"><div className="v">{openR.length}</div><div className="k">Belum selesai</div></div>
          <div className={`stat ${late.length ? 'acc-r' : ''}`}><div className="v">{late.length}</div><div className="k">Lewat tenggat</div></div>
          <div className="stat acc-g"><div className="v">{rows.length - openR.length}</div><div className="k">Selesai</div>
            <div className="d">{Math.round(((rows.length - openR.length) / rows.length) * 100)}% dari total</div></div>
        </div>
        <div className="card"><div className="tbl-wrap"><table>
          <thead><tr><th>Aksi</th><th>Asal catatan</th><th>PIC</th><th>Target</th><th>Status</th></tr></thead>
          <tbody>{rows.map(({ r, i, n }) => (
            <tr key={`${n.id}-${i}`}>
              <td>{r.aksi}</td>
              <td className="tbl-click" onClick={() => setOpen(n)}>
                <span className="small">{(n.judul || '').slice(0, 58)}{(n.judul || '').length > 58 ? '…' : ''}</span>
                <div className="tiny muted">{progLabel(n)} · {n.kabkota}</div></td>
              <td className="nowrap">{r.pic || '—'}</td>
              <td className="nowrap num">{r.target && r.target < today && r.status !== 'selesai'
                ? <span className="pill p-r">{fmtDate(r.target)}</span> : fmtDate(r.target)}</td>
              <td><select value={r.status} style={{ width: 'auto', padding: '.15rem .4rem', fontSize: '.75rem' }}
                onChange={e => patchRtlStatus(n.id, i, e.target.value)}>
                <option value="terbuka">Terbuka</option><option value="berjalan">Berjalan</option><option value="selesai">Selesai</option>
              </select></td>
            </tr>
          ))}</tbody></table></div></div>
      </main>
      {open && <NoteModal note={open} onClose={() => setOpen(null)} />}
    </>
  );
}
