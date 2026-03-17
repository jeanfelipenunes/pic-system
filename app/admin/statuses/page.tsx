'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Status { id: string; nome: string; ordem: number; cor: string; }

const COLORS = ['#6B7280','#F59E0B','#3B82F6','#F97316','#10B981','#EF4444','#374151','#8B5CF6','#EC4899'];

export default function AdminStatusesPage() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Status | null>(null);
  const [form, setForm] = useState({ nome: '', cor: '#6B7280' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchStatuses(); }, []);

  async function fetchStatuses() {
    setLoading(true);
    const res = await fetch('/api/statuses');
    if (res.ok) setStatuses((await res.json()).statuses || []);
    setLoading(false);
  }

  function openCreate() { setEditing(null); setForm({ nome: '', cor: '#6B7280' }); setModal(true); }
  function openEdit(s: Status) { setEditing(s); setForm({ nome: s.nome, cor: s.cor }); setModal(true); }

  async function handleSave() {
    if (!form.nome.trim()) { toast.error('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/statuses/${editing.id}` : '/api/statuses';
      const method = editing ? 'PATCH' : 'POST';
      const body = editing ? form : { ...form, ordem: statuses.length + 1 };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(editing ? 'Status atualizado!' : 'Status criado!');
      setModal(false);
      fetchStatuses();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erro'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este status?')) return;
    const res = await fetch(`/api/statuses/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Status excluído!'); fetchStatuses(); }
    else toast.error((await res.json()).error || 'Erro ao excluir');
  }

  return (
    <div>
      <Header title="Status das Ideias" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-900">Status</span>
          </div>
          <button onClick={openCreate} className="btn-primary">+ Novo Status</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><svg className="animate-spin w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
        ) : (
          <div className="card overflow-hidden max-w-lg">
            <div className="divide-y divide-gray-50">
              {statuses.sort((a, b) => a.ordem - b.ordem).map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <span className="w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: s.cor }} />
                  <span className="text-sm font-medium text-gray-900 flex-1">{s.nome}</span>
                  <span className="text-xs text-gray-400 w-8">#{s.ordem}</span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-display font-semibold text-gray-900">{editing ? 'Editar' : 'Novo'} Status</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
                <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} className="input-field" placeholder="Ex: Em análise" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, cor: c }))} className={`w-7 h-7 rounded-full transition-transform ${form.cor === c ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 px-3 py-2.5 rounded-lg">
                <span className="w-5 h-5 rounded-full" style={{ backgroundColor: form.cor }} />
                <span className="text-sm font-medium" style={{ color: form.cor }}>{form.nome || 'Prévia'}</span>
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
