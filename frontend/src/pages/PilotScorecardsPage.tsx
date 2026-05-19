import { useEffect, useState } from 'react';
import { Award, RefreshCcw, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../api';

type PilotRow = { id: number; pilot_name: string; deal_id: number; deal_title: string; deal_value: number; deal_stage: string; company_id: number; company_name: string; company_tier: string; start_date: string; end_date: string; budget_usd: number; exec_sponsor: string; status: string; conversion_target_arr_usd: number; success_criteria: string; metric_count: number };
type Metric = { id: number; metric_name: string; target_value: number; current_value: number; unit: string; threshold_pct: number; achievement_pct?: number; pass?: boolean };
type PilotDetail = { pilot: PilotRow; metrics: Metric[]; metrics_passing: number; metrics_total: number; score: number };
type Funnel = { total_pilots: number; active: number; completed: number; passing_75pct: number; total_budget_usd: number; total_target_arr_usd: number; converted_value_usd: number; avg_budget_per_pilot_usd: number; arr_to_budget_multiple: number; conversion_pass_rate_pct: number };
type AtRisk = { id: number; pilot_name: string; company_name: string; deal_title: string; deal_value: number; exec_sponsor: string; score: number; metrics_passing: number; metrics_total: number; failing: Metric[] };

const statusColor: Record<string, string> = { active: 'bg-amber-900/50 text-amber-300', completed: 'bg-green-900/50 text-green-300', cancelled: 'bg-gray-800 text-gray-400' };

export default function PilotScorecardsPage() {
  const [pilots, setPilots] = useState<PilotRow[]>([]);
  const [activePilotId, setActivePilotId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PilotDetail | null>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [atRisk, setAtRisk] = useState<AtRisk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadAll() {
    setLoading(true); setError('');
    try {
      const [p, f, r] = await Promise.all([
        apiFetch('/deep-pilot-scorecards/pilots'),
        apiFetch('/deep-pilot-scorecards/conversion-funnel'),
        apiFetch('/deep-pilot-scorecards/at-risk')
      ]);
      setPilots(p); setFunnel(f); setAtRisk(r);
      if (p.length && !activePilotId) setActivePilotId(p[0].id);
    } catch (e: any) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  }

  async function loadDetail(id: number) {
    try {
      const d = await apiFetch(`/deep-pilot-scorecards/pilots/${id}`);
      setDetail(d);
    } catch (e: any) { setError(e.message); }
  }

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (activePilotId) loadDetail(activePilotId); }, [activePilotId]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Pilot Success Scorecards</h1>
            <p className="text-gray-400 text-sm">Track POC metrics against success criteria. Drive pilot → MSA conversion economics.</p>
          </div>
        </div>
        <button onClick={loadAll} disabled={loading} className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Reload
        </button>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      {/* Funnel stats */}
      {funnel && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="text-xs text-gray-400">Pilots</div>
            <div className="text-2xl font-bold text-white">{funnel.total_pilots}</div>
            <div className="text-xs text-gray-500">{funnel.active} active · {funnel.completed} done</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="text-xs text-gray-400">Pass-rate ≥75%</div>
            <div className="text-2xl font-bold text-green-400">{funnel.conversion_pass_rate_pct}%</div>
            <div className="text-xs text-gray-500">{funnel.passing_75pct} of {funnel.total_pilots}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="text-xs text-gray-400">Pilot budget</div>
            <div className="text-2xl font-bold text-white">${(funnel.total_budget_usd / 1_000).toFixed(0)}K</div>
            <div className="text-xs text-gray-500">avg ${(funnel.avg_budget_per_pilot_usd / 1_000).toFixed(0)}K</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="text-xs text-gray-400">Target ARR</div>
            <div className="text-2xl font-bold text-amber-300">${(funnel.total_target_arr_usd / 1_000_000).toFixed(1)}M</div>
            <div className="text-xs text-gray-500">{funnel.arr_to_budget_multiple}x budget</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
            <div className="text-xs text-gray-400">Converted (closed-won)</div>
            <div className="text-2xl font-bold text-emerald-300">${(funnel.converted_value_usd / 1_000_000).toFixed(1)}M</div>
            <div className="text-xs text-gray-500">deal value</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Pilots</h2>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {pilots.map(p => (
              <button key={p.id} onClick={() => setActivePilotId(p.id)} className={`w-full text-left bg-gray-800/40 hover:bg-gray-800 rounded-lg p-3 border ${activePilotId === p.id ? 'border-amber-500' : 'border-gray-700'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-white text-sm">{p.pilot_name}</div>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColor[p.status] || 'bg-gray-800 text-gray-400'}`}>{p.status}</span>
                </div>
                <div className="text-xs text-gray-500">{p.company_name} · {p.company_tier}</div>
                <div className="text-xs text-amber-300 mt-1">${p.budget_usd ? (p.budget_usd / 1_000).toFixed(0) : 0}K budget · ${(p.conversion_target_arr_usd / 1_000_000).toFixed(1)}M target ARR</div>
                <div className="text-xs text-gray-500">{p.metric_count} metrics tracked</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          {detail ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{detail.pilot.pilot_name}</h2>
                  <div className="text-xs text-gray-500">{detail.pilot.company_name} · sponsor: {detail.pilot.exec_sponsor}</div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${detail.score >= 75 ? 'text-green-400' : detail.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{detail.score}%</div>
                  <div className="text-xs text-gray-500">{detail.metrics_passing} / {detail.metrics_total} passing</div>
                </div>
              </div>
              {detail.pilot.success_criteria && (
                <div className="text-xs text-gray-400 italic mb-3 bg-gray-800/40 rounded p-2">{detail.pilot.success_criteria}</div>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                    <th className="py-2 pr-2">Metric</th>
                    <th className="py-2 pr-2 text-right">Target</th>
                    <th className="py-2 pr-2 text-right">Current</th>
                    <th className="py-2 pr-2 text-right">%</th>
                    <th className="py-2 pr-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.metrics.map((m: Metric) => (
                    <tr key={m.id} className="border-b border-gray-800/60">
                      <td className="py-2 pr-2 text-gray-200">{m.metric_name}</td>
                      <td className="py-2 pr-2 text-right text-gray-400">{m.target_value} {m.unit}</td>
                      <td className="py-2 pr-2 text-right text-white">{m.current_value} {m.unit}</td>
                      <td className={`py-2 pr-2 text-right font-bold ${(m.achievement_pct ?? 0) >= (m.threshold_pct ?? 100) ? 'text-green-400' : 'text-red-400'}`}>{m.achievement_pct}%</td>
                      <td className="py-2 pr-2">
                        {m.pass
                          ? <span className="text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded">PASS</span>
                          : <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded">FAIL</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : <div className="text-gray-500 text-sm">Pick a pilot</div>}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" />At-risk pilots ({atRisk.length})</h2>
        {atRisk.length === 0 ? <div className="text-sm text-gray-500">No at-risk pilots.</div> :
        <div className="space-y-3">
          {atRisk.map(p => (
            <div key={p.id} className="bg-gray-800/40 rounded-lg p-3 border border-red-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white">{p.pilot_name} <span className="text-xs text-gray-500">· {p.company_name}</span></div>
                  <div className="text-xs text-gray-500">Sponsor: {p.exec_sponsor} · Deal value ${(p.deal_value / 1_000_000).toFixed(1)}M</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-400">{p.score}%</div>
                  <div className="text-xs text-gray-500">{p.metrics_passing} / {p.metrics_total}</div>
                </div>
              </div>
              {p.failing.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.failing.map((f, i) => (
                    <span key={i} className="text-xs bg-red-900/30 text-red-200 px-2 py-0.5 rounded border border-red-800">
                      {f.metric_name}: {f.current_value}/{f.target_value} ({f.achievement_pct}%)
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}
