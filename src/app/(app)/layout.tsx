import { redirect } from 'next/navigation';
import { currentProfile } from '@/lib/auth';
import { NotesProvider } from '@/components/NotesProvider';
import { Sidebar } from '@/components/Shell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await currentProfile();
  if (!profile) redirect('/login');

  return (
    <NotesProvider profile={profile}>
      <div className="app">
        <Sidebar />
        <div className="main">{children}</div>
      </div>
    </NotesProvider>
  );
}
