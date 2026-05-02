'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import MasonryGrid from '@/components/pins/MasonryGrid';
import Avatar from '@/components/ui/Avatar';
import FollowButton from '@/components/users/FollowButton';
import { Search, Loader2, BadgeCheck } from 'lucide-react';
import { Suspense } from 'react';

function SearchContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [query, setQuery] = useState(q);
  const [activeType, setActiveType] = useState('pins');
  const [pins, setPins] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const doSearch = useCallback(async (searchQ, type) => {
    if (!searchQ.trim()) { setPins([]); setUsers([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQ)}&type=${type}&limit=30`);
      const data = await res.json();
      if (res.ok && data.success) {
        if (type === 'pins') setPins(data.data.docs || []);
        else setUsers(data.data.docs || []);
        setHasMore(!!data.data.hasNextPage);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setQuery(q);
    doSearch(q, activeType);
  }, [q, activeType, doSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="min-h-screen max-w-screen-2xl mx-auto px-4 py-6">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="relative max-w-2xl mx-auto mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for pins, people, ideas..."
          className="w-full h-14 bg-secondary rounded-full pl-12 pr-6 text-base font-medium outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </form>

      {/* Tabs */}
      <div className="flex gap-3 mb-6 justify-center">
        {['pins', 'users'].map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-6 py-2 rounded-full font-semibold text-sm transition-all ${
              activeType === type ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
            }`}
          >
            {type === 'pins' ? '📌 Pins' : '👤 People'}
          </button>
        ))}
      </div>

      {/* Results label */}
      {q && (
        <h2 className="text-lg font-bold mb-4 px-1">
          {loading ? 'Searching...' : `Results for "${q}"`}
        </h2>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : activeType === 'pins' ? (
        <MasonryGrid pins={pins} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {users.length === 0 ? (
            <div className="col-span-full flex flex-col items-center py-16 text-muted-foreground">
              <div className="text-5xl mb-4">🔍</div>
              <p className="font-semibold text-foreground">No people found</p>
              <p className="text-sm mt-1">Try a different search term.</p>
            </div>
          ) : (
            users.map(u => (
              <Link
                key={u._id}
                href={`/${u.username}`}
                className="flex flex-col items-center text-center p-6 bg-card border border-border rounded-3xl hover:shadow-lg transition-shadow group"
              >
                <Avatar src={u.profileImage} alt={u.username} size="xl" className="mb-3" />
                <div className="flex items-center gap-1 mb-1">
                  <p className="font-bold group-hover:text-primary transition-colors">{u.displayName || u.username}</p>
                  {u.isVerified && <BadgeCheck className="w-4 h-4 text-primary flex-shrink-0" />}
                </div>
                <p className="text-sm text-muted-foreground mb-1">@{u.username}</p>
                <p className="text-xs text-muted-foreground mb-3">
                  {(u.followersCount || 0).toLocaleString()} followers
                </p>
                {u.bio && <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{u.bio}</p>}
                <FollowButton targetUserId={u._id} initialFollowing={false} />
              </Link>
            ))
          )}
        </div>
      )}

      {!q && !loading && (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl font-bold text-foreground">Search for anything</p>
          <p className="text-sm mt-1">Find pins, people, ideas and more.</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
