'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, TrendingUp, Eye, Heart, Bookmark, MessageCircle, Users, Zap, ArrowUp, ArrowDown, BarChart3, Star, RefreshCw, ChevronRight, Lightbulb, Target, Award, DollarSign } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

/* ─── Tiny SVG Line Chart ─── */
function LineChart({ data = [], color = '#e60023', label = '', height = 80 }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const min = 0;
  const w = 600, h = height;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((d.value - min) / (max - min)) * h;
    return `${x},${y}`;
  });
  const pathD = `M ${pts.join(' L ')}`;
  const fillD = `M 0,${h} L ${pts.join(' L ')} L ${w},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#g-${label})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Mini Bar Chart ─── */
function BarChart({ data = [], color = '#e60023', height = 60 }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-0.5 w-full" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 rounded-t-sm transition-all" style={{ height: `${Math.max(4, (d.value / max) * 100)}%`, background: color, opacity: 0.7 + (i / data.length) * 0.3 }} title={`${d.label}: ${d.value}`} />
      ))}
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ title, value, icon: Icon, color, change, suffix = '' }) {
  const isPos = change >= 0;
  return (
    <div className="glass-card rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-black tabular-nums">{(value || 0).toLocaleString()}{suffix}</p>
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${isPos ? 'text-green-500' : 'text-red-500'}`}>
          {isPos ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(change)}% vs last month
        </div>
      )}
    </div>
  );
}

