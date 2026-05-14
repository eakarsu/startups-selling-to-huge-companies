import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Pin } from 'lucide-react';
import { api } from '../api';
import type { Note, Deal } from '../types';

const NOTE_TYPES = ['general','meeting_summary','objection','competitor_intel','next_steps','executive_summary'];

function NoteForm({ note, deals, onSave, onCancel }: { note?: Note; deals: Deal[]; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ deal_id: note?.deal_id||(deals[0]?.id||''), content: note?.content||'', note_type: note?.note_type||'general', is_pinned: note?.is_pinned||false });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { note ? await api.notes.update(note.id, form) : await api.notes.create(form); onSave(); } catch(err){console.error(err);} };
  const inp = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-white mb-4">{note ? 'Edit Note' : 'New Note'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-sm text-gray-300 mb-1">Deal</label><select value={form.deal_id} onChange={e=>setForm({...form,deal_id:Number(e.target.value)})} className={inp}>{deals.map(d=><option key={d.id} value={d.id}>{d.title}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-300 mb-1">Note Type</label><select value={form.note_type} onChange={e=>setForm({...form,note_type:e.target.value})} className={inp}>{NOTE_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
            <div className="flex items-center gap-2 pt-6"><input type="checkbox" checked={form.is_pinned} onChange={e=>setForm({...form,is_pinned:e.target.checked})} className="w-4 h-4" /><label className="text-sm text-gray-300">Pin Note</label></div>
          </div>
          <div><label className="block text-sm text-gray-300 mb-1">Content</label><textarea value={form.content} onChange={e=>setForm({...form,content:e.target.value})} rows={5} className={inp+" resize-none"} required /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm">Save</button>
            <button type="button" onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NoteDetail({ note, onEdit, onDelete, onClose }: { note: Note; onEdit: () => void; onDelete: () => void; onClose: () => void }) {
  const typeColor: Record<string,string> = { general:'text-gray-300', meeting_summary:'text-blue-400', objection:'text-red-400', competitor_intel:'text-orange-400', next_steps:'text-green-400', executive_summary:'text-purple-400' };
  return (
    <div className="bg-gray-900 border-l border-gray-800 w-96 flex-shrink-0 overflow-y-auto">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {note.is_pinned && <Pin className="w-4 h-4 text-yellow-400" />}
            <h2 className="font-bold text-white text-lg capitalize">{note.note_type.replace('_',' ')}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Type</p><p className={`text-sm font-medium ${typeColor[note.note_type]||'text-white'}`}>{note.note_type.replace('_',' ')}</p></div>
            <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs">Pinned</p><p className={`text-sm ${note.is_pinned?'text-yellow-400':'text-gray-400'}`}>{note.is_pinned?'Yes':'No'}</p></div>
          </div>
          {note.deal_title && <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Deal</p><p className="text-blue-400 text-sm">{note.deal_title}</p></div>}
          <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-2">Content</p><p className="text-white text-sm leading-relaxed">{note.content}</p></div>
          <div className="bg-gray-800 rounded-lg p-3"><p className="text-gray-400 text-xs mb-1">Created</p><p className="text-white text-sm">{new Date(note.created_at).toLocaleString()}</p></div>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={onEdit} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg">Edit</button>
          <button onClick={onDelete} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-400 text-sm font-medium py-2 rounded-lg">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Note|null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Note|undefined>(undefined);
  const load = async () => { const [n,d] = await Promise.all([api.notes.list(), api.deals.list()]); setNotes(n); setDeals(d); };
  useEffect(()=>{ load(); },[]);
  const handleDelete = async (id: number) => { if(!confirm('Delete?')) return; await api.notes.delete(id); setSelected(null); load(); };
  const filtered = notes.filter(n => n.content?.toLowerCase().includes(search.toLowerCase()) || n.deal_title?.toLowerCase().includes(search.toLowerCase()) || n.note_type?.toLowerCase().includes(search.toLowerCase()));
  const typeColor: Record<string,string> = { general:'text-gray-300', meeting_summary:'text-blue-400', objection:'text-red-400', competitor_intel:'text-orange-400', next_steps:'text-green-400', executive_summary:'text-purple-400' };
  return (
    <div className="flex h-full">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-white">Notes</h1><p className="text-gray-400 text-sm mt-1">{notes.length} deal notes</p></div>
          <button onClick={()=>{setEditItem(undefined);setShowForm(true);}} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"><Plus className="w-4 h-4" />New Note</button>
        </div>
        <div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes..." className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <div className="space-y-2">
          {filtered.map(n => (
            <div key={n.id} onClick={()=>setSelected(n)} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-all hover:border-blue-700 ${selected?.id===n.id?'border-blue-600':'border-gray-800'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-blue-400" /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">{n.is_pinned && <Pin className="w-3 h-3 text-yellow-400 flex-shrink-0" />}<span className={`text-xs font-medium ${typeColor[n.note_type]||'text-white'}`}>{n.note_type.replace('_',' ')}</span></div>
                    <div className="text-gray-300 text-sm mt-0.5 truncate">{n.content.slice(0,100)}{n.content.length>100?'...':''}</div>
                    <div className="text-xs text-gray-500 mt-1">{n.deal_title}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && <NoteDetail note={selected} onEdit={()=>{setEditItem(selected);setShowForm(true);}} onDelete={()=>handleDelete(selected.id)} onClose={()=>setSelected(null)} />}
      {showForm && <NoteForm note={editItem} deals={deals} onSave={()=>{setShowForm(false);load();}} onCancel={()=>setShowForm(false)} />}
    </div>
  );
}
