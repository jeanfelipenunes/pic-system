'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import toast from 'react-hot-toast';

interface Idea {
  id: string;
  titulo: string;
  descricao: string;
  departamento?: { nome: string };
  autor: { nome: string };
  execution?: {
    plano_execucao?: string;
    resultado?: string;
    ganho_estimado?: number;
    ganho_real?: number;
    data_inicio?: string;
    data_fim?: string;
  };
}

export default function ExecutionPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Idea | null>(null);
  const [form, setForm] = useState({
    plano_execucao: '',
    resultado: '',
    ganho_estimado: '',
    ganho_real: '',
    data_inicio: '',
    data_fim: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchIdeas(); }, []);

  async function fetchIdeas() {
    setLoading(true);
    const res = await fetch('/api/ideas?execution=true');
    if (res.ok) setIdeas((await res.json()).ideas || []);
    setLoading(false);
  }

  function openModal(idea: Idea) {
    setSelected(idea);
    setForm({
      plano_execucao: idea.execution?.plano_execucao || '',
      resultado: idea.execution?.resultado || '',
      ganho_estimado: idea.execution?.ganho_estimado?.toString() || '',
      ganho_real: idea.execution?.ganho_real?.toString() || '',
      data_inicio: idea.execution?.data_inicio ? idea.execution.data_inicio.slice(0, 10) : '',
      data_fim: idea.execution?.data_fim ? idea.execution.data_fim.slice(0, 10) : '',
    });
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/ideas/${selected.id}/execution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ganho_estimado: form.ganho_estimado ? parseFloat(form.ganho_estimado) : undefined,
          ganho_real: form.ganho_real ? parseFloat(form.ganho_real) : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success('Execução salva com sucesso!');
      setSelected(null);
      fetchIdeas();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (role !== 'executor' && role !== 'admin') {
    return (
      <div>
        <Header title="Execução" />
        <div className="p-6 flex items-center justify-center">
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">🔒</p>
            <p className="text-gray-500">Acesso restrito a executores e administradores.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Execução de Ideias" />
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
            <p className="text-4xl mb-3">⚙️</p>
            <p className="text-gray-600 font-medium">Nenhuma ideia para executar.</p>
            <p className="text-gray-400 text-sm mt-1">Aguarde ideias serem designadas para você.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{ideas.length} ideia{ideas.length !== 1 ? 's' : ''} para executar</p>
            {ideas.map(idea => (
              <div key={idea.id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {idea.departamento && <span className="text-xs text-gray-400">{idea.departamento.nome}</span>}
                    </div>
                    <h3 className="font-semibold text-gray-900">{idea.titulo}</h3>
                    <p className="text-sm text-gray-500 mt-1">Por {idea.autor.nome}</p>
                    {idea.execution?.plano_execucao && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-400" />
                        <span className="text-xs text-orange-600 font-medium">Em execução</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => openModal(idea)} className="btn-primary shrink-0">
                    {idea.execution?.plano_execucao ? '✏️ Atualizar' : '▶ Iniciar Execução'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h3 className="font-display font-semibold text-gray-900">Registrar Execução</h3>
              <p className="text-sm text-gray-500 mt-1 truncate">{selected.titulo}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Plano de Execução</label>
                <textarea value={form.plano_execucao} onChange={e => setForm(p => ({ ...p, plano_execucao: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Descreva o plano..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data Início</label>
                  <input type="date" value={form.data_inicio} onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Data Fim</label>
                  <input type="date" value={form.data_fim} onChange={e => setForm(p => ({ ...p, data_fim: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ganho Estimado (R$)</label>
                  <input type="number" value={form.ganho_estimado} onChange={e => setForm(p => ({ ...p, ganho_estimado: e.target.value }))} className="input-field" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Ganho Real (R$)</label>
                  <input type="number" value={form.ganho_real} onChange={e => setForm(p => ({ ...p, ganho_real: e.target.value }))} className="input-field" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Resultado</label>
                <textarea value={form.resultado} onChange={e => setForm(p => ({ ...p, resultado: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Descreva o resultado obtido..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Salvando...' : 'Salvar'}</button>
                <button onClick={() => setSelected(null)} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
