'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Idea {
  id: string;
  titulo: string;
  descricao: string;
  problema?: string;
  solucao?: string;
  beneficio?: string;
  created_at: string;
  status: { nome: string; cor: string };
  autor: { id: string; nome: string; email: string };
  departamento?: { nome: string };
  votes: { user_id: string }[];
  comments: { id: string; comentario: string; created_at: string; user: { nome: string } }[];
  tags: { tag: { nome: string } }[];
  followers: { user_id: string }[];
  execution?: { plano_execucao?: string; resultado?: string; ganho_estimado?: number; ganho_real?: number; data_inicio?: string; data_fim?: string; executor: { nome: string } };
}

export default function IdeaDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [tab, setTab] = useState<'detalhes' | 'comentarios' | 'execucao'>('detalhes');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState('');

  const userId = (session?.user as { id?: string })?.id;
  const role = (session?.user as { role?: string })?.role;

  useEffect(() => {
    fetchIdea();
  }, [params.id]);

  async function fetchIdea() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ideas/${params.id}`);
      if (!res.ok) { router.push('/ideas'); return; }
      const data = await res.json();
      setIdea(data.idea);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote() {
    const res = await fetch(`/api/ideas/${params.id}/vote`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'Erro ao votar'); return; }
    toast.success(data.message || 'Voto registrado!');
    fetchIdea();
  }

  async function handleFollow() {
    const res = await fetch(`/api/ideas/${params.id}/follow`, { method: 'POST' });
    const data = await res.json();
    if (res.ok) { toast.success(data.message); fetchIdea(); }
  }

  async function handleComment() {
    if (!comment.trim()) return;
    const res = await fetch(`/api/ideas/${params.id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comentario: comment }),
    });
    if (res.ok) { toast.success('Comentário adicionado!'); setComment(''); fetchIdea(); }
  }

  async function handleSummary() {
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setSummary(data.summary);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao gerar resumo');
    } finally {
      setSummaryLoading(false);
    }
  }

  if (loading) return (
    <div>
      <Header />
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    </div>
  );

  if (!idea) return null;

  const hasVoted = idea.votes.some(v => v.user_id === userId);
  const isFollowing = idea.followers.some(f => f.user_id === userId);
  const canVote = idea.status.nome === 'Aprovada' && !hasVoted;

  return (
    <div>
      <Header />
      <div className="p-6 max-w-4xl mx-auto">
        {/* Back */}
        <Link href="/ideas" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar para ideias
        </Link>

        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: idea.status.cor + '20', color: idea.status.cor }}>
                  {idea.status.nome}
                </span>
                {idea.departamento && (
                  <span className="text-sm text-gray-500">{idea.departamento.nome}</span>
                )}
              </div>
              <h1 className="text-xl font-display font-bold text-gray-900 mb-2">{idea.titulo}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {idea.autor.nome.charAt(0).toUpperCase()}
                  </div>
                  {idea.autor.nome}
                </div>
                <span>·</span>
                <span>{new Date(idea.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {/* Votes */}
              <div className="flex flex-col items-center">
                <button
                  onClick={handleVote}
                  disabled={!canVote}
                  className={`flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-xl border-2 transition-all ${hasVoted ? 'bg-blue-50 border-blue-400 text-blue-700' : canVote ? 'border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50' : 'border-gray-100 text-gray-300 cursor-default'}`}
                >
                  <svg className="w-5 h-5" fill={hasVoted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" />
                  </svg>
                  <span className="text-lg font-bold leading-none">{idea.votes.length}</span>
                  <span className="text-xs">votos</span>
                </button>
              </div>

              {/* Follow */}
              <button onClick={handleFollow} className={`btn-secondary text-xs ${isFollowing ? 'bg-green-50 border-green-200 text-green-700' : ''}`}>
                {isFollowing ? '✓ Seguindo' : '+ Seguir'}
              </button>

              {/* Summary */}
              <button onClick={handleSummary} disabled={summaryLoading} className="btn-secondary text-xs">
                {summaryLoading ? '...' : '✨ Resumo IA'}
              </button>
            </div>
          </div>

          {/* Tags */}
          {idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
              {idea.tags.map((t, i) => (
                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">#{t.tag.nome}</span>
              ))}
            </div>
          )}

          {/* AI Summary */}
          {summary && (
            <div className="mt-4 pt-4 border-t border-purple-100 bg-purple-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-xl">
              <p className="text-xs font-semibold text-purple-600 mb-2">✨ Resumo gerado por IA</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{summary}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
          {(['detalhes', 'comentarios', 'execucao'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'comentarios' ? `Comentários (${idea.comments.length})` : t === 'execucao' ? 'Execução' : 'Detalhes'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'detalhes' && (
          <div className="card p-6 space-y-5">
            {idea.descricao && (
              <section>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Descrição</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{idea.descricao}</p>
              </section>
            )}
            {idea.problema && (
              <section className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Problema</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{idea.problema}</p>
              </section>
            )}
            {idea.solucao && (
              <section className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Solução</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{idea.solucao}</p>
              </section>
            )}
            {idea.beneficio && (
              <section className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Benefícios</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{idea.beneficio}</p>
              </section>
            )}
          </div>
        )}

        {tab === 'comentarios' && (
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="section-title mb-4">Adicionar comentário</h3>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} className="input-field resize-none mb-3" placeholder="Escreva seu comentário..." />
              <button onClick={handleComment} disabled={!comment.trim()} className="btn-primary">Comentar</button>
            </div>

            {idea.comments.length === 0 ? (
              <div className="card p-10 text-center text-gray-400 text-sm">Nenhum comentário ainda. Seja o primeiro!</div>
            ) : (
              idea.comments.map(c => (
                <div key={c.id} className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                      {c.user.nome.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{c.user.nome}</span>
                    <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-gray-700 pl-8">{c.comentario}</p>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'execucao' && (
          <div className="card p-6">
            {idea.execution ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-green-600">✓</span>
                  <span className="font-semibold text-gray-900">Executado por: {idea.execution.executor?.nome}</span>
                </div>
                {idea.execution.plano_execucao && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Plano de Execução</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{idea.execution.plano_execucao}</p>
                  </div>
                )}
                {idea.execution.resultado && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Resultado</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{idea.execution.resultado}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {idea.execution.ganho_estimado && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-600 font-medium">Ganho Estimado</p>
                      <p className="text-lg font-bold text-blue-700">R$ {idea.execution.ganho_estimado.toLocaleString('pt-BR')}</p>
                    </div>
                  )}
                  {idea.execution.ganho_real && (
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs text-green-600 font-medium">Ganho Real</p>
                      <p className="text-lg font-bold text-green-700">R$ {idea.execution.ganho_real.toLocaleString('pt-BR')}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-4xl mb-3">⚙️</p>
                <p className="text-sm">Nenhuma execução registrada ainda.</p>
                {(role === 'executor' || role === 'admin') && (
                  <Link href="/execution" className="btn-primary mt-4 inline-flex">Registrar Execução</Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
