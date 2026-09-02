'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ASPEK, DEPT, JENIS, PROGRAM } from '@/lib/taxonomy';
import { wordCount } from '@/lib/format';
import { scoreNote, scoreBand, TAFSIR_MARK } from '@/lib/scoring';
import { Meter } from './Charts';
import { toast } from './Toast';
import { useNotes } from './NotesProvider';
import { Topbar } from './Shell';
import type { Note, Pihak, Rtl } from '@/lib/types';

export function blankNote(email: string): Note {
  return {
    id: '', judul: '', tglKegiatan: '', tglSelesai: '', kabkota: '', kecdesa: '', institusi: '',
    emailTF: email, deptLevel: 'Nasional', deptUnit: '', deptLain: '', program: '', programLain: '',
    jenis: '', jenisLain: '', pihak: [{ nama: '', jabatan: '', instansi: '' }], tujuan: '', alasan: '',
    ringkasan: '', obs: { pelaksanaan: { f: '', i: '' }, respons: { f: '', i: '' }, konteks: { f: '', i: '' } },
    rtl: [{ aksi: '', pic: '', target: '', status: 'terbuka' }], ai: null, status: 'draft',
    authorId: '', createdAt: '', updatedAt: ''
  };
}

export function NoteForm({ initial, isEdit }: { initial: Note; isEdit: boolean }) {
  const { saveNote, profile } = useNotes();
  const router = useRouter();
  const [d, setD] = useState<Note>(() => ({
    ...initial,
    pihak: initial.pihak?.length ? initial.pihak : [{ nama: '', jabatan: '', instansi: '' }],
    rtl: initial.rtl?.length ? initial.rtl : [{ aksi: '', pic: '', target: '', status: 'terbuka' }]
  }));
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof Note>(k: K, v: Note[K]) => setD(p => ({ ...p, [k]: v }));
  const setObs = (id: string, col: 'f' | 'i', v: string) =>
    setD(p => ({ ...p, obs: { ...p.obs, [id]: { ...p.obs[id], [col]: v } } }));
  const setPihak = (i: number, k: keyof Pihak, v: string) =>
    setD(p => ({ ...p, pihak: p.pihak.map((x, j) => (j === i ? { ...x, [k]: v } : x)) }));
  const setRtl = (i: number, k: keyof Rtl, v: string) =>
    setD(p => ({ ...p, rtl: p.rtl.map((x, j) => (j === i ? { ...x, [k]: v } : x)) as Rtl[] }));

  /* Skor hidup — baris kosong tidak ikut dihitung */
  const live = useMemo(() => {
    const snap: Note = {
      ...d,
      pihak: d.pihak.filter(p => p.nama || p.jabatan || p.instansi),
      rtl: d.rtl.filter(r => (r.aksi || '').trim())
    };
    return scoreNote(snap);
  }, [d]);
  const band = scoreBand(live.total);

  const faktaWarn = (id: string) => {
    const t = (d.obs?.[id]?.f || '').toLowerCase();
    const hits = TAFSIR_MARK.filter(m => t.includes(m));
    if (!hits.length) return null;
    return (
      <div className="tiny mt-s">
        <span className="pill p-a">Cek: {hits.slice(0, 3).join(', ')}{hits.length > 3 ? ` +${hits.length - 3}` : ''}</span>
        <span className="muted" style={{ marginLeft: '.3rem' }}>terdengar seperti penilaian — pertimbangkan pindah ke kolom kanan</span>
      </div>
    );
  };

  async function submit(status: 'draft' | 'submitted') {
    const miss: string[] = [];
    if (!d.judul.trim()) miss.push('judul kegiatan');
    if (!d.tglKegiatan) miss.push('tanggal kegiatan');
    if (!d.emailTF.trim()) miss.push('email TF');
    if (status === 'submitted') {
      if (!d.program) miss.push('program');
      if (!d.jenis) miss.push('jenis kegiatan');
      if (!d.kabkota.trim()) miss.push('lokasi');
      if (!d.ringkasan.trim()) miss.push('ringkasan');
    }
    if (miss.length) { toast('Lengkapi dulu: ' + miss.join(', ') + '.', 'err'); return; }

    setBusy(true);
    const payload = {
      ...d,
      id: isEdit ? d.id : undefined,
      status,
      pihak: d.pihak.filter(p => p.nama || p.jabatan || p.instansi),
      rtl: d.rtl.filter(r => (r.aksi || '').trim())
    };
    const saved = await saveNote(payload);
    setBusy(false);
    if (saved) {
      toast(status === 'draft' ? 'Draf tersimpan.' : 'Catatan tersimpan dan dikirim.');
      router.push('/catatan');
    }
  }

  const deptUnits = (DEPT[d.deptLevel] || []).concat('Lainnya');

  return (
    <>
      <Topbar
        title={isEdit ? 'Ubah catatan' : 'Catatan baru'}
        sub="Mengikuti template Catatan Lapangan TF v2"
        actions={<>
          <span className="small muted">Skor kualitas {live.total}/100</span>
          <button className="btn btn-sm" disabled={busy} onClick={() => submit('draft')}>Simpan draf</button>
          <button className="btn btn-p btn-sm" disabled={busy} onClick={() => submit('submitted')}>Simpan &amp; kirim</button>
        </>}
      />
      <main className="content">
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) 17rem', alignItems: 'start', gap: '1.2rem' }}>
          <div>
            {/* A */}
            <section className="card sec"><div className="card-b">
              <div className="sec-h"><span className="ltr">A</span><h2>Identifikasi kegiatan</h2></div>

              <div className="f"><label>Judul kegiatan / kunjungan <span className="req">*</span></label>
                <input type="text" value={d.judul} onChange={e => set('judul', e.target.value)}
                  placeholder="Contoh: Supervisi pengumpulan data baseline literasi kelas 2" /></div>

              <div className="row row-2">
                <div className="f"><label>Tanggal kegiatan <span className="req">*</span></label>
                  <input type="date" value={d.tglKegiatan} onChange={e => set('tglKegiatan', e.target.value)} /></div>
                <div className="f"><label>Tanggal catatan diselesaikan</label>
                  <div className="help">Target: maksimal 3 hari kerja setelah kunjungan</div>
                  <input type="date" value={d.tglSelesai} onChange={e => set('tglSelesai', e.target.value)} /></div>
              </div>

              <div className="f"><label>Lokasi <span className="req">*</span></label>
                <div className="help">Kabupaten/kota, kecamatan/desa, nama sekolah/PAUD/posyandu/kantor</div>
                <div className="row row-3">
                  <input type="text" value={d.kabkota} onChange={e => set('kabkota', e.target.value)} placeholder="Kabupaten/kota" />
                  <input type="text" value={d.kecdesa} onChange={e => set('kecdesa', e.target.value)} placeholder="Kecamatan/desa" />
                  <input type="text" value={d.institusi} onChange={e => set('institusi', e.target.value)} placeholder="Nama institusi" />
                </div></div>

              <div className="row row-2">
                <div className="f"><label>Email TF <span className="req">*</span></label>
                  <input type="email" value={d.emailTF} onChange={e => set('emailTF', e.target.value)} placeholder="nama@tanotofoundation.org" /></div>
                <div className="f"><label>Departemen <span className="req">*</span></label>
                  <div className="row row-2" style={{ gap: '.5rem' }}>
                    <select value={d.deptLevel} onChange={e => setD(p => ({ ...p, deptLevel: e.target.value, deptUnit: '' }))}>
                      <option>Nasional</option><option>Regional</option>
                    </select>
                    <select value={d.deptUnit} onChange={e => set('deptUnit', e.target.value)}>
                      <option value="">Pilih unit</option>
                      {deptUnits.map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  {d.deptUnit === 'Lainnya' && (
                    <input type="text" className="mt-s" value={d.deptLain} onChange={e => set('deptLain', e.target.value)}
                      placeholder="Sebutkan departemen lainnya" />
                  )}
                </div>
              </div>

              <div className="row row-2">
                <div className="f"><label>Program <span className="req">*</span></label>
                  <select value={d.program} onChange={e => set('program', e.target.value)}>
                    <option value="">Pilih program</option>
                    {PROGRAM.concat('Lainnya').map(p => <option key={p}>{p}</option>)}
                  </select>
                  {d.program === 'Lainnya' && (
                    <input type="text" className="mt-s" value={d.programLain} onChange={e => set('programLain', e.target.value)}
                      placeholder="Sebutkan program lainnya" />
                  )}
                </div>
                <div className="f"><label>Jenis kegiatan (pilih satu utama) <span className="req">*</span></label>
                  <select value={d.jenis} onChange={e => set('jenis', e.target.value)}>
                    <option value="">Pilih jenis kegiatan</option>
                    {JENIS.concat('Lainnya').map(p => <option key={p}>{p}</option>)}
                  </select>
                  {d.jenis === 'Lainnya' && (
                    <input type="text" className="mt-s" value={d.jenisLain} onChange={e => set('jenisLain', e.target.value)}
                      placeholder="Sebutkan kunjungan lain" />
                  )}
                </div>
              </div>

              <div className="f"><label>Pihak yang ditemui <span className="req">*</span></label>
                <div className="help">Nama, jabatan, instansi. Semakin beragam instansinya, semakin kuat triangulasi temuan.</div>
                {d.pihak.map((p, i) => (
                  <div className="row row-3 mt-s" key={i} style={{ gridTemplateColumns: '1fr 1fr 1fr auto', gap: '.4rem' }}>
                    <input type="text" placeholder="Nama" value={p.nama} onChange={e => setPihak(i, 'nama', e.target.value)} />
                    <input type="text" placeholder="Jabatan" value={p.jabatan} onChange={e => setPihak(i, 'jabatan', e.target.value)} />
                    <input type="text" placeholder="Instansi" value={p.instansi} onChange={e => setPihak(i, 'instansi', e.target.value)} />
                    <button className="btn btn-sm btn-d" title="Hapus baris"
                      onClick={() => setD(pr => ({ ...pr, pihak: pr.pihak.filter((_, j) => j !== i) }))}>✕</button>
                  </div>
                ))}
                <button className="btn btn-sm mt-s"
                  onClick={() => setD(p => ({ ...p, pihak: [...p.pihak, { nama: '', jabatan: '', instansi: '' }] }))}>+ Tambah narasumber</button>
              </div>

              <div className="f"><label>Tujuan kunjungan <span className="req">*</span></label>
                <div className="help">1–2 kalimat: apa yang ingin dipastikan/dipelajari dari kunjungan ini</div>
                <textarea rows={2} value={d.tujuan} onChange={e => set('tujuan', e.target.value)} /></div>

              <div className="f" style={{ marginBottom: 0 }}><label>Alasan pemilihan lokasi/kegiatan</label>
                <div className="help">Mengapa lokasi/kegiatan ini yang dikunjungi (bukan yang lain)</div>
                <textarea rows={2} value={d.alasan} onChange={e => set('alasan', e.target.value)} /></div>
            </div></section>

            {/* B */}
            <section className="card sec"><div className="card-b">
              <div className="sec-h"><span className="ltr">B</span><h2>Ringkasan</h2>
                <span className="n">{wordCount(d.ringkasan) ? `${wordCount(d.ringkasan)} kata` : ''}</span></div>
              <div className="f" style={{ marginBottom: 0 }}>
                <div className="help">Rangkum temuan utama kunjungan: apa yang terjadi, apa yang menonjol, dan apa risikonya. Tulis setelah bagian C terisi agar ringkasan mencerminkan bukti, bukan kesan awal.</div>
                <textarea rows={5} value={d.ringkasan} onChange={e => set('ringkasan', e.target.value)} /></div>
            </div></section>

            {/* C */}
            <section className="card sec"><div className="card-b">
              <div className="sec-h"><span className="ltr">C</span><h2>Catatan observasi</h2>
                <span className="n">Fakta di kiri, penafsiran di kanan</span></div>
              {ASPEK.map(a => (
                <div className="obs" key={a.id}>
                  <div className="obs-h"><div className="t">{a.n}. {a.t}</div><div className="q">{a.q}</div></div>
                  <div className="obs-split">
                    <div className="obs-col fakta">
                      <div className="cl"><span className="dot dot-f" />Fakta &amp; bukti</div>
                      <div className="cd">Yang dilihat, didengar, dihitung, atau dibaca. Dapat diverifikasi.</div>
                      <textarea rows={6} value={d.obs[a.id]?.f || ''} onChange={e => setObs(a.id, 'f', e.target.value)} />
                      {faktaWarn(a.id)}
                    </div>
                    <div className="obs-col tafsir">
                      <div className="cl"><span className="dot dot-t" />Interpretasi &amp; implikasi</div>
                      <div className="cd">Penafsiran atas fakta di kolom sebelah.</div>
                      <textarea rows={6} value={d.obs[a.id]?.i || ''} onChange={e => setObs(a.id, 'i', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div></section>

            {/* D */}
            <section className="card sec"><div className="card-b">
              <div className="sec-h"><span className="ltr">D</span><h2>Rencana tindak lanjut</h2></div>
              <div className="help" style={{ marginBottom: '.6rem' }}>Langkah konkret setelah field trip, termasuk pihak yang perlu ditindaklanjuti dan perkiraan waktunya.</div>
              {d.rtl.map((r, i) => (
                <div className="row mt-s" key={i} style={{ gridTemplateColumns: 'minmax(0,2.2fr) 1fr .9fr .8fr auto', gap: '.4rem' }}>
                  <input type="text" placeholder="Langkah konkret yang akan dilakukan" value={r.aksi} onChange={e => setRtl(i, 'aksi', e.target.value)} />
                  <input type="text" placeholder="PIC" value={r.pic} onChange={e => setRtl(i, 'pic', e.target.value)} />
                  <input type="date" value={r.target} onChange={e => setRtl(i, 'target', e.target.value)} />
                  <select value={r.status} onChange={e => setRtl(i, 'status', e.target.value)}>
                    <option value="terbuka">Terbuka</option><option value="berjalan">Berjalan</option><option value="selesai">Selesai</option>
                  </select>
                  <button className="btn btn-sm btn-d" title="Hapus baris"
                    onClick={() => setD(p => ({ ...p, rtl: p.rtl.filter((_, j) => j !== i) }))}>✕</button>
                </div>
              ))}
              <button className="btn btn-sm mt-s"
                onClick={() => setD(p => ({ ...p, rtl: [...p.rtl, { aksi: '', pic: '', target: '', status: 'terbuka' }] }))}>+ Tambah tindak lanjut</button>
            </div></section>

            <div className="flex fw mb">
              <button className="btn btn-p" disabled={busy} onClick={() => submit('submitted')}>Simpan &amp; kirim</button>
              <button className="btn" disabled={busy} onClick={() => submit('draft')}>Simpan draf</button>
              <button className="btn" onClick={() => router.push('/catatan')}>Batal</button>
            </div>
          </div>

          <aside style={{ position: 'sticky', top: '5rem' }}>
            <div className="card"><div className="card-h"><h3>Pemeriksaan cepat</h3></div>
              <div className="card-b">
                <div className="flex" style={{ marginBottom: '.6rem' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-.03em', fontVariantNumeric: 'tabular-nums' }}>{live.total}</div>
                  <div><span className={`pill ${band.c}`}>{band.l}</span><div className="tiny muted">dari 100</div></div>
                </div>
                {live.dims.map(dm => (
                  <div key={dm.k} style={{ marginBottom: '.45rem' }}>
                    <div className="flex tiny" style={{ justifyContent: 'space-between' }}>
                      <span>{dm.label}</span><span className="num muted">{dm.score}/{dm.max}</span></div>
                    <Meter value={dm.score} max={dm.max} />
                  </div>
                ))}
                {live.kosong.length > 0 && (
                  <div className="tiny muted mt-s" style={{ lineHeight: 1.5 }}>
                    Belum terisi: {live.kosong.slice(0, 4).join(', ')}{live.kosong.length > 4 ? `, +${live.kosong.length - 4}` : ''}
                  </div>
                )}
              </div></div>

            <div className="card mt"><div className="card-b">
              <div className="small" style={{ fontWeight: 600, marginBottom: '.4rem' }}>Aturan kolom fakta</div>
              <div className="tiny muted" style={{ lineHeight: 1.6 }}>Tulis hanya yang bisa dicek ulang orang lain: jumlah, durasi, kutipan, apa yang terlihat. Kata seperti <i>&ldquo;kurang baik&rdquo;</i>, <i>&ldquo;tampaknya&rdquo;</i>, atau <i>&ldquo;perlu&rdquo;</i> adalah penilaian — tempatnya di kolom kanan.</div>
            </div></div>
            <div className="tiny muted mt-s">Pencatat: {profile.email}</div>
          </aside>
        </div>
      </main>
    </>
  );
}
