'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr('Masukkan alamat email yang valid.'); return; }
    if (!pass) { setErr('Masukkan kata sandi.'); return; }
    setBusy(true);
    const { error } = await createClient().auth.signInWithPassword({ email, password: pass });
    setBusy(false);
    if (error) {
      setErr(error.message === 'Invalid login credentials'
        ? 'Email atau kata sandi tidak cocok.'
        : `Gagal masuk: ${error.message}`);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div className="login-box">
      <h2>Masuk ke FIND</h2>
      <p className="p">Gunakan akun yang didaftarkan oleh System Administrator.</p>

      <div className="fld">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} autoComplete="username"
          onChange={e => setEmail(e.target.value)} placeholder="nama@tanotofoundation.org" />
        <div className="aid">Akun pertama: masuk dengan alamat email yang dibuat di Supabase Dashboard.</div>
      </div>

      <div className="fld">
        <label htmlFor="pass">Kata sandi</label>
        <input id="pass" type="password" value={pass} autoComplete="current-password"
          onChange={e => setPass(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void submit(); }}
          placeholder="••••••••" />
        <div className="aid">Akun berikutnya dibuat melalui Pengaturan › Pengguna.</div>
      </div>

      {err && <div className="flag e" style={{ marginBottom: '.8rem' }}>
        <span className="ic">●</span><div className="tx">{err}</div></div>}

      <button className="btn btn-p go" onClick={submit} disabled={busy}>
        {busy ? 'Memeriksa…' : 'Masuk'}
      </button>
    </div>
  );
}
