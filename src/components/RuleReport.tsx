'use client';
import { useMemo } from 'react';
import { ASPEK } from '@/lib/taxonomy';
import { fmtDate } from '@/lib/format';
import { ruleAnalyze, clip, type Faktor } from '@/lib/rules';
import type { Note } from '@/lib/types';

function KartuFaktor({ arr, judul, warna, catatan }:
  { arr: Faktor[]; judul: string; warna: string; catatan: string }) {

  const dalam = arr.filter(x => x.kendali);
  const luar = arr.filter(x => !x.kendali);

  const Baris = ({ list, lbl }: { list: Faktor[]; lbl: string }) => !list.length ? null : (
    <>
      <div className="tiny muted" style={{ margin: '.55rem 0 .3rem', fontWeight: 600 }}>
        {lbl} — {list.length} kalimat
      </div>
      {list.slice(0, 4).map((x, i) => (
        <div className="flag" style={{ padding: '.5rem .7rem' }} key={i}>
          <span className="ic" style={{ color: warna }}>▪</span>
          <div className="tx">
            {clip(x.kalimat, 190)}
            <div className="tiny muted" style={{ marginTop: '.2rem' }}>
              {clip(x.judul || '', 46)} · {x.lokasi || '—'} · penanda “{x.cue}”
            </div>
          </div>
        </div>
      ))}
      {list.length > 4 && (
        <div className="tiny muted">dan {list.length - 4} kalimat lain dengan penanda serupa</div>
      )}
    </>
  );

  return (
    <div className="card">
      <div className="card-h"><h3>{judul}</h3><span className="hint">{arr.length} kalimat terdeteksi</span></div>
      <div className="card-b">
        {arr.length ? (
          <>
            <Baris list={dalam} lbl="Dalam kendali program (aspek 1–2)" />
            <Baris list={luar} lbl="Faktor kontekstual (aspek 3)" />
          </>
        ) : (
          <div className="small muted">Tidak ada kalimat dengan frasa penanda pada kumpulan ini.</div>
        )}
        <div className="tiny muted mt-s" style={{ lineHeight: 1.5 }}>{catatan}</div>
      </div>
    </div>
  );
}

