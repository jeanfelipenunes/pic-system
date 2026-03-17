import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const configs = await prisma.systemConfig.findMany();
  const map: Record<string, string> = {};
  for (const c of configs) map[c.chave] = c.valor;

  // Mask passwords
  if (map['ldap.bind_password']) map['ldap.bind_password'] = '••••••••';
  if (map['smtp.password']) map['smtp.password'] = '';

  return NextResponse.json(map);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const body = await req.json();

  for (const [chave, valor] of Object.entries(body)) {
    if (valor === '' || valor === '••••••••') continue; // skip empty/masked
    await prisma.systemConfig.upsert({
      where: { chave },
      update: { valor: String(valor) },
      create: { chave, valor: String(valor) },
    });
  }

  return NextResponse.json({ ok: true });
}
