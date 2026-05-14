import { useState, useEffect } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { api } from '../api';
import type { Contact, Company } from '../types';

function ContactForm({ contact, companies, onSave, onCancel }: { contact?: Contact; companies: Company[]; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ company_id: contact?.company_id||(companies[0]?.id||''), name: contact?.name||'', title: contact?.title||'', email: contact?.email||'', phone: contact?.phone||'', linkedin: contact?.linkedin||'', decision_maker: contact?.decision_maker||false, relationship_strength: contact?.relationship_strength||'cold', last_contacted: contact?.last_contacted?contact.last_contacted.slice(0,10):'', notes: contact?.notes||'' });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { contact ? await api.contacts.update(contact.id, form) : await api.contacts.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{contact ? 'Edit Contact' : 'New Contact'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Company</label><select value={form.company_id} onChange={e=>setForm({...form,company_id:Number(e.target.value)})} className={inp}>{companies.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inp} required /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className={inp} /></div>
            <div><label className="block text-sm text-gray-300 mb-1">Phone</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className={inp} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Relationship</label><select value={form.relationship_strength} onChange={e=>setForm({...form,relationship_strength:e.target.value})} className={inp}>{['cold','warm','engaged','champion','sponsor'].map(r=><option key={r}>{r}</option>)}</select></div>
            <div className="flex items-center gap-2 pt-6"><input type="checkbox" checked={form.decision_maker} onChange={e=>setForm({...form,decision_maker:e.target.checked})} className="w-4 h-4" /><label className="text-sm text-gray-300">Decision Maker</label></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Last Contacted</label><input type="date" value={form.last_contacted} onChange={e=>setForm({...form,last_contacted:e.target.value})} className={inp} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactDetail({ contact, onEdit, onDelete, onClose }: { contact: Contact; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const relColor: Record<string,string> = { cold:'text-gray-400', warm:'text-yellow-400', engaged:'text-blue-400', champion:'text-green-400', sponsor:'text-purple-400' };
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-white text-lg">{contact.name}</h2><button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button></div>
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">{contact.title}</p><p className="text-blue-400 text-sm">{contact.company_name}</p></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Relationship</p><p className={`text-sm font-medium ${relColor[contact.relationship_strength]||'text-white'}`}>{contact.relationship_strength}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Decision Maker</p><p className={`text-sm ${contact.decision_maker?'text-green-400':'text-gray-400'}`}>{contact.decision_maker?'Yes':'No'}</p></div>
          </div>
          {contact.email && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Email</p><p className="text-blue-400 text-sm">{contact.email}</p></div>}
          {contact.phone && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Phone</p><p className="text-white text-sm">{contact.phone}</p></div>}
          {contact.last_contacted && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Last Contacted</p><p className="text-white text-sm">{new Date(contact.last_contacted).toLocaleDateString()}</p></div>}
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Contact|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Contact|undefined>(undefined);
  const load = async () => { const [c, co] = await Promise.all([api.contacts.list(), api.companies.list()]); setContacts(c); setCompanies(co); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.contacts.delete(id); setSelected(null); load(); };
  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.company_name?.toLowerCase().includes(search.toLowerCase()) || c.title?.toLowerCase().includes(search.toLowerCase()));
  const relColor: Record<string,string> = { cold:'bg-gray-700', warm:'bg-yellow-900', engaged:'bg-blue-900', champion:'bg-green-900', sponsor:'bg-purple-900' };
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Contacts</h1><p className="text-gray-400 text-sm mt-1">{contacts.length} enterprise contacts</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus className="w-4 h-4" />New Contact</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search contacts..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div className="space-y-2">
          {filtered.map(c => (
            <div key={c.id} onClick={()=>setSelected(c)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-blue-700 ${selected?.id===c.id?'border-blue-600':'border-gray-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 ${relColor[c.relationship_strength]||'bg-gray-800'} rounded-lg flex items-center justify-center`}><Users className="w-4 h-4 text-blue-400" /></div>
                  <div><div className="font-medium text-white text-sm">{c.name}</div><div className="text-xs text-gray-500">{c.title} • {c.company_name}</div></div>
                </div>
                <div className="text-right"><div className="text-xs text-gray-300">{c.relationship_strength}</div>{c.decision_maker && <div className="text-xs text-green-400">DM</div>}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <ContactDetail contact={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <ContactForm contact={editItem} companies={companies} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
