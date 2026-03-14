'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, TrendingUp, Eye, Heart, Bookmark, Users, BarChart3, ArrowUpRight, ImageIcon } from 'lucide-react';
import Link from 'next/link';

function StatCard({ label, value, icon: Icon, trend, color = 'text-primary' }) {
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className="text-3xl font-bold">{value?.toLocaleString() || 0}</p>
      {trend != null && (
        <p className={`text-xs font-medium flex items-center gap-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          <ArrowUpRight className={`w-3.5 h-3.5 ${trend < 0 ? 'rotate-180' : ''}`} />
          {Math.abs(trend)}% vs last month
        </p>
      )}
    </div>
  );
}

function PinRow({ pin }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-secondary">
        {pin.images?.[0] && (
          <img src={pin.images[0]} alt={pin.title} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{pin.title || 'Untitled'}</p>
        <p className="text-xs text-muted-foreground">{new Date(pin.createdAt).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{pin.viewsCount || 0}</span>
        <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{pin.likesCount || 0}</span>
        <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5" />{pin.savesCount || 0}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [overview, setOverview] = useState(null);
  const [topPins, setTopPins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    Promise.all([
      fetch('/api/analytics/overview').then(r => r.json()),
      fetch('/api/pins?limit=10').then(r => r.json()),
    ]).then(([ovData, pinsData]) => {
      setOverview(ovData.data || null);
      const docs = pinsData.data?.docs || [];
      setTopPins(docs.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0)).slice(0, 8));
    }).catch(() => { }).finally(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { label: 'Total Views', value: overview?.totalViews ?? 0, icon: Eye, trend: 12 },
    { label: 'Total Likes', value: overview?.totalLikes ?? 0, icon: Heart, trend: 5 },
    { label: 'Total Saves', value: overview?.totalSaves ?? 0, icon: Bookmark, trend: 8 },
    { label: 'Followers', value: user.followersCount ?? 0, icon: Users, trend: 3 },
    { label: 'Total Pins', value: overview?.totalPins ?? 0, icon: ImageIcon, color: 'text-blue-500' },
    { label: 'Boards', value: overview?.totalBoards ?? 0, icon: BarChart3, color: 'text-purple-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Creator Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your content performance</p>
        </div>
        <Link
          href="/create"
          className="px-6 py-2.5 rounded-full bg-primary text-white font-semibold hover:bg-primary/90 transition-colors self-start sm:self-center"
        >
          + Create Pin
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Top Pins Table */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> Your Top Pins
        </h2>
        {topPins.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
            <ImageIcon className="w-10 h-10 mb-3 opacity-30" />
            <p className="font-medium">No pins yet</p>
            <p className="text-sm mt-1">Start creating to see your analytics here</p>
          </div>
        ) : (
          <div>
            {topPins.map(pin => <PinRow key={pin._id} pin={pin} />)}
          </div>
        )}
      </div>
    </div>
  );
}
