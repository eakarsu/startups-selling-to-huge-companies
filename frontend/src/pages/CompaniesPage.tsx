import { useState, useEffect } from 'react';
import { Plus, Search, Building2 } from 'lucide-react';
import { api } from '../api';
import type { Company } from '../types';

function CompanyForm({ company, onSave, onCancel }: { company?: Company; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: company?.name||'', industry: company?.industry||'', revenue_billions: company?.revenue_billions||'', employee_count: company?.employee_count||'', tier: company?.tier||'F500', website: company?.website||'', hq_city: company?.hq_city||'', hq_country: company?.hq_country||'USA', stock_symbol: company?.stock_symbol||'', founded_year: company?.founded_year||'', notes: company?.notes||'' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { company ? await api.companies.update(company.id, form) : await api.companies.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{company ? 'Edit Company' : 'New Company'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inp} required /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Industry</label><input value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Tier</label><select value={form.tier} onChange={e=>setForm({...form,tier:e.target.value})} className={inp}>{['F10','F50','F100','F500','Fortune1000'].map(t=><option key={t}>{t}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Revenue ($B)</label><input type="number" step="0.01" value={form.revenue_billions} onChange={e=>setForm({...form,revenue_billions:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Employees</label><input type="number" value={form.employee_count} onChange={e=>setForm({...form,employee_count:e.target.value})} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">HQ City</label><input value={form.hq_city} onChange={e=>setForm({...form,hq_city:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Country</label><input value={form.hq_country} onChange={e=>setForm({...form,hq_country:e.target.value})} className={inp} /></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Website</label><input value={form.website} onChange={e=>setForm({...form,website:e.target.value})} className={inp} /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} className={inp+" resize-none"} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompanyDetail({ company, onEdit, onDelete, onClose }: { company: Company; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const tierColor: Record<string,string> = { F10: 'text-yellow-400', F50: 'text-blue-400', F100: 'text-green-400', F500: 'text-gray-300', Fortune1000: 'text-gray-400' };
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{company.name}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Tier</p><p className={`text-sm font-medium ${tierColor[company.tier] || 'text-white'}`}>{company.tier}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Revenue</p><p className="text-white text-sm">${Number(company.revenue_billions).toFixed(2)}B</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Employees</p><p className="text-white text-sm">{Number(company.employee_count).toLocaleString()}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Industry</p><p className="text-white text-sm">{company.industry}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">HQ</p><p className="text-white text-sm">{company.hq_city}, {company.hq_country}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Founded</p><p className="text-white text-sm">{company.founded_year}</p></div>
          </div>
          {company.notes && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Notes</p><p className="text-white text-sm">{company.notes}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Company|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Company|undefined>(undefined);
  const load = async () => { const d = await api.companies.list(); setCompanies(d); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.companies.delete(id); setSelected(null); load(); };
  const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.industry?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Companies</h1><p className="text-gray-400 text-sm mt-1">{companies.length} Fortune 500 accounts</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus className="w-4 h-4" />New Company</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search companies..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} onClick={()=>setSelected(c)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-blue-700 ${selected?.id===c.id?'border-blue-600':'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><Building2 className="w-4 h-4 text-blue-400" /></div>
                  <div><div className="font-medium text-white text-sm">{c.name}</div><div className="text-xs text-gray-500">{c.industry} • {c.hq_city}</div></div>
                </div>
                <div className="text-right"><div className="text-sm font-medium text-white">${Number(c.revenue_billions).toFixed(1)}B</div><div className="text-xs text-blue-400">{c.tier}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <CompanyDetail company={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <CompanyForm company={editItem} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
