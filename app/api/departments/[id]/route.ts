import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const { nome, descricao, responsavel_id } = await req.json();
  const department = await prisma.department.update({
    where: { id: params.id },
    data: {
      ...(nome && { nome: nome.trim() }),
      descricao: descricao?.trim() || null,
      responsavel_id: responsavel_id || null,
    },
  });
  return NextResponse.json({ department });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  try {
    await prisma.department.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Não é possível excluir departamento com usuários ou ideias' }, { status: 400 });
  }
}
