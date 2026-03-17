import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import Link from 'next/link';

async function getDashboardData() {
  const [totalIdeas, approvedIdeas, implementedIdeas, totalUsers, recentIdeas, topIdeas, topUsers, topDepts] =
    await Promise.all([
      prisma.idea.count(),
      prisma.idea.count({ where: { status: { nome: 'Aprovada' } } }),
      prisma.idea.count({ where: { status: { nome: 'Implementada' } } }),
      prisma.user.count({ where: { ativo: true } }),
      prisma.idea.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: { autor: true, departamento: true, status: true, votes: true },
      }),
      prisma.idea.findMany({
        take: 5,
        orderBy: { votes: { _count: 'desc' } },
        include: { autor: true, departamento: true, status: true, votes: true },
      }),
      prisma.user.findMany({
        take: 10,
        orderBy: { pontos: 'desc' },
        where: { ativo: true },
        include: { departamento: true },
      }),
      prisma.department.findMany({
        include: {
          ideas: {
            where: { status: { nome: 'Implementada' } },
            include: { autor: true },
          },
        },
      }),
    ]);

  const deptRanking = topDepts
    .map((d) => ({
      id: d.id,
      nome: d.nome,
      ideias: d.ideas.length,
      pontos: d.ideas.length * 200,
    }))
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 10);

  return { totalIdeas, approvedIdeas, implementedIdeas, totalUsers, recentIdeas, topIdeas, topUsers, deptRanking };
}

function StatusBadge({ nome, cor }: { nome: string; cor: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: cor + '20', color: cor }}>
      {nome}
    </span>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const metrics = [
    { label: 'Total de Ideias', value: data.totalIdeas, icon: '💡', color: 'blue' },
    { label: 'Aprovadas', value: data.approvedIdeas, icon: '✅', color: 'green' },
    { label: 'Implementadas', value: data.implementedIdeas, icon: '🚀', color: 'purple' },
    { label: 'Colaboradores', value: data.totalUsers, icon: '👥', color: 'orange' },
  ];

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.label} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{m.icon}</span>
                <span className={`text-3xl font-display font-bold text-gray-900`}>{m.value}</span>
              </div>
              <p className="text-sm text-gray-500">{m.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/ideas/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nova Ideia
          </Link>
          <Link href="/ideas" className="btn-secondary">
            Ver todas as ideias
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Ideas */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Ideias Recentes</h2>
              <Link href="/ideas" className="text-sm text-blue-600 hover:text-blue-700">Ver todas →</Link>
            </div>
            <div className="space-y-3">
              {data.recentIdeas.map((idea) => (
                <Link key={idea.id} href={`/ideas/${idea.id}`} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                    <span className="text-sm">💡</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700">{idea.titulo}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">{idea.autor.nome}</span>
                      <span className="text-gray-300">·</span>
                      <StatusBadge nome={idea.status.nome} cor={idea.status.cor} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs shrink-0">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" />
                    </svg>
                    {idea.votes.length}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Rankings */}
          <div className="space-y-4">
            {/* Top Users */}
            <div className="card p-5">
              <h2 className="section-title mb-4">🏆 Top Colaboradores</h2>
              <div className="space-y-2">
                {data.topUsers.slice(0, 5).map((u, i) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-500'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{u.nome}</p>
                      <p className="text-xs text-gray-400">{u.departamento?.nome || '—'}</p>
                    </div>
                    <span className="text-sm font-bold text-blue-600">{u.pontos}pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Departments */}
            <div className="card p-5">
              <h2 className="section-title mb-4">🏢 Top Departamentos</h2>
              <div className="space-y-2">
                {data.deptRanking.slice(0, 5).map((d, i) => (
                  <div key={d.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-50 text-gray-500'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.nome}</p>
                      <p className="text-xs text-gray-400">{d.ideias} ideias implementadas</p>
                    </div>
                    <span className="text-sm font-bold text-green-600">{d.pontos}pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Most Voted */}
        <div className="card p-5">
          <h2 className="section-title mb-4">⬆️ Mais Votadas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.topIdeas.map((idea) => (
              <Link key={idea.id} href={`/ideas/${idea.id}`} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-colors group">
                <div className="text-center shrink-0">
                  <p className="text-xl font-bold text-blue-600">{idea.votes.length}</p>
                  <p className="text-xs text-gray-400">votos</p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700">{idea.titulo}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <StatusBadge nome={idea.status.nome} cor={idea.status.cor} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
