'use client';
import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Pencil, Trash2, Tag, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';

export default function CategoriesTab() {
  const { toast } = useToast();
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', type: 'category', description: '', color: '#e60023', emoji: '' });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/categories?active=false');
      const d = await res.json();
      if (d.success) setCats(d.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const url = editId ? `/api/admin/categories/${editId}` : '/api/admin/categories';
      const method = editId ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (res.ok) {
        toast({ title: `Category ${editId ? 'updated' : 'created'}` });
        setForm({ name: '', type: 'category', description: '', color: '#e60023', emoji: '' });
        setEditId(null);
        fetch_();
      } else toast({ title: d.error || 'Failed', variant: 'destructive' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      toast({ title: 'Deleted' });
      fetch_();
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  const startEdit = (cat) => {
    setEditId(cat._id);
    setForm({ name: cat.name, type: cat.type, description: cat.description || '', color: cat.color || '#e60023', emoji: cat.emoji || '' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="glass-card rounded-2xl p-5 border border-border lg:col-span-1">
        <h3 className="font-bold mb-4">{editId ? 'Edit Category' : 'New Category'}</h3>
        <form onSubmit={handleSave} className="space-y-3">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Name *" required
            className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none">
            <option value="category">Category</option>
            <option value="tag">Tag</option>
          </select>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Description"
            className="w-full bg-secondary/60 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
          <div className="flex gap-2">
            <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="Emoji" maxLength={4}
              className="w-20 bg-secondary/60 rounded-xl px-3 py-2.5 text-sm outline-none text-center" />
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-muted-foreground">Color</label>
              <input type="color" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer border-0" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving} className="flex-1 rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? 'Update' : <><Plus className="w-4 h-4 mr-1" />Create</>}
            </Button>
            {editId && <Button type="button" variant="secondary" onClick={() => { setEditId(null); setForm({ name: '', type: 'category', description: '', color: '#e60023', emoji: '' }); }} className="rounded-xl">Cancel</Button>}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="glass-card rounded-2xl border border-border overflow-hidden lg:col-span-2">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold">All Categories & Tags ({cats.length})</h3>
          <button onClick={fetch_}><RefreshCw className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
        </div>
        {loading ? <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          : cats.length === 0 ? <p className="text-center text-muted-foreground py-10">No categories yet</p>
          : <div className="divide-y divide-border">
            {cats.map(cat => (
              <div key={cat._id} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30">
                <span className="text-xl w-7">{cat.emoji || <Tag className="w-4 h-4 text-muted-foreground" />}</span>
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{cat.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{cat.type} · {cat.isActive ? 'Active' : 'Hidden'}</p>
                </div>
                <span className="text-xs text-muted-foreground">{cat.pinsCount || 0} pins</span>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg hover:bg-secondary"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(cat._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>}
      </div>
    </div>
  );
}
