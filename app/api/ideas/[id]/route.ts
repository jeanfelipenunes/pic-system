import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const idea = await prisma.idea.findUnique({
    where: { id: params.id },
    include: {
      autor: true,
      departamento: true,
      status: true,
      votes: true,
      comments: { include: { user: true }, orderBy: { created_at: 'asc' } },
      tags: { include: { tag: true } },
      followers: { include: { user: true } },
      execution: { include: { executor: true } },
    },
  });

  if (!idea) return NextResponse.json({ error: 'Ideia não encontrada' }, { status: 404 });
  return NextResponse.json({ idea });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const idea = await prisma.idea.update({
    where: { id: params.id },
    data: {
      titulo: body.titulo,
      descricao: body.descricao,
      problema: body.problema,
      solucao: body.solucao,
      beneficio: body.beneficio,
    },
  });
  return NextResponse.json({ idea });
}
