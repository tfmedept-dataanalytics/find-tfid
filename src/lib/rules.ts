/* ==========================================================
   Mesin analisis terstruktur — deterministik, tanpa AI.

   Pendekatan: pencocokan leksikon domain M&E dan frasa penanda
   pada kolom Fakta. Mesin ini menghitung dan mengelompokkan;
   ia tidak memahami makna kalimat. Setiap angka yang muncul di
   laporan dapat ditelusuri kembali ke catatan sumbernya.

   Logika identik dengan versi single-file HTML agar hasil kedua
   versi dapat dibandingkan langsung.
   ========================================================== */
import { ASPEK } from './taxonomy';
import { fmtDate, progLabel, tally, wordCount, todayISO, faktaText } from './format';
import { scoreNote } from './scoring';
import type { Note } from './types';

/* Leksikon tema. Kata kunci sengaja dibuat eksplisit agar hasilnya
   dapat diaudit dan disesuaikan tim MLE tanpa mengubah kode lain. */
export const LEX: { k: string; l: string; w: string[] }[] = [
  { k: 'logistik', l: 'Ketersediaan alat, modul, dan bahan',
    w: ['alat peraga','alat bantu','modul','buku','materi','perlengkapan','logistik','distribusi','kit','media ajar','belum diterima','belum sampai','belum tersedia'] },
  { k: 'partisipasi', l: 'Kehadiran dan partisipasi',
    w: ['kehadiran','hadir','tidak hadir','absen','peserta','partisipasi','putus','mangkir','datang','undangan'] },
  { k: 'jadwal', l: 'Penjadwalan dan waktu pelaksanaan',
    w: ['jadwal','terlambat','molor','durasi','bertabrakan','panen','musim','libur','waktu pelaksanaan','ditunda','reschedule','mundur'] },
  { k: 'kapasitas', l: 'Kapasitas pelaksana dan pelatihan',
    w: ['pelatihan','penyegaran','kapasitas','kompetensi','keterampilan','kader','fasilitator','enumerator','guru','pendampingan','coaching','bimbingan teknis'] },
  { k: 'protokol', l: 'Kepatuhan protokol dan standar',
    w: ['protokol','manual','standar','sop','panduan','prosedur','inkonsistensi','menyimpang','tidak sesuai','sesuai manual','instrumen'] },
  { k: 'data', l: 'Kualitas data dan pencatatan',
    w: ['pencatatan','entri','verifikasi','validasi','skor','asesmen','survei','kuesioner','formulir','data tidak','rekap','laporan bulanan'] },
  { k: 'anggaran', l: 'Anggaran dan pembiayaan',
    w: ['anggaran','biaya','dana','pembiayaan','alokasi','apbd','apbdes','honor','insentif','usulan anggaran','dak','bos'] },
  { k: 'kebijakan', l: 'Dukungan pemerintah dan kebijakan',
    w: ['dinas','pemerintah','kebijakan','regulasi','peraturan','camat','kepala desa','lurah','pengawas','advokasi','komitmen','surat edaran','skpd','bappeda'] },
  { k: 'mitra', l: 'Koordinasi mitra dan pelaksana',
    w: ['mitra','vendor','pelaksana','koordinasi','komunikasi','mou','kontrak','konsorsium','pihak ketiga'] },
  { k: 'sarana', l: 'Infrastruktur dan sarana',
    w: ['listrik','padam','ruang','ruangan','jaringan','internet','sinyal','air','sanitasi','bangunan','transportasi','akses jalan','tablet','perangkat'] },
  { k: 'umpanbalik', l: 'Umpan balik dan diseminasi hasil',
    w: ['umpan balik','hasil asesmen','diseminasi','sosialisasi','laporan hasil','tindak balik','informasi hasil','belum menerima hasil'] },
  { k: 'masyarakat', l: 'Keterlibatan orang tua dan masyarakat',
    w: ['orang tua','pengasuh','wali','masyarakat','komunitas','warga','tokoh','pkk','dasawisma'] },
  { k: 'kesehatan', l: 'Layanan kesehatan dan gizi',
    w: ['posyandu','puskesmas','gizi','stunting','imunisasi','bidan','timbang','antropometri','mpasi','pemberian makan','balita','ibu hamil'] },
  { k: 'pembelajaran', l: 'Pembelajaran, literasi, dan numerasi',
    w: ['literasi','numerasi','membaca','berhitung','pembelajaran','siswa','murid','kelas','kurikulum','egra','asesmen literasi','paud'] }
];

