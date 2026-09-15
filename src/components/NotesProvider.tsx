'use client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Note, Profile } from '@/lib/types';
import { can } from '@/lib/taxonomy';
import { toast } from './Toast';

interface Ctx {
  profile: Profile;
  notes: Note[];
  loading: boolean;
  reload: () => Promise<void>;
  saveNote: (n: Partial<Note> & { id?: string }) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<boolean>;
  patchRtlStatus: (noteId: string, index: number, status: string) => Promise<void>;
  ui: number;
  setUi: (v: number) => void;
  may: (k: string) => boolean;
  /** True bila ANTHROPIC_API_KEY terpasang di server. Ditentukan di layout, bukan di browser. */
  aiEnabled: boolean;
}

const NotesCtx = createContext<Ctx | null>(null);
export const useNotes = () => {
  const c = useContext(NotesCtx);
  if (!c) throw new Error('useNotes dipakai di luar NotesProvider');
  return c;
};

export function NotesProvider(
  { profile, aiEnabled, children }: { profile: Profile; aiEnabled: boolean; children: React.ReactNode }
) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [ui, setUiState] = useState(90);

  useEffect(() => {
    const saved = Number(localStorage.getItem('find_ui') || 90);
    setUiState(saved);
    document.documentElement.style.setProperty('--ui-scale', (saved / 100).toFixed(2));
  }, []);

  const setUi = (v: number) => {
    setUiState(v);
    localStorage.setItem('find_ui', String(v));
    document.documentElement.style.setProperty('--ui-scale', (v / 100).toFixed(2));
  };

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/notes', { cache: 'no-store' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Gagal memuat catatan.');
      setNotes(d.notes as Note[]);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Gagal memuat catatan.', 'err');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const saveNote: Ctx['saveNote'] = async (n) => {
    const isEdit = Boolean(n.id);
    const r = await fetch(isEdit ? `/api/notes/${n.id}` : '/api/notes', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n)
    });
    const d = await r.json();
    if (!r.ok) { toast(d.error || 'Catatan gagal disimpan.', 'err'); return null; }
    setNotes(prev => (isEdit ? prev.map(x => (x.id === d.note.id ? d.note : x)) : [d.note, ...prev]));
    return d.note as Note;
  };

  const deleteNote = async (id: string) => {
    const r = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { toast(d.error || 'Catatan gagal dihapus.', 'err'); return false; }
    setNotes(prev => prev.filter(x => x.id !== id));
    return true;
  };

  const patchRtlStatus = async (noteId: string, index: number, status: string) => {
    const n = notes.find(x => x.id === noteId);
    if (!n) return;
    const rtl = n.rtl.map((r, i) => (i === index ? { ...r, status: status as Note['rtl'][number]['status'] } : r));
    const saved = await saveNote({ ...n, rtl });
    if (saved) toast('Status tindak lanjut diperbarui.');
  };

  return (
    <NotesCtx.Provider value={{
      profile, notes, loading, reload, saveNote, deleteNote, patchRtlStatus,
      ui, setUi, may: (k: string) => can(profile.role, k), aiEnabled
    }}>
      {children}
    </NotesCtx.Provider>
  );
}
