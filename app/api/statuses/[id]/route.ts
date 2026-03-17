import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const { nome, cor, ordem } = await req.json();
  const status = await prisma.ideaStatus.update({
    where: { id: params.id },
    data: { ...(nome && { nome }), ...(cor && { cor }), ...(ordem !== undefined && { ordem }) },
  });
  return NextResponse.json({ status });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    await prisma.ideaStatus.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Não é possível excluir status com ideias associadas' }, { status: 400 });
  }
}
