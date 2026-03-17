import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.role !== undefined) data.role = body.role;
  if (body.ativo !== undefined) data.ativo = body.ativo;
  if (body.departamento_id !== undefined) data.departamento_id = body.departamento_id;

  const user = await prisma.user.update({ where: { id: params.id }, data });
  return NextResponse.json({ user });
}
