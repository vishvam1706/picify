'use client';
import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, RefreshCw, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';

const TYPE_COLOR = { info: '#06b6d4', warning: '#f97316', success: '#10b981', maintenance: '#ef4444' };

export default function AnnouncementsTab() {
  const { toast } = useToast();
  const [anns, setAnns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', type: 'info', isPinned: false, targetRole: 'all', expiresAt: '' });

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/announcements?active=false');
      const d = await res.json();
      if (d.success) setAnns(d.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || !form.body) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (res.ok) { toast({ title: 'Announcement created' }); setForm({ title: '', body: '', type: 'info', isPinned: false, targetRole: 'all', expiresAt: '' }); fetch_(); }
      else toast({ title: d.error || 'Failed', variant: 'destructive' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const handleToggle = async (ann) => {
    try {
      await fetch('/api/admin/announcements', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ann._id, isActive: !ann.isActive }) });
      fetch_();
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await fetch(`/api/admin/announcements?id=${id}`, { method: 'DELETE' });
      fetch_();
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="glass-card rounded-2xl p-5 border border-border">
        <h3 className="font-bold mb-4">New Announcement</h3>
        <form onSubmit={handleCreate} className="space-y-3">
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title *" required
            className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Message *" required rows={3}
            className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="bg-secondary/60 rounded-xl px-3 py-2.5 text-sm outline-none">
              {['info','warning','success','maintenance'].map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
            <select value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value }))} className="bg-secondary/60 rounded-xl px-3 py-2.5 text-sm outline-none">
              <option value="all">All Users</option>
              <option value="creator">Creators</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.isPinned} onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))} className="rounded" />
            Pin to top
          </label>
          <input type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
            className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none" />
          <Button type="submit" disabled={saving} className="w-full rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" />Publish</>}
          </Button>
        </form>
      </div>

      <div className="glass-card rounded-2xl border border-border overflow-hidden lg:col-span-2">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold">Announcements ({anns.length})</h3>
          <button onClick={fetch_}><RefreshCw className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          : anns.length === 0 ? <p className="text-center text-muted-foreground py-10">No announcements</p>
          : <div className="divide-y divide-border">
            {anns.map(ann => (
              <div key={ann._id} className="p-4 hover:bg-accent/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: TYPE_COLOR[ann.type] }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{ann.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ann.body}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        <span className="capitalize">{ann.type}</span>
                        <span>→ {ann.targetRole}</span>
                        {ann.isPinned && <span className="text-primary font-bold">📌 Pinned</span>}
                        <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleToggle(ann)} className={`text-xs font-bold px-3 py-1 rounded-full ${ann.isActive ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'}`}>
                      {ann.isActive ? 'Live' : 'Hidden'}
                    </button>
                    <button onClick={() => handleDelete(ann._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>}
      </div>
    </div>
  );
}
