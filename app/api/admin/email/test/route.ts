import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { enviarEmail, testEmailConnection } from '@/lib/mail';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { email: session.user?.email! } });
  if (!me || me.role !== 'admin') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });

  const { email } = await req.json();

  const connResult = await testEmailConnection();
  if (!connResult.success) return NextResponse.json(connResult);

  if (email) {
    const sent = await enviarEmail(
      email,
      '[PIC] Teste de configuração de email',
      `<h2>✅ Email configurado com sucesso!</h2><p>O servidor SMTP do PIC está funcionando corretamente.</p><p>Enviado em: ${new Date().toLocaleString('pt-BR')}</p>`
    );
    return NextResponse.json({ success: sent, message: sent ? 'Email enviado com sucesso!' : 'Falha ao enviar email' });
  }

  return NextResponse.json(connResult);
}
