'use client';
import { useEffect, useState } from 'react';
import { useNotes } from '@/components/NotesProvider';
import { Topbar } from '@/components/Shell';
import { toast } from '@/components/Toast';
import { ROLES } from '@/lib/taxonomy';
import { download, deptLabel, progLabel, jenisLabel } from '@/lib/format';
import { scoreNote } from '@/lib/scoring';
import { ASPEK } from '@/lib/taxonomy';

interface UserRow { id: string; email: string; name: string; role: string; notes: number }

export default function PengaturanPage() {
  const { notes, profile, ui, setUi, may } = useNotes();
  const boleh = may('settings');
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [uErr, setUErr] = useState('');

  useEffect(() => {
    if (!may('users')) return;
    fetch('/api/users').then(async r => {
      const d = await r.json();
      if (!r.ok) { setUErr(d.error || 'Daftar pengguna gagal dimuat.'); return; }
      setUsers(d.users);
    }).catch(() => setUErr('Daftar pengguna gagal dimuat.'));
  }, [may]);

  async function setRole(id: string, role: string) {
    const r = await fetch('/api/users', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, role })
    });
    const d = await r.json();
    if (!r.ok) { toast(d.error || 'Peran gagal diubah.', 'err'); return; }
    setUsers(u => (u || []).map(x => (x.id === id ? { ...x, role } : x)));
    toast('Peran pengguna diperbarui.');
  }

  function exportJSON() {
    download(`FIND-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ app: 'FIND', version: 1, exportedAt: new Date().toISOString(), notes }, null, 2),
      'application/json');
    toast('Cadangan diunduh.');
  }

  function exportCSV() {
    if (!notes.length) { toast('Tidak ada catatan untuk diekspor.', 'err'); return; }
    const cols = ['Judul', 'Tanggal kegiatan', 'Tanggal selesai', 'Kab/Kota', 'Institusi', 'Email TF',
      'Departemen', 'Program', 'Jenis kegiatan', 'Ringkasan',
      ...ASPEK.flatMap(a => [`Fakta ${a.n}`, `Interpretasi ${a.n}`]), 'Skor kualitas', 'Status'];
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
    const body = notes.map(n => [n.judul, n.tglKegiatan, n.tglSelesai, n.kabkota, n.institusi, n.emailTF,
      deptLabel(n), progLabel(n), jenisLabel(n), n.ringkasan,
      ...ASPEK.flatMap(a => [n.obs?.[a.id]?.f, n.obs?.[a.id]?.i]),
      scoreNote(n).total, n.status].map(cell).join(','));
    download(`FIND-catatan-${new Date().toISOString().slice(0, 10)}.csv`,
      '\uFEFF' + cols.map(cell).join(',') + '\n' + body.join('\n'), 'text/csv;charset=utf-8');
    toast(`${notes.length} catatan diekspor.`);
  }

  if (!boleh) {
    return (
      <>
        <Topbar title="Pengaturan" sub="Khusus Administrator" />
        <main className="content">
          <div className="card"><div className="card-b empty">
            <div className="e-t">Halaman ini khusus Administrator</div>
            <div className="e-d">Pengaturan sistem, manajemen pengguna, dan ekspor data hanya dapat diakses oleh Administrator.
              Untuk mengganti kata sandi atau skala tampilan, gunakan tombol <b>Akun</b> di bagian bawah sidebar.</div>
          </div></div>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar title="Pengaturan" sub="Pengguna, data, dan konfigurasi AI — khusus Administrator" />
      <main className="content">
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'start' }}>

          <div className="card"><div className="card-h"><h3>Konfigurasi AI</h3></div><div className="card-b">
            <div className="small" style={{ lineHeight: 1.6, marginBottom: '.6rem' }}>
              Analisis AI dijalankan di server. Kunci API disimpan sebagai environment variable
              <b> ANTHROPIC_API_KEY</b> di Vercel, tidak pernah dikirim ke browser.
            </div>
            <div className="tiny muted" style={{ lineHeight: 1.6 }}>Isi catatan lapangan yang dianalisis dikirim ke Anthropic API saat analisis dijalankan. Jangan memasukkan data pribadi penerima manfaat yang dapat mengidentifikasi individu ke dalam catatan.</div>
          </div></div>

          <div className="card"><div className="card-h"><h3>Data</h3></div><div className="card-b">
            <div className="small mb">{notes.length} catatan tersimpan di database Supabase.</div>
            <div className="flex fw">
              <button className="btn btn-sm" onClick={exportJSON}>Cadangkan (JSON)</button>
              <button className="btn btn-sm" onClick={exportCSV}>Ekspor CSV</button>
            </div>
            <div className="tiny muted mt-s">Data tersimpan terpusat, bukan di browser. Cadangan JSON berguna untuk arsip dan migrasi antar-lingkungan.</div>
          </div></div>

          <div className="card"><div className="card-h"><h3>Peran dan akses</h3></div><div className="card-b">
            {Object.entries(ROLES).map(([k, v]) => (
              <div key={k} style={{ marginBottom: '.6rem' }}>
                <div className="small" style={{ fontWeight: 600 }}>{v.n}
                  {profile.role === k && <span className="pill p-g" style={{ marginLeft: '.4rem' }}>peran Anda</span>}</div>
                <div className="tiny muted">{v.d}</div>
              </div>
            ))}
          </div></div>
        </div>

        {may('users') && (
          <div className="card mt"><div className="card-h"><h3>Pengguna</h3>
            <span className="hint">Akun dibuat di Supabase Dashboard › Authentication › Users, lalu perannya diatur di sini</span></div>
            {uErr ? <div className="card-b"><div className="flag e"><span className="ic">●</span><div className="tx">{uErr}</div></div></div>
              : !users ? <div className="card-b flex"><span className="spin" /><span className="small muted">Memuat pengguna…</span></div>
              : (
                <div className="tbl-wrap"><table>
                  <thead><tr><th>Nama</th><th>Email</th><th className="right">Catatan</th><th>Peran</th></tr></thead>
                  <tbody>{users.map(u => (
                    <tr key={u.id}>
                      <td><b>{u.name || '—'}</b>{u.id === profile.id && <span className="pill p-g" style={{ marginLeft: '.4rem' }}>Anda</span>}</td>
                      <td className="small">{u.email}</td>
                      <td className="right num">{u.notes}</td>
                      <td><select value={u.role} onChange={e => setRole(u.id, e.target.value)}
                        style={{ width: 'auto', padding: '.15rem .4rem', fontSize: '.75rem' }}>
                        {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.n}</option>)}
                      </select></td>
                    </tr>
                  ))}</tbody></table></div>
              )}
          </div>
        )}
      </main>
    </>
  );
}
