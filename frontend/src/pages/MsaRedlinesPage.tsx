import { useEffect, useState } from 'react';
import { Scale, RefreshCcw, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../api';

type Clause = { id: number; topic: string; clause_name: string; default_text: string; startup_position: string; risk_level: string; notes: string };
type Redline = { id: number; clause_id: number; company_id: number; company_name: string; company_tier: string; topic: string; clause_name: string; risk_level: string; buyer_position: string; startup_counter: string; outcome: string; negotiated_value: string; cycle_days: number };
type TopicSummary = { topic: string; accepted: number; open: number; rejected: number; total: number; avg_cycle_days: number | null; max_cycle_days: number | null };
type CycleRow = { company_id: number; company_name: string; tier: string; redlines: number; avg_cycle_days: number | null; open_count: number; pipeline_value_usd: number };

const riskColor: Record<string, string> = { high: 'text-red-400', medium: 'text-amber-400', low: 'text-green-400' };
const outcomeColor: Record<string, string> = { accepted: 'text-green-400', open: 'text-amber-400', rejected: 'text-red-400' };

export default function MsaRedlinesPage() {
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [redlines, setRedlines] = useState<Redline[]>([]);
  const [byTopic, setByTopic] = useState<TopicSummary[]>([]);
  const [cycleByCompany, setCycleByCompany] = useState<CycleRow[]>([]);
  const [topicFilter, setTopicFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadAll() {
    setLoading(true); setError('');
    try {
      const [cl, rl, tp, cy] = await Promise.all([
        apiFetch('/deep-msa-redlines/clauses'),
        apiFetch('/deep-msa-redlines/redlines'),
        apiFetch('/deep-msa-redlines/by-topic'),
        apiFetch('/deep-msa-redlines/cycle-analysis')
      ]);
      setClauses(cl); setRedlines(rl); setByTopic(tp); setCycleByCompany(cy);
    } catch (e: any) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadAll(); }, []);

  const filteredClauses = topicFilter ? clauses.filter(c => c.topic === topicFilter) : clauses;
  const filteredRedlines = topicFilter ? redlines.filter(r => r.topic === topicFilter) : redlines;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-fuchsia-600 to-rose-600 rounded-xl flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">MSA Redlines Library</h1>
            <p className="text-gray-400 text-sm">Catalog of standard MSA clauses + per-F100 redline negotiation history (indemnification cap, IP, audit, data residency).</p>
          </div>
        </div>
        <button onClick={loadAll} disabled={loading} className="bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Reload
        </button>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      {/* Topic summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <button onClick={() => setTopicFilter('')} className={`bg-gray-900 border ${!topicFilter ? 'border-rose-500' : 'border-gray-800'} rounded-lg p-3 text-left`}>
          <div className="text-xs text-gray-400">All topics</div>
          <div className="text-xl font-bold text-white">{byTopic.reduce((s, x) => s + x.total, 0)}</div>
        </button>
        {byTopic.map(t => (
          <button key={t.topic} onClick={() => setTopicFilter(t.topic)} className={`bg-gray-900 border ${topicFilter === t.topic ? 'border-rose-500' : 'border-gray-800'} rounded-lg p-3 text-left`}>
            <div className="text-xs text-gray-400 truncate">{t.topic}</div>
            <div className="text-xl font-bold text-white">{t.total}</div>
            <div className="text-xs text-gray-500">
              <span className="text-green-400">{t.accepted}</span> / <span className="text-amber-400">{t.open}</span>
              {t.avg_cycle_days && <span className="ml-1 text-gray-500">~{t.avg_cycle_days}d</span>}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Clauses{topicFilter ? ` — ${topicFilter}` : ''} ({filteredClauses.length})</h2>
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                  <th className="py-2 pr-2">Clause</th>
                  <th className="py-2 pr-2">Risk</th>
                  <th className="py-2 pr-2">Position</th>
                </tr>
              </thead>
              <tbody>
                {filteredClauses.map(c => (
                  <tr key={c.id} className="border-b border-gray-800/60 align-top">
                    <td className="py-2 pr-2">
                      <div className="text-white">{c.clause_name}</div>
                      <div className="text-xs text-gray-500">{c.topic}</div>
                    </td>
                    <td className={`py-2 pr-2 text-xs font-bold ${riskColor[c.risk_level] || 'text-gray-400'}`}>{c.risk_level}</td>
                    <td className={`py-2 pr-2 text-xs ${c.startup_position === 'pushback' ? 'text-amber-300' : 'text-gray-300'}`}>{c.startup_position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" />Cycle time by F100 buyer</h2>
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                  <th className="py-2 pr-2">Buyer</th>
                  <th className="py-2 pr-2 text-right">Redlines</th>
                  <th className="py-2 pr-2 text-right">Avg days</th>
                  <th className="py-2 pr-2 text-right">Open</th>
                  <th className="py-2 pr-2 text-right">Pipeline</th>
                </tr>
              </thead>
              <tbody>
                {cycleByCompany.map(c => (
                  <tr key={c.company_id} className="border-b border-gray-800/60">
                    <td className="py-2 pr-2">
                      <div className="text-white">{c.company_name}</div>
                      <div className="text-xs text-gray-500">{c.tier}</div>
                    </td>
                    <td className="py-2 pr-2 text-right text-gray-300">{c.redlines}</td>
                    <td className={`py-2 pr-2 text-right font-bold ${c.avg_cycle_days && c.avg_cycle_days > 40 ? 'text-red-400' : c.avg_cycle_days && c.avg_cycle_days > 25 ? 'text-amber-400' : 'text-green-400'}`}>
                      {c.avg_cycle_days ?? '—'}
                    </td>
                    <td className="py-2 pr-2 text-right text-amber-400">{c.open_count}</td>
                    <td className="py-2 pr-2 text-right text-gray-400 text-xs">${(c.pipeline_value_usd / 1_000_000).toFixed(1)}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">All redlines ({filteredRedlines.length})</h2>
        <div className="overflow-x-auto max-h-[70vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                <th className="py-2 pr-2">Buyer</th>
                <th className="py-2 pr-2">Clause</th>
                <th className="py-2 pr-2">Buyer position</th>
                <th className="py-2 pr-2">Counter</th>
                <th className="py-2 pr-2">Negotiated</th>
                <th className="py-2 pr-2">Cycle</th>
                <th className="py-2 pr-2">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {filteredRedlines.map(r => (
                <tr key={r.id} className="border-b border-gray-800/60 align-top">
                  <td className="py-2 pr-2 text-white">{r.company_name}</td>
                  <td className="py-2 pr-2">
                    <div className="text-gray-200">{r.clause_name}</div>
                    <div className="text-xs text-gray-500">{r.topic} · <span className={riskColor[r.risk_level]}>{r.risk_level}</span></div>
                  </td>
                  <td className="py-2 pr-2 text-xs text-gray-400 max-w-xs">{r.buyer_position}</td>
                  <td className="py-2 pr-2 text-xs text-gray-300 max-w-xs">{r.startup_counter}</td>
                  <td className="py-2 pr-2 text-xs text-amber-200">{r.negotiated_value || '—'}</td>
                  <td className="py-2 pr-2 text-xs text-gray-300">{r.cycle_days ? `${r.cycle_days}d` : '—'}</td>
                  <td className={`py-2 pr-2 text-xs font-bold ${outcomeColor[r.outcome] || 'text-gray-400'}`}>{r.outcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
