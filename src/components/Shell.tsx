'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ROLES } from '@/lib/taxonomy';
import { APP_VERSION, BUILD_DATE } from '@/lib/version';
import { useNotes } from './NotesProvider';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { AccountModal } from './AccountModal';

const NAV = [
  ['Ruang kerja', [
    { href: '/', ic: '◧', l: 'Ringkasan' },
    { href: '/catatan', ic: '▤', l: 'Catatan lapangan' },
    { href: '/catatan/baru', ic: '✎', l: 'Catatan baru' }
  ]],
  ['Analisis', [
    { href: '/analisis', ic: '◈', l: 'Analisis AI', need: 'analyze' },
    { href: '/kualitas', ic: '◆', l: 'Kualitas catatan', need: 'quality' },
    { href: '/tindak-lanjut', ic: '▸', l: 'Tindak lanjut', badge: true }
  ]],
  ['Sistem', [{ href: '/pengaturan', ic: '⚙', l: 'Pengaturan', need: 'settings' }]]
] as const;

export function Sidebar() {
  const { profile, notes, may } = useNotes();
  const path = usePathname();
  const router = useRouter();
  const openRtl = notes.flatMap(n => n.rtl || []).filter(r => r.status !== 'selesai').length;
  const [akun, setAkun] = useState(false);

  const logout = async () => {
    await createClient().auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href));

  const closeNav = () => document.getElementById('sidebar')?.classList.remove('open');

  return (
      <aside className="sidebar" id="sidebar">
        <div className="brand">
          <Image className="tile" src="/logo-tf.png" alt="Tanoto Foundation" width={34} height={34} />
          <div className="rule" />
          <div>
            <div className="brand-mark"><b>FIND</b></div>
            <div className="brand-sub">Field Insights &amp; Notes</div>
          </div>
        </div>
        <nav className="nav">
          {NAV.map(([group, links]) => {
            const vis = links.filter(l => !('need' in l) || may((l as { need: string }).need));
            if (!vis.length) return null;
            return (
              <div key={group}>
                <div className="nav-group">{group}</div>
                {vis.map(l => (
                  <Link key={l.href} href={l.href} className={active(l.href) ? 'on' : ''} onClick={closeNav}>
                    <span className="ic">{l.ic}</span>{l.l}
                    {'badge' in l && openRtl ? <span className="badge">{openRtl}</span> : null}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="who">
          <div className="nm">{profile.name}</div>
          <div className="rl">{ROLES[profile.role].n}</div>
          <div className="rl" style={{ fontSize: '.65rem', marginTop: '.15rem' }}
            title={`Build ${BUILD_DATE}`}>FIND v{APP_VERSION}</div>
          <div className="flex" style={{ gap: '.35rem', marginTop: '.45rem' }}>
            <button onClick={() => setAkun(true)}>Akun</button>
            <button onClick={logout}>Keluar</button>
          </div>
        </div>
        {akun && <AccountModal onClose={() => setAkun(false)} />}
      </aside>
  );
}

export function Topbar({ title, sub, actions }: { title: string; sub: string; actions?: React.ReactNode }) {
  return (
    <header className="topbar">
      <button className="btn btn-sm" id="menuBtn"
        onClick={() => document.getElementById('sidebar')?.classList.toggle('open')}>☰</button>
      <div><h1>{title}</h1><div className="sub">{sub}</div></div>
      <div className="spacer" />
      <div className="flex">{actions}</div>
    </header>
  );
}
