import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Building2, Briefcase, Users, Calendar, Trophy,
  Sparkles, Database, RefreshCw, ScrollText, DollarSign
} from 'lucide-react';
import { api } from '../api';

interface AuditEntry {
  id: number;
  user_email: string | null;
  action: string;
  entity: string | null;
  entity_id: number | null;
  details: string | null;
  created_at: string;
}

interface Stats {
  kpis: {
    companies_in_pipeline: number;
    active_deals: number;
    total_contacts: number;
    deals_closing_this_quarter: number;
    win_rate_pct: number;
    won_count: number;
    lost_count: number;
    pipeline_value_usd: number;
  };
  recent_activity: AuditEntry[];
}

function formatUsd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n)}`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await api.dashboard.stats();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const kpiCards = stats ? [
    { label: 'Companies in Pipeline', value: stats.kpis.companies_in_pipeline, icon: Building2, color: 'from-blue-600 to-cyan-600', tint: 'text-blue-400' },
    { label: 'Active Deals',          value: stats.kpis.active_deals,          icon: Briefcase, color: 'from-emerald-600 to-teal-600', tint: 'text-emerald-400' },
    { label: 'Total Contacts',        value: stats.kpis.total_contacts,        icon: Users,     color: 'from-violet-600 to-purple-600', tint: 'text-violet-400' },
    { label: 'Closing This Quarter',  value: stats.kpis.deals_closing_this_quarter, icon: Calendar, color: 'from-amber-600 to-orange-600', tint: 'text-amber-400' },
    { label: 'Win Rate',              value: `${stats.kpis.win_rate_pct}%`,    icon: Trophy,    color: 'from-pink-600 to-rose-600', tint: 'text-pink-400',
      sub: `${stats.kpis.won_count} won / ${stats.kpis.lost_count} lost` }
  ] : [];

  const quickActions = [
    { to: '/ai-center',    label: 'AI Center',    icon: Sparkles,  color: 'from-violet-600 to-indigo-600', desc: '9 AI tools for deals, ICP, discovery & more' },
    { to: '/deals',        label: 'Deals',        icon: Briefcase, color: 'from-emerald-600 to-teal-600',  desc: 'Pipeline & forecast' },
    { to: '/companies',    label: 'Companies',    icon: Building2, color: 'from-blue-600 to-cyan-600',     desc: 'Fortune 500 accounts' },
    { to: '/sample-data',  label: 'Sample Data',  icon: Database,  color: 'from-amber-600 to-orange-600',  desc: 'Seed realistic demo rows' }
  ];

  const colorFor = (action: string) => {
    if (action.includes('export')) return 'text-green-400';
    if (action.includes('search')) return 'text-blue-400';
    if (action.includes('ai_call')) return 'text-violet-400';
    if (action.includes('login'))   return 'text-amber-400';
    return 'text-gray-300';
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 text-sm">Pipeline health, recent activity, and quick actions.</p>
          </div>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {(stats ? kpiCards : Array.from({ length: 5 })).map((c: any, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            {stats && c ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                    <c.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="text-xs text-gray-400 mb-1">{c.label}</div>
                <div className="text-2xl font-bold text-white">{c.value}</div>
                {c.sub && <div className="text-xs text-gray-500 mt-1">{c.sub}</div>}
              </>
            ) : (
              <div className="h-20 animate-pulse bg-gray-800 rounded" />
            )}
          </div>
        ))}
      </div>

      {/* Pipeline value strip */}
      {stats && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs text-gray-400">Open pipeline value</div>
              <div className="text-xl font-bold text-white">{formatUsd(stats.kpis.pipeline_value_usd)}</div>
            </div>
          </div>
          <div className="text-xs text-gray-500">Sum of <code>value_usd</code> across non-closed deals</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-amber-400" />
            <div className="text-white font-semibold text-sm">Recent activity</div>
            <Link to="/audit" className="ml-auto text-xs text-blue-400 hover:text-blue-300">View all</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase">
              <tr>
                <th className="px-3 py-2 text-left">When</th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Entity</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recent_activity.map(r => (
                <tr key={r.id} className="border-t border-gray-800 text-gray-200">
                  <td className="px-3 py-2 text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 text-xs">{r.user_email || '—'}</td>
                  <td className={`px-3 py-2 text-xs font-medium ${colorFor(r.action)}`}>{r.action}</td>
                  <td className="px-3 py-2 text-xs">{r.entity || '—'}{r.entity_id ? ` #${r.entity_id}` : ''}</td>
                </tr>
              ))}
              {stats && stats.recent_activity.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-500 text-sm">No activity yet.</td></tr>
              )}
              {!stats && (
                <tr><td colSpan={4} className="px-3 py-8 text-center text-gray-500 text-sm">Loading...</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quick actions */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-white font-semibold text-sm mb-3">Quick actions</div>
          <div className="space-y-2">
            {quickActions.map(({ to, label, icon: Icon, color, desc }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-3 transition-colors">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium">{label}</div>
                  <div className="text-xs text-gray-400 truncate">{desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
