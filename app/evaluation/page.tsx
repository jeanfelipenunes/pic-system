'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import toast from 'react-hot-toast';

interface Idea {
  id: string;
  titulo: string;
  descricao: string;
  created_at: string;
  status: { nome: string; cor: string };
  autor: { nome: string; email: string };
  departamento?: { nome: string };
  votes: unknown[];
}

interface User { id: string; nome: string; email: string; role: string; }

export default function EvaluationPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ idea: Idea; action: string } | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [executorId, setExecutorId] = useState('');
  const [statuses, setStatuses] = useState<{ id: string; nome: string }[]>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [ideasRes, usersRes, statusesRes] = await Promise.all([
      fetch('/api/ideas?evaluation=true'),
      fetch('/api/users?role=executor'),
      fetch('/api/statuses'),
    ]);
    if (ideasRes.ok) setIdeas((await ideasRes.json()).ideas || []);
    if (usersRes.ok) setUsers((await usersRes.json()).users || []);
    if (statusesRes.ok) setStatuses((await statusesRes.json()).statuses || []);
    setLoading(false);
  }

  async function handleAction() {
    if (!modal) return;
    setProcessing(true);
    try {
      const statusMap: Record<string, string> = {
        approve: 'Aprovada',
        reject: 'Rejeitada',
        adjust: 'Em avaliação',
        execute: 'Em execução',
      };
      const targetStatus = statuses.find(s => s.nome === statusMap[modal.action]);
      if (!targetStatus) throw new Error('Status não encontrado');

      const res = await fetch(`/api/ideas/${modal.idea.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status_id: targetStatus.id,
          justificativa,
          executor_id: modal.action === 'execute' ? executorId : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Ideia atualizada com sucesso!');
      setModal(null);
      setJustificativa('');
      setExecutorId('');
      fetchData();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao processar');
    } finally {
      setProcessing(false);
    }
  }

  const actionLabels: Record<string, { label: string; color: string; emoji: string }> = {
    approve: { label: 'Aprovar', color: 'bg-green-600 hover:bg-green-700', emoji: '✅' },
    reject: { label: 'Rejeitar', color: 'bg-red-600 hover:bg-red-700', emoji: '❌' },
    adjust: { label: 'Solicitar Ajuste', color: 'bg-yellow-500 hover:bg-yellow-600', emoji: '🔄' },
    execute: { label: 'Designar Execução', color: 'bg-blue-600 hover:bg-blue-700', emoji: '⚙️' },
  };

  if (role !== 'gestor' && role !== 'admin') {
    return (
      <div>
        <Header title="Avaliação" />
        <div className="p-6 flex items-center justify-center">
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">🔒</p>
            <p className="text-gray-500">Acesso restrito a gestores e administradores.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Avaliação de Ideias" />
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : ideas.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-gray-600 font-medium">Nenhuma ideia pendente de avaliação!</p>
            <p className="text-gray-400 text-sm mt-1">Todas as ideias foram processadas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{ideas.length} ideia{ideas.length !== 1 ? 's' : ''} pendente{ideas.length !== 1 ? 's' : ''}</p>
            {ideas.map(idea => (
              <div key={idea.id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: idea.status.cor + '20', color: idea.status.cor }}>
                        {idea.status.nome}
                      </span>
                      {idea.departamento && <span className="text-xs text-gray-400">{idea.departamento.nome}</span>}
                      <span className="text-xs text-gray-400">{idea.votes.length} votos</span>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{idea.titulo}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{idea.descricao}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <span>Por {idea.autor.nome}</span>
                      <span>·</span>
                      <span>{new Date(idea.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {Object.entries(actionLabels).map(([action, { label, color, emoji }]) => (
                      <button
                        key={action}
                        onClick={() => { setModal({ idea, action }); setJustificativa(''); setExecutorId(''); }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-medium rounded-lg transition-colors ${color}`}
                      >
                        {emoji} {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-display font-semibold text-gray-900">
                {actionLabels[modal.action].emoji} {actionLabels[modal.action].label}
              </h3>
              <p className="text-sm text-gray-500 mt-1">"{modal.idea.titulo}"</p>
            </div>
            <div className="p-6 space-y-4">
              {modal.action === 'execute' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Designar Executor</label>
                  <select value={executorId} onChange={e => setExecutorId(e.target.value)} className="input-field" required>
                    <option value="">Selecione um executor...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Justificativa {modal.action !== 'approve' ? '*' : '(opcional)'}</label>
                <textarea
                  value={justificativa}
                  onChange={e => setJustificativa(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Adicione uma justificativa..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAction}
                  disabled={processing || (modal.action === 'execute' && !executorId)}
                  className={`flex-1 py-2.5 text-white font-medium rounded-lg transition-colors disabled:opacity-50 ${actionLabels[modal.action].color}`}
                >
                  {processing ? 'Processando...' : 'Confirmar'}
                </button>
                <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
