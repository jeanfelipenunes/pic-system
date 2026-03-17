const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Status padrão
  const statusList = [
    { nome: 'Nova', ordem: 1, cor: '#6B7280' },
    { nome: 'Em avaliação', ordem: 2, cor: '#F59E0B' },
    { nome: 'Aprovada', ordem: 3, cor: '#3B82F6' },
    { nome: 'Em execução', ordem: 4, cor: '#F97316' },
    { nome: 'Implementada', ordem: 5, cor: '#10B981' },
    { nome: 'Rejeitada', ordem: 6, cor: '#EF4444' },
    { nome: 'Arquivada', ordem: 7, cor: '#374151' },
  ];

  const statuses = {};
  for (const s of statusList) {
    const existing = await prisma.ideaStatus.findFirst({ where: { nome: s.nome } });
    if (!existing) {
      const created = await prisma.ideaStatus.create({ data: s });
      statuses[s.nome] = created;
    } else {
      statuses[s.nome] = existing;
    }
  }
  console.log('✅ Status criados');

  // Departamentos
  const deptData = [
    { nome: 'Tecnologia da Informação', descricao: 'Infraestrutura, desenvolvimento e suporte técnico' },
    { nome: 'Recursos Humanos', descricao: 'Gestão de pessoas, recrutamento e cultura organizacional' },
    { nome: 'Financeiro', descricao: 'Controle financeiro, contabilidade e planejamento' },
    { nome: 'Operações', descricao: 'Processos operacionais e logística' },
    { nome: 'Marketing', descricao: 'Comunicação, marca e estratégias de mercado' },
  ];

  const depts = {};
  for (const d of deptData) {
    const existing = await prisma.department.findFirst({ where: { nome: d.nome } });
    if (!existing) {
      const created = await prisma.department.create({ data: d });
      depts[d.nome] = created;
    } else {
      depts[d.nome] = existing;
    }
  }
  console.log('✅ Departamentos criados');

  // Usuários dev
  if (process.env.NODE_ENV !== 'production') {
    const devUsers = [
      { nome: 'Usuário Teste', email: 'usuario@pic.local', role: 'usuario', pontos: 45, deptKey: 'Tecnologia da Informação' },
      { nome: 'Gestor Silva', email: 'gestor@pic.local', role: 'gestor', pontos: 120, deptKey: 'Recursos Humanos' },
      { nome: 'Executor Costa', email: 'executor@pic.local', role: 'executor', pontos: 80, deptKey: 'Operações' },
      { nome: 'Administrador', email: 'admin@pic.local', role: 'admin', pontos: 200, deptKey: 'Tecnologia da Informação' },
    ];

    const senha = await bcrypt.hash('123456', 10);
    const createdUsers = {};

    for (const u of devUsers) {
      const existing = await prisma.user.findUnique({ where: { email: u.email } });
      if (!existing) {
        const dept = depts[u.deptKey];
        const created = await prisma.user.create({
          data: {
            nome: u.nome,
            email: u.email,
            senha,
            role: u.role,
            pontos: u.pontos,
            departamento_id: dept?.id,
          },
        });
        createdUsers[u.email] = created;
      } else {
        createdUsers[u.email] = existing;
      }
    }
    console.log('✅ Usuários dev criados');

    // Tags
    const tagNames = ['processo', 'economia', 'inovação', 'sustentabilidade', 'tecnologia', 'pessoas'];
    const tags = {};
    for (const nome of tagNames) {
      const existing = await prisma.tag.findUnique({ where: { nome } });
      if (!existing) {
        tags[nome] = await prisma.tag.create({ data: { nome } });
      } else {
        tags[nome] = existing;
      }
    }

    // Ideias exemplo
    const ideasData = [
      {
        titulo: 'Sistema de feedback contínuo entre colaboradores',
        descricao: 'Implementar uma plataforma digital para troca de feedbacks em tempo real entre colaboradores de diferentes áreas.',
        problema: 'Ausência de cultura de feedback estruturado prejudica o desenvolvimento profissional.',
        solucao: 'Criar módulo integrado ao sistema de RH para envio e recebimento de feedbacks.',
        beneficio: 'Aumento do engajamento e melhora no clima organizacional.',
        statusKey: 'Implementada',
        autorEmail: 'usuario@pic.local',
        deptKey: 'Recursos Humanos',
        tagNames: ['pessoas', 'inovação'],
        votos: 8,
      },
      {
        titulo: 'Automação do processo de onboarding',
        descricao: 'Automatizar o processo de integração de novos colaboradores com fluxos digitais e checklists automáticos.',
        problema: 'O onboarding atual é manual, lento e inconsistente entre departamentos.',
        solucao: 'Desenvolver sistema de onboarding digital com trilhas personalizadas por área.',
        beneficio: 'Redução de 60% no tempo de integração e maior padronização.',
        statusKey: 'Em execução',
        autorEmail: 'gestor@pic.local',
        deptKey: 'Recursos Humanos',
        tagNames: ['processo', 'tecnologia'],
        votos: 5,
      },
      {
        titulo: 'Dashboard de indicadores em tempo real',
        descricao: 'Criar painel centralizado com os principais KPIs da empresa atualizados em tempo real.',
        problema: 'Gestores precisam acessar múltiplos sistemas para obter visão consolidada dos resultados.',
        solucao: 'Integrar APIs dos sistemas existentes em um dashboard unificado.',
        beneficio: 'Tomada de decisão mais ágil e baseada em dados.',
        statusKey: 'Aprovada',
        autorEmail: 'executor@pic.local',
        deptKey: 'Tecnologia da Informação',
        tagNames: ['tecnologia', 'inovação'],
        votos: 12,
      },
      {
        titulo: 'Programa de descarte consciente de equipamentos',
        descricao: 'Estabelecer parceria com empresas de reciclagem para descarte correto de equipamentos eletrônicos obsoletos.',
        problema: 'Equipamentos antigos são descartados de forma inadequada, gerando passivo ambiental.',
        solucao: 'Mapear fornecedores certificados e criar fluxo de logística reversa.',
        beneficio: 'Conformidade ambiental e melhora da imagem corporativa.',
        statusKey: 'Nova',
        autorEmail: 'usuario@pic.local',
        deptKey: 'Operações',
        tagNames: ['sustentabilidade', 'processo'],
        votos: 0,
      },
      {
        titulo: 'Biblioteca digital de conhecimento interno',
        descricao: 'Criar repositório digital com documentação de processos, tutoriais e boas práticas da empresa.',
        problema: 'Conhecimento crítico fica retido em pessoas específicas, gerando dependência.',
        solucao: 'Plataforma wiki interna com busca inteligente e categorização por área.',
        beneficio: 'Redução da dependência de pessoas-chave e aceleração do aprendizado.',
        statusKey: 'Em avaliação',
        autorEmail: 'gestor@pic.local',
        deptKey: 'Tecnologia da Informação',
        tagNames: ['tecnologia', 'pessoas'],
        votos: 3,
      },
      {
        titulo: 'Programa de recompensas por economia de energia',
        descricao: 'Incentivar boas práticas de consumo energético com sistema de pontos e recompensas.',
        problema: 'Alto consumo de energia sem engajamento dos colaboradores para redução.',
        solucao: 'Medir consumo por área e criar ranking com premiações trimestrais.',
        beneficio: 'Redução estimada de 20% na conta de energia.',
        statusKey: 'Aprovada',
        autorEmail: 'usuario@pic.local',
        deptKey: 'Operações',
        tagNames: ['sustentabilidade', 'economia'],
        votos: 7,
      },
      {
        titulo: 'Centralização de contratos digitais com assinatura eletrônica',
        descricao: 'Migrar gestão de contratos para plataforma digital com assinatura eletrônica certificada.',
        problema: 'Contratos em papel geram lentidão, custo e risco de perda de documentos.',
        solucao: 'Integrar ferramenta de assinatura eletrônica ao ERP existente.',
        beneficio: 'Redução de 80% no tempo de fechamento de contratos.',
        statusKey: 'Implementada',
        autorEmail: 'gestor@pic.local',
        deptKey: 'Financeiro',
        tagNames: ['processo', 'economia', 'tecnologia'],
        votos: 15,
      },
      {
        titulo: 'Chatbot para dúvidas de RH',
        descricao: 'Implementar assistente virtual para responder dúvidas frequentes dos colaboradores sobre benefícios, férias e folha.',
        problema: 'Equipe de RH sobrecarregada com perguntas repetitivas que poderiam ser automatizadas.',
        solucao: 'Chatbot com base de conhecimento integrada ao portal do colaborador.',
        beneficio: 'Liberação de 30% do tempo da equipe de RH para atividades estratégicas.',
        statusKey: 'Em avaliação',
        autorEmail: 'executor@pic.local',
        deptKey: 'Recursos Humanos',
        tagNames: ['tecnologia', 'inovação', 'pessoas'],
        votos: 2,
      },
      {
        titulo: 'Programa de mentorias cruzadas entre áreas',
        descricao: 'Conectar profissionais de diferentes departamentos para troca de experiências e desenvolvimento de competências.',
        problema: 'Baixa integração entre áreas gera visão limitada do negócio.',
        solucao: 'Plataforma de matching entre mentores e mentorados com agendamento integrado.',
        beneficio: 'Desenvolvimento de lideranças e maior integração organizacional.',
        statusKey: 'Nova',
        autorEmail: 'admin@pic.local',
        deptKey: 'Recursos Humanos',
        tagNames: ['pessoas', 'inovação'],
        votos: 0,
      },
      {
        titulo: 'Relatórios financeiros automatizados',
        descricao: 'Automatizar geração de relatórios mensais de fechamento financeiro eliminando trabalho manual em planilhas.',
        problema: 'Time financeiro gasta em média 3 dias por mês consolidando dados manualmente.',
        solucao: 'Scripts de automação integrados ao ERP com geração automática de relatórios em PDF.',
        beneficio: 'Economia de 72h/mês da equipe financeira e redução de erros.',
        statusKey: 'Implementada',
        autorEmail: 'executor@pic.local',
        deptKey: 'Financeiro',
        tagNames: ['processo', 'economia', 'tecnologia'],
        votos: 10,
      },
    ];

    for (const ideaData of ideasData) {
      const existing = await prisma.idea.findFirst({ where: { titulo: ideaData.titulo } });
      if (existing) continue;

      const autor = createdUsers[ideaData.autorEmail];
      const dept = depts[ideaData.deptKey];
      const status = statuses[ideaData.statusKey];

      if (!autor || !status) continue;

      const idea = await prisma.idea.create({
        data: {
          titulo: ideaData.titulo,
          descricao: ideaData.descricao,
          problema: ideaData.problema,
          solucao: ideaData.solucao,
          beneficio: ideaData.beneficio,
          autor_id: autor.id,
          departamento_id: dept?.id,
          status_id: status.id,
        },
      });

      // Tags
      for (const tagName of ideaData.tagNames) {
        const tag = tags[tagName];
        if (tag) {
          await prisma.ideaTag.create({ data: { idea_id: idea.id, tag_id: tag.id } }).catch(() => {});
        }
      }

      // Votos
      const allUsers = Object.values(createdUsers);
      for (let i = 0; i < ideaData.votos && i < allUsers.length; i++) {
        const voter = allUsers[i];
        if (voter.id !== autor.id) {
          await prisma.vote.create({ data: { idea_id: idea.id, user_id: voter.id } }).catch(() => {});
        }
      }

      // Execução para implementadas
      if (ideaData.statusKey === 'Implementada') {
        const executor = createdUsers['executor@pic.local'];
        await prisma.execution.create({
          data: {
            idea_id: idea.id,
            executor_id: executor.id,
            plano_execucao: 'Plano de execução estruturado com etapas bem definidas e cronograma aprovado.',
            resultado: 'Projeto concluído com sucesso, dentro do prazo e orçamento previstos.',
            ganho_estimado: 50000,
            ganho_real: 62000,
            data_inicio: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            data_fim: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          },
        }).catch(() => {});

        // Pontos por implementação
        await prisma.user.update({
          where: { id: autor.id },
          data: { pontos: { increment: 200 } },
        });
      }

      // Seguidor (autor)
      await prisma.ideaFollower.create({ data: { idea_id: idea.id, user_id: autor.id } }).catch(() => {});

      // Comentário exemplo
      const comentador = createdUsers['gestor@pic.local'];
      if (comentador.id !== autor.id && ['Aprovada', 'Em execução', 'Implementada'].includes(ideaData.statusKey)) {
        await prisma.comment.create({
          data: {
            idea_id: idea.id,
            user_id: comentador.id,
            comentario: 'Ótima ideia! Isso pode trazer resultados significativos para a empresa.',
          },
        });
      }
    }
    console.log('✅ Ideias de exemplo criadas');
  }

  // Configurações do sistema
  const configs = [
    { chave: 'pontos.ideia_cadastrada', valor: '10' },
    { chave: 'pontos.ideia_aprovada', valor: '50' },
    { chave: 'pontos.ideia_implementada', valor: '200' },
    { chave: 'pontos.receber_voto', valor: '5' },
    { chave: 'votos.limite_mensal', valor: '10' },
    { chave: 'ai.provider', valor: process.env.AI_PROVIDER || 'openai' },
    { chave: 'ldap.url', valor: process.env.LDAP_URL || '' },
    { chave: 'ldap.base_dn', valor: process.env.LDAP_BASE_DN || '' },
    { chave: 'ldap.bind_user', valor: process.env.LDAP_BIND_USER || '' },
    { chave: 'ldap.bind_password', valor: process.env.LDAP_BIND_PASSWORD || '' },
    { chave: 'smtp.host', valor: process.env.SMTP_HOST || 'smtp.office365.com' },
    { chave: 'smtp.port', valor: process.env.SMTP_PORT || '587' },
    { chave: 'smtp.user', valor: process.env.SMTP_USER || '' },
    { chave: 'smtp.password', valor: process.env.SMTP_PASSWORD || '' },
  ];

  for (const cfg of configs) {
    await prisma.systemConfig.upsert({
      where: { chave: cfg.chave },
      update: {},
      create: cfg,
    });
  }
  console.log('✅ Configurações do sistema criadas');

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
