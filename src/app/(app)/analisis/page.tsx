'use client';
import { useMemo, useRef, useState } from 'react';
import { useNotes } from '@/components/NotesProvider';
import { Topbar } from '@/components/Shell';
import { Md } from '@/components/Md';
import { RuleReport } from '@/components/RuleReport';
import { toast } from '@/components/Toast';
import { fmtDate, deptLabel, progLabel, tally, download } from '@/lib/format';
import { rulesMarkdown } from '@/lib/rules';
import { scoreNote } from '@/lib/scoring';
import type { Note } from '@/lib/types';

export default function AnalisisPage() {
  const { notes, reload, aiEnabled } = useNotes();
  const [f, setF] = useState({ prog: '', dept: '', from: '', to: '', stat: '' });
  const [applied, setApplied] = useState(f);
  const [out, setOut] = useState<{ text: string; count: number } | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const outRef = useRef<HTMLDivElement>(null);

  const progs = useMemo(() => Array.from(new Set(notes.map(progLabel))).filter(Boolean).sort(), [notes]);
  const depts = useMemo(() => Array.from(new Set(notes.map(deptLabel))).filter(Boolean).sort(), [notes]);

  const scope = useMemo(() => notes.filter(n => {
    if (applied.prog && progLabel(n) !== applied.prog) return false;
    if (applied.dept && deptLabel(n) !== applied.dept) return false;
    if (applied.stat && n.status !== applied.stat) return false;
    if (applied.from && (n.tglKegiatan || '') < applied.from) return false;
    if (applied.to && (n.tglKegiatan || '') > applied.to) return false;
    return true;
  }), [notes, applied]);

  const ctxLabel = useMemo(() =>
    [applied.prog && `program ${applied.prog}`, applied.dept && `departemen ${applied.dept}`,
      applied.from && `sejak ${applied.from}`, applied.to && `sampai ${applied.to}`,
      applied.stat === 'submitted' && 'hanya catatan terkirim']
      .filter(Boolean).join(', ') || 'seluruh catatan yang dapat diakses', [applied]);

  async function run() {
    if (!scope.length) return;
    setBusy(true); setErr(''); setOut(null);
    const ctx = ctxLabel;
    try {
      const r = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'many', ids: scope.map(n => n.id), ctx })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Analisis gagal dijalankan.');
      setOut({ text: d.text, count: d.count });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Analisis gagal dijalankan.');
    } finally { setBusy(false); }
  }

  async function runOne(n: Note) {
    setBusy(true); setErr(''); setOut(null);
    try {
      const r = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'one', ids: [n.id] })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Analisis gagal dijalankan.');
      setOut({ text: d.text, count: 1 });
      await reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Analisis gagal dijalankan.');
    } finally { setBusy(false); }
  }
  void runOne;

  /* Pra-analisis deterministik: selalu tersedia, tanpa AI */
  const pre = useMemo(() => {
    const s = scope.map(n => ({ n, s: scoreNote(n) }));
    const avg = Math.round(s.reduce((a, x) => a + x.s.total, 0) / (s.length || 1));
    return {
      avg,
      kuat: s.filter(x => x.s.total >= 80).length,
      lemah: s.filter(x => x.s.total < 60).length,
      sumber: new Set(scope.flatMap(n => (n.pihak || []).map(p => (p.instansi || '').toLowerCase()).filter(Boolean))).size,
      lokasi: new Set(scope.map(n => n.kabkota).filter(Boolean)).size,
      progs: tally(scope, progLabel).length,
      rentang: scope.map(n => n.tglKegiatan).filter(Boolean).sort(),
      single: scope.filter(n => (n.pihak || []).length <= 1).length
    };
  }, [scope]);

  return (
    <>
      <Topbar title="Analisis AI" sub="Sintesis lintas catatan untuk evaluasi dan pembelajaran" />
      <main className="content">
        <div className="card mb"><div className="card-h"><h3>Pilih cakupan analisis</h3>
          <span className="hint">Semakin banyak catatan, semakin kuat dasar pola — tetapi periksa keterwakilannya</span></div>
          <div className="card-b">
            <div className="filters" style={{ marginBottom: '.6rem' }}>
              <select value={f.prog} onChange={e => setF({ ...f, prog: e.target.value })}>
                <option value="">Semua program</option>{progs.map(p => <option key={p}>{p}</option>)}</select>
              <select value={f.dept} onChange={e => setF({ ...f, dept: e.target.value })}>
                <option value="">Semua departemen</option>{depts.map(p => <option key={p}>{p}</option>)}</select>
              <input type="date" title="Dari tanggal kegiatan" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} />
              <input type="date" title="Sampai tanggal kegiatan" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} />
              <select value={f.stat} onChange={e => setF({ ...f, stat: e.target.value })}>
                <option value="">Draf dan terkirim</option><option value="submitted">Hanya terkirim</option></select>
              <button className="btn btn-sm" onClick={() => setApplied(f)}>Terapkan</button>
            </div>
            <div className="flex fw">
              <span className="small">{scope.length
                ? <><b>{scope.length}</b> catatan masuk cakupan.</>
                : <span className="muted">Tidak ada catatan yang cocok dengan filter ini.</span>}</span>
              <div className="spacer" />
              {!aiEnabled && (
                <span className="tiny muted">Nonaktif — ANTHROPIC_API_KEY belum diatur di server.</span>
              )}
              <button className="btn btn-g" disabled={!scope.length || busy || !aiEnabled} onClick={run}>
                Sintesis AI (opsional)
              </button>
            </div>
          </div></div>

        {scope.length > 0 && (
          <>
            <div className="stats mb">
              <div className="stat"><div className="v">{scope.length}</div><div className="k">Catatan dianalisis</div>
                <div className="d">{pre.rentang.length ? `${fmtDate(pre.rentang[0])} – ${fmtDate(pre.rentang[pre.rentang.length - 1])}` : '—'}</div></div>
              <div className="stat"><div className="v">{pre.lokasi}</div><div className="k">Kabupaten/kota</div>
                <div className="d">{pre.progs} program</div></div>
              <div className="stat"><div className="v">{pre.sumber}</div><div className="k">Instansi narasumber</div>
                <div className="d">basis triangulasi</div></div>
              <div className={`stat ${pre.avg < 60 ? 'acc-a' : 'acc-g'}`}><div className="v">{pre.avg}</div>
                <div className="k">Rata-rata skor kualitas</div><div className="d">{pre.kuat} kuat · {pre.lemah} di bawah 60</div></div>
              <div className={`stat ${pre.single ? 'acc-a' : ''}`}><div className="v">{pre.single}</div>
                <div className="k">Catatan sumber tunggal</div><div className="d">bukti indikatif saja</div></div>
            </div>
            {(pre.lemah > 0 || pre.single > 0) && (
              <div className="flag w"><span className="ic">▲</span><div className="tx">
                <b>Baca hasil analisis dengan hati-hati</b>
                {pre.lemah ? `${pre.lemah} dari ${scope.length} catatan berskor kualitas di bawah 60. ` : ''}
                {pre.single ? `${pre.single} catatan hanya bersandar pada satu narasumber. ` : ''}
                Kesimpulan yang ditarik dari kumpulan ini belum cukup kuat untuk klaim atribusi atau pelaporan outcome.
              </div></div>
            )}
            <RuleReport notes={scope} />
            <div className="flex fw mb">
              <button className="btn btn-sm" onClick={() => {
                navigator.clipboard?.writeText(rulesMarkdown(scope, ctxLabel))
                  .then(() => toast('Laporan disalin.'), () => toast('Browser menolak akses papan klip.', 'err'));
              }}>Salin laporan</button>
              <button className="btn btn-sm" onClick={() =>
                download(`FIND-analisis-terstruktur-${new Date().toISOString().slice(0, 10)}.md`,
                  rulesMarkdown(scope, ctxLabel), 'text/markdown')
              }>Unduh .md</button>
              <span className="tiny muted">Laporan ini lengkap tanpa AI dan dapat langsung dilampirkan ke laporan program.</span>
            </div>
          </>
        )}

        <div className="card mt"><div className="card-h"><h3>Sintesis AI</h3>
          <span className="hint">lapisan tambahan di atas analisis terstruktur</span></div>
          <div className="card-b">
            {busy ? (
              <div className="flex"><span className="spin" />
                <span className="small muted">Menyintesis {scope.length} catatan lapangan…</span></div>
            ) : err ? (
              <div className="flag e"><span className="ic">●</span><div className="tx">
                <b>Analisis tidak dapat dijalankan</b>{err}</div></div>
            ) : out ? (
              <>
                <div ref={outRef}><Md text={out.text} /></div>
                <div className="ai-note mt">Insight ini dihasilkan model bahasa dari {out.count} catatan lapangan yang Anda pilih. Perlakukan sebagai hipotesis awal untuk didiskusikan tim, bukan sebagai temuan evaluasi yang sudah tervalidasi. Verifikasi setiap angka dan pernyataan ke catatan sumber sebelum dipakai dalam laporan ke donor atau manajemen.</div>
                <div className="flex mt-s">
                  <button className="btn btn-sm" onClick={() => {
                    navigator.clipboard?.writeText(outRef.current?.innerText || '')
                      .then(() => toast('Teks disalin.'), () => toast('Browser menolak akses papan klip.', 'err'));
                  }}>Salin teks</button>
                  <button className="btn btn-sm" onClick={() =>
                    download(`FIND-insight-${new Date().toISOString().slice(0, 10)}.md`, out.text, 'text/markdown')
                  }>Unduh .md</button>
                </div>
              </>
            ) : (
              <div className="empty"><div className="e-t">{aiEnabled ? 'Belum dijalankan' : 'Sintesis AI nonaktif'}</div>
                <div className="e-d">Analisis terstruktur di atas sudah lengkap dan tidak memerlukan koneksi maupun biaya. Sintesis AI menambahkan penafsiran lintas catatan yang tidak dapat dihasilkan aturan tetap, dan hanya berjalan bila layanan AI tersedia.</div></div>
            )}
          </div></div>
      </main>
    </>
  );
}
