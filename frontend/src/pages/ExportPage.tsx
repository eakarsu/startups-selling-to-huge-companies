import { useState } from 'react';
import { Download, FileSpreadsheet, Briefcase, Building2, Users, Activity } from 'lucide-react';
import { api } from '../api';

const ENTITIES = [
  { id: 'deals' as const, label: 'Deals', icon: Briefcase, desc: 'All deals with company, stage, value, ARR, and forecast.' },
  { id: 'companies' as const, label: 'Companies', icon: Building2, desc: 'Account list with revenue, employees, tier, and HQ.' },
  { id: 'contacts' as const, label: 'Contacts', icon: Users, desc: 'Contacts with role, decision-maker flag, and relationship.' },
  { id: 'activities' as const, label: 'Activities', icon: Activity, desc: 'Call/email/meeting log with outcomes.' },
];

export default function ExportPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);

  const exportEntity = async (entity: 'deals' | 'companies' | 'contacts' | 'activities') => {
    setBusy(entity); setError(null);
    try {
      await api.utils.exportCsv(entity);
      setLast(`${entity}.csv downloaded at ${new Date().toLocaleTimeString()}`);
    } catch (err: any) {
      setError(err?.message || 'Export failed');
    } finally { setBusy(null); }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
          <FileSpreadsheet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">CSV Export</h1>
          <p className="text-gray-400 text-sm">Download CRM data as CSV files for spreadsheets, BI tools, or reporting.</p>
        </div>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>}
      {last && <div className="bg-emerald-900/40 border border-emerald-700 text-emerald-300 rounded-lg p-3 mb-4 text-sm">{last}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        {ENTITIES.map(({ id, label, icon: Icon, desc }) => (
          <div key={id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center"><Icon className="w-5 h-5 text-blue-400" /></div>
              <div>
                <div className="text-white font-semibold">{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
            </div>
            <button onClick={() => exportEntity(id)} disabled={busy !== null} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-50">
              <Download className="w-4 h-4" />
              {busy === id ? 'Exporting...' : `Export ${label}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
