'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Notification {
  id: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  created_at: string;
}

export default function Header({ title }: { title?: string }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {}
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
  }

  const unread = notifications.filter((n) => !n.lida).length;

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div>
        {title && <h1 className="page-title">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen(!open)}
            className="relative p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-100 rounded-xl shadow-lg z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-sm text-gray-900">Notificações</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700">
                    Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">
                    Nenhuma notificação
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-gray-50 last:border-0 text-sm ${!n.lida ? 'bg-blue-50/50' : ''}`}
                    >
                      <p className={`text-gray-700 leading-snug ${!n.lida ? 'font-medium' : ''}`}>
                        {n.mensagem}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
            {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {session?.user?.name}
          </span>
        </div>
      </div>
    </header>
  );
}
