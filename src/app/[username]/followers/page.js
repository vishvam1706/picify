'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import UserCard from '@/components/users/UserCard';
import Avatar from '@/components/ui/Avatar';
import { ChevronLeft, Loader2, Users } from 'lucide-react';
import InfiniteScroll from 'react-infinite-scroll-component';

export default function FollowersPage() {
  const { username } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Single combined fetch: profile first, then followers
  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch profile
        const profileRes = await fetch(`/api/users/profile?username=${username}`);
        const profileData = await profileRes.json();
        if (!profileRes.ok || cancelled) {
          if (!cancelled) setError('User not found');
          setLoading(false);
          return;
        }

        const profileUser = profileData.data;
        if (!cancelled) setProfile(profileUser);

        // 2. Fetch followers using the resolved _id
        const followersRes = await fetch(`/api/users/${profileUser._id}/followers?page=1&limit=24`);
        const followersData = await followersRes.json();
        if (!cancelled) {
          if (followersRes.ok) {
            setUsers(followersData.data?.docs || []);
            setHasMore(followersData.data?.hasNextPage || false);
          } else {
            setError(followersData.error || 'Failed to load followers');
          }
        }
      } catch {
        if (!cancelled) setError('Something went wrong');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [username]);

  const loadMore = useCallback(async () => {
    if (!profile?._id) return;
    const next = page + 1;
    setPage(next);
    try {
      const res = await fetch(`/api/users/${profile._id}/followers?page=${next}&limit=24`);
      const data = await res.json();
      if (res.ok) {
        setUsers(prev => [...prev, ...(data.data?.docs || [])]);
        setHasMore(data.data?.hasNextPage || false);
      }
    } catch { }
  }, [profile, page]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back</span>
      </button>

      {profile && (
        <div className="flex items-center gap-3 mb-8">
          <Avatar src={profile.profileImage} alt={profile.username} size="md" />
          <div>
            <h1 className="text-2xl font-bold">{profile.displayName || profile.username}&apos;s Followers</h1>
            <p className="text-sm text-muted-foreground">{(profile.followersCount || 0).toLocaleString()} people follow {profile.displayName || profile.username}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : error ? (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="text-lg font-semibold text-foreground mb-2">{error}</p>
          <p className="text-sm text-muted-foreground">This list may be private or unavailable.</p>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center bg-secondary/20 rounded-3xl">
          <Users className="w-14 h-14 text-muted-foreground opacity-40 mb-4" />
          <h2 className="text-xl font-semibold mb-1">No followers yet</h2>
          <p className="text-sm text-muted-foreground">When people follow {profile?.displayName || profile?.username}, they&apos;ll appear here.</p>
        </div>
      ) : (
        <InfiniteScroll
          dataLength={users.length}
          next={loadMore}
          hasMore={hasMore}
          loader={<div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {users.map(u => <UserCard key={u._id} user={u} />)}
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
}
