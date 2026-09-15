'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ROLES } from '@/lib/taxonomy';
import { useNotes } from './NotesProvider';
import { createClient } from '@/lib/supabase/client';
import { toast } from './Toast';

/** Akun saya — ganti kata sandi Supabase Auth dan atur skala antarmuka. Tersedia untuk semua peran. */
export function AccountModal({ onClose }: { onClose: () => void }) {
  const { profile, ui, setUi } = useNotes();
  const [np, setNp] = useState('');
  const [np2, setNp2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [siap, setSiap] = useState(false);

  // Modal dipasang langsung ke <body> agar tidak terkurung di dalam sidebar yang sticky.
  useEffect(() => {
    setSiap(true);
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  const simpan = async () => {
    setErr('');
    if (np.length < 8) { setErr('Kata sandi baru minimal 8 karakter.'); return; }
    if (np !== np2) { setErr('Ulangan kata sandi tidak sama.'); return; }
    setBusy(true);
    const { error } = await createClient().auth.updateUser({ password: np });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setNp(''); setNp2('');
    toast('Kata sandi diperbarui.');
    onClose();
  };

  if (!siap) return null;

  return createPortal(
    <div className="ovl" id="modalWrap" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: '28rem' }}>
        <div className="modal-h">
          <h3>Akun saya</h3>
          <button className="x" onClick={onClose} aria-label="Tutup">✕</button>
        </div>
        <div className="modal-b">
          <div className="small mb">
            <b>{profile.name}</b>
            <div className="tiny muted">{profile.email} · {ROLES[profile.role].n}</div>
          </div>

          <div className="f">
            <label htmlFor="acNew">Kata sandi baru</label>
            <div className="help">Minimal 8 karakter. Perubahan berlaku langsung di Supabase Auth.</div>
            <input type="password" id="acNew" autoComplete="new-password" value={np} onChange={e => setNp(e.target.value)} />
          </div>
          <div className="f">
            <label htmlFor="acNew2">Ulangi kata sandi baru</label>
            <input type="password" id="acNew2" autoComplete="new-password" value={np2} onChange={e => setNp2(e.target.value)} />
          </div>
          <div className="tiny" style={{ color: 'var(--red)', minHeight: '1rem' }}>{err}</div>
          <button className="btn btn-p" onClick={simpan} disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan kata sandi'}
          </button>

          <div className="divider" />
          <div className="f" style={{ marginBottom: 0 }}>
            <label htmlFor="acScale">Skala antarmuka</label>
            <div className="help">Standar aplikasi ini 90%. Turunkan untuk menampilkan lebih banyak data per layar.</div>
            <select id="acScale" value={ui} onChange={e => setUi(Number(e.target.value))}>
              {[80, 90, 100, 110, 125].map(v => <option key={v} value={v}>{v}%</option>)}
            </select>
          </div>
        </div>
        <div className="modal-f"><button className="btn btn-p" onClick={onClose}>Tutup</button></div>
      </div>
    </div>,
    document.body
  );
}
