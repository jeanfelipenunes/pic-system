'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface User { id: string; nome: string; email: string; role: string; pontos: number; ativo: boolean; departamento?: { nome: string }; }

const ROLES = ['usuario', 'gestor', 'executor', 'admin'];
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  gestor: 'bg-blue-100 text-blue-700',
  executor: 'bg-orange-100 text-orange-700',
  usuario: 'bg-gray-100 text-gray-700',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch('/api/users');
    if (res.ok) setUsers((await res.json()).users || []);
    setLoading(false);
  }

  async function updateRole(id: string, role: string) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (res.ok) { toast.success('Role atualizada!'); fetchUsers(); }
    else toast.error('Erro ao atualizar role');
  }

  async function toggleAtivo(id: string, ativo: boolean) {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ativo: !ativo }),
    });
    if (res.ok) { toast.success(ativo ? 'Usuário desativado' : 'Usuário ativado'); fetchUsers(); }
    else toast.error('Erro ao atualizar usuário');
  }

  const filtered = users.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header title="Usuários" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">← Admin</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm text-gray-900 font-medium">Usuários</span>
        </div>

        <div className="flex gap-3 mb-4">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuário..." className="input-field max-w-xs" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Departamento</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Pontos</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50 ${!u.ativo ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.nome}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{u.departamento?.nome || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={e => updateRole(u.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${ROLE_COLORS[u.role]}`}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 font-semibold text-blue-600 hidden sm:table-cell">{u.pontos}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleAtivo(u.id, u.ativo)} className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${u.ativo ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
