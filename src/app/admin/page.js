'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toaster';
import { Button } from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import dynamic from 'next/dynamic';
import {
  Loader2, Users, AlertTriangle, Shield, Activity, FileText, Ban, Check,
  ChevronRight, Search, Settings, ScrollText, Download, Eye, Trash2,
  RefreshCw, CheckCircle2, XCircle, ImageIcon, ToggleLeft, ToggleRight,
  Lock, Globe, Database, Server, TrendingUp, Heart, Bookmark, MessageCircle,
  ShieldAlert, BarChart3, Plus, Tag, Megaphone, Zap, LineChart, ExternalLink, BadgeCheck, BadgeX
} from 'lucide-react';

const CategoriesTab = dynamic(() => import('./CategoriesTab'), { loading: () => <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> });
const AnnouncementsTab = dynamic(() => import('./AnnouncementsTab'), { loading: () => <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> });
const FeatureFlagsTab = dynamic(() => import('./FeatureFlagsTab'), { loading: () => <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> });
const PlatformAnalyticsTab = dynamic(() => import('./PlatformAnalyticsTab'), { loading: () => <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> });
const ServerHealthTab = dynamic(() => import('./ServerHealthTab'), { loading: () => <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> });

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'reports', label: 'Reports & Flagged', icon: AlertTriangle },
  { id: 'content', label: 'Content Moderation', icon: ImageIcon },
  { id: 'analytics', label: 'Platform Analytics', icon: BarChart3 },
  { id: 'categories', label: 'Categories & Tags', icon: Tag },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  // { id: 'flags', label: 'Feature Flags', icon: Zap },
  { id: 'system', label: 'System Settings', icon: Settings },
  { id: 'health', label: 'Server Health', icon: Server },
  { id: 'logs', label: 'Audit Logs', icon: ScrollText },
  { id: 'security', label: 'Security & Export', icon: ShieldAlert },
];

/* ─── Shared sub-components ─── */
function Card({ title, value, subtitle, highlight, icon: Icon, color = '#e60023' }) {
  return (
    <div className="glass-card rounded-2xl p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
          {Icon && <Icon className="w-4 h-4" style={{ color }} />}
        </div>
      </div>
      <p className="text-3xl font-black">{(value || 0).toLocaleString()}</p>
      {subtitle && <p className={`text-xs mt-1 ${highlight ? 'text-destructive' : 'text-muted-foreground'}`}>{subtitle}</p>}
    </div>
  );
}

function Badge({ label, color }) {
  const cls = {
    green: 'bg-green-500/10 text-green-500',
    red: 'bg-red-500/10 text-red-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    blue: 'bg-blue-500/10 text-blue-500',
    gray: 'bg-secondary text-secondary-foreground',
  }[color] || 'bg-secondary text-secondary-foreground';
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>{label}</span>;
}

