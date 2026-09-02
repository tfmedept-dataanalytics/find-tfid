'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ASPEK } from '@/lib/taxonomy';
import { fmtDate, deptLabel, progLabel, jenisLabel } from '@/lib/format';
import { scoreNote, scoreBand } from '@/lib/scoring';
import { useNotes } from './NotesProvider';
import { printNote } from './PrintSheet';
import { Md } from './Md';
import { RuleReport } from './RuleReport';
import { toast } from './Toast';
import type { Note } from '@/lib/types';

export function NoteModal({ note, onClose }: { note: Note; onClose: () => void }) {
  const { profile, may, aiEnabled, reload } = useNotes();
  const router = useRouter();
  const s = scoreNote(note), b = scoreBand(s.total);

  /* Analisis per catatan: lapisan terstruktur dibuka langsung, sintesis AI opsional. */
  const [showRules, setShowRules] = useState(false);
  const [ai, setAi] = useState<string | null>(null);
  const [aiErr, setAiErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function analisisAI() {
    setBusy(true); setAiErr(''); setAi(null);
    try {
      const r = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'one', ids: [note.id] })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Analisis gagal dijalankan.');
      setAi(d.text as string);
      await reload();                       // insight tersimpan di database
      toast('Insight AI tersimpan pada catatan ini.');
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : 'Analisis gagal dijalankan.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="ovl" id="modalWrap" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-h">
          <h3>{note.judul || '(tanpa judul)'}</h3>
          <span className={`pill ${b.c}`}>{b.l} · {s.total}</span>
          <button className="x" onClick={onClose} aria-label="Tutup">✕</button>
        </div>

        <div className="modal-b">
          <div className="row row-3 small" style={{ gap: '.7rem 1.2rem', marginBottom: '1rem' }}>
            <div><div className="tiny muted">Tanggal kegiatan</div>{fmtDate(note.tglKegiatan)}</div>
            <div><div className="tiny muted">Catatan diselesaikan</div>{fmtDate(note.tglSelesai)}
              {s.wd !== null && s.wd >= 0 ? <span className="tiny muted"> ({s.wd} hari kerja)</span> : null}</div>
            <div><div className="tiny muted">Program</div>{progLabel(note)}</div>
            <div><div className="tiny muted">Departemen</div>{note.deptLevel} · {deptLabel(note)}</div>
            <div><div className="tiny muted">Jenis kegiatan</div>{jenisLabel(note)}</div>
            <div><div className="tiny muted">Pencatat</div>{note.emailTF}</div>
          </div>

          <div className="small mb"><div className="tiny muted">Lokasi</div>
            {[note.kabkota, note.kecdesa, note.institusi].filter(Boolean).join(' · ') || '—'}</div>

          <div className="row row-2 small mb">
            <div><div className="tiny muted">Tujuan kunjungan</div>{note.tujuan || '—'}</div>
            <div><div className="tiny muted">Alasan pemilihan lokasi</div>{note.alasan || '—'}</div>
          </div>

          <div className="small mb"><div className="tiny muted">Pihak yang ditemui</div>
            {(note.pihak || []).length
              ? note.pihak.map((p, i) => <div key={i}>{p.nama} — {p.jabatan}, {p.instansi}</div>)
              : '—'}</div>

          <div className="sec-h" style={{ marginTop: '1.2rem' }}><span className="ltr">B</span><h2>Ringkasan</h2></div>
          <div className="small" style={{ lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{note.ringkasan || '—'}</div>

          <div className="sec-h" style={{ marginTop: '1.4rem' }}><span className="ltr">C</span><h2>Catatan observasi</h2></div>
          {ASPEK.map(a => (
            <div className="obs" key={a.id}>
              <div className="obs-h"><div className="t">{a.n}. {a.t}</div></div>
              <div className="obs-split">
                <div className="obs-col fakta">
                  <div className="cl"><span className="dot dot-f" />Fakta &amp; bukti</div>
                  <div className="small" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{note.obs?.[a.id]?.f || '—'}</div>
                </div>
                <div className="obs-col tafsir">
                  <div className="cl"><span className="dot dot-t" />Interpretasi &amp; implikasi</div>
                  <div className="small" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{note.obs?.[a.id]?.i || '—'}</div>
                </div>
              </div>
            </div>
          ))}

          <div className="sec-h" style={{ marginTop: '1.2rem' }}><span className="ltr">D</span><h2>Rencana tindak lanjut</h2></div>
          {(note.rtl || []).length ? (
            <div className="tbl-wrap"><table>
              <thead><tr><th>Aksi</th><th>PIC</th><th>Target</th><th>Status</th></tr></thead>
              <tbody>{note.rtl.map((r, i) => (
                <tr key={i}><td>{r.aksi}</td><td>{r.pic || '—'}</td><td className="nowrap">{fmtDate(r.target)}</td>
                  <td><span className={`pill ${r.status === 'selesai' ? 'p-g' : r.status === 'berjalan' ? 'p-b' : 'p-n'}`}>{r.status}</span></td></tr>
              ))}</tbody></table></div>
          ) : <div className="small muted">Belum ada rencana tindak lanjut.</div>}

          {may('quality') && (
            <>
              <div className="sec-h" style={{ marginTop: '1.4rem' }}><span className="ltr">✓</span><h2>Pemeriksaan kualitas</h2></div>
              {s.flags.length ? s.flags.map((f, i) => (
                <div className={`flag ${f.lvl}`} key={i}>
                  <span className="ic">{f.lvl === 'e' ? '●' : '▲'}</span>
                  <div className="tx"><b>{f.title}</b>{f.text}</div>
                </div>
              )) : (
                <div className="flag o"><span className="ic">✓</span>
                  <div className="tx"><b>Tidak ada catatan kualitas</b>Catatan ini memenuhi seluruh pemeriksaan otomatis.</div></div>
              )}
            </>
          )}

          {may('analyze') && (
            <>
              <div className="sec-h" style={{ marginTop: '1.4rem' }}><span className="ltr">▤</span><h2>Analisis catatan</h2>
                <span className="n">
                  <button className="btn btn-sm" onClick={() => setShowRules(v => !v)}>
                    {showRules ? 'Sembunyikan analisis terstruktur' : 'Tampilkan analisis terstruktur'}
                  </button>
                </span>
              </div>
              {showRules
                ? <RuleReport notes={[note]} />
                : <div className="small muted">Analisis terstruktur dihitung dari aturan tetap, tanpa AI dan tanpa biaya.</div>}

              {busy && (
                <div className="flex mt"><span className="spin" />
                  <span className="small muted">Menganalisis catatan ini…</span></div>
              )}
              {aiErr && (
                <div className="flag e mt"><span className="ic">●</span>
                  <div className="tx"><b>Analisis AI tidak dapat dijalankan</b>{aiErr}</div></div>
              )}
              {ai && (
                <>
                  <div className="sec-h" style={{ marginTop: '1.2rem' }}><span className="ltr">AI</span><h2>Hasil sintesis AI</h2></div>
                  <Md text={ai} />
                  <div className="ai-note mt">Insight ini dihasilkan model bahasa dari satu catatan lapangan. Perlakukan sebagai hipotesis awal untuk didiskusikan tim, bukan sebagai temuan evaluasi yang sudah tervalidasi.</div>
                </>
              )}
            </>
          )}

          {note.ai && !ai && (
            <>
              <div className="sec-h" style={{ marginTop: '1.4rem' }}><span className="ltr">AI</span><h2>Insight tersimpan</h2>
                <span className="n">{new Date(note.ai.at).toLocaleString('id-ID')}</span></div>
              <Md text={note.ai.text} />
            </>
          )}
        </div>

        <div className="modal-f">
          {may('analyze') && aiEnabled &&
            <button className="btn btn-g" disabled={busy} onClick={analisisAI}>
              {busy ? 'Menganalisis…' : 'Analisis AI catatan ini'}
            </button>}
          <button className="btn" onClick={() => printNote(note, profile.name)}>Cetak lembar catatan</button>
          <button className="btn" onClick={() => { onClose(); router.push(`/catatan/${note.id}`); }}>Ubah</button>
          <button className="btn btn-p" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}
