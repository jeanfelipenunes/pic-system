import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const counts = searchParams.get('counts') === 'true';

  const departments = await prisma.department.findMany({
    orderBy: { nome: 'asc' },
    include: {
      responsavel: true,
      ...(counts ? { _count: { select: { users: true, ideas: true } } } : {}),
    },
  });

  return NextResponse.json({ departments });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const { nome, descricao } = await req.json();
  if (!nome?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });

  const department = await prisma.department.create({ data: { nome: nome.trim(), descricao: descricao?.trim() || null } });
  return NextResponse.json({ department }, { status: 201 });
}
