import { prisma } from './prisma';

async function getAIConfig(): Promise<{ provider: string; openaiKey: string; geminiKey: string }> {
  const configs = await prisma.systemConfig.findMany({
    where: { chave: { startsWith: 'ai.' } },
  });
  const map: Record<string, string> = {};
  for (const c of configs) map[c.chave] = c.valor;

  return {
    provider: map['ai.provider'] || process.env.AI_PROVIDER || 'openai',
    openaiKey: process.env.OPENAI_API_KEY || '',
    geminiKey: process.env.GEMINI_API_KEY || '',
  };
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Você é um assistente especializado em inovação corporativa e gestão de ideias. Responda sempre em português brasileiro de forma clara e objetiva.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Erro na API OpenAI');
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
        systemInstruction: {
          parts: [
            {
              text: 'Você é um assistente especializado em inovação corporativa e gestão de ideias. Responda sempre em português brasileiro.',
            },
          ],
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Erro na API Gemini');
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callAI(prompt: string): Promise<string> {
  const config = await getAIConfig();

  if (config.provider === 'gemini' && config.geminiKey) {
    return callGemini(prompt, config.geminiKey);
  } else if (config.openaiKey) {
    return callOpenAI(prompt, config.openaiKey);
  } else {
    throw new Error('Nenhum provedor de IA configurado. Configure as chaves de API no painel administrativo.');
  }
}

export async function ajudarEscreverIdeia(dados: {
  titulo?: string;
  problema?: string;
  departamento?: string;
}): Promise<{ descricao: string; solucao: string; beneficio: string }> {
  const prompt = `Com base nas seguintes informações, ajude a desenvolver uma ideia corporativa completa:

Título: ${dados.titulo || 'Não informado'}
Problema identificado: ${dados.problema || 'Não informado'}
Departamento: ${dados.departamento || 'Não informado'}

Por favor, elabore:
1. Uma DESCRIÇÃO completa da ideia (2-3 parágrafos)
2. Uma SOLUÇÃO proposta detalhada
3. Os BENEFÍCIOS esperados com métricas estimadas

Responda em formato JSON com as chaves: descricao, solucao, beneficio`;

  const result = await callAI(prompt);

  try {
    const clean = result.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {
      descricao: result,
      solucao: 'Elaborar plano de implementação detalhado com etapas e responsáveis.',
      beneficio: 'Melhoria de eficiência operacional e redução de custos.',
    };
  }
}

export async function gerarResumoIdeia(idea: {
  titulo: string;
  descricao: string;
  problema?: string | null;
  solucao?: string | null;
  beneficio?: string | null;
}): Promise<string> {
  const prompt = `Gere um resumo executivo conciso (máximo 3 parágrafos) da seguinte ideia corporativa:

Título: ${idea.titulo}
Descrição: ${idea.descricao}
Problema: ${idea.problema || 'N/A'}
Solução: ${idea.solucao || 'N/A'}
Benefício: ${idea.beneficio || 'N/A'}

O resumo deve ser profissional e destacar os pontos mais importantes.`;

  return callAI(prompt);
}

export async function gerarRelatorioAnalitico(dados: {
  totalIdeias: number;
  ideiasPorStatus: Array<{ status: string; total: number }>;
  ideiasPorDepartamento: Array<{ departamento: string; total: number }>;
  topUsuarios: Array<{ nome: string; pontos: number }>;
  ideiasImplementadas: number;
}): Promise<string> {
  const prompt = `Analise os seguintes dados do Programa de Ideias Criativas (PIC) e gere um relatório analítico executivo:

Total de ideias: ${dados.totalIdeias}
Ideias implementadas: ${dados.ideiasImplementadas}
Taxa de implementação: ${dados.totalIdeias > 0 ? ((dados.ideiasImplementadas / dados.totalIdeias) * 100).toFixed(1) : 0}%

Distribuição por status:
${dados.ideiasPorStatus.map((s) => `- ${s.status}: ${s.total} ideias`).join('\n')}

Distribuição por departamento:
${dados.ideiasPorDepartamento.map((d) => `- ${d.departamento}: ${d.total} ideias`).join('\n')}

Top colaboradores:
${dados.topUsuarios.map((u, i) => `${i + 1}. ${u.nome}: ${u.pontos} pontos`).join('\n')}

Por favor, elabore:
1. Análise geral do programa
2. Destaques positivos
3. Pontos de atenção
4. Recomendações estratégicas para os próximos 90 dias`;

  return callAI(prompt);
}
