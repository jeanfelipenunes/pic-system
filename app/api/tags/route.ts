import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const counts = searchParams.get('counts') === 'true';

  const tags = await prisma.tag.findMany({
    orderBy: { nome: 'asc' },
    include: counts ? { _count: { select: { ideas: true } } } : undefined,
  });

  return NextResponse.json({ tags });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const { nome } = await req.json();
  if (!nome?.trim()) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });

  try {
    const tag = await prisma.tag.create({ data: { nome: nome.trim().toLowerCase(), created_by: user.id } });
    return NextResponse.json({ tag }, { status: 201 });
  } catch {
    const existing = await prisma.tag.findUnique({ where: { nome: nome.trim().toLowerCase() } });
    if (existing) return NextResponse.json({ tag: existing });
    return NextResponse.json({ error: 'Erro ao criar tag' }, { status: 500 });
  }
}
