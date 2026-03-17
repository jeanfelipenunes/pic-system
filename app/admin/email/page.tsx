'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminEmailPage() {
  const [form, setForm] = useState({ host: 'smtp.office365.com', port: '587', user: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => { fetchConfig(); }, []);

  async function fetchConfig() {
    setLoading(true);
    const res = await fetch('/api/admin/config');
    if (res.ok) {
      const data = await res.json();
      setForm({ host: data['smtp.host'] || 'smtp.office365.com', port: data['smtp.port'] || '587', user: data['smtp.user'] || '', password: '' });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 'smtp.host': form.host, 'smtp.port': form.port, 'smtp.user': form.user, ...(form.password && { 'smtp.password': form.password }) }),
    });
    setSaving(false);
    if (res.ok) toast.success('Configurações salvas!');
    else toast.error('Erro ao salvar');
  }

  async function handleTest() {
    if (!testEmail) { toast.error('Informe um email para teste'); return; }
    setTesting(true);
    const res = await fetch('/api/admin/email/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: testEmail }) });
    const data = await res.json();
    setTesting(false);
    if (data.success) toast.success('Email de teste enviado!');
    else toast.error(data.message || 'Erro ao enviar email');
  }

  return (
    <div>
      <Header title="Configuração Email" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900">Email</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><svg className="animate-spin w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
        ) : (
          <div className="max-w-xl space-y-4">
            <div className="card p-6 space-y-4">
              <h3 className="section-title">Servidor SMTP</h3>
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                Padrão compatível com <strong>Microsoft Exchange Online</strong> (Office 365)
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Host SMTP</label>
                  <input value={form.host} onChange={e => setForm(p => ({ ...p, host: e.target.value }))} className="input-field" placeholder="smtp.office365.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Porta</label>
                  <input value={form.port} onChange={e => setForm(p => ({ ...p, port: e.target.value }))} className="input-field" placeholder="587" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuário / Email remetente</label>
                <input value={form.user} onChange={e => setForm(p => ({ ...p, user: e.target.value }))} className="input-field" placeholder="pic@empresa.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha {form.password === '' && form.user && <span className="text-gray-400">(deixe em branco para manter atual)</span>}</label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="input-field" placeholder="••••••••" />
              </div>
              <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar Configurações'}</button>
            </div>

            <div className="card p-6">
              <h3 className="section-title mb-3">Teste de Envio</h3>
              <div className="flex gap-2">
                <input value={testEmail} onChange={e => setTestEmail(e.target.value)} className="input-field" placeholder="destinatario@empresa.com" type="email" />
                <button onClick={handleTest} disabled={testing} className="btn-secondary shrink-0">{testing ? 'Enviando...' : '📧 Testar'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