/* Frasa penanda. Klasifikasi hanya berdasar kemunculan frasa, bukan pemahaman kalimat. */
export const CUE_HAMBAT = ['belum','tidak tersedia','tidak ada','tidak hadir','terlambat','kekurangan','kendala','hambatan',
  'gagal','menurun','berkurang','bertabrakan','padam','batal','sulit','tertunda','menolak','tidak sesuai',
  'inkonsistensi','tidak mengetahui','meninggalkan','kurang dari','di bawah target'];
export const CUE_DORONG = ['menyediakan','bersedia','mendukung','aktif','meningkat','inisiatif','tanpa diminta','kooperatif',
  'komitmen','membantu','antusias','menugaskan','menyanggupi','sesuai manual','sesuai jadwal','melebihi','tepat waktu'];

export const sentences = (t?: string) => String(t || '')
  .split(/(?<=[.!?])\s+|\n+/).map(x => x.trim()).filter(x => x.length > 25);

export const clip = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t);

export interface Faktor {
  kalimat: string; judul: string; lokasi: string; program: string;
  aspek: string; kendali: boolean; cue: string;
}
export interface Tema {
  key: string; label: string; jml: number; lokasi: string[]; program: string[];
  kata: string[]; judul: string[];
}
export interface Agenda { q: string; alasan: string; metode: string }

export interface RuleReport {
  cakupan: {
    n: number; lokasi: string[]; instansi: number; dari: string; sampai: string;
    perProgram: { k: string; v: number }[]; perLokasi: { k: string; v: number }[];
    programSatuLokasi: string[];
  };
  bukti: {
    avg: number; kuat: number; lemah: number; sumberTunggal: number;
    tanpaAngka: number; telat: number; aspekKosong: Record<string, number>;
  };
  tema: Tema[];
  hambat: Faktor[];
  dorong: Faktor[];
  rtl: {
    total: number; terbuka: number; telat: number; tanpaPic: number; tanpaTarget: number;
    tema: { label: string; jml: number; lokasi: string[] }[];
  };
  agenda: Agenda[];
}

