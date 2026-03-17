'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import toast from 'react-hot-toast';

interface Dept { id: string; nome: string; }
interface Tag { id: string; nome: string; }

export default function NewIdeaPage() {
  const router = useRouter();
  const [depts, setDepts] = useState<Dept[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiResult, setAiResult] = useState<{ descricao?: string; solucao?: string; beneficio?: string } | null>(null);

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    problema: '',
    solucao: '',
    beneficio: '',
    departamento_id: '',
  });

  useEffect(() => {
    fetch('/api/departments').then(r => r.json()).then(d => setDepts(d.departments || []));
    fetch('/api/tags').then(r => r.json()).then(d => setAllTags(d.tags || []));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleTag(tag: Tag) {
    setSelectedTags(prev =>
      prev.find(t => t.id === tag.id) ? prev.filter(t => t.id !== tag.id) : [...prev, tag]
    );
  }

  async function addNewTag() {
    if (!newTag.trim()) return;
    try {
      const res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: newTag.trim().toLowerCase() }),
      });
      if (res.ok) {
        const data = await res.json();
        setAllTags(prev => [...prev, data.tag]);
        setSelectedTags(prev => [...prev, data.tag]);
        setNewTag('');
      }
    } catch { toast.error('Erro ao criar tag'); }
  }

  async function handleAIHelp() {
    if (!form.titulo && !form.problema) {
      toast.error('Preencha pelo menos o título ou o problema para usar a IA.');
      return;
    }
    setAiLoading(true);
    setShowAiModal(true);
    setAiResult(null);
    try {
      const dept = depts.find(d => d.id === form.departamento_id);
      const res = await fetch('/api/ai/help-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: form.titulo, problema: form.problema, departamento: dept?.nome }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro');
      const data = await res.json();
      setAiResult(data);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao chamar IA');
      setShowAiModal(false);
    } finally {
      setAiLoading(false);
    }
  }

  function applyAiResult() {
    if (!aiResult) return;
    setForm(prev => ({
      ...prev,
      descricao: aiResult.descricao || prev.descricao,
      solucao: aiResult.solucao || prev.solucao,
      beneficio: aiResult.beneficio || prev.beneficio,
    }));
    setShowAiModal(false);
    toast.success('Sugestões da IA aplicadas!');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.descricao.trim()) {
      toast.error('Título e descrição são obrigatórios.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tags: selectedTags.map(t => t.id) }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro');
      const data = await res.json();
      toast.success('Ideia criada com sucesso!');
      router.push(`/ideas/${data.idea.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao criar ideia');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Header title="Nova Ideia" />
      <div className="p-6 max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basics */}
          <div className="card p-6 space-y-4">
            <h2 className="section-title">Informações Básicas</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Título *</label>
              <input name="titulo" value={form.titulo} onChange={handleChange} className="input-field" placeholder="Descreva sua ideia em uma frase" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Departamento</label>
              <select name="departamento_id" value={form.departamento_id} onChange={handleChange} className="input-field">
                <option value="">Selecione...</option>
                {depts.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Descrição *</label>
                <button type="button" onClick={handleAIHelp} className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors">
                  ✨ Ajuda da IA
                </button>
              </div>
              <textarea name="descricao" value={form.descricao} onChange={handleChange} rows={4} className="input-field resize-none" placeholder="Descreva sua ideia em detalhes..." required />
            </div>
          </div>

          {/* Details */}
          <div className="card p-6 space-y-4">
            <h2 className="section-title">Detalhamento</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Problema Identificado</label>
              <textarea name="problema" value={form.problema} onChange={handleChange} rows={3} className="input-field resize-none" placeholder="Qual problema esta ideia resolve?" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Solução Proposta</label>
              <textarea name="solucao" value={form.solucao} onChange={handleChange} rows={3} className="input-field resize-none" placeholder="Como você propõe resolver o problema?" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Benefícios Esperados</label>
              <textarea name="beneficio" value={form.beneficio} onChange={handleChange} rows={3} className="input-field resize-none" placeholder="Quais benefícios esta ideia trará?" />
            </div>
          </div>

          {/* Tags */}
          <div className="card p-6">
            <h2 className="section-title mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {allTags.map(tag => (
                <button key={tag.id} type="button" onClick={() => toggleTag(tag)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${selectedTags.find(t => t.id === tag.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                  #{tag.nome}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewTag())} className="input-field text-sm" placeholder="Nova tag..." />
              <button type="button" onClick={addNewTag} className="btn-secondary text-sm">Adicionar</button>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Criando...' : '💡 Criar Ideia'}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <h3 className="font-display font-semibold text-gray-900">Sugestões da IA</h3>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {aiLoading ? (
                <div className="flex flex-col items-center py-8">
                  <svg className="animate-spin w-8 h-8 text-purple-600 mb-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-gray-500 text-sm">Gerando sugestões...</p>
                </div>
              ) : aiResult ? (
                <div className="space-y-4">
                  {aiResult.descricao && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Descrição</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{aiResult.descricao}</p>
                    </div>
                  )}
                  {aiResult.solucao && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Solução</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{aiResult.solucao}</p>
                    </div>
                  )}
                  {aiResult.beneficio && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Benefícios</p>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{aiResult.beneficio}</p>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button onClick={applyAiResult} className="btn-primary flex-1">Aplicar sugestões</button>
                    <button onClick={() => setShowAiModal(false)} className="btn-secondary">Descartar</button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
