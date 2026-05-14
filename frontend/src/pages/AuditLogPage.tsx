import { useEffect, useState } from 'react';
import { ScrollText, RefreshCw } from 'lucide-react';
import { api } from '../api';

interface AuditEntry {
  id: number;
  user_id: number | null;
  user_email: string | null;
  action: string;
  entity: string | null;
  entity_id: number | null;
  details: string | null;
  ip: string | null;
  created_at: string;
}

export default function AuditLogPage() {
  const [rows, setRows] = useState<AuditEntry[]>([]);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const data = await api.utils.auditList({
        action: filterAction || undefined,
        entity: filterEntity || undefined,
        user_email: filterEmail || undefined,
        limit: 200
      });
      setRows(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load audit log');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const colorFor = (action: string) => {
    if (action.includes('export')) return 'text-green-400';
    if (action.includes('search')) return 'text-blue-400';
    if (action.includes('ai_call')) return 'text-violet-400';
    return 'text-gray-300';
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center">
          <ScrollText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-gray-400 text-sm">User actions, exports, AI calls, and searches</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input value={filterAction} onChange={e=>setFilterAction(e.target.value)} placeholder="Filter by action (e.g., ai_call)" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
        <input value={filterEntity} onChange={e=>setFilterEntity(e.target.value)} placeholder="Filter by entity (e.g., deals)" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
        <input value={filterEmail} onChange={e=>setFilterEmail(e.target.value)} placeholder="Filter by user email" className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm" />
        <button onClick={load} disabled={loading} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} />{loading?'Loading...':'Refresh'}</button>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
            <tr>
              <th className="px-3 py-2 text-left">When</th>
              <th className="px-3 py-2 text-left">User</th>
              <th className="px-3 py-2 text-left">Action</th>
              <th className="px-3 py-2 text-left">Entity</th>
              <th className="px-3 py-2 text-left">Entity ID</th>
              <th className="px-3 py-2 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-t border-gray-800 text-gray-200">
                <td className="px-3 py-2 text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2 text-xs">{r.user_email || '—'}</td>
                <td className={`px-3 py-2 text-xs font-medium ${colorFor(r.action)}`}>{r.action}</td>
                <td className="px-3 py-2 text-xs">{r.entity || '—'}</td>
                <td className="px-3 py-2 text-xs">{r.entity_id ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-gray-400">{r.details || '—'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500 text-sm">No audit entries.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
