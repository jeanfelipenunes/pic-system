'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminConfigPage() {
  const [form, setForm] = useState({
    'pontos.ideia_cadastrada': '10',
    'pontos.ideia_aprovada': '50',
    'pontos.ideia_implementada': '200',
    'pontos.receber_voto': '5',
    'votos.limite_mensal': '10',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  async function fetchConfig() {
    setLoading(true);
    const res = await fetch('/api/admin/config');
    if (res.ok) {
      const data = await res.json();
      setForm(prev => ({ ...prev, ...Object.fromEntries(Object.entries(data).filter(([k]) => k.startsWith('pontos.') || k.startsWith('votos.'))) }));
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch('/api/admin/config', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    if (res.ok) toast.success('Configurações salvas!');
    else toast.error('Erro ao salvar');
  }

  const pointFields = [
    { key: 'pontos.ideia_cadastrada', label: 'Ideia cadastrada', icon: '💡' },
    { key: 'pontos.ideia_aprovada', label: 'Ideia aprovada', icon: '✅' },
    { key: 'pontos.ideia_implementada', label: 'Ideia implementada', icon: '🚀' },
    { key: 'pontos.receber_voto', label: 'Receber um voto', icon: '⬆️' },
  ];

  return (
    <div>
      <Header title="Configurações Gerais" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900">Configurações</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><svg className="animate-spin w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
        ) : (
          <div className="max-w-lg space-y-6">
            <div className="card p-6">
              <h3 className="section-title mb-4">Sistema de Pontuação</h3>
              <div className="space-y-3">
                {pointFields.map(({ key, label, icon }) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-lg w-6">{icon}</span>
                    <label className="text-sm text-gray-700 flex-1">{label}</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={form[key as keyof typeof form]}
                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                        className="input-field w-20 text-center"
                      />
                      <span className="text-xs text-gray-400">pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="section-title mb-4">Sistema de Votação</h3>
              <div className="flex items-center gap-3">
                <span className="text-lg">🗳️</span>
                <label className="text-sm text-gray-700 flex-1">Votos disponíveis por mês</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    value={form['votos.limite_mensal']}
                    onChange={e => setForm(p => ({ ...p, 'votos.limite_mensal': e.target.value }))}
                    className="input-field w-20 text-center"
                  />
                  <span className="text-xs text-gray-400">votos</span>
                </div>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar Configurações'}</button>
          </div>
        )}
      </div>
    </div>
  );
}
