import type { Note, Obs, Pihak, Rtl, AiInsight } from './types';

const EMPTY_OBS: Obs = { pelaksanaan: { f: '', i: '' }, respons: { f: '', i: '' }, konteks: { f: '', i: '' } };

const d = (v: string | null | undefined) => (v ? String(v).slice(0, 10) : '');

/** Baris Postgres (snake_case) -> bentuk yang dipakai UI, sama persis dengan versi HTML. */
export function toNote(r: Record<string, any>): Note {
  return {
    id: r.id,
    judul: r.judul ?? '',
    tglKegiatan: d(r.tgl_kegiatan),
    tglSelesai: d(r.tgl_selesai),
    kabkota: r.kabkota ?? '',
    kecdesa: r.kecdesa ?? '',
    institusi: r.institusi ?? '',
    emailTF: r.email_tf ?? '',
    deptLevel: r.dept_level ?? 'Nasional',
    deptUnit: r.dept_unit ?? '',
    deptLain: r.dept_lain ?? '',
    program: r.program ?? '',
    programLain: r.program_lain ?? '',
    jenis: r.jenis ?? '',
    jenisLain: r.jenis_lain ?? '',
    pihak: (r.pihak as Pihak[]) ?? [],
    tujuan: r.tujuan ?? '',
    alasan: r.alasan ?? '',
    ringkasan: r.ringkasan ?? '',
    obs: { ...EMPTY_OBS, ...((r.obs as Obs) ?? {}) },
    rtl: (r.rtl as Rtl[]) ?? [],
    ai: (r.ai as AiInsight | null) ?? null,
    status: r.status === 'submitted' ? 'submitted' : 'draft',
    authorId: r.author_id ?? '',
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : ''
  };
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const dt = (v: unknown) => { const s = str(v); return s ? s.slice(0, 10) : null; };

/** Payload dari UI -> kolom Postgres. Field yang tidak dikenal diabaikan. */
export function fromPayload(b: Record<string, any>) {
  return {
    judul: str(b.judul),
    tgl_kegiatan: dt(b.tglKegiatan),
    tgl_selesai: dt(b.tglSelesai),
    kabkota: str(b.kabkota),
    kecdesa: str(b.kecdesa),
    institusi: str(b.institusi),
    email_tf: str(b.emailTF),
    dept_level: str(b.deptLevel) || 'Nasional',
    dept_unit: str(b.deptUnit),
    dept_lain: str(b.deptLain),
    program: str(b.program),
    program_lain: str(b.programLain),
    jenis: str(b.jenis),
    jenis_lain: str(b.jenisLain),
    pihak: Array.isArray(b.pihak) ? b.pihak : [],
    tujuan: str(b.tujuan),
    alasan: str(b.alasan),
    ringkasan: str(b.ringkasan),
    obs: b.obs && typeof b.obs === 'object' ? b.obs : EMPTY_OBS,
    rtl: Array.isArray(b.rtl) ? b.rtl : [],
    status: b.status === 'submitted' ? 'submitted' : 'draft'
  };
}