export function ruleAnalyze(notes: Note[]): RuleReport {
  const low = (t?: string) => String(t || '').toLowerCase();

  /* ---------- Cakupan ---------- */
  const tanggal = notes.map(n => n.tglKegiatan).filter(Boolean).sort();
  const lokasi = Array.from(new Set(notes.map(n => n.kabkota).filter(Boolean)));
  const instansi = new Set(notes.flatMap(n => (n.pihak || []).map(p => (p.instansi || '').trim().toLowerCase()).filter(Boolean)));
  const perProgram = tally(notes, progLabel);
  const perLokasi = tally(notes, n => n.kabkota);
  const cakupan = {
    n: notes.length, lokasi, instansi: instansi.size,
    dari: tanggal[0] || '', sampai: tanggal[tanggal.length - 1] || '',
    perProgram, perLokasi,
    programSatuLokasi: perProgram.filter(p => {
      const lk = new Set(notes.filter(n => progLabel(n) === p.k).map(n => n.kabkota).filter(Boolean));
      return lk.size <= 1;
    }).map(p => p.k)
  };

  /* ---------- Kekuatan bukti ---------- */
  const scored = notes.map(n => ({ n, s: scoreNote(n) }));
  const aspekKosong: Record<string, number> = {};
  ASPEK.forEach(a => { aspekKosong[a.id] = notes.filter(n => !String(n.obs?.[a.id]?.f || '').trim()).length; });
  const bukti = {
    avg: Math.round(scored.reduce((x, y) => x + y.s.total, 0) / (scored.length || 1)),
    kuat: scored.filter(x => x.s.total >= 80).length,
    lemah: scored.filter(x => x.s.total < 60).length,
    sumberTunggal: notes.filter(n => (n.pihak || []).length <= 1).length,
    tanpaAngka: notes.filter(n => !/\b\d/.test(faktaText(n)) && wordCount(faktaText(n)) > 0).length,
    telat: scored.filter(x => x.s.wd !== null && x.s.wd > 3).length,
    aspekKosong
  };

  /* ---------- Tema berulang ---------- */
  const tema: Tema[] = LEX.map(t => {
    const kena: { note: Note; kata: string[] }[] = [];
    notes.forEach(n => {
      const teks = low(faktaText(n) + ' ' + (n.ringkasan || ''));
      const cocok = t.w.filter(w => teks.includes(w));
      if (cocok.length) kena.push({ note: n, kata: Array.from(new Set(cocok)) });
    });
    return {
      key: t.k, label: t.l, jml: kena.length,
      lokasi: Array.from(new Set(kena.map(x => x.note.kabkota).filter(Boolean))),
      program: Array.from(new Set(kena.map(x => progLabel(x.note)).filter(Boolean))),
      kata: Array.from(new Set(kena.flatMap(x => x.kata))).slice(0, 6),
      judul: kena.map(x => x.note.judul)
    };
  }).filter(t => t.jml > 0).sort((a, b) => b.jml - a.jml || b.lokasi.length - a.lokasi.length);

  /* ---------- Hambatan & pendorong ---------- */
  const hambat: Faktor[] = [], dorong: Faktor[] = [];
  notes.forEach(n => {
    ASPEK.forEach(a => {
      sentences(n.obs?.[a.id]?.f).forEach(kal => {
        const l = low(kal);
        const h = CUE_HAMBAT.filter(c => l.includes(c));
        const d = CUE_DORONG.filter(c => l.includes(c));
        const item = {
          kalimat: kal, judul: n.judul, lokasi: n.kabkota, program: progLabel(n),
          aspek: a.t, kendali: a.id !== 'konteks'
        };
        if (h.length && h.length >= d.length) hambat.push({ ...item, cue: h[0] });
        else if (d.length) dorong.push({ ...item, cue: d[0] });
      });
    });
  });

  /* ---------- Pola tindak lanjut ---------- */
  const semuaRtl = notes.flatMap(n => (n.rtl || []).map(r => ({ r, n })));
  const hari = todayISO();
  const rtlTema = LEX.map(t => {
    const kena = semuaRtl.filter(x => t.w.some(w => low(x.r.aksi).includes(w)));
    return { label: t.l, jml: kena.length, lokasi: Array.from(new Set(kena.map(x => x.n.kabkota).filter(Boolean))) };
  }).filter(t => t.jml >= 2).sort((a, b) => b.jml - a.jml);
  const rtl = {
    total: semuaRtl.length,
    terbuka: semuaRtl.filter(x => x.r.status !== 'selesai').length,
    telat: semuaRtl.filter(x => x.r.status !== 'selesai' && x.r.target && x.r.target < hari).length,
    tanpaPic: semuaRtl.filter(x => !String(x.r.pic || '').trim()).length,
    tanpaTarget: semuaRtl.filter(x => !String(x.r.target || '').trim()).length,
    tema: rtlTema
  };

  /* ---------- Learning agenda dari kesenjangan struktural ---------- */
  const agenda: Agenda[] = [];
  const pct = (x: number) => Math.round((x / (notes.length || 1)) * 100);

  tema.filter(t => t.jml >= 3 && t.lokasi.length >= 2).slice(0, 3).forEach(t => {
    agenda.push({
      q: `Apakah "${t.label.toLowerCase()}" merupakan masalah sistemik atau spesifik lokasi?`,
      alasan: `Muncul di ${t.jml} catatan dari ${t.lokasi.length} kabupaten/kota (${t.lokasi.slice(0, 3).join(', ')}${t.lokasi.length > 3 ? ', dan lainnya' : ''}).`,
      metode: 'Tinjauan dokumen mitra pelaksana lintas lokasi, dilengkapi wawancara singkat dengan pelaksana di lokasi yang tidak menyebutkan isu ini sebagai pembanding.'
    });
  });

  ASPEK.forEach(a => {
    if (aspekKosong[a.id] / (notes.length || 1) > 0.3)
      agenda.push({
        q: `Mengapa aspek "${a.t.toLowerCase()}" jarang terisi dalam catatan lapangan?`,
        alasan: `${aspekKosong[a.id]} dari ${notes.length} catatan (${pct(aspekKosong[a.id])}%) mengosongkan kolom fakta pada aspek ini.`,
        metode: 'Diskusi terarah dengan pencatat: apakah informasi tidak tersedia di lapangan, tidak dianggap relevan, atau panduan pengisiannya belum jelas.'
      });
  });

  if (bukti.sumberTunggal / (notes.length || 1) > 0.3)
    agenda.push({
      q: 'Seberapa berbeda temuan bila kunjungan menjangkau lebih dari satu jenis narasumber?',
      alasan: `${bukti.sumberTunggal} dari ${notes.length} catatan (${pct(bukti.sumberTunggal)}%) bersandar pada satu narasumber atau tidak mencantumkannya.`,
      metode: 'Uji coba protokol kunjungan yang mewajibkan minimal dua jenis narasumber pada satu klaster, lalu bandingkan kedalaman temuannya.'
    });

  if (cakupan.programSatuLokasi.length)
    agenda.push({
      q: 'Sejauh mana temuan program yang hanya dikunjungi di satu lokasi dapat digeneralisasi?',
      alasan: `Program ${cakupan.programSatuLokasi.slice(0, 3).join(', ')}${cakupan.programSatuLokasi.length > 3 ? ', dan lainnya' : ''} hanya terwakili oleh satu kabupaten/kota dalam kumpulan ini.`,
      metode: 'Perluas kunjungan ke lokasi kontras (kinerja tinggi dan rendah) sebelum temuan dipakai untuk keputusan tingkat program.'
    });

  if (rtl.telat >= 2)
    agenda.push({
      q: 'Apa yang menghambat penyelesaian tindak lanjut yang sudah lewat tenggat?',
      alasan: `${rtl.telat} tindak lanjut belum selesai melewati tanggal targetnya.`,
      metode: 'Telaah cepat atas butir yang tertunda bersama PIC masing-masing; pisahkan hambatan sumber daya dari hambatan kewenangan.'
    });

  if (rtl.tema.length)
    agenda.push({
      q: `Apakah tindak lanjut berulang pada "${rtl.tema[0].label.toLowerCase()}" menandakan perbaikan sebelumnya tidak berjalan?`,
      alasan: `${rtl.tema[0].jml} butir tindak lanjut menyentuh tema yang sama di ${rtl.tema[0].lokasi.length} lokasi.`,
      metode: 'Lacak status penyelesaian butir sejenis pada siklus sebelumnya sebelum menambahkan tindak lanjut baru dengan isi yang sama.'
    });

  return { cakupan, bukti, tema, hambat, dorong, rtl, agenda };
}