/* ─── Users Tab ─── */
function UsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?limit=30&search=${search}`);
      const data = await res.json();
      if (res.ok) setUsers(data.data.docs || []);
    } catch { toast({ title: 'Failed to load users', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [search, toast]);

  useEffect(() => { fetchUsers(); }, []);

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        toast({ title: `User ${action} successful` });

        // Optimistic UI update
        setUsers(current => current.map(u => {
          if (u._id === id) {
            if (action === 'verify') return { ...u, isVerified: true };
            if (action === 'unverify') return { ...u, isVerified: false };
            if (action === 'ban') return { ...u, isActive: false };
            if (action === 'unban') return { ...u, isActive: true };
            if (action === 'make_creator') return { ...u, isCreator: true };
          }
          return u;
        }));

        // Background refetch with cache buster
        fetch(`/api/admin/users?limit=30&search=${search}&_t=${Date.now()}`)
          .then(r => r.json())
          .then(d => { if (d.success) setUsers(d.data.docs || []); });
      }
      else { const d = await res.json(); toast({ title: d.error, variant: 'destructive' }); }
    } catch { toast({ title: 'Action failed', variant: 'destructive' }); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchUsers()}
            placeholder="Search username or email..."
            className="w-full h-10 bg-secondary/60 rounded-lg pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <Button onClick={fetchUsers} size="sm">Search</Button>
      </div>
      <div className="glass-card rounded-2xl overflow-hidden border border-border">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan="4" className="px-6 py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
            ) : users.map(u => (
              <tr key={u._id} className="hover:bg-accent/40">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar src={u.profileImage} size="sm" alt={u.username} />
                    <div>
                      <p className="font-semibold">{u.username}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {!u.isActive ? <Badge label="Banned" color="red" /> : u.isVerified ? <Badge label="Verified" color="green" /> : <Badge label="Unverified" color="yellow" />}
                </td>
                <td className="px-6 py-4"><Badge label={u.role} color={u.role === 'admin' ? 'blue' : 'gray'} /></td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2 flex-wrap">
                    {!u.isVerified
                      ? <Button variant="secondary" size="sm" onClick={() => handleAction(u._id, 'verify')} title="Grant verified badge">
                        <BadgeCheck className="w-3.5 h-3.5 mr-1 text-blue-500" />Verify
                      </Button>
                      : <Button variant="secondary" size="sm" onClick={() => handleAction(u._id, 'unverify')} title="Remove verified badge" className="border border-blue-500/30 text-blue-500 hover:bg-blue-500/10">
                        <BadgeX className="w-3.5 h-3.5 mr-1" />Unverify
                      </Button>
                    }
                    {u.isActive
                      ? <Button variant="destructive" size="sm" onClick={() => handleAction(u._id, 'ban')}><Ban className="w-3.5 h-3.5 mr-1" />Ban</Button>
                      : <Button variant="secondary" size="sm" onClick={() => handleAction(u._id, 'unban')}>Unban</Button>}
                    {!u.isCreator && <Button variant="secondary" size="sm" onClick={() => handleAction(u._id, 'make_creator')}><Plus className="w-3.5 h-3.5 mr-1" />Creator</Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Reports Tab ─── */
function ReportsTab() {
  const { toast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${status}&limit=30`);
      const data = await res.json();
      if (res.ok) setReports(data.data?.docs || []);
    } catch { toast({ title: 'Failed to load reports', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [status, toast]);

  useEffect(() => { fetchReports(); }, [status]);

  const handleResolve = async (id, action) => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: action })
      });
      if (res.ok) { toast({ title: `Report ${action}` }); fetchReports(); }
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  const statuses = ['pending', 'resolved', 'dismissed'];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        {statuses.map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all capitalize ${status === s ? 'bg-primary text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'}`}>
            {s}
          </button>
        ))}
        <button onClick={fetchReports} className="ml-auto text-muted-foreground hover:text-foreground"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div> : (
        <div className="glass-card rounded-2xl overflow-hidden border border-border">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="px-5 py-3">Reporter</th>
                <th className="px-5 py-3">Target</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3">Date</th>
                {status === 'pending' && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-10 text-center text-muted-foreground">No {status} reports</td></tr>
              ) : reports.map(r => (
                <tr key={r._id} className="hover:bg-accent/40">
                  <td className="px-5 py-4 font-medium">{r.reporterId?.username || 'Anonymous'}</td>
                  <td className="px-5 py-4">
                    {r.entity ? (
                      <a
                        href={r.entityType === 'user' ? `/${r.entity.username}` : `/pin/${r.entity._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 max-w-[150px] truncate"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        {r.entityType === 'user' ? (r.entity.username) : (r.entity.title || 'Pin')}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">Deleted</span>
                    )}
                  </td>
                  <td className="px-5 py-4"><Badge label={r.entityType || 'content'} color="blue" /></td>
                  <td className="px-5 py-4 text-muted-foreground max-w-xs truncate" title={r.reason}>{r.reason}</td>
                  <td className="px-5 py-4 text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                  {status === 'pending' && (
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" onClick={() => handleResolve(r._id, 'resolved')}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Resolve</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleResolve(r._id, 'dismissed')}><XCircle className="w-3.5 h-3.5 mr-1" />Dismiss</Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Content Moderation Tab ─── */
function ContentTab() {
  const { toast } = useToast();
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNsfw = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/content?nsfw=true&limit=20');
      const data = await res.json();
      if (res.ok) setPins(data.data?.docs || []);
    } catch { toast({ title: 'Failed to load content', variant: 'destructive' }); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchNsfw(); }, []);

  const handlePin = async (id, action) => {
    try {
      const res = await fetch(`/api/admin/content/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) { toast({ title: `Pin ${action}` }); setPins(p => p.filter(x => x._id !== id)); }
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">NSFW / Flagged Content</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Review auto-detected or reported content</p>
        </div>
        <button onClick={fetchNsfw} className="text-muted-foreground hover:text-foreground"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div> : pins.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center text-muted-foreground border border-dashed">
          <CheckCircle2 className="w-12 h-12 mb-3 mx-auto opacity-30" />
          <p className="font-semibold">No flagged content to review</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {pins.map(pin => (
            <div key={pin._id} className="glass-card rounded-2xl overflow-hidden border border-border group">
              <div className="relative aspect-square bg-muted overflow-hidden">
                {pin.images?.[0]?.url ? (
                  <img src={pin.images[0].url} alt={pin.title} className="w-full h-full object-cover blur-sm group-hover:blur-none transition-all" />
                ) : <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><ImageIcon className="w-8 h-8" /></div>}
                {pin.isNSFW && <div className="absolute top-2 left-2"><Badge label="NSFW" color="red" /></div>}
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold truncate mb-2">{pin.title || 'Untitled'}</p>
                <div className="flex gap-2">
                  <Button size="sm" variant="destructive" className="flex-1 text-xs" onClick={() => handlePin(pin._id, 'delete')}>
                    <Trash2 className="w-3 h-3 mr-1" />Delete
                  </Button>
                  <Button size="sm" variant="secondary" className="flex-1 text-xs" onClick={() => handlePin(pin._id, 'approve')}>
                    <Check className="w-3 h-3 mr-1" />Approve
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── System Settings Tab ─── */
function SystemTab() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/system-settings').then(r => r.json()).then(d => { if (d.success) setSettings(d.data); });
  }, []);

  // Immediately save a nested platform/upload/trending toggle
  const saveSingle = async (section, subKey, newVal) => {
    try {
      await fetch('/api/admin/system-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [section]: { [subKey]: newVal } })
      });
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    }
  };

  const handleToggle = (section, subKey) => (v) => {
    setSettings(s => ({ ...s, [section]: { ...s[section], [subKey]: v } }));
    saveSingle(section, subKey, v);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: settings.platform,
          upload: settings.upload,
          trending: settings.trending,
        })
      });
      if (res.ok) toast({ title: 'Settings saved!' });
      else toast({ title: 'Failed to save', variant: 'destructive' });
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  if (!settings) return <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>;

  const SettingToggle = ({ label, desc, value, onChange }) => (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div><p className="font-medium text-sm">{label}</p><p className="text-xs text-muted-foreground mt-0.5">{desc}</p></div>
      <button onClick={() => onChange(!value)} className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-secondary'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="glass-card rounded-2xl p-6 border border-border">
        <h3 className="font-bold mb-1 flex items-center gap-2"><Globe className="w-4 h-4 text-primary" />Platform Settings</h3>
        <p className="text-sm text-muted-foreground mb-4">Control core platform behavior. Changes are saved instantly.</p>
        <SettingToggle
          label="Maintenance Mode" desc="Takes site offline for all non-admin users"
          value={settings.platform?.maintenanceMode || false}
          onChange={handleToggle('platform', 'maintenanceMode')}
        />
        <SettingToggle
          label="Open Registrations" desc="Allow new users to sign up"
          value={settings.platform?.registrationOpen ?? true}
          onChange={handleToggle('platform', 'registrationOpen')}
        />
      </div>

      <div className="glass-card rounded-2xl p-6 border border-border">
        <h3 className="font-bold mb-1 flex items-center gap-2"><Database className="w-4 h-4 text-primary" />Upload Settings</h3>
        <p className="text-sm text-muted-foreground mb-4">Control file upload limits</p>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Max File Size (MB)</label>
          <input
            type="number" min="1" max="100"
            value={settings.upload?.maxFileSize || 20}
            onChange={e => setSettings(s => ({ ...s, upload: { ...s.upload, maxFileSize: parseInt(e.target.value) } }))}
            className="w-32 h-10 bg-secondary/60 rounded-xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-border">
        <h3 className="font-bold mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Trending Weights</h3>
        <p className="text-sm text-muted-foreground mb-4">Tune how trending scores are computed</p>
        {['weightViews', 'weightLikes', 'weightSaves'].map(key => (
          <div key={key} className="flex items-center justify-between py-2">
            <label className="text-sm font-medium capitalize">{key.replace('weight', '')} weight</label>
            <input
              type="number" min="0" max="10" step="0.5"
              value={settings.trending?.[key] ?? 1}
              onChange={e => setSettings(s => ({ ...s, trending: { ...s.trending, [key]: parseFloat(e.target.value) } }))}
              className="w-20 h-8 bg-secondary/60 rounded-lg px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="self-start rounded-full px-8">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Check className="w-4 h-4 mr-2" />Save Settings</>}
      </Button>
    </div>
  );
}

/* ─── Audit Logs Tab ─── */
function LogsTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [totalDocs, setTotalDocs] = useState(0);

  const fetchLogs = useCallback(async (p = 1, replace = true) => {
    if (replace) setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 30 });
      if (actionFilter) params.set('action', actionFilter);
      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();
      if (res.ok) {
        const docs = data.data?.docs || [];
        if (replace) setLogs(docs); else setLogs(prev => [...prev, ...docs]);
        setHasMore(!!data.data?.hasNextPage);
        setTotalDocs(data.data?.totalDocs || 0);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [actionFilter]);

  useEffect(() => { setPage(1); fetchLogs(1); }, [fetchLogs]);

  const loadMore = () => { const next = page + 1; setPage(next); fetchLogs(next, false); };

  // Colour-code actions
  const actionColor = (action = '') => {
    const a = action.toLowerCase();
    if (a.includes('ban') || a.includes('delete') || a.includes('removed') || a.includes('reject')) return 'red';
    if (a.includes('verify') || a.includes('approved') || a.includes('resolv')) return 'green';
    if (a.includes('setting') || a.includes('flag') || a.includes('system') || a.includes('update')) return 'blue';
    if (a.includes('report') || a.includes('dismiss')) return 'yellow';
    return 'gray';
  };

  // Friendly label
  const actionLabel = (a = '') =>
    a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const filteredLogs = search.trim()
    ? logs.filter(l =>
      (l.adminId?.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.action || '').toLowerCase().includes(search.toLowerCase())
    )
    : logs;

  const ACTION_FILTERS = [
    '', 'user_verified', 'user_banned', 'user_unban', 'content_deleted',
    'report_reviewed', 'settings_updated', 'UPDATE_SYSTEM_SETTINGS',
    'TOGGLE_FEATURE_FLAG', 'pin_removed',
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-bold text-lg">Admin Audit Logs</h3>
          <p className="text-sm text-muted-foreground">{totalDocs.toLocaleString()} total actions recorded</p>
        </div>
        <button
          onClick={() => { setPage(1); fetchLogs(1); }}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by admin or action..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-secondary/60 rounded-xl pl-9 pr-4 h-10 text-sm outline-none ring-2 ring-transparent focus:ring-primary/25 transition-all"
          />
        </div>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          className="bg-secondary/60 rounded-xl px-3 h-10 text-sm outline-none ring-2 ring-transparent focus:ring-primary/25 transition-all min-w-[180px]"
        >
          <option value="">All Actions</option>
          {ACTION_FILTERS.filter(Boolean).map(a => (
            <option key={a} value={a}>{actionLabel(a)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-border">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground border-b border-border">
            <tr>
              <th className="px-5 py-3 w-36">Admin</th>
              <th className="px-5 py-3 w-52">Action</th>
              <th className="px-5 py-3">Details</th>
              <th className="px-5 py-3 w-40">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan="4" className="px-5 py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              </td></tr>
            ) : filteredLogs.length === 0 ? (
              <tr><td colSpan="4" className="px-5 py-12 text-center text-muted-foreground">
                <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium">No audit logs found</p>
                <p className="text-xs mt-1">Actions taken in the admin panel will appear here</p>
              </td></tr>
            ) : filteredLogs.map(log => {
              const detailStr = JSON.stringify(log.details || {}, null, 2);
              const isExpanded = expandedId === log._id;
              return (
                <>
                  <tr
                    key={log._id}
                    onClick={() => setExpandedId(isExpanded ? null : log._id)}
                    className="hover:bg-accent/40 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-semibold">{log.adminId?.displayName || log.adminId?.username || 'System'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge label={actionLabel(log.action)} color={actionColor(log.action)} />
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs max-w-xs">
                      <span className="truncate block max-w-[260px]">
                        {detailStr === '{}' ? '—' : detailStr.slice(0, 80) + (detailStr.length > 80 ? '…' : '')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${log._id}-detail`} className="bg-secondary/20">
                      <td colSpan="4" className="px-5 py-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-1.5">Full Details</p>
                        <pre className="text-xs bg-background rounded-xl p-3 overflow-x-auto border border-border max-h-48 overflow-y-auto">
                          {detailStr}
                        </pre>
                        {log.entityId && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Entity: <code className="text-foreground">{log.entityType} / {log.entityId}</code>
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore && !loading && (
        <div className="flex justify-center">
          <Button variant="secondary" size="sm" onClick={loadMore} className="rounded-full px-8">
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Security & Export Tab ─── */
function SecurityTab() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState('');

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const res = await fetch(`/api/admin/export?type=${type}`);
      const data = await res.json();
      if (res.ok) {
        const blob = new Blob([JSON.stringify(data.data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `picify_${type}_export_${Date.now()}.json`;
        a.click(); URL.revokeObjectURL(url);
        toast({ title: `Exported ${data.data.count} ${type}` });
      }
    } catch { toast({ title: 'Export failed', variant: 'destructive' }); }
    finally { setExporting(''); }
  };

  const exports = [
    { type: 'users', label: 'Export Users', icon: Users, desc: 'All user accounts (no passwords)', color: '#e60023' },
    { type: 'pins', label: 'Export Pins', icon: ImageIcon, desc: 'All pins with metadata', color: '#7c3aed' },
    { type: 'boards', label: 'Export Boards', icon: BarChart3, desc: 'All boards data', color: '#f97316' },
    { type: 'comments', label: 'Export Comments', icon: MessageCircle, desc: 'All comments data', color: '#06b6d4' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h3 className="font-bold mb-1 flex items-center gap-2"><Lock className="w-4 h-4 text-primary" />Security Overview</h3>
        <p className="text-sm text-muted-foreground mb-4">Platform security status and data export tools</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Data Encryption', status: 'Active', color: 'green' },
            { label: 'Anti-Spam', status: 'Active', color: 'green' },
            { label: 'NSFW Detection', status: 'Active', color: 'green' },
            { label: 'Rate Limiting', status: 'Active', color: 'green' },
            { label: '2FA Available', status: 'Optional', color: 'yellow' },
            { label: 'Maintenance Mode', status: 'Inactive', color: 'gray' },
          ].map(item => (
            <div key={item.label} className="glass-card rounded-xl p-4 border border-border">
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <Badge label={item.status} color={item.color} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-1 flex items-center gap-2"><Download className="w-4 h-4 text-primary" />Data Export Tools</h3>
        <p className="text-sm text-muted-foreground mb-4">Download platform data as JSON (up to 1,000 records per export)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exports.map(({ type, label, icon: Icon, desc, color }) => (
            <div key={type} className="glass-card rounded-2xl p-5 border border-border hover:border-primary/40 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <Badge label="JSON" color="gray" />
              </div>
              <p className="font-semibold text-sm mb-1">{label}</p>
              <p className="text-xs text-muted-foreground mb-4">{desc}</p>
              <Button
                size="sm" variant="secondary"
                onClick={() => handleExport(type)}
                disabled={exporting === type}
                className="w-full rounded-xl"
              >
                {exporting === type ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                Download
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Admin Dashboard ─── */
export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);

  // Guard: only redirect after auth has fully resolved
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (!authLoading && user && user.role !== 'admin') router.push('/');
  }, [user, authLoading, router]);

  // Fetch dashboard stats (always call — skip when not admin)
  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    fetch('/api/admin/stats').then(r => r.json()).then(d => { if (d.success) setStats(d.data); });
  }, [user]);

  // Still loading auth — show spinner
  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  // Logged in but not admin
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Shield className="w-16 h-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-black">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
        <Link href="/" className="text-primary font-semibold hover:underline">← Back to Home</Link>
      </div>
    );
  }



  const tabMap = {
    dashboard: null,
    users: <UsersTab />,
    reports: <ReportsTab />,
    content: <ContentTab />,
    analytics: <PlatformAnalyticsTab />,
    categories: <CategoriesTab />,
    announcements: <AnnouncementsTab />,
    flags: <FeatureFlagsTab />,
    system: <SystemTab />,
    health: <ServerHealthTab />,
    logs: <LogsTab />,
    security: <SecurityTab />,
  };

  const dashboardCards = [
    { title: 'Total Users', value: stats?.users?.total, subtitle: `+${stats?.users?.recent30d || 0} this month`, icon: Users, color: '#e60023' },
    { title: 'Active Users', value: stats?.users?.active, subtitle: 'Not banned', icon: Shield, color: '#10b981' },
    { title: 'Pending Reports', value: stats?.moderation?.pendingReports, highlight: (stats?.moderation?.pendingReports || 0) > 0, subtitle: 'Requires review', icon: AlertTriangle, color: '#f97316' },
    { title: 'Total Pins', value: stats?.content?.pins, subtitle: 'Across all boards', icon: ImageIcon, color: '#7c3aed' },
    { title: 'Total Boards', value: stats?.content?.boards, subtitle: 'Across all users', icon: FileText, color: '#06b6d4' },
    { title: 'NSFW Flagged', value: stats?.content?.nsfwPins, highlight: true, subtitle: 'Needs moderation', icon: ShieldAlert, color: '#ef4444' },
  ];

  const renderTab = (tab) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;
    return (
      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
        className={`group relative flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
          ? 'bg-primary text-white shadow-md shadow-primary/20'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
          }`}>
        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground transition-colors'}`} />
        {tab.label}
        {isActive && <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Premium Sidebar */}
      <aside className="w-64 border-r border-border/40 bg-card/80 backdrop-blur-xl flex flex-col fixed inset-y-0 left-0 z-40 shadow-sm transition-all">
        <div className="p-5 flex-1 overflow-y-auto hide-scrollbar flex flex-col">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-8 mt-2 px-1">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-rose-600 rounded-2xl text-white flex items-center justify-center font-black text-xl shadow-lg shadow-primary/30">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-black tracking-tight text-lg leading-none text-foreground">Admin Core</h2>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">Production Panel</p>
            </div>
          </div>

          <nav className="flex flex-col gap-6 flex-1">
            {/* Overview Group */}
            <div className="flex flex-col gap-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">Overview</p>
              {TABS.filter(t => ['dashboard', 'analytics'].includes(t.id)).map(renderTab)}
            </div>

            {/* Moderation Group */}
            <div className="flex flex-col gap-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">Moderation</p>
              {TABS.filter(t => ['users', 'reports', 'content'].includes(t.id)).map(renderTab)}
            </div>

            {/* Management Group */}
            <div className="flex flex-col gap-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">Management</p>
              {TABS.filter(t => ['categories', 'announcements', 'flags'].includes(t.id)).map(renderTab)}
            </div>

            {/* System Group */}
            <div className="flex flex-col gap-1">
              <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">System</p>
              {TABS.filter(t => ['system', 'health', 'logs', 'security'].includes(t.id)).map(renderTab)}
            </div>
          </nav>
        </div>

        {/* User Profile & Exit */}
        <div className="p-4 m-4 rounded-2xl bg-secondary/50 border border-border/50 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <Avatar src={user.profileImage} alt={user.username} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-foreground">{user.displayName || user.username}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Super Admin</p>
            </div>
          </div>
          <Link href="/" className="flex items-center justify-center gap-2 text-sm font-semibold bg-background hover:bg-accent border border-border transition-colors w-full py-2.5 rounded-xl text-foreground shadow-sm group">
            <Globe className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" /> Exit to Site
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 min-h-screen bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col gap-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground">{TABS.find(t => t.id === activeTab)?.label}</h1>
            <p className="text-muted-foreground text-sm font-medium">Manage platform content, users, and settings</p>
          </div>

          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {dashboardCards.map(c => <Card key={c.title} {...c} />)}
            </div>
          )}

          <div className="animate-fade-up animate-delay-100">
            {tabMap[activeTab]}
          </div>
        </div>
      </main>
    </div>
  );
}
