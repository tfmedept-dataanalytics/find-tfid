import { ASPEK } from './taxonomy';
import type { Note } from './types';

export const fmtDate = (d?: string | null) => {
  if (!d) return '—';
  const dt = new Date(d + 'T00:00:00');
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function workdaysBetween(a?: string | null, b?: string | null): number | null {
  if (!a || !b) return null;
  const d1 = new Date(a + 'T00:00:00'), d2 = new Date(b + 'T00:00:00');
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;
  if (d2 < d1) return -1;
  let n = 0; const cur = new Date(d1);
  while (cur < d2) { cur.setDate(cur.getDate() + 1); const w = cur.getDay(); if (w !== 0 && w !== 6) n++; }
  return n;
}

export const wordCount = (s?: string) => (String(s || '').trim().match(/\S+/g) || []).length;

export const deptLabel = (n: Note) => (n.deptUnit === 'Lainnya' ? n.deptLain || 'Lainnya' : n.deptUnit);
export const progLabel = (n: Note) => (n.program === 'Lainnya' ? n.programLain || 'Lainnya' : n.program);
export const jenisLabel = (n: Note) => (n.jenis === 'Lainnya' ? n.jenisLain || 'Kunjungan lain' : n.jenis);

export const faktaText = (n: Note) => ASPEK.map(a => n.obs?.[a.id]?.f || '').join(' ');

export function tally<T>(arr: T[], fn: (x: T) => string): { k: string; v: number }[] {
  const m = new Map<string, number>();
  arr.forEach(x => { const k = fn(x); if (!k) return; m.set(k, (m.get(k) || 0) + 1); });
  return Array.from(m, ([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
}

export function download(name: string, content: string, type = 'text/plain;charset=utf-8') {
  const b = new Blob([content], { type });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(u), 800);
}

export const todayISO = () => new Date().toISOString().slice(0, 10);
