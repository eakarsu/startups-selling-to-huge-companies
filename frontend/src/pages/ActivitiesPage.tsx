import { useState, useEffect } from 'react';
import { Plus, Search, Activity } from 'lucide-react';
import { api } from '../api';
import type { Activity as ActivityType, Deal, Contact } from '../types';

const ACTIVITY_TYPES = ['email','call','meeting','demo','proposal_sent','contract_sent','follow_up','linkedin_message'];

function ActivityForm({ activity, deals, contacts, onSave, onCancel }: { activity?: ActivityType; deals: Deal[]; contacts: Contact[]; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ deal_id: activity?.deal_id||(deals[0]?.id||''), contact_id: activity?.contact_id||'', activity_type: activity?.activity_type||'call', subject: activity?.subject||'', notes: activity?.notes||'', outcome: activity?.outcome||'', scheduled_at: activity?.scheduled_at?activity.scheduled_at.slice(0,16):'', duration_mins: activity?.duration_mins||30 });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { activity ? await api.activities.update(activity.id, form) : await api.activities.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{activity ? 'Edit Activity' : 'New Activity'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Deal</label><select value={form.deal_id} onChange={e=>setForm({...form,deal_id:Number(e.target.value)})} className={inp}>{deals.map(d=><option key={d.id} value={d.id}>{d.title}</option>)}</select></div>
          <div><label className="block text-sm text-gray-300 mb-1">Contact (optional)</label><select value={form.contact_id} onChange={e=>setForm({...form,contact_id:e.target.value})} className={inp}><option value="">-- None --</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Type</label><select value={form.activity_type} onChange={e=>setForm({...form,activity_type:e.target.value})} className={inp}>{ACTIVITY_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label className="block text-sm text-gray-300 mb-1">Duration (min)</label><input type="number" value={form.duration_mins} onChange={e=>setForm({...form,duration_mins:Number(e.target.value)})} className={inp} /></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Subject</label><input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} className={inp} required /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} className={inp+" resize-none"} /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Outcome</label><input value={form.outcome} onChange={e=>setForm({...form,outcome:e.target.value})} className={inp} /></div>
          <div><label className="block text-sm text-gray-300 mb-1">Scheduled At</label><input type="datetime-local" value={form.scheduled_at} onChange={e=>setForm({...form,scheduled_at:e.target.value})} className={inp} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActivityDetail({ activity, onEdit, onDelete, onClose }: { activity: ActivityType; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const typeColor: Record<string,string> = { email:'text-blue-400', call:'text-green-400', meeting:'text-purple-400', demo:'text-yellow-400', proposal_sent:'text-orange-400', contract_sent:'text-red-400' };
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{activity.subject}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Type</p><p className={`text-sm font-medium ${typeColor[activity.activity_type]||'text-white'}`}>{activity.activity_type}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Duration</p><p className="text-white text-sm">{activity.duration_mins} min</p></div>
          </div>
          {activity.deal_title && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Deal</p><p className="text-blue-400 text-sm">{activity.deal_title}</p></div>}
          {activity.contact_name && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Contact</p><p className="text-white text-sm">{activity.contact_name}</p></div>}
          {activity.outcome && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Outcome</p><p className="text-white text-sm">{activity.outcome}</p></div>}
          {activity.notes && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Notes</p><p className="text-white text-sm">{activity.notes}</p></div>}
          {activity.scheduled_at && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Scheduled</p><p className="text-white text-sm">{new Date(activity.scheduled_at).toLocaleString()}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ActivityType|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<ActivityType|undefined>(undefined);
  const load = async () => { const [a,d,c] = await Promise.all([api.activities.list(), api.deals.list(), api.contacts.list()]); setActivities(a); setDeals(d); setContacts(c); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.activities.delete(id); setSelected(null); load(); };
  const filtered = activities.filter(a => a.subject?.toLowerCase().includes(search.toLowerCase()) || a.deal_title?.toLowerCase().includes(search.toLowerCase()) || a.activity_type?.toLowerCase().includes(search.toLowerCase()));
  const typeColor: Record<string,string> = { email:'text-blue-400', call:'text-green-400', meeting:'text-purple-400', demo:'text-yellow-400', proposal_sent:'text-orange-400', contract_sent:'text-red-400', follow_up:'text-cyan-400', linkedin_message:'text-indigo-400' };
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Activities</h1><p className="text-gray-400 text-sm mt-1">{activities.length} total activities</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus className="w-4 h-4" />New Activity</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search activities..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div className="space-y-2">
          {filtered.map(a => (
            <div key={a.id} onClick={()=>setSelected(a)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-blue-700 ${selected?.id===a.id?'border-blue-600':'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center"><Activity className="w-4 h-4 text-blue-400" /></div>
                  <div><div className="font-medium text-white text-sm">{a.subject}</div><div className="text-xs text-gray-500">{a.deal_title}</div></div>
                </div>
                <div className="text-right"><div className={`text-xs font-medium ${typeColor[a.activity_type]||'text-white'}`}>{a.activity_type}</div>{a.scheduled_at && <div className="text-xs text-gray-400">{new Date(a.scheduled_at).toLocaleDateString()}</div>}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <ActivityDetail activity={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <ActivityForm activity={editItem} deals={deals} contacts={contacts} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
