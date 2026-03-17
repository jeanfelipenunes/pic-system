'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import toast from 'react-hot-toast';

interface ReportData {
  totalIdeas: number;
  ideiasImplementadas: number;
  ideiasPorStatus: { status: string; total: number; cor: string }[];
  ideiasPorDepartamento: { departamento: string; total: number }[];
  rankingUsuarios: { nome: string; pontos: number; departamento?: string }[];
  rankingDepartamentos: { nome: string; pontos: number; ideias: number }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState('');

  useEffect(() => { fetchReports(); }, []);

  async function fetchReports() {
    setLoading(true);
    const [summaryRes, deptRes, rankRes] = await Promise.all([
      fetch('/api/reports/summary'),
      fetch('/api/reports/departments'),
      fetch('/api/reports/ranking'),
    ]);
    if (summaryRes.ok && deptRes.ok && rankRes.ok) {
      const summary = await summaryRes.json();
      const dept = await deptRes.json();
      const rank = await rankRes.json();
      setData({ ...summary, ...dept, ...rank });
    }
    setLoading(false);
  }

  async function handleAIReport() {
    if (!data) return;
    setAiLoading(true);
    setAiReport('');
    try {
      const res = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalIdeias: data.totalIdeas,
          ideiasImplementadas: data.ideiasImplementadas,
          ideiasPorStatus: data.ideiasPorStatus.map(s => ({ status: s.status, total: s.total })),
          ideiasPorDepartamento: data.ideiasPorDepartamento,
          topUsuarios: data.rankingUsuarios.slice(0, 5),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const d = await res.json();
      setAiReport(d.report);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao gerar relatório IA');
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) return (
    <div>
      <Header title="Relatórios" />
      <div className="flex items-center justify-center h-64">
        <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    </div>
  );

  return (
    <div>
      <Header title="Relatórios" />
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 text-center">
            <p className="text-3xl font-display font-bold text-blue-600">{data?.totalIdeas || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total de Ideias</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-3xl font-display font-bold text-green-600">{data?.ideiasImplementadas || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Implementadas</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-3xl font-display font-bold text-purple-600">
              {data?.totalIdeas ? ((data.ideiasImplementadas / data.totalIdeas) * 100).toFixed(0) : 0}%
            </p>
            <p className="text-sm text-gray-500 mt-1">Taxa de Implementação</p>
          </div>
          <div className="card p-5 text-center">
            <p className="text-3xl font-display font-bold text-orange-600">{data?.rankingUsuarios?.length || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Colaboradores Ativos</p>
          </div>
        </div>

        {/* AI Report Button */}
        <div className="flex items-center justify-between">
          <h2 className="section-title">Análises</h2>
          <button onClick={handleAIReport} disabled={aiLoading} className="btn-primary">
            {aiLoading ? (
              <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Gerando...</>
            ) : '✨ Gerar Análise com IA'}
          </button>
        </div>

        {/* AI Report */}
        {aiReport && (
          <div className="card p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">✨</span>
              <h3 className="font-display font-semibold text-purple-900">Análise gerada por IA</h3>
            </div>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
              {aiReport}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status breakdown */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Ideias por Status</h3>
            <div className="space-y-3">
              {data?.ideiasPorStatus.map(s => (
                <div key={s.status} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.cor }} />
                  <span className="text-sm text-gray-700 flex-1">{s.status}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${data.totalIdeas ? (s.total / data.totalIdeas) * 100 : 0}%`, backgroundColor: s.cor }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-4 text-right">{s.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dept breakdown */}
          <div className="card p-5">
            <h3 className="section-title mb-4">Ideias por Departamento</h3>
            <div className="space-y-3">
              {data?.ideiasPorDepartamento.sort((a, b) => b.total - a.total).slice(0, 8).map(d => (
                <div key={d.departamento} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 flex-1 truncate">{d.departamento}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${data.totalIdeas ? (d.total / data.totalIdeas) * 100 : 0}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-4 text-right">{d.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User ranking */}
          <div className="card p-5">
            <h3 className="section-title mb-4">🏆 Ranking de Colaboradores</h3>
            <div className="space-y-2">
              {data?.rankingUsuarios.map((u, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-500'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.nome}</p>
                    {u.departamento && <p className="text-xs text-gray-400 truncate">{u.departamento}</p>}
                  </div>
                  <span className="text-sm font-bold text-blue-600 shrink-0">{u.pontos} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dept ranking */}
          <div className="card p-5">
            <h3 className="section-title mb-4">🏢 Ranking de Departamentos</h3>
            <div className="space-y-2">
              {data?.rankingDepartamentos.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-50 text-gray-500'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{d.nome}</p>
                    <p className="text-xs text-gray-400">{d.ideias} ideias implementadas</p>
                  </div>
                  <span className="text-sm font-bold text-green-600 shrink-0">{d.pontos} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
