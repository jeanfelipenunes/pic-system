'use client';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Link from 'next/link';

const sections = [
  { href: '/admin/users', icon: '👥', title: 'Usuários', desc: 'Gerenciar usuários, roles e permissões' },
  { href: '/admin/departments', icon: '🏢', title: 'Departamentos', desc: 'Criar e editar departamentos' },
  { href: '/admin/tags', icon: '🏷️', title: 'Tags', desc: 'Gerenciar tags disponíveis' },
  { href: '/admin/statuses', icon: '🔄', title: 'Status das Ideias', desc: 'Configurar fluxo de status' },
  { href: '/admin/ldap', icon: '🔗', title: 'Active Directory', desc: 'Configurar integração LDAP/AD' },
  { href: '/admin/ai', icon: '✨', title: 'Configuração IA', desc: 'Provedor e chaves de API de IA' },
  { href: '/admin/email', icon: '📧', title: 'Configuração Email', desc: 'Servidor SMTP e notificações' },
  { href: '/admin/config', icon: '⚙️', title: 'Configurações Gerais', desc: 'Pontuação, votos e parâmetros do sistema' },
];

export default function AdminPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;

  if (role !== 'admin') {
    return (
      <div>
        <Header title="Administração" />
        <div className="p-6 flex items-center justify-center">
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">🔒</p>
            <p className="text-gray-500">Acesso restrito a administradores.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Administração" />
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sections.map((s) => (
            <Link key={s.href} href={s.href} className="card p-5 hover:shadow-md hover:border-blue-100 transition-all group">
              <span className="text-3xl mb-3 block">{s.icon}</span>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{s.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
