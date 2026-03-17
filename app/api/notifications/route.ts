import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!user) return NextResponse.json({ notifications: [] });

  const notifications = await prisma.notification.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: 'desc' },
    take: 30,
  });

  return NextResponse.json({ notifications });
}

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!user) return NextResponse.json({ ok: false });

  await prisma.notification.updateMany({ where: { user_id: user.id, lida: false }, data: { lida: true } });
  return NextResponse.json({ ok: true });
}
