'use client';
import { createRoot } from 'react-dom/client';
import React from 'react';
import { ASPEK } from '@/lib/taxonomy';
import { fmtDate, deptLabel, progLabel, jenisLabel } from '@/lib/format';
import { scoreNote, scoreBand } from '@/lib/scoring';
import { Md } from './Md';
import type { Note } from '@/lib/types';

const dash = (v?: string | null) => (String(v || '').trim() ? String(v) : '—');

function PrintSheet({ n, by }: { n: Note; by: string }) {
  const sc = scoreNote(n), band = scoreBand(sc.total);
  const now = new Date();

  const identifikasi: [string, React.ReactNode][] = [
    ['Judul kegiatan / kunjungan', dash(n.judul)],
    ['Tanggal kegiatan', fmtDate(n.tglKegiatan)],
    ['Tanggal catatan diselesaikan', <>{fmtDate(n.tglSelesai)}{sc.wd !== null && sc.wd >= 0 ? <span className="pr-note"> ({sc.wd} hari kerja setelah kunjungan{sc.wd > 3 ? ', melewati target 3 hari kerja' : ''})</span> : null}</>],
    ['Lokasi', dash([n.kabkota, n.kecdesa, n.institusi].filter(Boolean).join(' · '))],
    ['Email TF', dash(n.emailTF)],
    ['Departemen', `${dash(n.deptLevel)} · ${dash(deptLabel(n))}`],
    ['Program', dash(progLabel(n))],
    ['Jenis kegiatan', dash(jenisLabel(n))],
    ['Pihak yang ditemui', (n.pihak || []).length
      ? <>{n.pihak.map((p, i) => <div key={i}>{`${p.nama || '—'} — ${p.jabatan || '—'}, ${p.instansi || '—'}`}</div>)}</>
      : '—'],
    ['Tujuan kunjungan', dash(n.tujuan)],
    ['Alasan pemilihan lokasi/kegiatan', dash(n.alasan)],
    ['Status catatan', n.status === 'draft' ? 'Draf' : 'Terkirim']
  ];

  return (
    <>
      <div className="pr-head">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-tf.png" alt="Tanoto Foundation" />
        <div>
          <div className="t1">Catatan Lapangan Tanoto Foundation</div>
          <div className="t2">FIND — Field Insights &amp; Notes Dashboard · Template v2</div>
        </div>
        <div className="meta">
          Dicetak {now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br />oleh {by}
        </div>
      </div>

      <div className="pr-title">{dash(n.judul)}</div>
      <div className="pr-sub">{progLabel(n)} · {[n.kabkota, n.institusi].filter(Boolean).join(', ') || '—'} · {fmtDate(n.tglKegiatan)}</div>

      <div className="pr-sec keep"><h3>A. Identifikasi kegiatan</h3>
        <dl className="pr-kv">
          {identifikasi.map(([k, v], i) => <React.Fragment key={i}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}
        </dl></div>

      <div className="pr-sec keep"><h3>B. Ringkasan</h3>
        <div className="pr-body">{dash(n.ringkasan)}</div></div>

      <div className="pr-sec"><h3>C. Catatan observasi</h3>
        <table className="pr"><thead><tr>
          <th style={{ width: '22%' }}>Aspek yang diamati</th>
          <th style={{ width: '39%' }}>Fakta &amp; bukti<div className="pr-note">Yang dilihat, didengar, dihitung, atau dibaca. Dapat diverifikasi.</div></th>
          <th style={{ width: '39%' }}>Interpretasi &amp; implikasi<div className="pr-note">Penafsiran atas fakta di kolom sebelah.</div></th>
        </tr></thead><tbody>
          {ASPEK.map(a => (
            <tr key={a.id}>
              <td className="a">{a.n}. {a.t}
                <div className="pr-note" style={{ fontWeight: 400, fontStyle: 'italic', marginTop: '.25rem' }}>{a.q}</div></td>
              <td className="f"><div className="pr-body" style={{ fontSize: '.76rem' }}>{dash(n.obs?.[a.id]?.f)}</div></td>
              <td className="i"><div className="pr-body" style={{ fontSize: '.76rem' }}>{dash(n.obs?.[a.id]?.i)}</div></td>
            </tr>
          ))}
        </tbody></table></div>

      <div className="pr-sec"><h3>D. Rencana tindak lanjut</h3>
        {(n.rtl || []).length ? (
          <table className="pr"><thead><tr>
            <th style={{ width: '46%' }}>Langkah konkret</th><th style={{ width: '20%' }}>Pihak / PIC</th>
            <th style={{ width: '19%' }}>Perkiraan waktu</th><th style={{ width: '15%' }}>Status</th>
          </tr></thead><tbody>
            {n.rtl.map((r, i) => (
              <tr key={i}><td>{dash(r.aksi)}</td><td>{dash(r.pic)}</td><td>{fmtDate(r.target)}</td>
                <td>{(r.status || '').replace(/^./, c => c.toUpperCase())}</td></tr>
            ))}
          </tbody></table>
        ) : <div className="pr-body">—</div>}
      </div>

      <div className="pr-sec"><h3>Pemeriksaan kualitas catatan</h3>
        <table className="pr"><thead><tr>
          <th style={{ width: '36%' }}>Dimensi</th><th style={{ width: '14%' }}>Skor</th><th style={{ width: '50%' }}>Keterangan</th>
        </tr></thead><tbody>
          {sc.dims.map(dm => <tr key={dm.k}><td>{dm.label}</td><td>{dm.score} / {dm.max}</td><td>{dm.note}</td></tr>)}
          <tr><td style={{ fontWeight: 700 }}>Total</td><td style={{ fontWeight: 700 }}>{sc.total} / 100</td>
            <td style={{ fontWeight: 700 }}>{band.l}</td></tr>
        </tbody></table>
        {sc.flags.length ? (
          <div className="pr-note" style={{ marginTop: '.5rem' }}><b>Catatan pemeriksaan:</b>
            <ul style={{ margin: '.25rem 0 0 1rem' }}>
              {sc.flags.map((f, i) => <li key={i}><b>{f.title}.</b> {f.text}</li>)}
            </ul></div>
        ) : <div className="pr-note" style={{ marginTop: '.5rem' }}>Tidak ada catatan pemeriksaan. Seluruh pemeriksaan otomatis terpenuhi.</div>}
        <div className="pr-note" style={{ marginTop: '.5rem' }}>Skor dihitung dengan rubrik tetap (Kelengkapan 25 · Spesifisitas bukti 20 · Disiplin fakta–interpretasi 20 · Triangulasi sumber 15 · Ketepatan waktu 10 · Aktionabilitas tindak lanjut 10). Skor tinggi berarti catatan layak dianalisis, bukan berarti temuannya positif.</div>
      </div>

      {n.ai ? (
        <div className="pr-sec"><h3>Insight AI tersimpan</h3>
          <div className="pr-note" style={{ marginBottom: '.4rem' }}>
            Dihasilkan {new Date(n.ai.at).toLocaleString('id-ID')}. Hipotesis awal untuk didiskusikan tim, bukan temuan evaluasi tervalidasi.
          </div>
          <div style={{ fontSize: '.76rem' }}><Md text={n.ai.text} /></div></div>
      ) : null}

      <div className="pr-sign">
        <div>Pencatat: {dash(n.emailTF)}</div>
        <div>Diperiksa / diketahui:</div>
      </div>

      <div className="pr-foot">FIND — Field Insights &amp; Notes Dashboard · Tanoto Foundation ·
        {' '}Catatan dibuat {n.createdAt ? new Date(n.createdAt).toLocaleDateString('id-ID') : '—'},
        {' '}terakhir diperbarui {n.updatedAt ? new Date(n.updatedAt).toLocaleDateString('id-ID') : '—'} · ID {n.id}</div>
    </>
  );
}

/** Render lembar cetak ke #printArea lalu panggil window.print(). */
export function printNote(n: Note, by: string) {
  const host = document.getElementById('printArea');
  if (!host) return;
  const root = createRoot(host);
  root.render(<PrintSheet n={n} by={by} />);
  document.body.classList.add('printing');
  const cleanup = () => {
    document.body.classList.remove('printing');
    setTimeout(() => root.unmount(), 0);
  };
  window.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(() => { window.print(); setTimeout(cleanup, 1200); }, 120);
}
