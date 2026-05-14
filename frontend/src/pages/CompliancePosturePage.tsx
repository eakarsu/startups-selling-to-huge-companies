import { useEffect, useState } from 'react';
import { ShieldHalf, RefreshCcw, TrendingUp } from 'lucide-react';
import { apiFetch } from '../api';

type Cert = { id: number; framework: string; status: string; auditor: string; issued_date: string | null; expires_date: string | null; scope: string; evidence_link: string; cost_usd: number; notes: string };
type Gap = { framework: string; startup_status: string; expires_date: string | null; cost_usd: number; deals_requiring: number; deals_blocked: number; blocked_pipeline_usd: number; total_pipeline_usd: number };
type Roi = { framework: string; status: string; cost_usd: number; pipeline_usd: number; deals_touched: number; roi_multiple: number | null };
type Expiring = { window_days: number; certifications: (Cert & { days_until_expiry: number })[] };

const statusColor: Record<string, string> = { active: 'bg-green-900/50 text-green-300 border-green-700', in_progress: 'bg-amber-900/50 text-amber-300 border-amber-700', planned: 'bg-gray-800 text-gray-400 border-gray-700', not_started: 'bg-red-900/50 text-red-300 border-red-700' };

export default function CompliancePosturePage() {
  const [certs, setCerts] = useState<Cert[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [rois, setRois] = useState<Roi[]>([]);
  const [expiring, setExpiring] = useState<Expiring | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadAll() {
    setLoading(true); setError('');
    try {
      const [c, g, r, e] = await Promise.all([
        apiFetch('/deep-compliance-posture/certifications'),
        apiFetch('/deep-compliance-posture/gap-vs-deals'),
        apiFetch('/deep-compliance-posture/cost-vs-revenue'),
        apiFetch('/deep-compliance-posture/expiring?days=180')
      ]);
      setCerts(c); setGaps(g); setRois(r); setExpiring(e);
    } catch (e: any) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadAll(); }, []);

  const active = certs.filter(c => c.status === 'active').length;
  const inProgress = certs.filter(c => c.status === 'in_progress').length;
  const totalSpend = certs.reduce((s, x) => s + (x.cost_usd || 0), 0);
  const totalBlockedPipeline = gaps.reduce((s, x) => s + x.blocked_pipeline_usd, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <ShieldHalf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Compliance Posture</h1>
            <p className="text-gray-400 text-sm">SOC 2 / ISO 27001 / HIPAA BAA / FedRAMP / IRAP / C5 tracking + per-deal blocker mapping.</p>
          </div>
        </div>
        <button onClick={loadAll} disabled={loading} className="bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Reload
        </button>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-400">Active certs</div>
          <div className="text-2xl font-bold text-green-400">{active}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-400">In progress</div>
          <div className="text-2xl font-bold text-amber-400">{inProgress}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-400">Compliance spend</div>
          <div className="text-2xl font-bold text-white">${(totalSpend / 1_000_000).toFixed(2)}M</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-xs text-gray-400">Pipeline blocked</div>
          <div className="text-2xl font-bold text-red-400">${(totalBlockedPipeline / 1_000_000).toFixed(1)}M</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Compliance certifications</h2>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {certs.map(c => (
              <div key={c.id} className={`rounded-lg p-3 border ${statusColor[c.status] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm">{c.framework}</div>
                  <span className="text-xs uppercase font-mono">{c.status}</span>
                </div>
                <div className="text-xs opacity-80 mt-1">{c.scope}</div>
                <div className="text-xs opacity-70 mt-1">
                  {c.auditor && <>Auditor: {c.auditor} · </>}
                  {c.expires_date && <>Expires: {c.expires_date} · </>}
                  {c.cost_usd > 0 && <>Cost: ${(c.cost_usd / 1_000).toFixed(0)}K</>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" />ROI: cost-vs-pipeline</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                <th className="py-2 pr-2">Framework</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2 text-right">Cost</th>
                <th className="py-2 pr-2 text-right">Pipeline</th>
                <th className="py-2 pr-2 text-right">ROI x</th>
              </tr>
            </thead>
            <tbody>
              {rois.map((r, i) => (
                <tr key={i} className="border-b border-gray-800/60">
                  <td className="py-2 pr-2 text-gray-200">{r.framework}</td>
                  <td className={`py-2 pr-2 text-xs font-bold ${r.status === 'active' ? 'text-green-400' : r.status === 'in_progress' ? 'text-amber-400' : 'text-gray-500'}`}>{r.status}</td>
                  <td className="py-2 pr-2 text-right text-gray-400">${(r.cost_usd / 1_000).toFixed(0)}K</td>
                  <td className="py-2 pr-2 text-right text-emerald-300">${(r.pipeline_usd / 1_000_000).toFixed(1)}M</td>
                  <td className={`py-2 pr-2 text-right font-bold ${r.roi_multiple && r.roi_multiple > 10 ? 'text-green-400' : r.roi_multiple && r.roi_multiple > 3 ? 'text-amber-400' : 'text-gray-400'}`}>
                    {r.roi_multiple ? `${r.roi_multiple}x` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Blocked deals by missing certification</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-2">Framework</th>
              <th className="py-2 pr-2">Startup status</th>
              <th className="py-2 pr-2 text-right">Deals requiring</th>
              <th className="py-2 pr-2 text-right">Deals blocked</th>
              <th className="py-2 pr-2 text-right">Blocked pipeline</th>
              <th className="py-2 pr-2 text-right">Acquisition cost</th>
            </tr>
          </thead>
          <tbody>
            {gaps.map((g, i) => (
              <tr key={i} className="border-b border-gray-800/60">
                <td className="py-2 pr-2 text-blue-300">{g.framework}</td>
                <td className={`py-2 pr-2 text-xs font-bold ${g.startup_status === 'active' ? 'text-green-400' : g.startup_status === 'in_progress' ? 'text-amber-400' : 'text-red-400'}`}>{g.startup_status}</td>
                <td className="py-2 pr-2 text-right text-gray-300">{g.deals_requiring}</td>
                <td className="py-2 pr-2 text-right text-red-400 font-bold">{g.deals_blocked}</td>
                <td className="py-2 pr-2 text-right text-red-300">${(g.blocked_pipeline_usd / 1_000_000).toFixed(1)}M</td>
                <td className="py-2 pr-2 text-right text-gray-400">${(g.cost_usd / 1_000).toFixed(0)}K</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">Expiring within 180 days</h2>
        {expiring && expiring.certifications.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {expiring.certifications.map(c => (
              <div key={c.id} className={`rounded-lg p-3 border ${c.days_until_expiry < 30 ? 'bg-red-900/40 border-red-700 text-red-300' : 'bg-amber-900/30 border-amber-700 text-amber-300'}`}>
                <div className="font-bold">{c.framework}</div>
                <div className="text-xs">Expires {c.expires_date} ({c.days_until_expiry}d)</div>
                <div className="text-xs opacity-80 mt-1">Auditor: {c.auditor}</div>
              </div>
            ))}
          </div>
        ) : <div className="text-sm text-gray-500">No certifications expiring soon.</div>}
      </div>
    </div>
  );
}
