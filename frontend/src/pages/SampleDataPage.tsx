import { useState } from 'react';
import { Database, Building2, Users, Briefcase, Activity, UserCheck, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../api';

type Entity = 'companies' | 'contacts' | 'deals' | 'activities' | 'team' | 'notes';

const ENTITIES: { id: Entity; label: string; icon: any; desc: string }[] = [
  { id: 'companies',  label: 'Companies',  icon: Building2, desc: 'Fortune 500 accounts (JPMorgan Chase, Walmart, Boeing, ExxonMobil...).' },
  { id: 'contacts',   label: 'Contacts',   icon: Users,     desc: 'VP Engineering, Director of Procurement, CIO, SVP Digital Transformation...' },
  { id: 'deals',      label: 'Deals',      icon: Briefcase, desc: 'Enterprise pipeline across prospecting / discovery / proposal / negotiation.' },
  { id: 'activities', label: 'Activities', icon: Activity,  desc: 'Discovery call with CTO, exec briefings, demos, RFP follow-ups.' },
  { id: 'team',       label: 'Sales Team', icon: UserCheck, desc: 'AEs, Strategic Account Directors, SDRs with quota and win-rate.' },
  { id: 'notes',      label: 'Notes',      icon: FileText,  desc: 'Champion / decision-committee / pilot-scope notes on deals.' }
];

export default function SampleDataPage() {
  const [busy, setBusy] = useState<Entity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const seed = async (entity: Entity) => {
    setBusy(entity); setError(null); setToast(null);
    try {
      const res = await api.admin.sampleData(entity);
      const inserted = Number(res?.inserted) || 0;
      setCounts(prev => ({ ...prev, [entity]: (prev[entity] || 0) + inserted }));
      setToast(`Inserted ${inserted} ${entity} row${inserted === 1 ? '' : 's'}.`);
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      setError(err?.message || 'Sample data insert failed');
    } finally {
      setBusy(null);
    }
  };

  const totalInserted = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Sample Data</h1>
          <p className="text-gray-400 text-sm">Seed the CRM with 5–10 realistic rows per entity for demos and testing.</p>
        </div>
      </div>

      {toast && (
        <div className="bg-emerald-900/40 border border-emerald-700 text-emerald-300 rounded-lg p-3 mb-4 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />{toast}
        </div>
      )}
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />{error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-5 max-w-3xl flex items-center justify-between">
        <div>
          <div className="text-gray-400 text-xs">Total rows inserted this session</div>
          <div className="text-white text-2xl font-bold">{totalInserted}</div>
        </div>
        <div className="text-xs text-gray-500">Each click inserts 5–10 rows.</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        {ENTITIES.map(({ id, label, icon: Icon, desc }) => (
          <div key={id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold">{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
              {counts[id] ? (
                <span className="text-xs bg-amber-900/40 text-amber-300 border border-amber-700 px-2 py-0.5 rounded-full">
                  +{counts[id]}
                </span>
              ) : null}
            </div>
            <button
              onClick={() => seed(id)}
              disabled={busy !== null}
              className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50"
            >
              {busy === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {busy === id ? 'Inserting...' : `Insert sample ${label}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