/* ─── Growth Advice Card ─── */
function AdviceCard({ advice }) {
  const priorityColor = { high: '#ef4444', medium: '#f97316', info: '#06b6d4' }[advice.priority] || '#888';
  return (
    <div className="glass-card rounded-2xl p-4 border border-border hover:border-primary/30 transition-all">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{advice.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-sm">{advice.title}</p>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: priorityColor + '20', color: priorityColor }}>
              {advice.priority.toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{advice.body}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Top Pin Row ─── */
function TopPinRow({ pin, rank }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <span className="text-sm font-black text-muted-foreground w-5 text-center shrink-0">#{rank}</span>
      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-muted">
        {pin.thumbnail && <Image src={pin.thumbnail} alt={pin.title} width={40} height={40} className="object-cover w-full h-full" />}
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/pin/${pin._id}`} className="text-sm font-semibold truncate hover:text-primary transition-colors block">{pin.title || 'Untitled'}</Link>
        <p className="text-[10px] text-muted-foreground">{new Date(pin.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{pin.views || 0}</span>
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{pin.likesCount || 0}</span>
        <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />{pin.savesCount || 0}</span>
      </div>
    </div>
  );
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'engagement', label: 'Engagement', icon: TrendingUp },
  { id: 'audience', label: 'Audience', icon: Users },
  { id: 'content', label: 'Top Content', icon: Star },
  { id: 'advisor', label: 'AI Advisor', icon: Lightbulb },
  { id: 'monetization', label: 'Monetization', icon: DollarSign },
];

export default function CreatorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [audience, setAudience] = useState(null);
  const [advisor, setAdvisor] = useState(null);
  const [monetization, setMonetization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState('views');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ovRes, engRes, audRes, advRes, monRes] = await Promise.all([
        fetch('/api/analytics/overview'),
        fetch('/api/analytics/engagement'),
        fetch('/api/analytics/audience'),
        fetch('/api/analytics/growth-advisor'),
        fetch('/api/monetization/overview'),
      ]);
      const [ov, eng, aud, adv, mon] = await Promise.all([ovRes.json(), engRes.json(), audRes.json(), advRes.json(), monRes.json()]);
      if (ov.success) setOverview(ov.data);
      if (eng.success) setEngagement(eng.data);
      if (aud.success) setAudience(aud.data);
      if (adv.success) setAdvisor(adv.data);
      if (mon.success) setMonetization(mon.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (authLoading || !user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  const engSeries = engagement?.series || [];
  const chartData = engSeries.map(d => ({ label: d.date, value: d[metric] || 0 }));

  const METRIC_COLOR = { views: '#e60023', likes: '#ec4899', saves: '#f97316', comments: '#06b6d4' };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black">Creator Dashboard</h1>
            <p className="text-xs text-muted-foreground">Analytics & Insights</p>
          </div>
          <button onClick={fetchAll} disabled={loading} className="p-2 rounded-full hover:bg-secondary transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 overflow-x-auto">
          <div className="flex gap-1 pb-0 pt-1 min-w-max">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                  <Icon className="w-4 h-4" />{tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && overview && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Views" value={overview.totalViews} icon={Eye} color="#e60023" />
                  <StatCard title="Total Likes" value={overview.totalLikes} icon={Heart} color="#ec4899" />
                  <StatCard title="Total Saves" value={overview.totalSaves} icon={Bookmark} color="#f97316" />
                  <StatCard title="Comments" value={overview.totalComments} icon={MessageCircle} color="#06b6d4" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard title="Total Pins" value={overview.totalPins} icon={Target} color="#7c3aed" />
                  <StatCard title="Total Boards" value={overview.totalBoards} icon={BarChart3} color="#10b981" />
                  <StatCard title="Followers" value={audience?.totalFollowers || 0} icon={Users} color="#f59e0b" />
                  <StatCard title="Engagement Rate" value={engagement?.totals?.engagementRate || 0} icon={Zap} color="#e60023" suffix="%" />
                </div>

                {/* Engagement Rate Mini Summary */}
                <div className="glass-card rounded-2xl p-6 border border-border">
                  <h2 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />30-Day Performance Snapshot</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {['views', 'likes', 'saves', 'comments'].map(m => {
                      const vals = engSeries.map(d => ({ label: d.date, value: d[m] || 0 }));
                      return (
                        <div key={m}>
                          <p className="text-xs text-muted-foreground capitalize mb-2 font-medium">{m}</p>
                          <BarChart data={vals} color={METRIC_COLOR[m]} height={50} />
                          <p className="text-sm font-bold mt-1">{(engagement?.totals?.[m] || 0).toLocaleString()}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Pins */}
                {overview.topPins?.length > 0 && (
                  <div className="glass-card rounded-2xl p-6 border border-border">
                    <h2 className="font-bold mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-primary" />Top Performing Pins</h2>
                    {overview.topPins.slice(0, 5).map((pin, i) => <TopPinRow key={pin._id} pin={pin} rank={i + 1} />)}
                  </div>
                )}
              </div>
            )}

            {/* ── ENGAGEMENT TAB ── */}
            {activeTab === 'engagement' && engagement && (
              <div className="space-y-6">
                <div className="glass-card rounded-2xl p-6 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold">30-Day Engagement Trend</h2>
                    <div className="flex gap-2">
                      {['views', 'likes', 'saves', 'comments'].map(m => (
                        <button key={m} onClick={() => setMetric(m)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${metric === m ? 'text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/70'}`}
                          style={metric === m ? { background: METRIC_COLOR[m] } : {}}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <LineChart data={chartData} color={METRIC_COLOR[metric]} label={metric} height={160} />
                    {/* X axis labels */}
                    <div className="flex justify-between mt-2">
                      {[0, 7, 14, 21, 29].map(i => (
                        <span key={i} className="text-[10px] text-muted-foreground">{engSeries[i]?.date?.slice(5) || ''}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Totals grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(engagement.totals || {}).filter(([k]) => k !== 'engagementRate').map(([key, val]) => (
                    <div key={key} className="glass-card rounded-2xl p-5">
                      <p className="text-xs text-muted-foreground capitalize font-medium">{key}</p>
                      <p className="text-2xl font-black mt-1">{val.toLocaleString()}</p>
                    </div>
                  ))}
                  <div className="glass-card rounded-2xl p-5 border border-primary/20">
                    <p className="text-xs text-muted-foreground font-medium">Engagement Rate</p>
                    <p className="text-2xl font-black mt-1 text-primary">{engagement.totals?.engagementRate}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── AUDIENCE TAB ── */}
            {activeTab === 'audience' && audience && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard title="Total Followers" value={audience.totalFollowers} icon={Users} color="#e60023" />
                  <StatCard title="Following" value={audience.totalFollowing} icon={Users} color="#7c3aed" />
                  <StatCard title="New This Month" value={audience.recentFollowers} icon={ArrowUp} color="#10b981" />
                </div>

                <div className="glass-card rounded-2xl p-6 border border-border">
                  <h2 className="font-bold mb-4">Follower Growth (30 Days)</h2>
                  <LineChart
                    data={audience.followerGrowth?.map(d => ({ label: d.date, value: d.newFollowers })) || []}
                    color="#e60023" label="followers" height={140}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card rounded-2xl p-6 border border-border">
                    <h2 className="font-bold mb-4">Top Followers (by influence)</h2>
                    {audience.topFollowers?.length ? audience.topFollowers.map(f => (
                      <div key={f._id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
                        <Avatar src={f.profileImage} alt={f.username} size="sm" />
                        <div className="flex-1 min-w-0">
                          <Link href={`/${f.username}`} className="font-semibold text-sm hover:text-primary transition-colors">{f.displayName || f.username}</Link>
                          <p className="text-xs text-muted-foreground">@{f.username}</p>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" />{f.followersCount}</span>
                      </div>
                    )) : <p className="text-muted-foreground text-sm text-center py-6">No followers yet</p>}
                  </div>

                  <div className="glass-card rounded-2xl p-6 border border-border">
                    <h2 className="font-bold mb-4">Average Per Pin</h2>
                    {['likesPerPin', 'savesPerPin', 'viewsPerPin'].map(key => (
                      <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <span className="text-sm capitalize">{key.replace('PerPin', ' / pin')}</span>
                        <span className="font-bold">{audience.averageEngagement?.[key] || 0}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── TOP CONTENT TAB ── */}
            {activeTab === 'content' && overview && (
              <div className="space-y-6">
                <div className="glass-card rounded-2xl p-6 border border-border">
                  <h2 className="font-bold mb-2">Top Performing Pins</h2>
                  <p className="text-sm text-muted-foreground mb-4">Ranked by combined engagement score</p>
                  {overview.topPins?.length ? overview.topPins.map((pin, i) => <TopPinRow key={pin._id} pin={pin} rank={i + 1} />) : (
                    <p className="text-center text-muted-foreground py-8">No pins yet. <Link href="/create" className="text-primary font-semibold">Create your first pin →</Link></p>
                  )}
                </div>
              </div>
            )}

            {/* ── AI ADVISOR TAB ── */}
            {activeTab === 'advisor' && advisor && (
              <div className="space-y-6">
                <div className="glass-card rounded-2xl p-6 border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-bold">AI Growth Advisor</h2>
                      <p className="text-xs text-muted-foreground">Personalized insights based on your content</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                    <div><p className="text-xs text-muted-foreground">Total Pins</p><p className="font-bold">{advisor.summary?.totalPins || 0}</p></div>
                    <div><p className="text-xs text-muted-foreground">Total Views</p><p className="font-bold">{advisor.summary?.totalViews?.toLocaleString() || 0}</p></div>
                    <div><p className="text-xs text-muted-foreground">Engagement Rate</p><p className="font-bold text-primary">{advisor.summary?.engagementRate}%</p></div>
                    <div><p className="text-xs text-muted-foreground">Total Saves</p><p className="font-bold">{advisor.summary?.totalSaves?.toLocaleString() || 0}</p></div>
                  </div>
                </div>

                <h3 className="font-bold text-lg">Recommendations for You</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {advisor.advice?.map((a, i) => <AdviceCard key={i} advice={a} />)}
                </div>
              </div>
            )}

            {/* ── MONETIZATION TAB ── */}
            {activeTab === 'monetization' && (
              <div className="space-y-6">
                {!monetization ? (
                  <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : !monetization.isStripeConnected ? (
                  <div className="glass-card rounded-2xl p-10 border-2 border-dashed border-primary/30 text-center">
                    <DollarSign className="w-14 h-14 text-primary mx-auto mb-4 opacity-80" />
                    <h2 className="text-2xl font-black mb-2">Start Earning</h2>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Connect your Stripe account to receive tips and track your earnings.</p>
                    <Link href="/monetization">
                      <Button className="rounded-full px-8 font-bold shadow-lg shadow-primary/20">Set Up Monetization →</Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Earnings Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="glass-card rounded-2xl p-5 border border-green-500/20 bg-green-500/5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Total Earned</p>
                        <p className="text-3xl font-black text-green-500">${(monetization.totalEarnings / 100).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Completed payments</p>
                      </div>
                      <div className="glass-card rounded-2xl p-5 border border-yellow-500/20 bg-yellow-500/5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pending</p>
                        <p className="text-3xl font-black text-yellow-500">${(monetization.pendingEarnings / 100).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Being processed</p>
                      </div>
                      <div className="glass-card rounded-2xl p-5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tips Received</p>
                        <p className="text-3xl font-black">${((monetization.byType?.tip || 0) / 100).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">From fans (90% share)</p>
                      </div>
                      <div className="glass-card rounded-2xl p-5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tips Status</p>
                        <p className="text-lg font-bold mt-1">{monetization.tipsEnabled ? '✅ Enabled' : '⏸ Disabled'}</p>
                        <Link href="/monetization" className="text-xs text-primary hover:underline mt-1 block">Manage →</Link>
                      </div>
                    </div>

                    {/* Monthly chart */}
                    <div className="glass-card rounded-2xl p-6 border border-border">
                      <h2 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Monthly Earnings</h2>
                      <BarChart data={monetization.monthlyBreakdown?.map(m => ({ label: m.month, value: m.amount / 100 })) || []} color="#10b981" height={80} />
                      <div className="flex justify-between mt-2">
                        {monetization.monthlyBreakdown?.map(m => (
                          <span key={m.month} className="text-[10px] text-muted-foreground">{m.month}</span>
                        ))}
                      </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="glass-card rounded-2xl overflow-hidden border border-border">
                      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                        <h2 className="font-bold flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" />Recent Transactions</h2>
                        <button onClick={fetchAll} className="text-xs text-primary hover:underline flex items-center gap-1.5">
                          <RefreshCw className="w-3 h-3" /> Refresh
                        </button>
                      </div>
                      {!monetization.recentTransactions?.length ? (
                        <div className="py-16 text-center">
                          <DollarSign className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                          <p className="font-semibold text-muted-foreground">No transactions yet</p>
                          <p className="text-sm text-muted-foreground mt-1">Tips from fans will appear here after payment</p>
                        </div>
                      ) : (
                        <div>
                          {monetization.recentTransactions.map((tx) => {
                            const STATUS_COLOR = { completed: '#10b981', pending: '#f59e0b', refunded: '#6b7280', failed: '#ef4444' };
                            const TYPE_ICON = { tip: '🎁', subscription: '⭐', sponsored_pin: '📌', affiliate: '🔗', brand_deal: '🤝' };
                            return (
                              <div key={tx._id} className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                                <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-xl shrink-0">
                                  {TYPE_ICON[tx.type] || '💰'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm capitalize">{tx.type.replace('_', ' ')}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                  {tx.note && <p className="text-[10px] text-muted-foreground/60 truncate max-w-xs">{tx.note}</p>}
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-black" style={{ color: STATUS_COLOR[tx.status] }}>
                                    +${(tx.amount / 100).toFixed(2)}
                                  </p>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize" style={{ background: (STATUS_COLOR[tx.status] || '#888') + '20', color: STATUS_COLOR[tx.status] || '#888' }}>
                                    {tx.status}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
