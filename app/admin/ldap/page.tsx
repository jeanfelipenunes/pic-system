'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminLDAPPage() {
  const [form, setForm] = useState({ url: '', base_dn: '', bind_user: '', bind_password: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced?: number; errors?: string[] } | null>(null);

  useEffect(() => { fetchConfig(); }, []);

  async function fetchConfig() {
    setLoading(true);
    const res = await fetch('/api/admin/config');
    if (res.ok) {
      const data = await res.json();
      setForm({
        url: data['ldap.url'] || '',
        base_dn: data['ldap.base_dn'] || '',
        bind_user: data['ldap.bind_user'] || '',
        bind_password: data['ldap.bind_password'] || '',
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'ldap.url': form.url,
        'ldap.base_dn': form.base_dn,
        'ldap.bind_user': form.bind_user,
        'ldap.bind_password': form.bind_password,
      }),
    });
    setSaving(false);
    if (res.ok) toast.success('Configurações salvas!');
    else toast.error('Erro ao salvar');
  }

  async function handleTest() {
    setTesting(true);
    const res = await fetch('/api/admin/ldap/test', { method: 'POST' });
    const data = await res.json();
    setTesting(false);
    if (data.success) toast.success(data.message);
    else toast.error(data.message);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncResult(null);
    const res = await fetch('/api/admin/ldap/sync', { method: 'POST' });
    const data = await res.json();
    setSyncing(false);
    setSyncResult(data);
    if (data.errors?.length === 0) toast.success(`${data.synced} usuários sincronizados!`);
    else toast.error(`Sincronização parcial: ${data.synced} usuários`);
  }

  return (
    <div>
      <Header title="Configuração LDAP / AD" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900">Active Directory</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><svg className="animate-spin w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
        ) : (
          <div className="max-w-xl space-y-6">
            <div className="card p-6 space-y-4">
              <h3 className="section-title">Conexão LDAP</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">URL do servidor LDAP</label>
                <input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} className="input-field" placeholder="ldap://ldap.empresa.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Base DN</label>
                <input value={form.base_dn} onChange={e => setForm(p => ({ ...p, base_dn: e.target.value }))} className="input-field" placeholder="dc=empresa,dc=com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuário de bind</label>
                <input value={form.bind_user} onChange={e => setForm(p => ({ ...p, bind_user: e.target.value }))} className="input-field" placeholder="cn=admin,dc=empresa,dc=com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha de bind</label>
                <input type="password" value={form.bind_password} onChange={e => setForm(p => ({ ...p, bind_password: e.target.value }))} className="input-field" placeholder="••••••••" />
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar Configurações'}</button>
                <button onClick={handleTest} disabled={testing} className="btn-secondary">{testing ? 'Testando...' : '🔗 Testar Conexão'}</button>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="section-title mb-2">Sincronização de Usuários</h3>
              <p className="text-sm text-gray-500 mb-4">Sincroniza usuários e departamentos do Active Directory com o banco de dados. Executado automaticamente às 02h diariamente.</p>
              <button onClick={handleSync} disabled={syncing} className="btn-secondary">
                {syncing ? (
                  <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Sincronizando...</>
                ) : '🔄 Sincronizar Agora'}
              </button>
              {syncResult && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                  <p className="font-medium text-gray-900">{syncResult.synced} usuários sincronizados</p>
                  {syncResult.errors && syncResult.errors.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {syncResult.errors.map((e, i) => <li key={i} className="text-red-600">{e}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
