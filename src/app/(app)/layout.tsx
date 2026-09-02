import { redirect } from 'next/navigation';
import { currentProfile } from '@/lib/auth';
import { NotesProvider } from '@/components/NotesProvider';
import { Sidebar } from '@/components/Shell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await currentProfile();
  if (!profile) redirect('/login');

  // Kunci hanya diperiksa keberadaannya di server; nilainya tidak pernah dikirim ke browser.
  const aiEnabled = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <NotesProvider profile={profile} aiEnabled={aiEnabled}>
      <div className="app">
        <Sidebar />
        <div className="main">{children}</div>
      </div>
    </NotesProvider>
  );
}
