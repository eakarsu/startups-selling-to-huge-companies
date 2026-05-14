import { useState } from 'react';
import { Search, Filter, Briefcase, Building2, Users } from 'lucide-react';
import { api } from '../api';
import type { Deal, Company, Contact } from '../types';

const STAGES = ['', 'prospecting','qualification','discovery','proposal','negotiation','legal_review','closed_won','closed_lost'];
const RELATIONSHIPS = ['', 'cold','warm','hot','champion'];

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [entity, setEntity] = useState<'all'|'deals'|'companies'|'contacts'>('all');
  const [stage, setStage] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [minProb, setMinProb] = useState('');
  const [industry, setIndustry] = useState('');
  const [tier, setTier] = useState('');
  const [decisionMaker, setDecisionMaker] = useState(false);
  const [relationship, setRelationship] = useState('');
  const [results, setResults] = useState<{ deals?: Deal[]; companies?: Company[]; contacts?: Contact[] }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true); setError(null);
    try {
      const data = await api.utils.search({
        q, entity,
        stage: stage || undefined,
        min_value: minValue || undefined,
        max_value: maxValue || undefined,
        min_probability: minProb || undefined,
        industry: industry || undefined,
        tier: tier || undefined,
        decision_maker: decisionMaker ? 'true' : undefined,
        relationship_strength: relationship || undefined
      });
      setResults(data);
    } catch (err: any) {
      setError(err?.message || 'Search failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Search & Filter</h1>
          <p className="text-gray-400 text-sm">Cross-entity search with rich filters</p>
        </div>
      </div>

      <form onSubmit={runSearch} className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-6 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search across deals, companies, contacts..." className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={entity} onChange={e=>setEntity(e.target.value as any)} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm">
            <option value="all">All</option>
            <option value="deals">Deals</option>
            <option value="companies">Companies</option>
            <option value="contacts">Contacts</option>
          </select>
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">{loading ? 'Searching...' : 'Search'}</button>
        </div>
        <details className="text-gray-300 text-sm">
          <summary className="cursor-pointer flex items-center gap-2 text-gray-400 hover:text-white"><Filter className="w-4 h-4" />Advanced Filters</summary>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
            <div><label className="block text-xs text-gray-400 mb-1">Stage</label><select value={stage} onChange={e=>setStage(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">{STAGES.map(s=><option key={s} value={s}>{s||'any'}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Min Value ($)</label><input type="number" value={minValue} onChange={e=>setMinValue(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Max Value ($)</label><input type="number" value={maxValue} onChange={e=>setMaxValue(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Min Probability %</label><input type="number" min="0" max="100" value={minProb} onChange={e=>setMinProb(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Industry</label><input value={industry} onChange={e=>setIndustry(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Tier</label><input value={tier} onChange={e=>setTier(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="e.g., F500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Relationship</label><select value={relationship} onChange={e=>setRelationship(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm">{RELATIONSHIPS.map(s=><option key={s} value={s}>{s||'any'}</option>)}</select></div>
            <div className="flex items-center gap-2 pt-6"><input type="checkbox" checked={decisionMaker} onChange={e=>setDecisionMaker(e.target.checked)} /><label className="text-xs text-gray-300">Decision Makers Only</label></div>
          </div>
        </details>
      </form>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      <div className="space-y-6">
        {results.deals && (
          <section>
            <h2 className="flex items-center gap-2 text-white font-semibold mb-3"><Briefcase className="w-4 h-4 text-blue-400" />Deals ({results.deals.length})</h2>
            <div className="space-y-2">
              {results.deals.map(d => (
                <div key={d.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3 flex items-center justify-between">
                  <div><div className="text-white text-sm font-medium">{d.title}</div><div className="text-xs text-gray-500">{(d as any).company_name} • {d.stage}</div></div>
                  <div className="text-right"><div className="text-sm text-white">${Number(d.value_usd).toLocaleString()}</div><div className="text-xs text-gray-400">{d.probability}%</div></div>
                </div>
              ))}
              {results.deals.length === 0 && <div className="text-gray-500 text-sm">No deal matches.</div>}
            </div>
          </section>
        )}
        {results.companies && (
          <section>
            <h2 className="flex items-center gap-2 text-white font-semibold mb-3"><Building2 className="w-4 h-4 text-green-400" />Companies ({results.companies.length})</h2>
            <div className="space-y-2">
              {results.companies.map(c => (
                <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                  <div className="text-white text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.industry} • {c.tier} • ${c.revenue_billions}B • {c.hq_city}, {c.hq_country}</div>
                </div>
              ))}
              {results.companies.length === 0 && <div className="text-gray-500 text-sm">No company matches.</div>}
            </div>
          </section>
        )}
        {results.contacts && (
          <section>
            <h2 className="flex items-center gap-2 text-white font-semibold mb-3"><Users className="w-4 h-4 text-violet-400" />Contacts ({results.contacts.length})</h2>
            <div className="space-y-2">
              {results.contacts.map(c => (
                <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-lg p-3">
                  <div className="text-white text-sm font-medium">{c.name} {c.decision_maker && <span className="ml-2 text-xs text-yellow-400">DM</span>}</div>
                  <div className="text-xs text-gray-500">{c.title} • {(c as any).company_name} • {c.relationship_strength}</div>
                </div>
              ))}
              {results.contacts.length === 0 && <div className="text-gray-500 text-sm">No contact matches.</div>}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
