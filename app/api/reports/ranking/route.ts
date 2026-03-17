import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      where: { ativo: true },
      orderBy: { pontos: 'desc' },
      include: { departamento: true },
    }),
    prisma.department.findMany({
      include: {
        ideas: {
          where: { status: { nome: 'Implementada' } },
        },
      },
    }),
  ]);

  const rankingUsuarios = users.map((u) => ({
    nome: u.nome,
    pontos: u.pontos,
    departamento: u.departamento?.nome,
  }));

  const rankingDepartamentos = departments
    .map((d) => ({
      nome: d.nome,
      ideias: d.ideas.length,
      pontos: d.ideas.length * 200,
    }))
    .sort((a, b) => b.pontos - a.pontos);

  return NextResponse.json({ rankingUsuarios, rankingDepartamentos });
}
