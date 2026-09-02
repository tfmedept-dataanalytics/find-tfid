import { NextResponse } from 'next/server';
import { currentProfile } from '@/lib/auth';
import { can } from '@/lib/taxonomy';
import { listProfilesWithCounts, countAdmins, updateProfileRole } from '@/lib/db';
import type { Role } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const me = await currentProfile();
  if (!me) return NextResponse.json({ error: 'Belum masuk.' }, { status: 401 });
  if (!can(me.role, 'users')) return NextResponse.json({ error: 'Khusus administrator.' }, { status: 403 });

  try {
    return NextResponse.json({ users: await listProfilesWithCounts() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const me = await currentProfile();
  if (!me) return NextResponse.json({ error: 'Belum masuk.' }, { status: 401 });
  if (!can(me.role, 'users')) return NextResponse.json({ error: 'Khusus administrator.' }, { status: 403 });

  const { id, role } = await req.json();
  if (!['field', 'mle', 'admin'].includes(role))
    return NextResponse.json({ error: 'Peran tidak dikenal.' }, { status: 400 });
  if (id === me.id && role !== 'admin' && (await countAdmins()) <= 1)
    return NextResponse.json({ error: 'Tidak dapat menurunkan peran administrator terakhir.' }, { status: 400 });

  try {
    return NextResponse.json({ user: await updateProfileRole(id, role as Role) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
