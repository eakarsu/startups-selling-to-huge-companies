import { useEffect, useState } from 'react';
import { Network, RefreshCcw, AlertCircle } from 'lucide-react';
import { apiFetch, api } from '../api';

type DealCoverage = { deal_id: number; title: string; value_usd: number; stage: string; probability: number; company_id: number; company_name: string; tier: string; contacts: number; decision_makers: number; distinct_roles_covered: number; single_thread_risk: boolean };
type Score = { company_id: number; total_contacts: number; contacts_with_role: number; covered_roles: { role: string; weight: number }[]; missing_roles: string[]; coverage_pct: number; strength_pct: number; verdict: string };
type Contact = { id: number; name: string; title: string; email: string; decision_maker: boolean; relationship_strength: string; rel_id: number; function_area: string; signing_authority_usd: number | null; buyer_role: string | null; reports_to_name: string | null };
type Company = { id: number; name: string; tier: string };

const strengthColor: Record<string, string> = { champion: 'text-green-400', sponsor: 'text-emerald-400', engaged: 'text-blue-400', warm: 'text-amber-400', cold: 'text-gray-400' };
const verdictColor: Record<string, string> = { strong_multi_thread: 'bg-green-900/50 text-green-300 border-green-700', partial_multi_thread: 'bg-amber-900/50 text-amber-300 border-amber-700', single_threaded_risk: 'bg-red-900/50 text-red-300 border-red-700' };

export default function ChampionMapPage() {
  const [coverage, setCoverage] = useState<DealCoverage[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<number | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [score, setScore] = useState<Score | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadCoverage() {
    setLoading(true); setError('');
    try {
      const [cov, comps] = await Promise.all([
        apiFetch('/deep-champion-map/coverage-summary'),
        api.companies.list()
      ]);
      setCoverage(cov);
      setCompanies(comps);
      if (cov.length && !activeCompanyId) setActiveCompanyId(cov[0].company_id);
    } catch (e: any) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  }

  async function loadCompanyDetail(companyId: number) {
    try {
      const [det, sc] = await Promise.all([
        apiFetch(`/deep-champion-map/by-company/${companyId}`),
        apiFetch(`/deep-champion-map/multi-thread-score/${companyId}`)
      ]);
      setContacts(det.contacts);
      setScore(sc);
    } catch (e: any) { setError(e.message || 'Failed to load company detail'); }
  }

  useEffect(() => { loadCoverage(); }, []);
  useEffect(() => { if (activeCompanyId) loadCompanyDetail(activeCompanyId); }, [activeCompanyId]);

  const activeCompany = companies.find(c => c.id === activeCompanyId);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Champion Map / Org Chart</h1>
            <p className="text-gray-400 text-sm">Multi-threading coverage across the 8 canonical F100 buyer roles. Avoid single-threaded risk.</p>
          </div>
        </div>
        <button onClick={loadCoverage} disabled={loading} className="bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Reload
        </button>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Active deals — multi-threading risk</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                <th className="py-2 pr-2">Deal</th>
                <th className="py-2 pr-2">F100 buyer</th>
                <th className="py-2 pr-2 text-right">Value</th>
                <th className="py-2 pr-2">Stage</th>
                <th className="py-2 pr-2 text-right">Contacts</th>
                <th className="py-2 pr-2 text-right">Decision-makers</th>
                <th className="py-2 pr-2 text-right">Roles covered</th>
                <th className="py-2 pr-2">Risk</th>
              </tr>
            </thead>
            <tbody>
              {coverage.map(c => (
                <tr key={c.deal_id} className="border-b border-gray-800/60 hover:bg-gray-800/40 cursor-pointer" onClick={() => setActiveCompanyId(c.company_id)}>
                  <td className="py-2 pr-2 text-gray-100">{c.title}</td>
                  <td className="py-2 pr-2 text-violet-300">{c.company_name} <span className="text-xs text-gray-500">({c.tier})</span></td>
                  <td className="py-2 pr-2 text-right text-gray-300">${(c.value_usd / 1_000_000).toFixed(1)}M</td>
                  <td className="py-2 pr-2 text-xs text-gray-400">{c.stage}</td>
                  <td className="py-2 pr-2 text-right text-gray-300">{c.contacts}</td>
                  <td className="py-2 pr-2 text-right text-amber-300">{c.decision_makers}</td>
                  <td className={`py-2 pr-2 text-right font-bold ${c.distinct_roles_covered >= 3 ? 'text-green-400' : c.distinct_roles_covered >= 2 ? 'text-amber-400' : 'text-red-400'}`}>{c.distinct_roles_covered}</td>
                  <td className="py-2 pr-2">
                    {c.single_thread_risk && (
                      <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />single-threaded
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">{activeCompany?.name || 'Select buyer'}</h2>
            <select value={activeCompanyId ?? ''} onChange={e => setActiveCompanyId(Number(e.target.value) || null)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
              <option value="">--</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {score && (
            <>
              <div className={`border rounded-lg p-3 text-sm ${verdictColor[score.verdict]}`}>
                <div className="font-bold uppercase">{score.verdict.split('_').join(' ')}</div>
                <div className="text-xs mt-1">{score.coverage_pct}% role coverage · {score.strength_pct}% strength</div>
              </div>
              <div className="mt-3">
                <div className="text-xs uppercase text-gray-400 mb-1">Covered roles</div>
                <div className="flex flex-wrap gap-1">
                  {score.covered_roles.map(r => (
                    <span key={r.role} className="text-xs bg-violet-900/50 text-violet-200 px-2 py-0.5 rounded">
                      {r.role} ({(r.weight * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>
              {score.missing_roles.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs uppercase text-gray-400 mb-1">Missing</div>
                  <div className="flex flex-wrap gap-1">
                    {score.missing_roles.map(r => (
                      <span key={r} className="text-xs bg-red-900/40 text-red-300 px-2 py-0.5 rounded border border-red-800">{r}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-3">Contacts at {activeCompany?.name || '—'}</h2>
          <div className="overflow-x-auto max-h-[60vh]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-900">
                <tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
                  <th className="py-2 pr-2">Name</th>
                  <th className="py-2 pr-2">Role</th>
                  <th className="py-2 pr-2">Function</th>
                  <th className="py-2 pr-2">Reports to</th>
                  <th className="py-2 pr-2 text-right">Signing auth</th>
                  <th className="py-2 pr-2">Strength</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c.id} className="border-b border-gray-800/60">
                    <td className="py-2 pr-2">
                      <div className="text-white">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.title}</div>
                    </td>
                    <td className="py-2 pr-2">
                      {c.buyer_role
                        ? <span className="text-xs bg-violet-900/50 text-violet-200 px-2 py-0.5 rounded">{c.buyer_role}</span>
                        : <span className="text-xs text-gray-600">untagged</span>}
                    </td>
                    <td className="py-2 pr-2 text-gray-300 text-xs">{c.function_area || '—'}</td>
                    <td className="py-2 pr-2 text-gray-400 text-xs">{c.reports_to_name || '—'}</td>
                    <td className="py-2 pr-2 text-right text-gray-300 text-xs">{c.signing_authority_usd ? `$${(c.signing_authority_usd / 1_000_000).toFixed(1)}M` : '—'}</td>
                    <td className={`py-2 pr-2 text-xs font-bold ${strengthColor[c.relationship_strength] || 'text-gray-400'}`}>{c.relationship_strength}</td>
                  </tr>
                ))}
                {contacts.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-gray-500 text-sm">No contacts yet at this buyer.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