export function RuleReport({ notes }: { notes: Note[] }) {
  const r = useMemo(() => ruleAnalyze(notes), [notes]);
  if (!notes.length) return null;

  const n = notes.length;
  const pct = (x: number) => Math.round((x / n) * 100);

  const buktiFlags: string[] = [];
  if (r.bukti.lemah) buktiFlags.push(`${r.bukti.lemah} catatan (${pct(r.bukti.lemah)}%) berskor kualitas di bawah 60`);
  if (r.bukti.sumberTunggal) buktiFlags.push(`${r.bukti.sumberTunggal} catatan bersandar pada satu narasumber`);
  if (r.bukti.tanpaAngka) buktiFlags.push(`${r.bukti.tanpaAngka} catatan tidak memuat satu pun angka di kolom fakta`);
  if (r.bukti.telat) buktiFlags.push(`${r.bukti.telat} catatan diselesaikan melewati 3 hari kerja`);

  return (
    <>
      <div className="card mb">
        <div className="card-h"><h3>Analisis terstruktur</h3>
          <span className="hint">dihitung dari aturan tetap, tanpa AI</span></div>
        <div className="card-b">
          <h4 style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: '.4rem' }}>Cakupan dan keterwakilan</h4>
          <div className="small" style={{ lineHeight: 1.7 }}>
            {n} catatan dari {r.cakupan.lokasi.length} kabupaten/kota, {r.cakupan.perProgram.length} program,
            dengan narasumber dari {r.cakupan.instansi} instansi berbeda
            {r.cakupan.dari ? `, periode kegiatan ${fmtDate(r.cakupan.dari)} – ${fmtDate(r.cakupan.sampai)}` : ''}.
            {r.cakupan.perLokasi.length > 0 &&
              ` Lokasi terbanyak: ${r.cakupan.perLokasi.slice(0, 3).map(x => `${x.k} (${x.v})`).join(', ')}.`}
            {r.cakupan.programSatuLokasi.length > 0 && (
              <><br /><b>Batas keterwakilan:</b>{' '}
                {r.cakupan.programSatuLokasi.length} program hanya terwakili satu lokasi — {r.cakupan.programSatuLokasi.slice(0, 4).join(', ')}
                {r.cakupan.programSatuLokasi.length > 4 ? ', dan lainnya' : ''}. Temuan program tersebut bersifat indikatif.
              </>
            )}
          </div>

          <div className="divider" />
          <h4 style={{ fontSize: '.85rem', fontWeight: 600, marginBottom: '.4rem' }}>Kekuatan bukti</h4>
          <div className="small" style={{ lineHeight: 1.7 }}>
            Rata-rata skor kualitas {r.bukti.avg} dari 100; {r.bukti.kuat} catatan tergolong kuat.{' '}
            {buktiFlags.length
              ? `Yang membatasi keandalan kumpulan ini: ${buktiFlags.join('; ')}.`
              : 'Tidak ditemukan pembatas keandalan yang menonjol.'}
            <br />Kolom fakta yang kosong per aspek:{' '}
            {ASPEK.map(a => `${a.n}. ${a.t.split(' ')[0].toLowerCase()} ${r.bukti.aspekKosong[a.id]}/${n}`).join(' · ')}.
          </div>
        </div>
      </div>

      <div className="card mb">
        <div className="card-h"><h3>Tema berulang</h3>
          <span className="hint">pencocokan leksikon M&E pada kolom fakta dan ringkasan</span></div>
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th>Tema</th><th className="right">Catatan</th><th className="right">Lokasi</th>
              <th>Status pola</th><th>Kata kunci yang cocok</th>
            </tr></thead>
            <tbody>
              {r.tema.slice(0, 10).map(t => (
                <tr key={t.key}>
                  <td><b>{t.label}</b>
                    <div className="tiny muted">{clip(t.judul.slice(0, 2).join('; '), 78)}</div></td>
                  <td className="right num">{t.jml}</td>
                  <td className="right num">{t.lokasi.length}</td>
                  <td>{t.jml >= 3 && t.lokasi.length >= 2
                    ? <span className="pill p-g">pola lintas lokasi</span>
                    : t.jml >= 2
                      ? <span className="pill p-a">berulang, satu wilayah</span>
                      : <span className="pill p-n">indikatif, sekali muncul</span>}</td>
                  <td className="tiny muted">{t.kata.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-b" style={{ borderTop: '1px solid var(--line-2)' }}>
          <div className="tiny muted" style={{ lineHeight: 1.6 }}>
            Tema yang hanya muncul pada satu catatan ditandai indikatif dan belum dapat disebut pola.
            Pencocokan bersifat harfiah: dua catatan yang menggambarkan masalah sama dengan istilah berbeda tidak akan tergabung.
          </div>
        </div>
      </div>

      <div className="grid mb" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>
        <KartuFaktor arr={r.hambat} judul="Faktor penghambat" warna="var(--red)"
          catatan="Kalimat dipilih karena memuat frasa penanda seperti “belum”, “terlambat”, atau “tidak tersedia”. Baca kalimat aslinya sebelum menyimpulkan; penanda tidak selalu berarti hambatan." />
        <KartuFaktor arr={r.dorong} judul="Faktor pendorong" warna="var(--green-700)"
          catatan="Kalimat dipilih karena memuat frasa penanda seperti “menyediakan”, “bersedia”, atau “sesuai jadwal”." />
      </div>

      <div className="card mb">
        <div className="card-h"><h3>Pola tindak lanjut</h3></div>
        <div className="card-b">
          <div className="small" style={{ lineHeight: 1.7 }}>
            {r.rtl.total} butir tindak lanjut, {r.rtl.terbuka} belum selesai, {r.rtl.telat} lewat tenggat.
            {r.rtl.tanpaPic ? ` ${r.rtl.tanpaPic} butir tanpa PIC.` : ''}
            {r.rtl.tanpaTarget ? ` ${r.rtl.tanpaTarget} butir tanpa tanggal target.` : ''}
          </div>
          {r.rtl.tema.length ? (
            <div className="mt-s">
              {r.rtl.tema.slice(0, 5).map(t => (
                <div className="flex small" key={t.label}
                  style={{ justifyContent: 'space-between', padding: '.35rem 0', borderBottom: '1px solid var(--line-2)' }}>
                  <span>{t.label}</span>
                  <span className="tiny muted">{t.jml} butir · {t.lokasi.length} lokasi</span>
                </div>
              ))}
              <div className="tiny muted mt-s">
                Tindak lanjut yang berulang pada tema sama lintas lokasi biasanya menandakan penyebabnya berada di luar kendali satu lokasi.
              </div>
            </div>
          ) : <div className="tiny muted mt-s">Tidak ada tema tindak lanjut yang berulang.</div>}
        </div>
      </div>

      <div className="card mb">
        <div className="card-h"><h3>Usulan learning agenda</h3>
          <span className="hint">diturunkan dari kesenjangan struktural, bukan dari isi narasi</span></div>
        <div className="card-b">
          {r.agenda.length ? r.agenda.map((a, i) => (
            <div style={{ marginBottom: '.9rem' }} key={i}>
              <div className="small" style={{ fontWeight: 600 }}>{i + 1}. {a.q}</div>
              <div className="tiny muted" style={{ lineHeight: 1.6, marginTop: '.15rem' }}><b>Dasar:</b> {a.alasan}</div>
              <div className="tiny muted" style={{ lineHeight: 1.6 }}><b>Metode yang sesuai:</b> {a.metode}</div>
            </div>
          )) : (
            <div className="small muted">Tidak ada kesenjangan struktural yang cukup menonjol untuk diangkat sebagai pertanyaan evaluatif.</div>
          )}
        </div>
      </div>

      <div className="ai-note">
        Seluruh isi bagian ini dihitung dengan aturan tetap: pencocokan kata kunci, penghitungan frekuensi, dan
        pemeriksaan kelengkapan. Mesin ini tidak memahami makna kalimat, sehingga dua catatan yang menggambarkan
        masalah sama dengan istilah berbeda tidak akan dikenali sebagai satu tema, dan kalimat bernada negatif belum
        tentu benar-benar hambatan. Gunakan sebagai peta arah untuk membaca catatan aslinya, bukan sebagai kesimpulan evaluasi.
      </div>
    </>
  );
}
