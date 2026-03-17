import { prisma } from '@/lib/prisma';
import Header from '@/components/layout/Header';
import Link from 'next/link';

interface SearchParams { departamento?: string; status?: string; tags?: string; autor?: string; q?: string; }

async function getIdeas(filters: SearchParams) {
  const where: Record<string, unknown> = {};
  if (filters.departamento) where.departamento_id = filters.departamento;
  if (filters.status) where.status_id = filters.status;
  if (filters.autor) where.autor_id = filters.autor;
  if (filters.q) where.titulo = { contains: filters.q, mode: 'insensitive' };
  if (filters.tags) {
    where.tags = { some: { tag_id: filters.tags } };
  }

  const [ideas, departments, statuses, tags] = await Promise.all([
    prisma.idea.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: { autor: true, departamento: true, status: true, votes: true, tags: { include: { tag: true } } },
      take: 50,
    }),
    prisma.department.findMany({ orderBy: { nome: 'asc' } }),
    prisma.ideaStatus.findMany({ orderBy: { ordem: 'asc' } }),
    prisma.tag.findMany({ orderBy: { nome: 'asc' } }),
  ]);

  return { ideas, departments, statuses, tags };
}

export default async function IdeasPage({ searchParams }: { searchParams: SearchParams }) {
  const { ideas, departments, statuses, tags } = await getIdeas(searchParams);

  return (
    <div>
      <Header title="Ideias" />
      <div className="p-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form className="flex-1 flex gap-2" method="GET">
            <input
              name="q"
              defaultValue={searchParams.q}
              placeholder="Buscar ideias..."
              className="input-field flex-1"
            />
            <button type="submit" className="btn-primary">Buscar</button>
            {(searchParams.q || searchParams.departamento || searchParams.status || searchParams.tags) && (
              <Link href="/ideas" className="btn-secondary">Limpar</Link>
            )}
          </form>
          <Link href="/ideas/new" className="btn-primary shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nova Ideia
          </Link>
        </div>

        <div className="flex gap-6">
          {/* Filters sidebar */}
          <aside className="w-52 shrink-0 hidden md:block space-y-4">
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Departamento</h3>
              <div className="space-y-1">
                <Link href={buildFilterUrl(searchParams, 'departamento', '')} className={`block text-sm py-1 px-2 rounded ${!searchParams.departamento ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                  Todos
                </Link>
                {departments.map((d) => (
                  <Link key={d.id} href={buildFilterUrl(searchParams, 'departamento', d.id)} className={`block text-sm py-1 px-2 rounded truncate ${searchParams.departamento === d.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                    {d.nome}
                  </Link>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status</h3>
              <div className="space-y-1">
                <Link href={buildFilterUrl(searchParams, 'status', '')} className={`block text-sm py-1 px-2 rounded ${!searchParams.status ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                  Todos
                </Link>
                {statuses.map((s) => (
                  <Link key={s.id} href={buildFilterUrl(searchParams, 'status', s.id)} className={`block text-sm py-1 px-2 rounded ${searchParams.status === s.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.cor }} />
                      {s.nome}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Link key={t.id} href={buildFilterUrl(searchParams, 'tags', searchParams.tags === t.id ? '' : t.id)} className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${searchParams.tags === t.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                    {t.nome}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          {/* Ideas grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">{ideas.length} ideia{ideas.length !== 1 ? 's' : ''} encontrada{ideas.length !== 1 ? 's' : ''}</p>
            </div>

            {ideas.length === 0 ? (
              <div className="card p-16 text-center">
                <span className="text-4xl mb-4 block">💡</span>
                <p className="text-gray-500">Nenhuma ideia encontrada.</p>
                <Link href="/ideas/new" className="btn-primary mt-4 inline-flex">Criar primeira ideia</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {ideas.map((idea) => (
                  <Link key={idea.id} href={`/ideas/${idea.id}`} className="card p-5 hover:shadow-md hover:border-blue-100 transition-all group">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: idea.status.cor + '20', color: idea.status.cor }}>
                        {idea.status.nome}
                      </span>
                      <div className="flex items-center gap-1 text-gray-400 text-sm">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" />
                        </svg>
                        <span className="font-semibold">{idea.votes.length}</span>
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2 group-hover:text-blue-700 line-clamp-2">
                      {idea.titulo}
                    </h3>

                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{idea.descricao}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                          {idea.autor.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-500 truncate max-w-[100px]">{idea.autor.nome}</span>
                      </div>
                      {idea.departamento && (
                        <span className="text-xs text-gray-400 truncate max-w-[100px]">{idea.departamento.nome}</span>
                      )}
                    </div>

                    {idea.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {idea.tags.slice(0, 3).map((t) => (
                          <span key={t.tag_id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            #{t.tag.nome}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function buildFilterUrl(current: SearchParams, key: string, value: string): string {
  const params = new URLSearchParams();
  const entries = { ...current, [key]: value };
  for (const [k, v] of Object.entries(entries)) {
    if (v) params.set(k, v);
  }
  const str = params.toString();
  return `/ideas${str ? '?' + str : ''}`;
}
