import { prisma } from './prisma';

async function getSMTPConfig() {
  const configs = await prisma.systemConfig.findMany({
    where: { chave: { startsWith: 'smtp.' } },
  });
  const map: Record<string, string> = {};
  for (const c of configs) map[c.chave] = c.valor;

  return {
    host: map['smtp.host'] || process.env.SMTP_HOST || 'smtp.office365.com',
    port: parseInt(map['smtp.port'] || process.env.SMTP_PORT || '587'),
    user: map['smtp.user'] || process.env.SMTP_USER || '',
    password: map['smtp.password'] || process.env.SMTP_PASSWORD || '',
  };
}

async function getTransporter() {
  const nodemailer = await import('nodemailer');
  const config = await getSMTPConfig();

  if (!config.user || !config.password) return null;

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: false,
    requireTLS: true,
    auth: { user: config.user, pass: config.password },
    tls: { ciphers: 'SSLv3' },
  });
}

export async function enviarEmail(para: string, assunto: string, html: string): Promise<boolean> {
  try {
    const transporter = await getTransporter();
    if (!transporter) return false;

    const config = await getSMTPConfig();
    await transporter.sendMail({
      from: `"PIC - Programa de Ideias Criativas" <${config.user}>`,
      to: para,
      subject: assunto,
      html,
    });
    return true;
  } catch (e) {
    console.error('Erro ao enviar email:', e);
    return false;
  }
}

export async function notificarIdeaCriada(ideaId: string): Promise<void> {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: { autor: true, departamento: true },
    });
    if (!idea) return;

    // Notificação interna para gestores
    const gestores = await prisma.user.findMany({
      where: { role: { in: ['gestor', 'admin'] }, ativo: true },
    });

    for (const g of gestores) {
      await prisma.notification.create({
        data: {
          user_id: g.id,
          tipo: 'ideia_criada',
          mensagem: `Nova ideia criada: "${idea.titulo}" por ${idea.autor.nome}`,
        },
      });
    }

    const html = `
      <h2>Nova Ideia Cadastrada</h2>
      <p><strong>${idea.titulo}</strong></p>
      <p>Por: ${idea.autor.nome} | Departamento: ${idea.departamento?.nome || 'N/A'}</p>
      <p>${idea.descricao}</p>
    `;

    for (const g of gestores) {
      if (g.email && !g.email.endsWith('.local')) {
        await enviarEmail(g.email, `[PIC] Nova Ideia: ${idea.titulo}`, html);
      }
    }
  } catch (e) {
    console.error('Erro ao notificar ideia criada:', e);
  }
}

export async function notificarMudancaStatus(ideaId: string, novoStatus: string): Promise<void> {
  try {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: { autor: true, followers: { include: { user: true } } },
    });
    if (!idea) return;

    const mensagem = `A ideia "${idea.titulo}" foi atualizada para: ${novoStatus}`;

    for (const follower of idea.followers) {
      await prisma.notification.create({
        data: { user_id: follower.user_id, tipo: 'status_alterado', mensagem },
      });

      if (follower.user.email && !follower.user.email.endsWith('.local')) {
        await enviarEmail(
          follower.user.email,
          `[PIC] Status Atualizado: ${idea.titulo}`,
          `<h2>${mensagem}</h2>`
        );
      }
    }
  } catch (e) {
    console.error('Erro ao notificar mudança de status:', e);
  }
}

export async function notificarComentario(commentId: string): Promise<void> {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: true, idea: { include: { followers: { include: { user: true } } } } },
    });
    if (!comment) return;

    const mensagem = `${comment.user.nome} comentou na ideia "${comment.idea.titulo}"`;

    for (const follower of comment.idea.followers) {
      if (follower.user_id === comment.user_id) continue;
      await prisma.notification.create({
        data: { user_id: follower.user_id, tipo: 'comentario', mensagem },
      });
    }
  } catch (e) {
    console.error('Erro ao notificar comentário:', e);
  }
}

export async function testEmailConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = await getTransporter();
    if (!transporter) return { success: false, message: 'SMTP não configurado' };

    await transporter.verify();
    return { success: true, message: 'Conexão SMTP verificada com sucesso' };
  } catch (e: unknown) {
    return { success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' };
  }
}
