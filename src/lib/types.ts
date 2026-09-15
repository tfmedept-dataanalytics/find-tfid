export type Role = 'field' | 'mle' | 'admin';

export interface Pihak { nama: string; jabatan: string; instansi: string }
export interface Rtl { aksi: string; pic: string; target: string; status: 'terbuka' | 'berjalan' | 'selesai' }
export interface ObsCell { f: string; i: string }
export interface Obs { pelaksanaan: ObsCell; respons: ObsCell; konteks: ObsCell; [k: string]: ObsCell }
export interface AiInsight { text: string; at: string; scope: 'single' | 'many' }

export interface Note {
  id: string;
  judul: string;
  tglKegiatan: string;   // YYYY-MM-DD
  tglSelesai: string;
  kabkota: string;
  kecdesa: string;
  institusi: string;
  emailTF: string;
  deptLevel: string;
  deptUnit: string;
  deptLain: string;
  program: string;
  programLain: string;
  jenis: string;
  jenisLain: string;
  pihak: Pihak[];
  tujuan: string;
  alasan: string;
  ringkasan: string;
  obs: Obs;
  rtl: Rtl[];
  ai: AiInsight | null;
  status: 'draft' | 'submitted';
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile { id: string; email: string; name: string; role: Role }
