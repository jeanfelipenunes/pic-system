'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminAIPage() {
  const [form, setForm] = useState({ provider: 'openai', openai_key: '', gemini_key: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  async function fetchConfig() {
    setLoading(true);
    const res = await fetch('/api/admin/config');
    if (res.ok) {
      const data = await res.json();
      setForm({ provider: data['ai.provider'] || 'openai', openai_key: '', gemini_key: '' });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const body: Record<string, string> = { 'ai.provider': form.provider };
    const res = await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) toast.success('Configurações salvas!');
    else toast.error('Erro ao salvar');
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch('/api/ai/help-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: 'Teste de conexão', problema: 'Verificar se a API de IA está funcionando' }),
      });
      if (res.ok) toast.success('✅ IA funcionando corretamente!');
      else { const d = await res.json(); toast.error(d.error || 'Erro ao testar IA'); }
    } catch { toast.error('Erro de conexão'); }
    finally { setTesting(false); }
  }

  return (
    <div>
      <Header title="Configuração IA" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900">IA</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><svg className="animate-spin w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
        ) : (
          <div className="max-w-xl space-y-4">
            <div className="card p-6 space-y-4">
              <h3 className="section-title">Provedor de IA</h3>
              <div className="grid grid-cols-2 gap-3">
                {[{ value: 'openai', label: 'ChatGPT (OpenAI)', icon: '🤖' }, { value: 'gemini', label: 'Gemini (Google)', icon: '✨' }].map(p => (
                  <button key={p.value} onClick={() => setForm(prev => ({ ...prev, provider: p.value }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${form.provider === p.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className="text-2xl block mb-1">{p.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{p.label}</span>
                  </button>
                ))}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <p className="font-medium mb-1">⚠️ Configuração das chaves de API</p>
                <p>As chaves de API são configuradas via variáveis de ambiente <code className="bg-yellow-100 px-1 rounded">OPENAI_API_KEY</code> e <code className="bg-yellow-100 px-1 rounded">GEMINI_API_KEY</code> no arquivo <code className="bg-yellow-100 px-1 rounded">docker-compose.yml</code> por segurança.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
                <button onClick={handleTest} disabled={testing} className="btn-secondary">{testing ? 'Testando...' : '✨ Testar IA'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
