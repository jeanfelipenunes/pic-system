import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const [totalIdeas, ideiasImplementadas, statusCounts] = await Promise.all([
    prisma.idea.count(),
    prisma.idea.count({ where: { status: { nome: 'Implementada' } } }),
    prisma.ideaStatus.findMany({
      include: { _count: { select: { ideas: true } } },
      orderBy: { ordem: 'asc' },
    }),
  ]);

  const ideiasPorStatus = statusCounts.map((s) => ({
    status: s.nome,
    total: s._count.ideas,
    cor: s.cor,
  }));

  return NextResponse.json({ totalIdeas, ideiasImplementadas, ideiasPorStatus });
}
