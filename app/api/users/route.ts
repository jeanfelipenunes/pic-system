import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role');

  const where: Record<string, unknown> = { ativo: true };
  if (role) where.role = role;

  const users = await prisma.user.findMany({
    where,
    orderBy: { nome: 'asc' },
    include: { departamento: true },
    select: { id: true, nome: true, email: true, role: true, pontos: true, ativo: true, votos_disponiveis: true, departamento: true },
  });

  return NextResponse.json({ users });
}
