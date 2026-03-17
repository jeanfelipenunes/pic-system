'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Tag { id: string; nome: string; _count?: { ideas: number }; }

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTags(); }, []);

  async function fetchTags() {
    setLoading(true);
    const res = await fetch('/api/tags?counts=true');
    if (res.ok) setTags((await res.json()).tags || []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!nome.trim()) return;
    setSaving(true);
    const res = await fetch('/api/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: nome.trim().toLowerCase() }) });
    if (res.ok) { toast.success('Tag criada!'); setNome(''); fetchTags(); }
    else toast.error((await res.json()).error || 'Erro');
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta tag?')) return;
    const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Tag excluída!'); fetchTags(); }
    else toast.error('Erro ao excluir');
  }

  return (
    <div>
      <Header title="Tags" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900">Tags</span>
        </div>

        <div className="card p-5 mb-6 max-w-md">
          <h3 className="section-title mb-3">Nova Tag</h3>
          <div className="flex gap-2">
            <input value={nome} onChange={e => setNome(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} className="input-field" placeholder="nome-da-tag" />
            <button onClick={handleCreate} disabled={saving || !nome.trim()} className="btn-primary shrink-0">Criar</button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><svg className="animate-spin w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map(t => (
              <div key={t.id} className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-full">
                <span className="text-sm font-medium text-gray-700">#{t.nome}</span>
                {t._count?.ideas !== undefined && <span className="text-xs text-gray-400">{t._count.ideas}</span>}
                <button onClick={() => handleDelete(t.id)} className="text-gray-300 hover:text-red-500 transition-colors ml-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
