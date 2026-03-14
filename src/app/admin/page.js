'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toaster';
import { Button } from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import { Loader2, Users, AlertTriangle, Shield, Activity, FileText, Ban, Check, ChevronRight, Search } from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'reports', label: 'Reports & Flagged', icon: AlertTriangle },
  { id: 'content', label: 'Content Moderation', icon: FileText },
  { id: 'system', label: 'System Settings', icon: Shield },
];

function Card({ title, subtitle, value, highlight }) {
  return (
    <div className="glass-card rounded-2xl p-5 border-l-4 border-l-primary">
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
      <div className="flex items-end justify-between mt-2">
        <p className="text-3xl font-black">{value || 0}</p>
        {subtitle && <p className={`text-sm font-medium ${highlight ? 'text-destructive' : 'text-muted-foreground'}`}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Users Tab
// ----------------------------------------------------
function UsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?limit=30&search=${search}`);
      const data = await res.json();
      if (res.ok) setUsers(data.data.docs);
    } catch { toast({ title: 'Failed to load users', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

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
        fetchUsers();
      } else {
        const data = await res.json();
        toast({ title: data.error, variant: 'destructive' });
      }
    } catch { toast({ title: 'Action failed', variant: 'destructive' }); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()}
            placeholder="Search username or email..." 
            className="w-full h-10 bg-secondary/60 rounded-lg pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <Button onClick={fetchUsers} size="sm">Search</Button>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border">
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
              <tr><td colSpan="4" className="px-6 py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary"/></td></tr>
            ) : users.map(u => (
              <tr key={u._id} className="hover:bg-accent/40">
                <td className="px-6 py-4 flex items-center gap-3">
                  <Avatar src={u.profileImage} size="sm" alt={u.username} />
                  <div>
                    <p className="font-semibold text-foreground">{u.username}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {!u.isActive ? (
                    <span className="bg-destructive/10 text-destructive px-2.5 py-1 rounded-full text-xs font-bold">Banned</span>
                  ) : u.isVerified ? (
                    <span className="bg-green-500/10 text-green-500 px-2.5 py-1 rounded-full text-xs font-bold">Verified</span>
                  ) : (
                    <span className="bg-yellow-500/10 text-yellow-500 px-2.5 py-1 rounded-full text-xs font-bold">Unverified</span>
                  )}
                </td>
                <td className="px-6 py-4 font-medium uppercase text-xs">{u.role}</td>
                <td className="px-6 py-4 flex items-center justify-end gap-2">
                  {!u.isVerified && <Button variant="secondary" size="sm" onClick={() => handleAction(u._id, 'verify')}><Check className="w-3.5 h-3.5 mr-1"/> Verify</Button>}
                  {u.isActive ? (
                    <Button variant="destructive" size="sm" onClick={() => handleAction(u._id, 'ban')}><Ban className="w-3.5 h-3.5 mr-1"/> Ban</Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => handleAction(u._id, 'unban')}>Unban</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// Main Admin Layout
// ----------------------------------------------------
export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/admin/stats').then(r => r.json()).then(d => setStats(d.data));
    }
  }, [user]);

  if (authLoading || !user || user.role !== 'admin') {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col fixed inset-y-0 left-0 pt-16 z-30">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-full text-white flex items-center justify-center font-bold">P</div>
            <span className="font-bold tracking-tight text-xl">Admin</span>
          </Link>
          <nav className="flex flex-col gap-2">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 pt-20 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{TABS.find(t => t.id === activeTab)?.label}</h1>
          <p className="text-muted-foreground mt-1">Manage platform content and users</p>
        </div>

        {activeTab === 'dashboard' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card title="Total Users" value={stats.users?.total} subtitle={`+${stats.users?.recent30d} this month`} />
            <Card title="Active Users" value={stats.users?.active} subtitle="Accounts not banned" />
            <Card title="Pending Reports" value={stats.moderation?.pendingReports} highlight={stats.moderation?.pendingReports > 0} subtitle="Requires review" />
            <Card title="Total Pins" value={stats.content?.pins} subtitle="Across all boards" />
          </div>
        )}

        {activeTab === 'users' && <UsersTab />}

        {(activeTab === 'reports' || activeTab === 'content' || activeTab === 'system') && (
          <div className="glass-card rounded-2xl p-20 flex flex-col items-center justify-center text-center border border-dashed">
             <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
             <h3 className="text-xl font-bold">Tab module connected</h3>
             <p className="text-muted-foreground">The backend API routes for this section are complete. The UI for this specific tab will be expanded in phase 2.</p>
          </div>
        )}

      </main>
    </div>
  );
}
