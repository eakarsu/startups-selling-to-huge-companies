import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { BarChart3, RefreshCw } from 'lucide-react';

type Stage = {
  stage: string;
  deal_count: number;
  total_value: number;
  avg_probability: number;
  weighted_value: number;
  pct_of_pipeline: number;
  bar_pct: number;
};

type Resp = {
  stages: Stage[];
  summary: { total_deals: number; total_pipeline_value: number; total_weighted_value: number; stage_count: number };
};

const STAGE_COLORS: Record<string, string> = {
  prospecting: 'bg-slate-500',
  qualification: 'bg-sky-500',
  proposal: 'bg-indigo-500',
  negotiation: 'bg-amber-500',
  closed_won: 'bg-emerald-500',
  closed_lost: 'bg-rose-500',
  unknown: 'bg-gray-500'
};

function fmtMoney(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export default function DealStageChart() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const d = await apiFetch('/custom-views/deal-stage-chart');
      setData(d);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load deal stage chart');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <section data-testid="deal-stage-chart" className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Deal Stage Chart</h2>
            <p className="text-xs text-gray-400">Pipeline distribution across stages</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-md disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      {err && <div className="text-rose-400 text-sm mb-3">Error: {err}</div>}

      {data && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-500">Total deals</div>
              <div className="text-xl font-bold text-white">{data.summary.total_deals}</div>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-500">Pipeline</div>
              <div className="text-xl font-bold text-emerald-400">{fmtMoney(data.summary.total_pipeline_value)}</div>
            </div>
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-500">Weighted</div>
              <div className="text-xl font-bold text-amber-400">{fmtMoney(data.summary.total_weighted_value)}</div>
            </div>
          </div>

          <div className="space-y-3">
            {data.stages.map(s => {
              const color = STAGE_COLORS[s.stage] || 'bg-blue-500';
              return (
                <div key={s.stage}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${color}`}></span>
                      <span className="text-gray-200 font-medium capitalize">{s.stage.replace(/_/g, ' ')}</span>
                      <span className="text-gray-500">({s.deal_count} deals)</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300">
                      <span>{fmtMoney(s.total_value)}</span>
                      <span className="text-gray-500">{s.pct_of_pipeline}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-800 h-3 rounded">
                    <div className={`${color} h-3 rounded`} style={{ width: `${Math.max(2, s.bar_pct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
