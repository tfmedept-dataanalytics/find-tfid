/* Mesin penilaian kualitas — deterministik, tanpa AI.
   Rubrik terbuka: setiap poin dapat ditelusuri ke aturannya. */
import { ASPEK } from './taxonomy';
import { faktaText, wordCount, workdaysBetween } from './format';
import type { Note } from './types';

export const TAFSIR_MARK = ['sepertinya', 'tampaknya', 'kelihatannya', 'menurut saya', 'saya rasa',
  'mungkin', 'kemungkinan', 'diduga', 'agaknya', 'seharusnya', 'sebaiknya', 'perlu', 'kurang baik',
  'tidak baik', 'bagus', 'buruk', 'lemah', 'kuat', 'memuaskan', 'mengecewakan', 'cukup baik',
  'sangat baik', 'menandakan', 'menunjukkan bahwa', 'berarti', 'disebabkan oleh', 'karena itu',
  'sehingga dapat disimpulkan', 'terkesan', 'rupanya'];

export interface Dim { k: string; label: string; score: number; max: number; note: string }
export interface Flag { lvl: 'e' | 'w' | 'o'; title: string; text: string }
export interface Score { total: number; dims: Dim[]; flags: Flag[]; wd: number | null; kosong: string[] }

export function findTafsirInFakta(n: Note) {
  const hits: { aspek: string; kata: string }[] = [];
  ASPEK.forEach(a => {
    const t = (n.obs?.[a.id]?.f || '').toLowerCase();
    if (!t) return;
    TAFSIR_MARK.forEach(m => { if (t.includes(m)) hits.push({ aspek: a.t, kata: m }); });
  });
  return hits;
}