/* ---------- Ekspor laporan terstruktur sebagai Markdown ----------
   Lapisan gratis harus bisa jadi keluaran yang dipakai, bukan sekadar
   tampilan di layar. */
export function rulesMarkdown(notes: Note[], ctx?: string): string {

  const r = ruleAnalyze(notes);
  const n = notes.length;
  const pct = (x: number) => Math.round(x / (n||1) * 100);
  const L: string[] = [];

  L.push('# Analisis Terstruktur Catatan Lapangan — FIND');
  L.push('');
  L.push(`Cakupan: ${ctx || 'seluruh catatan yang dapat diakses'}`);
  L.push(`Disusun: ${new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})}`);
  L.push('');
  L.push('## Cakupan dan keterwakilan');
  L.push(`- ${n} catatan dari ${r.cakupan.lokasi.length} kabupaten/kota dan ${r.cakupan.perProgram.length} program`);
  L.push(`- Narasumber berasal dari ${r.cakupan.instansi} instansi berbeda`);
  if(r.cakupan.dari) L.push(`- Periode kegiatan: ${fmtDate(r.cakupan.dari)} – ${fmtDate(r.cakupan.sampai)}`);
  if(r.cakupan.programSatuLokasi.length)
    L.push(`- Batas keterwakilan: ${r.cakupan.programSatuLokasi.length} program hanya terwakili satu lokasi (${r.cakupan.programSatuLokasi.join(', ')}). Temuan program tersebut bersifat indikatif.`);
  L.push('');
  L.push('## Kekuatan bukti');
  L.push(`- Rata-rata skor kualitas ${r.bukti.avg}/100; ${r.bukti.kuat} catatan tergolong kuat, ${r.bukti.lemah} di bawah 60`);
  if(r.bukti.sumberTunggal) L.push(`- ${r.bukti.sumberTunggal} catatan (${pct(r.bukti.sumberTunggal)}%) bersandar pada satu narasumber`);
  if(r.bukti.tanpaAngka) L.push(`- ${r.bukti.tanpaAngka} catatan tidak memuat angka di kolom fakta`);
  if(r.bukti.telat) L.push(`- ${r.bukti.telat} catatan diselesaikan melewati 3 hari kerja`);
  L.push(`- Kolom fakta kosong per aspek: ${ASPEK.map(a => `${a.t} ${r.bukti.aspekKosong[a.id]}/${n}`).join('; ')}`);
  L.push('');
  L.push('## Tema berulang');
  r.tema.slice(0,10).forEach(t => {
    const pola = t.jml >= 3 && t.lokasi.length >= 2 ? 'pola lintas lokasi'
      : t.jml >= 2 ? 'berulang, satu wilayah' : 'indikatif, sekali muncul';
    L.push(`- **${t.label}** — ${t.jml} catatan, ${t.lokasi.length} lokasi (${pola}). Kata kunci: ${t.kata.join(', ')}`);
  });
  L.push('');
  L.push('## Faktor penghambat');
  const tulisFaktor = (arr: Faktor[]) => {
    if(!arr.length){ L.push('- Tidak ada kalimat dengan frasa penanda.'); return; }
    arr.filter(x => x.kendali).slice(0,6).forEach(x =>
      L.push(`- [Dalam kendali program] ${x.kalimat} — ${x.judul}, ${x.lokasi||'lokasi tidak dicatat'}`));
    arr.filter(x => !x.kendali).slice(0,6).forEach(x =>
      L.push(`- [Faktor kontekstual] ${x.kalimat} — ${x.judul}, ${x.lokasi||'lokasi tidak dicatat'}`));
  };
  tulisFaktor(r.hambat);
  L.push('');
  L.push('## Faktor pendorong');
  tulisFaktor(r.dorong);
  L.push('');
  L.push('## Pola tindak lanjut');
  L.push(`- ${r.rtl.total} butir; ${r.rtl.terbuka} belum selesai; ${r.rtl.telat} lewat tenggat`);
  if(r.rtl.tanpaPic) L.push(`- ${r.rtl.tanpaPic} butir tanpa PIC`);
  if(r.rtl.tanpaTarget) L.push(`- ${r.rtl.tanpaTarget} butir tanpa tanggal target`);
  r.rtl.tema.slice(0,5).forEach(t => L.push(`- Tema berulang: ${t.label} — ${t.jml} butir di ${t.lokasi.length} lokasi`));
  L.push('');
  L.push('## Usulan learning agenda');
  if(!r.agenda.length) L.push('Tidak ada kesenjangan struktural yang cukup menonjol.');
  r.agenda.forEach((a, i) => {
    L.push(`${i+1}. **${a.q}**`);
    L.push(`   - Dasar: ${a.alasan}`);
    L.push(`   - Metode yang sesuai: ${a.metode}`);
  });
  L.push('');
  L.push('---');
  L.push('Laporan ini dihitung dengan aturan tetap: pencocokan kata kunci, penghitungan frekuensi, dan pemeriksaan kelengkapan. Mesin tidak memahami makna kalimat, sehingga dua catatan yang menggambarkan masalah sama dengan istilah berbeda tidak akan dikenali sebagai satu tema. Gunakan sebagai peta arah untuk membaca catatan aslinya, bukan sebagai kesimpulan evaluasi.');
  return L.join('\n');
}

