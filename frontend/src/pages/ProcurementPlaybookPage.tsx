import { useEffect, useState } from 'react';
import { ClipboardList, RefreshCcw, Clock } from 'lucide-react';
import { apiFetch, api } from '../api';

type PlaybookCompany = { id: number; name: string; tier: string; industry: string; revenue_billions: number | null; stage_count: number; total_typical_days: number; top_signing_threshold_usd: number | null };
type Stage = { id: number; stage_order: number; stage_name: string; owner_role: string; typical_duration_days: number; required_artifacts: string; signing_threshold_usd: number; notes: string; progress?: { status: string; entered_at: string | null; completed_at: string | null; blocker: string | null } };
type Blocked = { id: number; deal_id: number; deal_title: string; value_usd: number; company_name: string; stage_name: string; owner_role: string; blocker: string; days_in_stage: number | null; is_overdue: boolean; typical_duration_days: number };
type Critical = { stage_name: string; owner_role: string; occurrences: number; avg_days: number; min_days: number; max_days: number };
type Deal = { id: number; title: string; company_id: number; value_usd: number };

const statusColor: Record<string, string> = { completed: 'bg-green-900/50 text-green-300 border-green-700', in_progress: 'bg-amber-900/50 text-amber-300 border-amber-700', not_started: 'bg-gray-800 text-gray-400 border-gray-700' };