export function scoreNote(n: Note): Score {
  const dims: Dim[] = [], flags: Flag[] = [];

  /* D1 — Kelengkapan (25) */
  const wajib: [string, unknown][] = [
    ['Judul kegiatan', n.judul], ['Tanggal kegiatan', n.tglKegiatan], ['Lokasi', n.kabkota],
    ['Email TF', n.emailTF], ['Departemen', n.deptUnit], ['Program', n.program],
    ['Jenis kegiatan', n.jenis], ['Pihak yang ditemui', (n.pihak || []).length ? 'y' : ''],
    ['Tujuan kunjungan', n.tujuan], ['Alasan pemilihan lokasi', n.alasan], ['Ringkasan', n.ringkasan],
    ['Observasi aspek 1', n.obs?.pelaksanaan?.f], ['Observasi aspek 2', n.obs?.respons?.f],
    ['Observasi aspek 3', n.obs?.konteks?.f], ['Rencana tindak lanjut', (n.rtl || []).length ? 'y' : '']
  ];
  const kosong = wajib.filter(([, v]) => !String(v || '').trim()).map(([k]) => k);
  const d1 = Math.round(((wajib.length - kosong.length) / wajib.length) * 25);
  dims.push({ k: 'lengkap', label: 'Kelengkapan', score: d1, max: 25,
    note: kosong.length ? `${kosong.length} bagian belum terisi` : 'Semua bagian wajib terisi' });
  if (kosong.length) flags.push({ lvl: kosong.length > 4 ? 'e' : 'w', title: 'Bagian belum terisi', text: kosong.join(', ') + '.' });

  /* D2 — Spesifisitas bukti (20) */
  const ft = faktaText(n);
  const wc = wordCount(ft);
  const angka = (ft.match(/\b\d+([.,]\d+)?\b/g) || []).length;
  const kutipan = (ft.match(/["“”'‘’]/g) || []).length >= 2 ? 1 : 0;
  const waktu = /\b(pukul|jam|menit|hari|minggu|bulan|\d{1,2}[.:]\d{2})\b/i.test(ft) ? 1 : 0;
  let d2 = 0;
  d2 += wc >= 220 ? 8 : wc >= 120 ? 6 : wc >= 60 ? 4 : wc >= 20 ? 2 : 0;
  d2 += angka >= 8 ? 7 : angka >= 4 ? 5 : angka >= 1 ? 3 : 0;
  d2 += kutipan * 2; d2 += waktu * 3;
  d2 = Math.min(20, d2);
  dims.push({ k: 'spesifik', label: 'Spesifisitas bukti', score: d2, max: 20,
    note: `${wc} kata fakta · ${angka} angka${kutipan ? ' · ada kutipan' : ''}` });
  if (angka === 0 && wc > 0) flags.push({ lvl: 'w', title: 'Fakta tanpa angka',
    text: 'Kolom fakta tidak memuat satu pun angka. Tambahkan jumlah, durasi, atau proporsi agar temuan dapat diverifikasi dan dibandingkan antarkunjungan.' });

  /* D3 — Disiplin fakta vs interpretasi (20) */
  const hits = findTafsirInFakta(n);
  const isiF = ASPEK.filter(a => String(n.obs?.[a.id]?.f || '').trim()).length;
  const isiI = ASPEK.filter(a => String(n.obs?.[a.id]?.i || '').trim()).length;
  let d3: number;
  if (isiF === 0) d3 = 0;
  else {
    d3 = 20;
    d3 -= Math.min(10, hits.length * 2.5);
    d3 -= isiF - isiI > 0 ? Math.min(10, (isiF - isiI) * 4) : 0;
    d3 = Math.max(0, Math.round(d3));
    d3 = Math.round(d3 * (isiF / ASPEK.length));
  }
  dims.push({ k: 'disiplin', label: 'Disiplin fakta–interpretasi', score: d3, max: 20,
    note: isiF === 0 ? 'Kolom observasi masih kosong'
      : hits.length ? `${hits.length} penanda tafsir di kolom fakta`
      : isiF > isiI ? `${isiF - isiI} aspek tanpa interpretasi` : 'Pemisahan terjaga' });
  if (hits.length) flags.push({ lvl: 'w', title: 'Bahasa interpretatif di kolom fakta',
    text: hits.slice(0, 5).map(h => `“${h.kata}” pada aspek ${h.aspek.toLowerCase()}`).join('; ')
      + (hits.length > 5 ? `; dan ${hits.length - 5} lainnya` : '')
      + '. Pindahkan penilaian ke kolom interpretasi dan sisakan hanya yang dapat diverifikasi.' });
  if (isiF > isiI) flags.push({ lvl: 'w', title: 'Fakta tanpa interpretasi',
    text: `${isiF - isiI} aspek berisi fakta tetapi kolom interpretasinya kosong. Tanpa penafsiran, pembaca lain akan menyimpulkan sendiri dan kesimpulannya bisa berbeda.` });

  /* D4 — Triangulasi (15) */
  const pihak = n.pihak || [];
  const instansi = new Set(pihak.map(p => (p.instansi || '').toLowerCase().trim()).filter(Boolean));
  let d4 = 0;
  d4 += pihak.length >= 3 ? 8 : pihak.length === 2 ? 6 : pihak.length === 1 ? 3 : 0;
  d4 += instansi.size >= 3 ? 7 : instansi.size === 2 ? 5 : instansi.size === 1 ? 2 : 0;
  d4 = Math.min(15, d4);
  dims.push({ k: 'triangulasi', label: 'Triangulasi sumber', score: d4, max: 15,
    note: `${pihak.length} narasumber dari ${instansi.size} instansi` });
  if (pihak.length <= 1) flags.push({ lvl: pihak.length === 0 ? 'e' : 'w', title: 'Sumber tunggal',
    text: 'Temuan bersandar pada satu sumber atau tidak mencantumkan narasumber. Perlakukan kesimpulannya sebagai indikatif, bukan bukti.' });

  /* D5 — Ketepatan waktu (10) */
  const wd = workdaysBetween(n.tglKegiatan, n.tglSelesai);
  let d5 = 0, wnote = 'Tanggal belum lengkap';
  if (wd !== null && wd >= 0) {
    d5 = wd <= 3 ? 10 : wd <= 5 ? 7 : wd <= 10 ? 4 : 1;
    wnote = `${wd} hari kerja setelah kunjungan`;
  }
  dims.push({ k: 'waktu', label: 'Ketepatan waktu', score: d5, max: 10, note: wnote });
  if (wd !== null && wd > 3) flags.push({ lvl: 'w', title: 'Melewati target 3 hari kerja',
    text: `Catatan diselesaikan ${wd} hari kerja setelah kunjungan. Semakin jauh jaraknya, semakin besar risiko detail terlewat atau tergeser oleh ingatan.` });

  /* D6 — Aktionabilitas tindak lanjut (10) */
  const rtl = n.rtl || [];
  const rtlOk = rtl.filter(r => String(r.aksi || '').trim() && String(r.pic || '').trim() && String(r.target || '').trim()).length;
  const d6 = rtl.length === 0 ? 0 : Math.min(10, Math.round((rtlOk / rtl.length) * 7) + (rtl.length >= 2 ? 3 : 2));
  dims.push({ k: 'rtl', label: 'Aktionabilitas tindak lanjut', score: d6, max: 10,
    note: rtl.length ? `${rtlOk}/${rtl.length} lengkap (aksi, PIC, target)` : 'Belum ada rencana tindak lanjut' });
  if (rtl.length && rtlOk < rtl.length) flags.push({ lvl: 'w', title: 'Tindak lanjut tanpa penanggung jawab atau tenggat',
    text: `${rtl.length - rtlOk} butir tindak lanjut belum memiliki PIC atau tanggal target, sehingga sulit dilacak penyelesaiannya.` });

  const total = dims.reduce((s, d) => s + d.score, 0);
  return { total, dims, flags, wd, kosong };
}

export const scoreBand = (t: number) =>
  t >= 80 ? { l: 'Kuat', c: 'p-g', m: '' }
  : t >= 60 ? { l: 'Memadai', c: 'p-b', m: '' }
  : t >= 40 ? { l: 'Perlu perbaikan', c: 'p-a', m: 'a' }
  : { l: 'Lemah', c: 'p-r', m: 'r' };
