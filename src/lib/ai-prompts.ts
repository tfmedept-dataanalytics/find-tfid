import { ASPEK } from './taxonomy';
import { deptLabel, progLabel, jenisLabel } from './format';
import { scoreNote, scoreBand } from './scoring';
import type { Note } from './types';

export const SYS_MNE = `Anda adalah analis Monitoring, Evaluation & Learning (MEL) yang berpengalaman menganalisis catatan lapangan program pembangunan sosial di Indonesia.

Aturan yang wajib Anda patuhi:
1. Pisahkan FAKTA dari INTERPRETASI. Saat menyatakan sesuatu sebagai temuan, sebutkan bukti spesifik dari catatan yang mendasarinya.
2. Jangan pernah mengarang angka, nama, lokasi, atau kejadian yang tidak ada di catatan. Jika data tidak tersedia, tulis secara eksplisit bahwa data tidak tersedia.
3. Nyatakan kekuatan bukti secara jujur. Bedakan antara (a) terverifikasi dari beberapa sumber, (b) laporan satu sumber, (c) dugaan pencatat. Jika bukti lemah, katakan lemah.
4. Hindari klaim kabur seperti "secara umum baik" atau "cukup efektif". Gunakan pernyataan yang dapat diuji.
5. Bedakan korelasi dari sebab-akibat. Catatan lapangan tunggal tidak membuktikan atribusi.
6. Rekomendasi harus konkret: apa yang dilakukan, oleh siapa, kapan, dan indikator apa yang menandakan berhasil.
7. Tulis dalam Bahasa Indonesia profesional. Pertahankan istilah teknis M&E dalam bahasa Inggris (misalnya output, outcome, learning agenda, theory of change, triangulation).
8. Gunakan format markdown: judul dengan ##, poin dengan -, penekanan dengan **. Jangan gunakan tabel. Ringkas dan padat.`;

export function noteToText(n: Note, i: number) {
  const s = scoreNote(n);
  return `--- CATATAN ${i + 1} (id ${n.id}) ---
Judul: ${n.judul}
Tanggal kegiatan: ${n.tglKegiatan} | Catatan selesai: ${n.tglSelesai || '-'} (${s.wd !== null && s.wd >= 0 ? s.wd + ' hari kerja' : 'tidak diketahui'})
Lokasi: ${[n.kabkota, n.kecdesa, n.institusi].filter(Boolean).join(', ')}
Program: ${progLabel(n)} | Departemen: ${n.deptLevel} ${deptLabel(n)} | Jenis: ${jenisLabel(n)}
Narasumber: ${(n.pihak || []).map(p => `${p.nama} (${p.jabatan}, ${p.instansi})`).join('; ') || 'tidak dicatat'}
Tujuan kunjungan: ${n.tujuan || '-'}
Alasan pemilihan lokasi: ${n.alasan || '-'}
Ringkasan: ${n.ringkasan || '-'}
${ASPEK.map(a => `[Aspek ${a.n}: ${a.t}]
  FAKTA: ${n.obs?.[a.id]?.f || '(kosong)'}
  INTERPRETASI PENCATAT: ${n.obs?.[a.id]?.i || '(kosong)'}`).join('\n')}
Rencana tindak lanjut: ${(n.rtl || []).map(r => `${r.aksi} [PIC ${r.pic || '-'}, target ${r.target || '-'}, status ${r.status}]`).join(' | ') || 'tidak ada'}
Skor kualitas otomatis: ${s.total}/100 (${scoreBand(s.total).l}); catatan kualitas: ${s.flags.map(f => f.title).join('; ') || 'tidak ada'}`;
}

export function promptOne(n: Note) {
  return `Analisis satu catatan lapangan berikut dan hasilkan insight awal untuk keperluan evaluasi.

${noteToText(n, 0)}

Hasilkan keluaran dengan struktur berikut, tanpa pengantar tambahan:

## Temuan utama
Maksimal 4 poin. Setiap poin sebutkan buktinya dari catatan.

## Kekuatan bukti
Nilai seberapa kuat dasar bukti catatan ini: jumlah dan keragaman sumber, ada tidaknya data terukur, dan apa yang masih bersandar pada satu sumber.

## Interpretasi yang belum cukup didukung
Tunjukkan pernyataan interpretasi pencatat yang melampaui fakta yang tersedia. Jika tidak ada, tulis "tidak ditemukan".

## Risiko dan implikasi program
Maksimal 3 poin, dengan tingkat urgensi (tinggi/sedang/rendah).

## Rekomendasi
Maksimal 4 butir. Format: aksi — pihak yang disarankan — kapan — tanda keberhasilan.

## Pertanyaan untuk learning agenda
2-3 pertanyaan yang belum terjawab oleh catatan ini dan layak diselidiki lebih lanjut.

## Data yang perlu dilengkapi
Sebutkan bukti atau data spesifik yang jika ditambahkan akan paling meningkatkan keandalan kesimpulan.`;
}

export function promptMany(notes: Note[], ctx: string) {
  return `Lakukan sintesis lintas catatan lapangan untuk keperluan evaluasi program dan pembelajaran organisasi.

KONTEKS SELEKSI: ${ctx}
JUMLAH CATATAN: ${notes.length}

${notes.map((n, i) => noteToText(n, i)).join('\n\n')}

Hasilkan keluaran dengan struktur berikut, tanpa pengantar tambahan:

## Gambaran umum
2-3 kalimat: apa yang dicakup kumpulan catatan ini dan apa yang tidak dicakup.

## Tema berulang
Maksimal 5 tema. Untuk setiap tema sebutkan berapa catatan yang mendukungnya dan dari lokasi/program mana. Tema yang hanya muncul di satu catatan harus ditandai sebagai indikatif, bukan pola.

## Pola hambatan dan pendorong
Pisahkan faktor yang menghambat dan yang mendukung. Bedakan faktor yang berada dalam kendali program dari faktor kontekstual.

## Perbedaan dan kontradiksi antarlokasi
Tunjukkan di mana catatan saling bertentangan atau menunjukkan hasil yang berbeda, dan kemungkinan penjelasannya.

## Sinyal awal perubahan
Tanda perubahan pengetahuan, praktik, komitmen, atau layanan yang terekam. Nyatakan dengan jelas bahwa ini sinyal awal, bukan bukti outcome.

## Kekuatan dan keterbatasan bukti
Nilai keandalan sintesis ini: keterwakilan lokasi, kedalaman bukti, sumber bias yang mungkin (misalnya purposive site selection, courtesy bias), dan kesimpulan apa yang TIDAK boleh ditarik dari data ini.

## Rekomendasi
Pisahkan menjadi "Perlu tindakan segera" dan "Untuk siklus perencanaan berikutnya". Setiap butir: aksi — pihak — tanda keberhasilan.

## Learning agenda
3-4 pertanyaan evaluatif prioritas beserta metode pengumpulan data yang sesuai untuk menjawabnya.`;
}