/* ==========================================================
   Insight dari catatan lapangan — deterministik.

   Berbeda dari laporan terstruktur yang menyajikan seluruh hitungan,
   bagian ini memilih sinyal yang paling layak ditindaklanjuti dan
   memberinya tingkat perhatian. Setiap butir menyertakan buktinya.
   ========================================================== */

export type InsightLevel = 'kritis' | 'perhatian' | 'peluang' | 'info';
export interface Insight { lvl: InsightLevel; judul: string; teks: string; bukti?: string }

/* Frasa penanda tanda perubahan awal — dipakai pada aspek 2 (respons). */
export const CUE_PERUBAHAN = ['mulai','meningkat','bertambah','menerapkan','mempraktikkan','berkomitmen','bersedia',
  'menyusun','menganggarkan','mengalokasikan','menugaskan','menerbitkan','mengadopsi','melanjutkan',
  'meminta','menanyakan','tertarik','berinisiatif'];

export const LVL_ORDER: Record<InsightLevel, number> = { kritis:0, perhatian:1, peluang:2, info:3 };
export const LVL_PILL: Record<InsightLevel, string> = { kritis:'p-r', perhatian:'p-a', peluang:'p-g', info:'p-b' };
export const LVL_LABEL: Record<InsightLevel, string> = { kritis:'Perlu tindakan', perhatian:'Perlu perhatian', peluang:'Peluang', info:'Catatan metode' };

