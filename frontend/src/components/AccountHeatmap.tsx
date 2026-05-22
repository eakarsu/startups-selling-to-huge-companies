import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Grid3x3, RefreshCw } from 'lucide-react';

type Cell = { signal: string; value: number; score: number };
type Row = {
  account_id: number;
  account_name: string;
  tier: string | null;
  industry: string | null;
  cells: Cell[];
};
type Resp = {
  accounts: { id: number; name: string; tier: string | null }[];
  signals: string[];
  matrix: Row[];
  legend: Record<string, string>;
};

function cellColor(score: number) {
  // Score 0..100 -> heat scale (cool blue -> warm red)
  if (score >= 80) return 'bg-rose-600 text-white';
  if (score >= 60) return 'bg-orange-500 text-white';
  if (score >= 40) return 'bg-amber-500 text-gray-900';
  if (score >= 20) return 'bg-sky-700 text-white';
  if (score > 0) return 'bg-sky-900 text-sky-200';
  return 'bg-gray-800 text-gray-500';
}

function fmtVal(signal: string, v: number) {
  if (signal === 'Pipeline $') {
    if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  }
  if (signal === 'Recency') return `${v}d`;
  return String(v);
}

export default function AccountHeatmap() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const d = await apiFetch('/custom-views/account-heatmap');
      setData(d);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load account heatmap');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <section data-testid="account-heatmap" className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-600/20 text-rose-400 flex items-center justify-center">
            <Grid3x3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Account x Signal Heatmap</h2>
            <p className="text-xs text-gray-400">Engagement signals across top enterprise accounts</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-md disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      {err && <div className="text-rose-400 text-sm mb-3">Error: {err}</div>}

      {data && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr>
                <th className="px-2 py-2 text-left text-gray-500 font-medium">Account</th>
                {data.signals.map(s => (
                  <th key={s} className="px-2 py-2 text-center text-gray-500 font-medium">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.matrix.map(row => (
                <tr key={row.account_id} className="border-t border-gray-800">
                  <td className="px-2 py-2 whitespace-nowrap">
                    <div className="text-white font-medium">{row.account_name}</div>
                    <div className="text-[10px] text-gray-500">{row.tier || '—'} · {row.industry || '—'}</div>
                  </td>
                  {row.cells.map(c => (
                    <td key={c.signal} className="px-1 py-1">
                      <div
                        className={`rounded text-center px-2 py-1.5 font-medium ${cellColor(c.score)}`}
                        title={`${row.account_name} — ${c.signal}: ${c.value} (score ${c.score})`}
                      >
                        <div>{fmtVal(c.signal, c.value)}</div>
                        <div className="text-[10px] opacity-80">{c.score}</div>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              {data.matrix.length === 0 && (
                <tr>
                  <td colSpan={data.signals.length + 1} className="text-center py-6 text-gray-500">
                    No accounts available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-3 text-[10px] text-gray-500 flex items-center gap-3">
            <span>Legend:</span>
            <span className="px-2 py-0.5 bg-sky-900 text-sky-200 rounded">cold</span>
            <span className="px-2 py-0.5 bg-sky-700 text-white rounded">cool</span>
            <span className="px-2 py-0.5 bg-amber-500 text-gray-900 rounded">warm</span>
            <span className="px-2 py-0.5 bg-orange-500 text-white rounded">hot</span>
            <span className="px-2 py-0.5 bg-rose-600 text-white rounded">hottest</span>
          </div>
        </div>
      )}
    </section>
  );
}
