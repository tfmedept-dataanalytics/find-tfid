import { ASPEK } from './taxonomy';
import { ruleAnalyze } from './rules';
import { deptLabel, progLabel, jenisLabel } from './format';
import { scoreNote, scoreBand } from './scoring';
import type { Note } from './types';

export const SYS_MNE = `Anda analis Monitoring, Evaluation & Learning (MEL) senior yang membaca catatan lapangan program pembangunan sosial di Indonesia.

Anda bekerja BERDAMPINGAN dengan mesin analisis berbasis aturan yang sudah menghitung: jumlah catatan, sebaran lokasi, frekuensi tema lewat pencocokan kata kunci, kalimat berpenanda hambatan/pendorong, statistik tindak lanjut, dan skor kualitas. Hasil hitungan itu diberikan kepada Anda sebagai konteks.

TUGAS ANDA ADALAH MENGERJAKAN YANG TIDAK BISA DILAKUKAN MESIN ATURAN:
1. Menyatukan masalah yang sama tetapi ditulis dengan istilah berbeda antarcatatan, dan menyebut secara eksplisit istilah mana yang Anda anggap merujuk hal yang sama.
2. Menemukan pertentangan antarcatatan: dua lokasi melaporkan hal berlawanan pada kondisi serupa.
3. Menguji masuk akal tidaknya penjelasan sebab-akibat yang ditulis pencatat di kolom Interpretasi, dan menyebut penjelasan alternatif yang sama masuk akalnya.
4. Membaca rangkaian peristiwa antarwaktu dan antarlokasi yang tidak terlihat dari hitungan frekuensi.

ATURAN WAJIB:
- SETIAP pernyataan temuan harus menyebut sumbernya: judul catatan dan lokasi. Tanpa sumber, jangan tulis.
- Sertakan potongan kalimat asli dari catatan sebagai bukti, maksimal 15 kata, dalam tanda kutip.
- Gunakan angka yang benar-benar ada di catatan. Dilarang mengarang angka, nama, lokasi, atau kejadian.
- JANGAN mengulang hitungan yang sudah diberikan di blok RINGKASAN TERHITUNG. Itu sudah tampil di layar pengguna. Rujuk seperlunya, lalu tambahkan yang baru.
- Nyatakan kekuatan bukti per temuan: terverifikasi beberapa sumber / laporan satu sumber / dugaan pencatat.
- Bedakan korelasi dari sebab-akibat. Catatan lapangan tidak membuktikan atribusi.
- Bila data tidak cukup untuk satu bagian, tulis "Data tidak cukup untuk menilai ini" dan sebutkan data apa yang kurang. Jangan mengisi dengan kalimat umum.

DILARANG MENULIS kalimat kosong seperti: "perlu koordinasi lebih lanjut", "perlu monitoring berkelanjutan", "secara umum berjalan baik", "diperlukan komitmen semua pihak", "perlu peningkatan kapasitas", "hal ini menunjukkan pentingnya". Bila sebuah kalimat tetap benar walau catatannya diganti catatan lain, hapus kalimat itu.

Tulis dalam Bahasa Indonesia profesional. Pertahankan istilah teknis M&E dalam bahasa Inggris (output, outcome, learning agenda, theory of change, triangulation). Format markdown: judul dengan ##, poin dengan -, penekanan dengan **. Tanpa tabel. Padat, tanpa pengantar.`;

/* Ringkasan hasil mesin aturan, dikirim sebagai konteks agar model tidak
   mengulang hitungan dan tidak menebak angka. */
export function ruleContext(notes: Note[]) {
  const r = ruleAnalyze(notes);
  const L: string[] = [];
  L.push('RINGKASAN TERHITUNG (hasil mesin aturan, sudah tampil di layar pengguna — jangan diulang):');
  L.push(`- ${notes.length} catatan; ${r.cakupan.lokasi.length} kabupaten/kota; ${r.cakupan.perProgram.length} program; ${r.cakupan.instansi} instansi narasumber`);
  L.push(`- Rata-rata skor kualitas ${r.bukti.avg}/100; ${r.bukti.lemah} catatan di bawah 60; ${r.bukti.sumberTunggal} catatan bersumber tunggal`);
  if(r.cakupan.programSatuLokasi.length)
    L.push(`- Program hanya satu lokasi: ${r.cakupan.programSatuLokasi.join(', ')}`);
  L.push(`- Tema terdeteksi (kata kunci, ${'catatan'}/lokasi): ${r.tema.slice(0,8).map(t => `${t.label} ${t.jml}/${t.lokasi.length}`).join('; ') || 'tidak ada'}`);
  L.push(`- Tindak lanjut: ${r.rtl.total} butir, ${r.rtl.terbuka} terbuka, ${r.rtl.telat} lewat tenggat`);
  L.push(`- Kalimat berpenanda hambatan: ${r.hambat.length}; berpenanda pendorong: ${r.dorong.length}`);
  L.push(`- Kolom fakta kosong per aspek: ${ASPEK.map(a => `${a.t} ${r.bukti.aspekKosong[a.id]}/${notes.length}`).join('; ')}`);
  return L.join('\n');
}