export function sinyalPerubahan(notes: Note[]) {
  const out: { kalimat: string; judul: string; lokasi: string; cue: string }[] = [];
  notes.forEach(n => {
    sentences(n.obs?.respons?.f).forEach(kal => {
      const l = kal.toLowerCase();
      const c = CUE_PERUBAHAN.filter(x => l.includes(x));
      if(c.length) out.push({ kalimat:kal, judul:n.judul, lokasi:n.kabkota, cue:c[0] });
    });
  });
  return out;
}

/* ---------- Insight untuk sekumpulan catatan ---------- */
export function insightsForSet(notes: Note[]): Insight[] {
  if(!notes.length) return [];
  const r = ruleAnalyze(notes);
  const n = notes.length;
  const out: Insight[] = [];
  const pct = (x: number) => Math.round((x / n) * 100);

  /* Pola lintas lokasi — kandidat isu tingkat program */
  r.tema.filter(t => t.jml >= 3 && t.lokasi.length >= 2).slice(0,2).forEach(t => out.push({
    lvl:'perhatian',
    judul:`${t.label} muncul di banyak lokasi`,
    teks:`Terdeteksi pada ${t.jml} dari ${n} catatan, tersebar di ${t.lokasi.length} kabupaten/kota (${t.lokasi.slice(0,3).join(', ')}${t.lokasi.length>3?', dan lainnya':''}). Sebaran seluas ini menandakan penanganannya berada di tingkat program, bukan di masing-masing lokasi.`,
    bukti:`Kata kunci yang cocok: ${t.kata.join(', ')}`
  }));

  /* Hambatan yang berada dalam kendali program */
  const dalam = r.hambat.filter(x => x.kendali);
  if(dalam.length >= 2) out.push({
    lvl:'perhatian',
    judul:`${dalam.length} hambatan berada dalam kendali program`,
    teks:`Kalimat dengan frasa penanda hambatan muncul pada aspek pelaksanaan dan respons — aspek yang dapat diperbaiki lewat keputusan program, bukan lewat kondisi eksternal.`,
    bukti:`Contoh: “${clip(dalam[0].kalimat, 150)}” (${dalam[0].judul}, ${dalam[0].lokasi || 'lokasi tidak dicatat'})`
  });

  /* Tindak lanjut yang macet */
  if(r.rtl.telat) out.push({
    lvl: r.rtl.telat >= 3 ? 'kritis' : 'perhatian',
    judul:`${r.rtl.telat} tindak lanjut melewati tenggat`,
    teks:`Dari ${r.rtl.total} butir tindak lanjut, ${r.rtl.terbuka} belum selesai dan ${r.rtl.telat} sudah lewat tanggal targetnya. Komitmen yang menumpuk tanpa penyelesaian menurunkan nilai kunjungan berikutnya di mata mitra.`,
    bukti: r.rtl.tanpaPic ? `${r.rtl.tanpaPic} butir juga belum memiliki PIC.` : ''
  });

  /* Tindak lanjut berulang pada tema yang sama */
  if(r.rtl.tema.length && r.rtl.tema[0].jml >= 2 && r.rtl.tema[0].lokasi.length >= 2) out.push({
    lvl:'perhatian',
    judul:`Tindak lanjut berulang pada ${r.rtl.tema[0].label.toLowerCase()}`,
    teks:`${r.rtl.tema[0].jml} butir tindak lanjut menyentuh tema yang sama di ${r.rtl.tema[0].lokasi.length} lokasi. Pengulangan seperti ini biasanya menandakan penyebabnya tidak berada di lokasi, sehingga perbaikan per lokasi akan terus terulang.`,
    bukti:''
  });

  /* Sinyal perubahan awal */
  const sp = sinyalPerubahan(notes);
  if(sp.length) out.push({
    lvl:'peluang',
    judul:`${sp.length} sinyal perubahan awal terekam`,
    teks:`Aspek respons memuat kalimat dengan penanda perubahan seperti “mulai”, “bersedia”, atau “menganggarkan”. Ini tanda awal, bukan bukti outcome — perlu dikonfirmasi pada kunjungan berikutnya sebelum dilaporkan sebagai capaian.`,
    bukti:`Contoh: “${clip(sp[0].kalimat, 150)}” (${sp[0].judul}, ${sp[0].lokasi || 'lokasi tidak dicatat'})`
  });

  /* Pendorong yang dapat dimanfaatkan */
  if(r.dorong.length) out.push({
    lvl:'peluang',
    judul:`${r.dorong.length} faktor pendorong dapat dimanfaatkan`,
    teks:`Terdapat kalimat yang menunjukkan dukungan aktif dari mitra, sekolah, atau pemerintah daerah. Dukungan yang sudah ada biasanya lebih murah diperkuat daripada membangun dukungan baru.`,
    bukti:`Contoh: “${clip(r.dorong[0].kalimat, 150)}” (${r.dorong[0].judul}, ${r.dorong[0].lokasi || 'lokasi tidak dicatat'})`
  });

  /* Batas bukti yang memengaruhi cara membaca seluruh insight di atas */
  if(r.bukti.sumberTunggal / n > 0.3) out.push({
    lvl:'info',
    judul:`${r.bukti.sumberTunggal} dari ${n} catatan bersumber tunggal`,
    teks:`Sebanyak ${pct(r.bukti.sumberTunggal)}% catatan hanya memuat satu narasumber atau tidak mencantumkannya. Seluruh pola di atas perlu dibaca sebagai indikatif sampai ditriangulasi.`,
    bukti:''
  });
  if(r.cakupan.programSatuLokasi.length) out.push({
    lvl:'info',
    judul:`${r.cakupan.programSatuLokasi.length} program hanya terwakili satu lokasi`,
    teks:`Program ${r.cakupan.programSatuLokasi.slice(0,4).join(', ')}${r.cakupan.programSatuLokasi.length>4?', dan lainnya':''} belum punya pembanding antarlokasi dalam kumpulan ini, sehingga temuannya tidak dapat digeneralisasi ke tingkat program.`,
    bukti:''
  });
  if(r.bukti.lemah) out.push({
    lvl: r.bukti.lemah / n > 0.5 ? 'perhatian' : 'info',
    judul:`${r.bukti.lemah} catatan berskor kualitas di bawah 60`,
    teks:`Catatan dengan skor rendah biasanya kekurangan angka, narasumber, atau interpretasi. Memperbaikinya lebih dulu akan menaikkan kualitas seluruh analisis berikutnya.`,
    bukti:''
  });

  return out.sort((a,b) => LVL_ORDER[a.lvl] - LVL_ORDER[b.lvl]);
}

