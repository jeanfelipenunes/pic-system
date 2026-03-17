import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { addPoints } from '@/lib/points';
import { notificarMudancaStatus } from '@/lib/mail';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!user || !['gestor', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const { status_id, executor_id } = await req.json();

  const newStatus = await prisma.ideaStatus.findUnique({ where: { id: status_id } });
  if (!newStatus) return NextResponse.json({ error: 'Status não encontrado' }, { status: 404 });

  const idea = await prisma.idea.update({
    where: { id: params.id },
    data: { status_id },
    include: { autor: true },
  });

  // Points for approval/implementation
  if (newStatus.nome === 'Aprovada') {
    await addPoints(idea.autor_id, 'ideia_aprovada');
  } else if (newStatus.nome === 'Implementada') {
    await addPoints(idea.autor_id, 'ideia_implementada');
  }

  // Assign executor
  if (newStatus.nome === 'Em execução' && executor_id) {
    await prisma.execution.upsert({
      where: { idea_id: params.id },
      update: { executor_id },
      create: { idea_id: params.id, executor_id },
    });
  }

  notificarMudancaStatus(params.id, newStatus.nome).catch(console.error);

  return NextResponse.json({ idea });
}
