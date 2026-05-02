'use client';
import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Users, ImageIcon, TrendingUp, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';

function MiniBar({ data = [], color = '#e60023' }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-px h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${Math.max(4, (d.count / max) * 100)}%`, background: color, opacity: 0.5 + (i / data.length) * 0.5 }} title={`${d.date}: ${d.count}`} />
      ))}
    </div>
  );
}

export default function PlatformAnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/platform-analytics');
      const d = await res.json();
      if (d.success) setData(d.data);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!data) return <p className="text-center text-muted-foreground py-10">Failed to load analytics</p>;

  const STATS = [
    { label: 'Total Users', value: data.overview.totalUsers, icon: Users, color: '#e60023' },
    { label: 'Total Pins', value: data.overview.totalPins, icon: ImageIcon, color: '#7c3aed' },
    { label: 'Total Boards', value: data.overview.totalBoards, icon: TrendingUp, color: '#f97316' },
    { label: 'Comments', value: data.overview.totalComments, icon: MessageCircle, color: '#06b6d4' },
    { label: 'New Users (7d)', value: data.growth.newUsersLast7d, icon: Users, color: '#10b981' },
    { label: 'New Pins (7d)', value: data.growth.newPinsLast7d, icon: ImageIcon, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button onClick={fetch_} className="text-muted-foreground hover:text-foreground"><RefreshCw className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STATS.map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{s.label}</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: s.color + '20' }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-2xl font-black">{(s.value || 0).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-5 border border-border">
          <h3 className="font-bold mb-3 text-sm">User Signups (30d)</h3>
          <MiniBar data={data.signupTrend} color="#e60023" />
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>{data.signupTrend[0]?.date?.slice(5)}</span>
            <span>{data.signupTrend.at(-1)?.date?.slice(5)}</span>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5 border border-border">
          <h3 className="font-bold mb-3 text-sm">Pin Creations (30d)</h3>
          <MiniBar data={data.pinTrend} color="#7c3aed" />
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>{data.pinTrend[0]?.date?.slice(5)}</span>
            <span>{data.pinTrend.at(-1)?.date?.slice(5)}</span>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border"><h3 className="font-bold">Top Creators by Pin Count</h3></div>
        <div className="divide-y divide-border">
          {data.topCreators?.map((c, i) => (
            <div key={c._id} className="flex items-center gap-3 px-5 py-3 hover:bg-accent/30">
              <span className="text-xs font-black text-muted-foreground w-5 text-center">#{i + 1}</span>
              <Avatar src={c.profileImage} alt={c.username} size="sm" />
              <div className="flex-1 min-w-0">
                <Link href={`/${c.username}`} className="font-semibold text-sm hover:text-primary">{c.displayName || c.username}</Link>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{c.pinCount} pins</span>
                <span>{c.totalLikes} likes</span>
                <span>{c.totalSaves} saves</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
