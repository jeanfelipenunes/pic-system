import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

  const existing = await prisma.ideaFollower.findUnique({
    where: { idea_id_user_id: { idea_id: params.id, user_id: user.id } },
  });

  if (existing) {
    await prisma.ideaFollower.delete({ where: { id: existing.id } });
    return NextResponse.json({ message: 'Deixou de seguir a ideia', following: false });
  } else {
    await prisma.ideaFollower.create({ data: { idea_id: params.id, user_id: user.id } });
    return NextResponse.json({ message: 'Agora você está seguindo esta ideia', following: true });
  }
}
