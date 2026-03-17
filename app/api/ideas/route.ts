import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { addPoints } from '@/lib/points';
import { notificarIdeaCriada } from '@/lib/mail';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const evaluation = searchParams.get('evaluation');
  const execution = searchParams.get('execution');
  const departamento = searchParams.get('departamento');
  const statusParam = searchParams.get('status');
  const tags = searchParams.get('tags');
  const q = searchParams.get('q');

  const user = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const where: Record<string, unknown> = {};

  if (evaluation === 'true') {
    where.status = { nome: { in: ['Nova', 'Em avaliação'] } };
  } else if (execution === 'true') {
    where.status = { nome: 'Em execução' };
    if (user.role === 'executor') {
      where.execution = { executor_id: user.id };
    }
  }

  if (departamento) where.departamento_id = departamento;
  if (statusParam) where.status_id = statusParam;
  if (tags) where.tags = { some: { tag_id: tags } };
  if (q) where.titulo = { contains: q, mode: 'insensitive' };

  const ideas = await prisma.idea.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      autor: true,
      departamento: true,
      status: true,
      votes: true,
      tags: { include: { tag: true } },
      execution: { include: { executor: true } },
    },
    take: 100,
  });

  return NextResponse.json({ ideas });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json();
  const { titulo, descricao, problema, solucao, beneficio, departamento_id, tags } = body;

  if (!titulo?.trim() || !descricao?.trim()) {
    return NextResponse.json({ error: 'Título e descrição são obrigatórios' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const statusNova = await prisma.ideaStatus.findFirst({ where: { nome: 'Nova' }, orderBy: { ordem: 'asc' } });
  if (!statusNova) return NextResponse.json({ error: 'Status padrão não configurado' }, { status: 500 });

  const idea = await prisma.idea.create({
    data: {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      problema: problema?.trim() || null,
      solucao: solucao?.trim() || null,
      beneficio: beneficio?.trim() || null,
      autor_id: user.id,
      departamento_id: departamento_id || null,
      status_id: statusNova.id,
    },
  });

  // Add tags
  if (tags && Array.isArray(tags)) {
    for (const tagId of tags) {
      await prisma.ideaTag.create({ data: { idea_id: idea.id, tag_id: tagId } }).catch(() => {});
    }
  }

  // Auto-follow author
  await prisma.ideaFollower.create({ data: { idea_id: idea.id, user_id: user.id } }).catch(() => {});

  // Points
  await addPoints(user.id, 'ideia_cadastrada');

  // Notify
  notificarIdeaCriada(idea.id).catch(console.error);

  return NextResponse.json({ idea }, { status: 201 });
}
