'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Dept { id: string; nome: string; descricao?: string; responsavel?: { nome: string }; _count?: { users: number; ideas: number }; }

export default function AdminDepartmentsPage() {
  const [depts, setDepts] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Dept | null>(null);
  const [form, setForm] = useState({ nome: '', descricao: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchDepts(); }, []);

  async function fetchDepts() {
    setLoading(true);
    const res = await fetch('/api/departments?counts=true');
    if (res.ok) setDepts((await res.json()).departments || []);
    setLoading(false);
  }

  function openCreate() { setEditing(null); setForm({ nome: '', descricao: '' }); setModal(true); }
  function openEdit(d: Dept) { setEditing(d); setForm({ nome: d.nome, descricao: d.descricao || '' }); setModal(true); }

  async function handleSave() {
    if (!form.nome.trim()) { toast.error('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/departments/${editing.id}` : '/api/departments';
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(editing ? 'Departamento atualizado!' : 'Departamento criado!');
      setModal(false);
      fetchDepts();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erro'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este departamento?')) return;
    const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Departamento excluído!'); fetchDepts(); }
    else toast.error((await res.json()).error || 'Erro ao excluir');
  }

  return (
    <div>
      <Header title="Departamentos" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-900">Departamentos</span>
          </div>
          <button onClick={openCreate} className="btn-primary">+ Novo Departamento</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {depts.map(d => (
              <div key={d.id} className="card p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">{d.nome}</h3>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(d)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                {d.descricao && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{d.descricao}</p>}
                <div className="flex gap-4 text-xs text-gray-400 pt-3 border-t border-gray-50">
                  <span>{d._count?.users || 0} colaboradores</span>
                  <span>{d._count?.ideas || 0} ideias</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-display font-semibold text-gray-900">{editing ? 'Editar' : 'Novo'} Departamento</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
                <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className="input-field" placeholder="Nome do departamento" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição</label>
                <textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} rows={3} className="input-field resize-none" placeholder="Descrição opcional..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Salvando...' : 'Salvar'}</button>
                <button onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
