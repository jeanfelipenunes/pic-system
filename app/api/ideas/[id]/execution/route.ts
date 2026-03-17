import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!user || !['executor', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }

  const body = await req.json();

  const execution = await prisma.execution.upsert({
    where: { idea_id: params.id },
    update: {
      plano_execucao: body.plano_execucao || null,
      resultado: body.resultado || null,
      ganho_estimado: body.ganho_estimado ? parseFloat(body.ganho_estimado) : null,
      ganho_real: body.ganho_real ? parseFloat(body.ganho_real) : null,
      data_inicio: body.data_inicio ? new Date(body.data_inicio) : null,
      data_fim: body.data_fim ? new Date(body.data_fim) : null,
    },
    create: {
      idea_id: params.id,
      executor_id: user.id,
      plano_execucao: body.plano_execucao || null,
      resultado: body.resultado || null,
      ganho_estimado: body.ganho_estimado ? parseFloat(body.ganho_estimado) : null,
      ganho_real: body.ganho_real ? parseFloat(body.ganho_real) : null,
      data_inicio: body.data_inicio ? new Date(body.data_inicio) : null,
      data_fim: body.data_fim ? new Date(body.data_fim) : null,
    },
  });

  // If completed (data_fim set), change status to Implementada
  if (body.data_fim) {
    const statusImpl = await prisma.ideaStatus.findFirst({ where: { nome: 'Implementada' } });
    if (statusImpl) {
      await prisma.idea.update({ where: { id: params.id }, data: { status_id: statusImpl.id } });
    }
  }

  return NextResponse.json({ execution });
}
