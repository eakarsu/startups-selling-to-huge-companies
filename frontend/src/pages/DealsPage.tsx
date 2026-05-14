import { useState, useEffect } from 'react';
import { Plus, Search, Briefcase } from 'lucide-react';
import { api } from '../api';
import type { Deal, Company } from '../types';

const STAGES = ['prospecting','qualification','discovery','proposal','negotiation','legal_review','closed_won','closed_lost'];
const stageColor: Record<string,string> = { prospecting:'text-gray-400', qualification:'text-blue-400', discovery:'text-cyan-400', proposal:'text-yellow-400', negotiation:'text-orange-400', legal_review:'text-purple-400', closed_won:'text-green-400', closed_lost:'text-red-400' };

function DealForm({ deal, companies, onSave, onCancel }: { deal?: Deal; companies: Company[]; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ company_id: deal?.company_id||(companies[0]?.id||''), title: deal?.title||'', value_usd: deal?.value_usd||'', stage: deal?.stage||'prospecting', probability: deal?.probability||10, expected_close: deal?.expected_close?deal.expected_close.slice(0,10):'', next_action: deal?.next_action||'', arr_usd: deal?.arr_usd||'' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { deal ? await api.deals.update(deal.id, form) : await api.deals.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{deal ? 'Edit Deal' : 'New Deal'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Company</label><select value={form.company_id} onChange={e=>setForm({...form,company_id:Number(e.target.value)})} className={inp}>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="block text-sm text-gray-300 mb-1">Deal Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className={inp} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Value ($)</label><input type="number" value={form.value_usd} onChange={e=>setForm({...form,value_usd:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">ARR ($)</label><input type="number" value={form.arr_usd} onChange={e=>setForm({...form,arr_usd:e.target.value})} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Stage</label><select value={form.stage} onChange={e=>setForm({...form,stage:e.target.value})} className={inp}>{STAGES.map(s=><option key={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Probability %</label><input type="number" min="0" max="100" value={form.probability} onChange={e=>setForm({...form,probability:Number(e.target.value)})} className={inp} /></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Expected Close</label><input type="date" value={form.expected_close} onChange={e=>setForm({...form,expected_close:e.target.value})} className={inp} /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Next Action</label><input value={form.next_action} onChange={e=>setForm({...form,next_action:e.target.value})} className={inp} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DealDetail({ deal, onEdit, onDelete, onClose }: { deal: Deal; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{deal.title}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Company</p><p className="text-blue-400 text-sm">{deal.company_name}</p></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Value</p><p className="text-white text-sm font-medium">${Number(deal.value_usd).toLocaleString()}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">ARR</p><p className="text-white text-sm">${Number(deal.arr_usd).toLocaleString()}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Stage</p><p className={`text-sm font-medium ${stageColor[deal.stage]||'text-white'}`}>{deal.stage}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Probability</p><p className="text-white text-sm">{deal.probability}%</p></div>
          </div>
          {deal.expected_close && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Expected Close</p><p className="text-white text-sm">{new Date(deal.expected_close).toLocaleDateString()}</p></div>}
          {deal.next_action && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Next Action</p><p className="text-white text-sm">{deal.next_action}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Deal|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Deal|undefined>(undefined);
  const load = async () => { const [d, c] = await Promise.all([api.deals.list(), api.companies.list()]); setDeals(d); setCompanies(c); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete deal?')) return; await api.deals.delete(id); setSelected(null); load(); };
  const filtered = deals.filter(d => d.title.toLowerCase().includes(search.toLowerCase()) || d.company_name?.toLowerCase().includes(search.toLowerCase()) || d.stage?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Deals</h1><p className="text-gray-400 text-sm mt-1">{deals.length} active deals • ${deals.filter(d=>d.stage!=='closed_won'&&d.stage!=='closed_lost').reduce((s,d)=>s+Number(d.value_usd),0).toLocaleString()} pipeline</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus className="w-4 h-4" />New Deal</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search deals..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div className="space-y-2">
          {filtered.map(d => (
            <div key={d.id} onClick={()=>setSelected(d)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-blue-700 ${selected?.id===d.id?'border-blue-600':'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><Briefcase className="w-4 h-4 text-blue-400" /></div>
                  <div><div className="font-medium text-white text-sm">{d.title}</div><div className="text-xs text-gray-500">{d.company_name}</div></div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs font-medium ${stageColor[d.stage]||'text-white'}`}>{d.stage}</span>
                  <div className="text-right"><div className="text-sm font-medium text-white">${Number(d.value_usd).toLocaleString()}</div><div className="text-xs text-gray-400">{d.probability}% win</div></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <DealDetail deal={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <DealForm deal={editItem} companies={companies} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