export default function ProcurementPlaybookPage() {
  const [companies, setCompanies] = useState<PlaybookCompany[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<number | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [companyMeta, setCompanyMeta] = useState<{ name: string; tier: string; total_typical_days: number; total_typical_weeks: number } | null>(null);
  const [blocked, setBlocked] = useState<Blocked[]>([]);
  const [critical, setCritical] = useState<Critical[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeDealId, setActiveDealId] = useState<number | null>(null);
  const [dealProgress, setDealProgress] = useState<{ stages: Stage[]; summary: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadAll() {
    setLoading(true); setError('');
    try {
      const [comps, blk, crit, dealsList] = await Promise.all([
        apiFetch('/deep-procurement-playbook/companies'),
        apiFetch('/deep-procurement-playbook/stages-blocked'),
        apiFetch('/deep-procurement-playbook/critical-path'),
        api.deals.list()
      ]);
      setCompanies(comps); setBlocked(blk); setCritical(crit); setDeals(dealsList);
      if (comps.length && !activeCompanyId) setActiveCompanyId(comps[0].id);
    } catch (e: any) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  }

  async function loadPlaybook(companyId: number) {
    try {
      const d = await apiFetch(`/deep-procurement-playbook/by-company/${companyId}`);
      setStages(d.stages);
      setCompanyMeta({ name: d.company.name, tier: d.company.tier, total_typical_days: d.total_typical_days, total_typical_weeks: d.total_typical_weeks });
    } catch (e: any) { setError(e.message); }
  }

  async function loadDealProgress(dealId: number) {
    try {
      const d = await apiFetch(`/deep-procurement-playbook/deal-progress/${dealId}`);
      setDealProgress(d);
    } catch (e: any) { setDealProgress(null); }
  }

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { if (activeCompanyId) loadPlaybook(activeCompanyId); }, [activeCompanyId]);
  useEffect(() => { if (activeDealId) loadDealProgress(activeDealId); }, [activeDealId]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">F100 Procurement Playbook</h1>
            <p className="text-gray-400 text-sm">Per-buyer procurement stages — RFI → RFP → POC → security → procurement → legal → signing — with deal progression tracking.</p>
          </div>
        </div>
        <button onClick={loadAll} disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Reload
        </button>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">F100 buyers (procurement length)</h2>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {companies.map(c => (
              <button key={c.id} onClick={() => setActiveCompanyId(c.id)} className={`w-full text-left bg-gray-800/40 hover:bg-gray-800 rounded-lg p-3 border ${activeCompanyId === c.id ? 'border-emerald-500' : 'border-gray-700'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-white">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.tier}</div>
                </div>
                <div className="text-xs text-gray-500">{c.industry} · ${c.revenue_billions ?? '?'}B</div>
                <div className="text-xs mt-1 flex items-center gap-2">
                  <span className="text-emerald-300">{c.stage_count} stages</span>
                  <span className="text-gray-500">·</span>
                  <span className={`font-bold ${c.total_typical_days > 200 ? 'text-red-400' : c.total_typical_days > 120 ? 'text-amber-400' : 'text-green-400'}`}>
                    {c.total_typical_days}d typical
                  </span>
                  {c.top_signing_threshold_usd && <><span className="text-gray-500">·</span><span className="text-gray-400">${(c.top_signing_threshold_usd / 1_000_000).toFixed(0)}M signing</span></>}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">{companyMeta?.name || '—'} playbook {companyMeta && <span className="text-sm text-gray-500">· ~{companyMeta.total_typical_weeks} weeks total</span>}</h2>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {stages.map(s => (
              <div key={s.id} className="bg-gray-800/40 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded font-mono">#{s.stage_order}</span>
                    <div className="text-white font-medium">{s.stage_name}</div>
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{s.typical_duration_days}d</div>
                </div>
                <div className="text-xs text-gray-500">Owner: <span className="text-gray-300">{s.owner_role}</span></div>
                {s.required_artifacts && <div className="text-xs text-gray-500 mt-1">Artifacts: {s.required_artifacts}</div>}
                {s.notes && <div className="text-xs text-gray-400 mt-1 italic">{s.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Deal progress</h2>
            <select value={activeDealId ?? ''} onChange={e => setActiveDealId(Number(e.target.value) || null)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
              <option value="">Pick deal</option>
              {deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
          {dealProgress ? (
            <>
              <div className="bg-gray-800/40 rounded-lg p-3 mb-3">
                <div className="text-sm text-white">Completed {dealProgress.summary.completed} / {dealProgress.summary.total_stages} ({dealProgress.summary.completed_pct}%)</div>
                <div className="text-xs text-gray-500">Current: <span className="text-amber-300">{dealProgress.summary.current_stage || 'none'}</span></div>
                <div className="text-xs text-gray-500">Remaining: <span className="text-gray-300">{dealProgress.summary.expected_remaining_days}d ({dealProgress.summary.expected_remaining_weeks}w)</span></div>
                {dealProgress.summary.current_blocker && <div className="text-xs text-red-300 mt-1">Blocker: {dealProgress.summary.current_blocker}</div>}
              </div>
              <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                {dealProgress.stages.map((s: Stage) => (
                  <div key={s.id} className={`text-xs border rounded p-2 ${statusColor[s.progress?.status || 'not_started']}`}>
                    <div className="font-medium">{s.stage_order}. {s.stage_name} · <span className="text-xs opacity-70">{s.progress?.status}</span></div>
                    {s.progress?.blocker && <div className="text-xs opacity-90 italic">{s.progress.blocker}</div>}
                  </div>
                ))}
              </div>
            </>
          ) : <div className="text-gray-500 text-sm">Pick a deal to view stage progression.</div>}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Critical-path stages across F100</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                <th className="py-2 pr-2">Stage</th>
                <th className="py-2 pr-2 text-right">Avg</th>
                <th className="py-2 pr-2 text-right">Max</th>
                <th className="py-2 pr-2 text-right">Buyers</th>
              </tr>
            </thead>
            <tbody>
              {critical.slice(0, 10).map((c, i) => (
                <tr key={i} className="border-b border-gray-800/60">
                  <td className="py-2 pr-2 text-gray-200">{c.stage_name} <span className="text-xs text-gray-500">· {c.owner_role}</span></td>
                  <td className={`py-2 pr-2 text-right font-bold ${c.avg_days > 60 ? 'text-red-400' : c.avg_days > 30 ? 'text-amber-400' : 'text-green-400'}`}>{c.avg_days}d</td>
                  <td className="py-2 pr-2 text-right text-gray-400">{c.max_days}d</td>
                  <td className="py-2 pr-2 text-right text-gray-500">{c.occurrences}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">Blocked deal stages ({blocked.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                <th className="py-2 pr-2">Deal</th>
                <th className="py-2 pr-2">Buyer</th>
                <th className="py-2 pr-2">Stage</th>
                <th className="py-2 pr-2">Blocker</th>
                <th className="py-2 pr-2 text-right">Days in stage</th>
                <th className="py-2 pr-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {blocked.map(b => (
                <tr key={b.id} className="border-b border-gray-800/60">
                  <td className="py-2 pr-2 text-gray-200">{b.deal_title}</td>
                  <td className="py-2 pr-2 text-emerald-300">{b.company_name}</td>
                  <td className="py-2 pr-2 text-gray-300">{b.stage_name}</td>
                  <td className="py-2 pr-2 text-amber-300 text-xs italic">{b.blocker}</td>
                  <td className={`py-2 pr-2 text-right font-bold ${b.is_overdue ? 'text-red-400' : 'text-gray-300'}`}>
                    {b.days_in_stage}d {b.is_overdue && <span className="text-xs">(SLA {b.typical_duration_days}d)</span>}
                  </td>
                  <td className="py-2 pr-2 text-right text-gray-400">${(b.value_usd / 1_000_000).toFixed(1)}M</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
