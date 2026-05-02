'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Avatar from '@/components/ui/Avatar';
import { Loader2, Activity, Heart, Bookmark, UserPlus, MessageCircle, ImageIcon, Repeat2, BadgeCheck, Grid } from 'lucide-react';

const ACTION_ICONS = {
  pin_created: { icon: ImageIcon, color: '#e60023', label: 'created a pin' },
  like: { icon: Heart, color: '#ec4899', label: 'liked a pin' },
  liked: { icon: Heart, color: '#ec4899', label: 'liked a pin' }, // legacy
  save: { icon: Bookmark, color: '#f97316', label: 'saved a pin' },
  saved: { icon: Bookmark, color: '#f97316', label: 'saved a pin' }, // legacy
  comment: { icon: MessageCircle, color: '#06b6d4', label: 'commented on a pin' },
  commented: { icon: MessageCircle, color: '#06b6d4', label: 'commented on a pin' },
  follow: { icon: UserPlus, color: '#10b981', label: 'started following someone' },
  followed: { icon: UserPlus, color: '#10b981', label: 'started following someone' },
  shared: { icon: Repeat2, color: '#8b5cf6', label: 'shared a pin' },
  board_created: { icon: Grid, color: '#7c3aed', label: 'created a board' },
};

function getRelativeTime(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ActivityItem({ item }) {
  const meta = ACTION_ICONS[item.type] || { icon: Activity, color: '#888', label: item.type };
  const Icon = meta.icon;
  const relTime = getRelativeTime(item.createdAt);
  const entity = item.entity; // enriched pin or board from API

  // Build a link to the entity if available
  const entityHref = entity?._id
    ? item.entityType === 'pin'
      ? `/pin/${entity._id}`
      : item.entityType === 'board'
        ? `/boards/${entity._id}`
        : null
    : null;

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl hover:bg-accent/30 transition-colors group">
      {/* Avatar with type icon badge */}
      <div className="relative flex-shrink-0">
        <Link href={`/${item.userId?.username}`}>
          <Avatar src={item.userId?.profileImage} alt={item.userId?.username} size="md" />
        </Link>
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background"
          style={{ backgroundColor: meta.color }}
        >
          <Icon className="w-2.5 h-2.5 text-white" />
        </div>
      </div>

      {/* Text + optional entity card */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href={`/${item.userId?.username}`} className="font-bold text-sm hover:text-primary transition-colors">
            {item.userId?.displayName || item.userId?.username}
          </Link>
          {item.userId?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
          <span className="text-sm text-muted-foreground">{meta.label}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{relTime}</p>

        {/* Entity preview card (pin thumbnail + title) */}
        {entity && entityHref && (
          <Link
            href={entityHref}
            className="mt-2.5 flex items-center gap-3 bg-secondary/40 rounded-xl p-2.5 hover:bg-secondary/70 transition-colors max-w-xs"
          >
            {/* Thumbnail */}
            {entity.thumbnail ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                <Image
                  src={entity.thumbnail}
                  alt={entity.title || entity.name || 'Pin'}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg flex-shrink-0 bg-muted flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            {/* Title + stats */}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate text-foreground">
                {entity.title || entity.name || 'Untitled'}
              </span>
              {(entity.likesCount !== undefined || entity.savesCount !== undefined) && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                  {entity.likesCount !== undefined && (
                    <span className="flex items-center gap-0.5">
                      <Heart className="w-2.5 h-2.5" /> {entity.likesCount}
                    </span>
                  )}
                  {entity.savesCount !== undefined && (
                    <span className="flex items-center gap-0.5">
                      <Bookmark className="w-2.5 h-2.5" /> {entity.savesCount}
                    </span>
                  )}
                </span>
              )}
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

const FILTERS = [
  // { id: 'all', label: 'All Activity' },
  { id: 'mine', label: 'My Activity' },
  // { id: 'following', label: 'Following' },
];

export default function ActivityFeedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('mine');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchActivity = useCallback(async (pageNum = 1, f = 'mine', replace = true) => {
    if (replace) setLoading(true); else setLoadingMore(true);
    try {
      const res = await fetch(`/api/activity?page=${pageNum}&limit=20&filter=${f}`);
      const data = await res.json();
      if (res.ok) {
        const docs = data.data?.docs || [];
        if (replace) setActivities(docs);
        else setActivities(prev => [...prev, ...docs]);
        setHasMore(!!data.data?.hasNextPage);
      }
    } catch { /* silent */ }
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    setPage(1);
    fetchActivity(1, filter, true);
  }, [user, authLoading, filter, router, fetchActivity]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchActivity(next, filter, false);
  };

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Activity className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Activity Feed</h1>
          <p className="text-sm text-muted-foreground mt-0.5">What's happening in your network</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${filter === f.id ? 'bg-primary text-white' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="glass-card rounded-2xl overflow-hidden border border-border">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-lg font-bold mb-1">No activity yet</h2>
            <p className="text-sm text-muted-foreground">
              {filter === 'following'
                ? 'Follow creators to see their activity here.'
                : 'Start creating pins and engaging with the community.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {activities.map(item => (
              <ActivityItem key={item._id} item={item} />
            ))}
          </div>
        )}
      </div>

      {/* Load more */}
      {hasMore && !loading && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-secondary text-sm font-semibold hover:bg-secondary/70 transition-colors disabled:opacity-60"
          >
            {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
