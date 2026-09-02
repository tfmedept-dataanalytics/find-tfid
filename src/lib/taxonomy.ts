/* Taksonomi diambil langsung dari Catatan Lapangan TF Template v2 */

export const DEPT: Record<string, string[]> = {
  Nasional: ['LE', 'LDS', 'PA', 'SPP', 'MLE', 'HRD', 'FATLC'],
  Regional: ['SUU', 'FTU', 'RL', 'Communication', 'FATLC']
};

export const PROGRAM = ['ALPHA', 'SNAP-ON', 'PASTI', 'RAS', 'Stunting 1.0', 'Stunting 2.0', 'MDTF',
  'SATU SEHAT', 'MBG', 'SPRING', 'PINTAR', 'DDSL', 'Numeracy Parent', 'Numeracy Teacher',
  'PPG-Teaching Practicum', 'FAASTER-Structured Pedagogy',
  'FAASTER-DD Affirmative Action with Digital Assessment', 'PANDAI', 'APS', 'TELADAN',
  'Fellowship', 'GEA', 'Advocacy Goal 1', 'Advocacy Goal 2', 'CSD', 'KM', 'HR', 'Communication'];

export const JENIS = ['Supervisi pengumpulan data', 'Pelaksanaan program (pelatihan/lokakarya/layanan)',
  'Bantuan teknis & advokasi kebijakan', 'Monitoring & evaluasi kegiatan/program',
  'Koordinasi dengan mitra/stakeholder', 'Konsultasi & penggalian kebutuhan lapangan',
  'Pendampingan/penguatan kapasitas mitra atau penerima manfaat',
  'Verifikasi/validasi data dan temuan lapangan', 'Asesmen/survei lapangan',
  'Dokumentasi kegiatan dan kondisi lapangan', 'Rapat/koordinasi internal tim',
  'Kunjungan untuk tindak lanjut/rekomendasi kegiatan'];

export const ASPEK = [
  { id: 'pelaksanaan', n: 1, t: 'Pelaksanaan kegiatan',
    q: 'Apa yang benar-benar terjadi? Sejauh mana sesuai dengan rencana, modul, atau standar? Siapa yang hadir dan bagaimana kualitas penyelenggaraannya?' },
  { id: 'respons', n: 2, t: 'Respons pemangku kepentingan/penerima manfaat & tanda perubahan awal',
    q: 'Bagaimana peserta, penerima manfaat, mitra, atau pemerintah merespons? Apa umpan balik mereka? Adakah tanda awal perubahan pengetahuan, praktik, komitmen, atau layanan?' },
  { id: 'konteks', n: 3, t: 'Konteks & faktor yang mempengaruhi',
    q: 'Apa yang terjadi di luar kegiatan yang mendukung atau menghambat? Kebijakan, anggaran, aktor lain, kapasitas, dinamika lokal, risiko.' }
] as const;

export const ROLES = {
  field: { n: 'Field Officer', d: 'Input dan kelola catatan sendiri' },
  mle: { n: 'MLE Analyst', d: 'Akses semua catatan, analisis AI, dan penilaian kualitas' },
  admin: { n: 'Administrator', d: 'Akses penuh termasuk pengaturan, hapus, dan manajemen pengguna' }
} as const;

const CAN: Record<string, string[]> = {
  viewAll: ['mle', 'admin'],
  analyze: ['mle', 'admin'],
  quality: ['mle', 'admin'],
  deleteAny: ['admin'],
  settings: ['admin'],
  users: ['admin'],
  exportAll: ['mle', 'admin']
};

export const can = (role: string | undefined, key: string) => (CAN[key] || []).includes(role || '');
