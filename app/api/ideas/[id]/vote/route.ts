import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { addPoints } from '@/lib/points';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const idea = await prisma.idea.findUnique({ where: { id: params.id }, include: { status: true } });
  if (!idea) return NextResponse.json({ error: 'Ideia não encontrada' }, { status: 404 });

  if (idea.status.nome !== 'Aprovada') {
    return NextResponse.json({ error: 'Só é possível votar em ideias com status "Aprovada"' }, { status: 400 });
  }

  const existingVote = await prisma.vote.findUnique({ where: { idea_id_user_id: { idea_id: params.id, user_id: user.id } } });
  if (existingVote) return NextResponse.json({ error: 'Você já votou nesta ideia' }, { status: 400 });

  if (user.votos_disponiveis <= 0) {
    return NextResponse.json({ error: 'Você não tem votos disponíveis este mês' }, { status: 400 });
  }

  await prisma.vote.create({ data: { idea_id: params.id, user_id: user.id } });
  await prisma.user.update({ where: { id: user.id }, data: { votos_disponiveis: { decrement: 1 } } });

  // Points to idea author
  await addPoints(idea.autor_id, 'receber_voto');

  // Auto-follow voter
  await prisma.ideaFollower.create({ data: { idea_id: params.id, user_id: user.id } }).catch(() => {});

  return NextResponse.json({ message: 'Voto registrado com sucesso!' });
}
