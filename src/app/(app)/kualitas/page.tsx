'use client';
import { useState } from 'react';
import { useNotes } from '@/components/NotesProvider';
import { Topbar } from '@/components/Shell';
import { HBar } from '@/components/Charts';
import { NoteModal } from '@/components/NoteModal';
import { fmtDate, progLabel, tally } from '@/lib/format';
import { scoreNote, scoreBand } from '@/lib/scoring';
import type { Note } from '@/lib/types';

export default function KualitasPage() {
  const { notes, loading } = useNotes();
  const [open, setOpen] = useState<Note | null>(null);

  if (loading) return (<><Topbar title="Kualitas catatan" sub="Penilaian otomatis atas kelengkapan dan disiplin bukti" />
    <main className="content"><div className="card"><div className="card-b flex"><span className="spin" />
      <span className="small muted">Memuat catatan…</span></div></div></main></>);

  if (!notes.length) return (<><Topbar title="Kualitas catatan" sub="Penilaian otomatis atas kelengkapan dan disiplin bukti" />
    <main className="content"><div className="card"><div className="card-b empty">
      <div className="e-t">Belum ada catatan untuk dinilai</div></div></div></main></>);

  const scored = notes.map(n => ({ n, s: scoreNote(n) })).sort((a, b) => a.s.total - b.s.total);
  const dimAvg = scored[0].s.dims.map((d, i) => ({
    k: d.label,
    v: Math.round((scored.reduce((a, x) => a + x.s.dims[i].score, 0) / scored.length / d.max) * 100)
  }));
  const allFlags = tally(scored.flatMap(x => x.s.flags), f => f.title);

  return (
    <>
      <Topbar title="Kualitas catatan" sub="Penilaian otomatis atas kelengkapan dan disiplin bukti" />
      <main className="content">
        <div className="card mb"><div className="card-b">
          <div className="small" style={{ lineHeight: 1.6 }}>Skor dihitung dengan rubrik tetap, bukan dengan AI, sehingga hasilnya dapat ditelusuri dan diulang. Skor tinggi berarti catatan <b>layak dianalisis</b> — bukan berarti temuannya bagus atau programnya berhasil.</div>
        </div></div>

        <div className="grid mb" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
          <div className="card"><div className="card-h"><h3>Rata-rata per dimensi</h3><span className="hint">% dari nilai maksimum</span></div>
            <div className="card-b"><HBar labelW={170} data={dimAvg.map(d => ({
              ...d, c: d.v < 50 ? 'var(--red)' : d.v < 80 ? 'var(--gold-500)' : 'var(--green-700)'
            }))} /></div></div>
          <div className="card"><div className="card-h"><h3>Masalah yang paling sering muncul</h3></div>
            <div className="card-b"><HBar labelW={200} data={allFlags.slice(0, 7).map(d => ({ ...d, c: 'var(--amber)' }))} /></div></div>
        </div>

        <div className="card"><div className="card-h"><h3>Penilaian per catatan</h3>
          <span className="hint">diurutkan dari skor terendah</span></div>
          <div className="tbl-wrap"><table>
            <thead><tr><th>Catatan</th>
              {scored[0].s.dims.map(d => <th key={d.k} className="right">{d.label.split(' ')[0]}</th>)}
              <th className="right">Total</th><th>Catatan kualitas</th></tr></thead>
            <tbody>{scored.map(({ n, s }) => { const b = scoreBand(s.total); return (
              <tr key={n.id}>
                <td className="tbl-click" onClick={() => setOpen(n)}><b>{(n.judul || '(tanpa judul)').slice(0, 50)}</b>
                  <div className="tiny muted">{progLabel(n)} · {fmtDate(n.tglKegiatan)}</div></td>
                {s.dims.map(d => (
                  <td key={d.k} className="right num"
                    style={d.score / d.max < 0.5 ? { color: 'var(--red)', fontWeight: 600 } : undefined}>{d.score}</td>
                ))}
                <td className="right"><span className={`pill ${b.c}`}>{s.total}</span></td>
                <td className="tiny">{s.flags.length ? s.flags.map(f => f.title).join('; ') : <span className="muted">—</span>}</td>
              </tr>); })}</tbody></table></div>
          <div className="card-b" style={{ borderTop: '1px solid var(--line-2)' }}>
            <div className="tiny muted" style={{ lineHeight: 1.6 }}><b>Rubrik:</b> Kelengkapan 25 · Spesifisitas bukti 20 · Disiplin fakta–interpretasi 20 · Triangulasi sumber 15 · Ketepatan waktu 10 · Aktionabilitas tindak lanjut 10.</div></div>
        </div>
      </main>
      {open && <NoteModal note={open} onClose={() => setOpen(null)} />}
    </>
  );
}