export function promptOne(n: Note) {
  return `Analisis SATU catatan lapangan berikut. Hasilkan insight yang spesifik untuk catatan ini, bukan pernyataan yang bisa dipakai untuk catatan mana pun.

${ruleContext([n])}

${noteToText(n,0)}

Keluaran dengan struktur berikut, tanpa pengantar:

## Temuan utama
Maksimal 4 poin. Tiap poin: apa yang terjadi, buktinya (potongan kalimat asli maksimal 15 kata), dan kekuatan buktinya.

## Uji penjelasan pencatat
Ambil setiap penjelasan sebab-akibat yang ditulis pencatat di kolom Interpretasi. Untuk masing-masing: sebutkan penjelasannya, nilai apakah fakta di kolom sebelah cukup mendukungnya, dan sebutkan minimal satu penjelasan alternatif yang sama masuk akalnya. Bila tidak ada penjelasan sebab-akibat, tulis "Pencatat tidak mengajukan penjelasan sebab-akibat".

## Yang hilang dari catatan ini
Informasi spesifik yang seharusnya ada untuk menopang kesimpulan, tetapi tidak dicatat. Sebutkan konkret, misalnya "jumlah peserta yang diundang tidak dicatat sehingga tingkat kehadiran tidak dapat dihitung".

## Risiko dan implikasi
Maksimal 3 poin, masing-masing dengan tingkat urgensi (tinggi/sedang/rendah) dan alasan urgensinya.

## Rekomendasi
Maksimal 4 butir. Format tiap butir: aksi — pihak yang disarankan — kapan — tanda keberhasilan yang dapat diamati.

## Pertanyaan untuk kunjungan berikutnya
2-3 pertanyaan spesifik yang muncul dari catatan ini dan dapat dijawab pada kunjungan berikutnya ke lokasi yang sama.`;
}

export function promptMany(notes: Note[], ctx: string) {
  return `Sintesis lintas catatan lapangan untuk evaluasi program dan pembelajaran organisasi.

CAKUPAN SELEKSI: ${ctx}

${ruleContext(notes)}

${notes.map((n,i)=>noteToText(n,i)).join('\n\n')}

Keluaran dengan struktur berikut, tanpa pengantar:

## Yang tidak terlihat dari hitungan
Bagian terpenting. Sebutkan masalah yang muncul di beberapa catatan dengan istilah BERBEDA sehingga tidak tergabung oleh pencocokan kata kunci. Untuk tiap butir: istilah mana di catatan mana yang Anda anggap merujuk hal yang sama, dan mengapa. Bila tidak menemukan, tulis "Tidak ditemukan" — jangan dipaksakan.

## Pertentangan antarcatatan
Lokasi atau catatan yang melaporkan hal berlawanan pada kondisi serupa, beserta kemungkinan penjelasannya. Bila tidak ada, tulis "Tidak ditemukan".

## Rangkaian peristiwa
Pola antarwaktu atau antarlokasi: sesuatu yang terjadi lebih dulu di satu lokasi lalu muncul di lokasi lain, atau memburuk/membaik sepanjang periode. Sebutkan catatan dan tanggalnya.

## Uji penjelasan pencatat
Penjelasan sebab-akibat yang ditulis pencatat dan apakah bukti lintas catatan mendukung atau melemahkannya. Sertakan penjelasan alternatif.

## Sinyal awal perubahan
Tanda perubahan pengetahuan, praktik, komitmen, atau layanan. Nyatakan tegas bahwa ini sinyal awal, bukan bukti outcome, dan sebutkan apa yang perlu diamati untuk menguatkannya.

## Kesimpulan yang TIDAK boleh ditarik
Daftar klaim yang mungkin tergoda dibuat orang dari kumpulan ini tetapi tidak didukung datanya, beserta alasan spesifiknya (keterwakilan, sumber tunggal, purposive site selection, courtesy bias).

## Rekomendasi
Pisahkan "Perlu tindakan segera" dan "Untuk siklus perencanaan berikutnya". Tiap butir: aksi — pihak — tanda keberhasilan yang dapat diamati.

## Learning agenda
3-4 pertanyaan evaluatif prioritas yang BELUM terjawab kumpulan ini, masing-masing dengan metode pengumpulan data yang sesuai dan alasan metode itu dipilih.`;
}


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

