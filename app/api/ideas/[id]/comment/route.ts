import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';
import { notificarComentario } from '@/lib/mail';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { comentario } = await req.json();
  if (!comentario?.trim()) return NextResponse.json({ error: 'Comentário vazio' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { idea_id: params.id, user_id: user.id, comentario: comentario.trim() },
  });

  // Auto-follow commenter
  await prisma.ideaFollower.create({ data: { idea_id: params.id, user_id: user.id } }).catch(() => {});

  notificarComentario(comment.id).catch(console.error);

  return NextResponse.json({ comment }, { status: 201 });
}
