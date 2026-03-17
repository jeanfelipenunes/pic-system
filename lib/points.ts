import { prisma } from './prisma';

type PointEvent = 'ideia_cadastrada' | 'ideia_aprovada' | 'ideia_implementada' | 'receber_voto';

async function getPointsConfig(): Promise<Record<string, number>> {
  const configs = await prisma.systemConfig.findMany({
    where: { chave: { startsWith: 'pontos.' } },
  });
  const map: Record<string, number> = {
    ideia_cadastrada: 10,
    ideia_aprovada: 50,
    ideia_implementada: 200,
    receber_voto: 5,
  };
  for (const c of configs) {
    const key = c.chave.replace('pontos.', '');
    map[key] = parseInt(c.valor) || 0;
  }
  return map;
}

export async function addPoints(userId: string, event: PointEvent): Promise<void> {
  try {
    const config = await getPointsConfig();
    const points = config[event] ?? 0;
    if (points <= 0) return;

    await prisma.user.update({
      where: { id: userId },
      data: { pontos: { increment: points } },
    });
  } catch (e) {
    console.error('Erro ao adicionar pontos:', e);
  }
}

export async function resetMonthlyVotes(): Promise<void> {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { chave: 'votos.limite_mensal' },
    });
    const limite = parseInt(config?.valor || '10');

    await prisma.user.updateMany({
      data: { votos_disponiveis: limite },
    });
    console.log(`✅ Votos mensais resetados para ${limite} por usuário`);
  } catch (e) {
    console.error('Erro ao resetar votos:', e);
  }
}