/* ---------- Insight untuk satu catatan ---------- */
export function insightsForNote(note: Note): Insight[] {
  const r = ruleAnalyze([note]);
  const s = scoreNote(note);
  const out: Insight[] = [];

  const tema = r.tema.slice(0,3);
  if(tema.length) out.push({
    lvl:'info',
    judul:`Isu yang tersentuh: ${tema.map(t => t.label.toLowerCase()).join(', ')}`,
    teks:`Penandaan ini memudahkan mencari catatan lain dengan isu serupa lewat menu Analisis.`,
    bukti:`Kata kunci: ${tema.flatMap(t => t.kata).slice(0,8).join(', ')}`
  });

  const dalam = r.hambat.filter(x => x.kendali), luar = r.hambat.filter(x => !x.kendali);
  if(dalam.length) out.push({
    lvl:'perhatian',
    judul:`${dalam.length} hambatan dalam kendali program`,
    teks:'Muncul pada aspek pelaksanaan atau respons, sehingga dapat ditangani lewat keputusan program.',
    bukti: dalam.slice(0,2).map(x => `“${clip(x.kalimat, 150)}”`).join('<br>')
  });
  if(luar.length) out.push({
    lvl:'info',
    judul:`${luar.length} hambatan bersifat kontekstual`,
    teks:'Tercatat pada aspek konteks — di luar kendali langsung program, tetapi perlu masuk daftar risiko operasional.',
    bukti: luar.slice(0,2).map(x => `“${clip(x.kalimat, 150)}”`).join('<br>')
  });

  const sp = sinyalPerubahan([note]);
  if(sp.length) out.push({
    lvl:'peluang',
    judul:`${sp.length} sinyal perubahan awal`,
    teks:'Terekam pada aspek respons. Perlakukan sebagai tanda awal yang harus dikonfirmasi pada kunjungan berikutnya, bukan sebagai capaian outcome.',
    bukti: sp.slice(0,2).map(x => `“${clip(x.kalimat, 150)}”`).join('<br>')
  });
  if(r.dorong.length) out.push({
    lvl:'peluang',
    judul:`${r.dorong.length} faktor pendorong tercatat`,
    teks:'Dukungan yang sudah ada biasanya lebih murah diperkuat daripada membangun dukungan baru.',
    bukti: r.dorong.slice(0,2).map(x => `“${clip(x.kalimat, 150)}”`).join('<br>')
  });

  const rtlBuka = (note.rtl||[]).filter(x => x.status !== 'selesai');
  const hariIni = new Date().toISOString().slice(0,10);
  const rtlTelat = rtlBuka.filter(x => x.target && x.target < hariIni);
  if(rtlTelat.length) out.push({
    lvl:'kritis',
    judul:`${rtlTelat.length} tindak lanjut lewat tenggat`,
    teks:'Butir berikut sudah melewati tanggal target dan belum ditandai selesai.',
    bukti: rtlTelat.slice(0,3).map(x => `${x.aksi} — ${x.pic || 'tanpa PIC'}, target ${fmtDate(x.target)}`).join('<br>')
  });

  const kritisQA = s.flags.filter(f => f.lvl === 'e');
  if(kritisQA.length) out.push({
    lvl:'perhatian',
    judul:'Keandalan catatan ini terbatas',
    teks: kritisQA.map(f => f.title).join('; ') + '. Kesimpulan dari catatan ini sebaiknya diperlakukan sebagai indikatif.',
    bukti:''
  });

  return out.sort((a,b) => LVL_ORDER[a.lvl] - LVL_ORDER[b.lvl]);
}

