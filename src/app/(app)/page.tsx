'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useNotes } from '@/components/NotesProvider';
import { Topbar } from '@/components/Shell';
import { HBar, VBar, Meter } from '@/components/Charts';
import { NoteModal } from '@/components/NoteModal';
import { fmtDate, progLabel, jenisLabel, tally, todayISO } from '@/lib/format';
import { scoreNote, scoreBand } from '@/lib/scoring';
import type { Note } from '@/lib/types';

export default function DashboardPage() {
  const { notes, loading } = useNotes();
  const [open, setOpen] = useState<Note | null>(null);

  const actions = <Link className="btn btn-p btn-sm" href="/catatan/baru">+ Catatan baru</Link>;

  if (loading) return (<><Topbar title="Ringkasan" sub="Gambaran umum catatan lapangan dan tindak lanjut" actions={actions} />
    <main className="content"><div className="card"><div className="card-b flex"><span className="spin" />
      <span className="small muted">Memuat catatan…</span></div></div></main></>);

  if (!notes.length) return (<><Topbar title="Ringkasan" sub="Gambaran umum catatan lapangan dan tindak lanjut" actions={actions} />
    <main className="content"><div className="card"><div className="card-b empty">
      <div className="e-t">Belum ada catatan lapangan</div>
      <div className="e-d">Mulai dengan mencatat satu kunjungan. Form mengikuti template Catatan Lapangan TF v2, jadi apa yang Anda isi di sini sama dengan yang biasa Anda isi di Word.</div>
      <Link className="btn btn-p" href="/catatan/baru">Buat catatan pertama</Link>
    </div></div></main></>);

  const scored = notes.map(n => ({ n, s: scoreNote(n) }));
  const avg = Math.round(scored.reduce((a, x) => a + x.s.total, 0) / scored.length);
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 864e5).toISOString().slice(0, 10);
  const recent = notes.filter(n => (n.tglKegiatan || '') >= d30).length;
  const allRtl = notes.flatMap(n => (n.rtl || []).map(r => ({ ...r, note: n })));
  const openRtl = allRtl.filter(r => r.status !== 'selesai');
  const today = todayISO();
  const lateRtl = openRtl.filter(r => r.target && r.target < today);
  const lateNote = scored.filter(x => x.s.wd !== null && x.s.wd > 3).length;
  const draft = notes.filter(n => n.status === 'draft').length;
  const band = scoreBand(avg);

  const byProgram = tally(notes, progLabel).slice(0, 8);
  const byJenis = tally(notes, n => { const j = jenisLabel(n); return j.length > 30 ? j.slice(0, 29) + '…' : j; })
    .slice(0, 7).map(d => ({ ...d, c: 'var(--gold-500)' }));

  const months: { key: string; k: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const dd = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: dd.toISOString().slice(0, 7), k: dd.toLocaleDateString('id-ID', { month: 'short' }) });
  }
  const trend = months.map(m => ({ k: m.k, v: notes.filter(n => (n.tglKegiatan || '').slice(0, 7) === m.key).length }));
  const latest = [...notes].sort((a, b) => (b.tglKegiatan || '').localeCompare(a.tglKegiatan || '')).slice(0, 5);
  const perhatian = [...lateRtl, ...openRtl.filter(r => !lateRtl.includes(r))].slice(0, 6);

  return (
    <>
      <Topbar title="Ringkasan" sub="Gambaran umum catatan lapangan dan tindak lanjut" actions={actions} />
      <main className="content">
        <div className="stats mb">
          <div className="stat"><div className="v">{notes.length}</div><div className="k">Catatan lapangan</div>
            <div className="d">{recent} dalam 30 hari terakhir</div></div>
          <div className={`stat ${band.m === 'r' ? 'acc-r' : band.m === 'a' ? 'acc-a' : 'acc-g'}`}>
            <div className="v">{avg}</div><div className="k">Rata-rata skor kualitas</div>
            <div className="d">{band.l} · skala 0–100</div></div>
          <div className={`stat ${openRtl.length ? 'acc-a' : ''}`}><div className="v">{openRtl.length}</div>
            <div className="k">Tindak lanjut terbuka</div><div className="d">{lateRtl.length} lewat tenggat</div></div>
          <div className={`stat ${lateNote ? 'acc-a' : ''}`}><div className="v">{lateNote}</div>
            <div className="k">Melewati 3 hari kerja</div><div className="d">Target penyelesaian catatan</div></div>
          <div className="stat"><div className="v">{draft}</div><div className="k">Masih draf</div><div className="d">Belum dikirim</div></div>
        </div>

        <div className="grid mb" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
          <div className="card"><div className="card-h"><h3>Catatan per program</h3><span className="hint">8 teratas</span></div>
            <div className="card-b"><HBar data={byProgram} /></div></div>
          <div className="card"><div className="card-h"><h3>Catatan per jenis kegiatan</h3></div>
            <div className="card-b"><HBar data={byJenis} labelW={180} /></div></div>
        </div>

        <div className="grid mb" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
          <div className="card"><div className="card-h"><h3>Kunjungan per bulan</h3><span className="hint">berdasarkan tanggal kegiatan</span></div>
            <div className="card-b"><VBar data={trend} /></div></div>
          <div className="card"><div className="card-h"><h3>Tindak lanjut yang perlu perhatian</h3></div>
            <div className="card-b">
              {perhatian.length ? (
                <div className="tbl-wrap"><table>
                  <thead><tr><th>Aksi</th><th>PIC</th><th>Target</th></tr></thead>
                  <tbody>{perhatian.map((r, i) => (
                    <tr key={i}><td>{r.aksi}<div className="tiny muted">{r.note.judul}</div></td>
                      <td className="nowrap">{r.pic || '—'}</td>
                      <td className="nowrap">{r.target && r.target < today
                        ? <span className="pill p-r">{fmtDate(r.target)}</span> : fmtDate(r.target)}</td></tr>
                  ))}</tbody></table></div>
              ) : <div className="empty small muted">Tidak ada tindak lanjut yang terbuka.</div>}
            </div></div>
        </div>

        <div className="card"><div className="card-h"><h3>Catatan terbaru</h3><div className="spacer" />
          <Link className="btn btn-sm" href="/catatan">Lihat semua</Link></div>
          <div className="tbl-wrap"><table>
            <thead><tr><th>Kegiatan</th><th>Program</th><th>Lokasi</th><th>Tanggal</th><th>Kualitas</th><th>Status</th></tr></thead>
            <tbody>{latest.map(n => { const s = scoreNote(n), b = scoreBand(s.total); return (
              <tr key={n.id} className="tbl-click" onClick={() => setOpen(n)}>
                <td><b>{n.judul || '(tanpa judul)'}</b><div className="tiny muted">{n.emailTF}</div></td>
                <td>{progLabel(n)}</td>
                <td>{n.kabkota || '—'}<div className="tiny muted">{n.institusi}</div></td>
                <td className="nowrap num">{fmtDate(n.tglKegiatan)}</td>
                <td><div className="flex"><Meter value={s.total} width="3.5rem" /><span className="num tiny">{s.total}</span></div></td>
                <td><span className={`pill ${n.status === 'draft' ? 'p-n' : 'p-g'}`}>{n.status === 'draft' ? 'Draf' : 'Terkirim'}</span></td>
              </tr>); })}</tbody></table></div></div>
      </main>
      {open && <NoteModal note={open} onClose={() => setOpen(null)} />}
    </>
  );
}
