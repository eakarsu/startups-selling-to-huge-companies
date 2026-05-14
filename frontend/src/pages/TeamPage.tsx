import { useState, useEffect } from 'react';
import { Plus, Search, UserCheck } from 'lucide-react';
import { api } from '../api';
import type { SalesTeamMember } from '../types';

const ROLES = ['SDR','AE','Senior_AE','Strategic_AE','VP_Sales','CSM'];

function TeamForm({ member, onSave, onCancel }: { member?: SalesTeamMember; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ name: member?.name||'', email: member?.email||'', role: member?.role||'AE', quota_usd: member?.quota_usd||'', deals_won: member?.deals_won||0, revenue_closed: member?.revenue_closed||0, win_rate: member?.win_rate||0, avg_deal_size: member?.avg_deal_size||0, active_deals: member?.active_deals||0, joined_date: member?.joined_date?member.joined_date.slice(0,10):'' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { member ? await api.team.update(member.id, form) : await api.team.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{member ? 'Edit Member' : 'New Team Member'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inp} required /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Role</label><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className={inp}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className={inp} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Quota ($)</label><input type="number" value={form.quota_usd} onChange={e=>setForm({...form,quota_usd:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Active Deals</label><input type="number" value={form.active_deals} onChange={e=>setForm({...form,active_deals:Number(e.target.value)})} className={inp} /></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Joined Date</label><input type="date" value={form.joined_date} onChange={e=>setForm({...form,joined_date:e.target.value})} className={inp} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeamDetail({ member, onEdit, onDelete, onClose }: { member: SalesTeamMember; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const attainment = member.quota_usd > 0 ? ((Number(member.revenue_closed) / Number(member.quota_usd)) * 100).toFixed(0) : '0';
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{member.name}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Role</p><p className="text-blue-400 text-sm font-medium">{member.role}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Attainment</p><p className={`text-sm font-medium ${Number(attainment)>=100?'text-green-400':Number(attainment)>=70?'text-yellow-400':'text-red-400'}`}>{attainment}%</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Revenue Closed</p><p className="text-white text-sm">${Number(member.revenue_closed).toLocaleString()}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Quota</p><p className="text-white text-sm">${Number(member.quota_usd).toLocaleString()}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Deals Won</p><p className="text-white text-sm">{member.deals_won}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Win Rate</p><p className="text-white text-sm">{(Number(member.win_rate)*100).toFixed(0)}%</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Avg Deal Size</p><p className="text-white text-sm">${Number(member.avg_deal_size).toLocaleString()}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Active Deals</p><p className="text-white text-sm">{member.active_deals}</p></div>
          </div>
          {member.email && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Email</p><p className="text-blue-400 text-sm">{member.email}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const [team, setTeam] = useState<SalesTeamMember[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SalesTeamMember|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<SalesTeamMember|undefined>(undefined);
  const load = async () => { const d = await api.team.list(); setTeam(d); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.team.delete(id); setSelected(null); load(); };
  const filtered = team.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.role?.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Sales Team</h1><p className="text-gray-400 text-sm mt-1">{team.length} team members</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus className="w-4 h-4" />Add Member</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search team..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div className="space-y-2">
          {filtered.map(m => {
            const attainment = m.quota_usd > 0 ? ((Number(m.revenue_closed) / Number(m.quota_usd)) * 100).toFixed(0) : '0';
            return (
              <div key={m.id} onClick={()=>setSelected(m)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-blue-700 ${selected?.id===m.id?'border-blue-600':'border-gray-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center text-white font-medium text-sm">{m.name[0]}</div>
                    <div><div className="font-medium text-white text-sm">{m.name}</div><div className="text-xs text-gray-500">{m.role}</div></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right"><div className="text-sm text-white">${Number(m.revenue_closed).toLocaleString()}</div><div className="text-xs text-gray-400">revenue</div></div>
                    <div className="text-right"><div className={`text-sm font-medium ${Number(attainment)>=100?'text-green-400':Number(attainment)>=70?'text-yellow-400':'text-red-400'}`}>{attainment}%</div><div className="text-xs text-gray-400">attainment</div></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selected && <TeamDetail member={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <TeamForm member={editItem} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
