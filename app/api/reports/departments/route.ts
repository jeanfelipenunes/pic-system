import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const departments = await prisma.department.findMany({
    include: { _count: { select: { ideas: true } } },
  });

  const ideiasPorDepartamento = departments.map((d) => ({
    departamento: d.nome,
    total: d._count.ideas,
  }));

  return NextResponse.json({ ideiasPorDepartamento });
}
