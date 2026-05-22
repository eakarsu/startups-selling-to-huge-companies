import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { ListChecks, Plus, Trash2, Save, RefreshCw } from 'lucide-react';

type Rule = {
  id: number;
  name: string;
  category: string;
  condition: string;
  action: string;
  priority: 'low' | 'medium' | 'high' | string;
  enabled: boolean;
};

type Resp = {
  rules: Rule[];
  summary: { total: number; enabled: number; by_priority: Record<string, number>; by_category: Record<string, number> };
};

const CATEGORIES = ['engagement', 'security', 'procurement', 'pilot', 'expansion', 'legal'];
const PRIORITIES = ['low', 'medium', 'high'];

function priorityClass(p: string) {
  if (p === 'high') return 'bg-rose-700 text-white';
  if (p === 'medium') return 'bg-amber-600 text-white';
  return 'bg-slate-600 text-white';
}

export default function PlaybookRulesEditor() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [edits, setEdits] = useState<Record<number, Partial<Rule>>>({});
  const [form, setForm] = useState<Omit<Rule, 'id'>>({
    name: '', category: 'engagement', condition: '', action: '', priority: 'medium', enabled: true
  });

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const d = await apiFetch('/custom-views/playbook-rules');
      setData(d);
      setEdits({});
    } catch (e: any) {
      setErr(e?.message || 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createRule(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.condition.trim() || !form.action.trim()) {
      setErr('Name, condition, action are required');
      return;
    }
    try {
      await apiFetch('/custom-views/playbook-rules', { method: 'POST', body: JSON.stringify(form) });
      setForm({ name: '', category: 'engagement', condition: '', action: '', priority: 'medium', enabled: true });
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Create failed');
    }
  }

  async function saveRule(id: number) {
    const patch = edits[id];
    if (!patch) return;
    try {
      await apiFetch(`/custom-views/playbook-rules/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Update failed');
    }
  }

  async function toggleEnabled(rule: Rule) {
    try {
      await apiFetch(`/custom-views/playbook-rules/${rule.id}`, {
        method: 'PUT', body: JSON.stringify({ enabled: !rule.enabled })
      });
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Toggle failed');
    }
  }

  async function deleteRule(id: number) {
    if (!confirm('Delete this playbook rule?')) return;
    try {
      await apiFetch(`/custom-views/playbook-rules/${id}`, { method: 'DELETE' });
      await load();
    } catch (e: any) {
      setErr(e?.message || 'Delete failed');
    }
  }

  function updateEdit(id: number, field: keyof Rule, value: any) {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  return (
    <section data-testid="playbook-rules-editor" className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
            <ListChecks className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Playbook Rules Editor</h2>
            <p className="text-xs text-gray-400">Enterprise sales advisory rules · CRUD</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-md disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      {err && <div className="text-rose-400 text-sm mb-3">Error: {err}</div>}

      {data && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500">Total rules</div>
            <div className="text-xl font-bold text-white">{data.summary.total}</div>
          </div>
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500">Enabled</div>
            <div className="text-xl font-bold text-emerald-400">{data.summary.enabled}</div>
          </div>
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500">High-priority</div>
            <div className="text-xl font-bold text-rose-400">{data.summary.by_priority?.high || 0}</div>
          </div>
          <div className="bg-gray-950 border border-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-500">Categories</div>
            <div className="text-xl font-bold text-sky-400">{Object.keys(data.summary.by_category || {}).length}</div>
          </div>
        </div>
      )}

      <form onSubmit={createRule} className="bg-gray-950 border border-gray-800 rounded-lg p-3 mb-5">
        <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Add new rule</div>
        <div className="grid grid-cols-12 gap-2">
          <input className="col-span-3 bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-sm text-white"
                 placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <select className="col-span-2 bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-sm text-white"
                  value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input className="col-span-3 bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-sm text-white"
                 placeholder="Condition" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} />
          <input className="col-span-3 bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-sm text-white"
                 placeholder="Action" value={form.action} onChange={e => setForm({ ...form, action: e.target.value })} />
          <select className="col-span-1 bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-sm text-white"
                  value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex justify-end mt-2">
          <button type="submit" className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700">
            <Plus className="w-4 h-4" /> Add rule
          </button>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="text-left px-2 py-2">Name</th>
              <th className="text-left px-2 py-2">Category</th>
              <th className="text-left px-2 py-2">Condition</th>
              <th className="text-left px-2 py-2">Action</th>
              <th className="text-left px-2 py-2">Priority</th>
              <th className="text-left px-2 py-2">Enabled</th>
              <th className="text-right px-2 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.rules.map(r => {
              const e = edits[r.id] || {};
              const current = { ...r, ...e };
              const dirty = Object.keys(e).length > 0;
              return (
                <tr key={r.id} className="border-b border-gray-800 align-top">
                  <td className="px-2 py-2">
                    <input className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-white"
                           value={current.name} onChange={ev => updateEdit(r.id, 'name', ev.target.value)} />
                  </td>
                  <td className="px-2 py-2">
                    <select className="bg-gray-900 border border-gray-800 rounded px-2 py-1 text-white"
                            value={current.category} onChange={ev => updateEdit(r.id, 'category', ev.target.value)}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-white"
                           value={current.condition} onChange={ev => updateEdit(r.id, 'condition', ev.target.value)} />
                  </td>
                  <td className="px-2 py-2">
                    <input className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1 text-white"
                           value={current.action} onChange={ev => updateEdit(r.id, 'action', ev.target.value)} />
                  </td>
                  <td className="px-2 py-2">
                    <select className={`rounded px-2 py-1 ${priorityClass(current.priority)}`}
                            value={current.priority} onChange={ev => updateEdit(r.id, 'priority', ev.target.value)}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <button onClick={() => toggleEnabled(r)}
                            className={`px-2 py-1 rounded ${r.enabled ? 'bg-emerald-700 text-white' : 'bg-gray-700 text-gray-300'}`}>
                      {r.enabled ? 'On' : 'Off'}
                    </button>
                  </td>
                  <td className="px-2 py-2 text-right whitespace-nowrap">
                    <button onClick={() => saveRule(r.id)} disabled={!dirty}
                            className="inline-flex items-center gap-1 px-2 py-1 mr-1 text-xs bg-blue-600 text-white rounded disabled:opacity-40">
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => deleteRule(r.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-rose-700 text-white rounded">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {data?.rules.length === 0 && (
              <tr><td colSpan={7} className="text-center py-6 text-gray-500">No rules yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
