'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import UserCard from '@/components/users/UserCard';
import Avatar from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import InfiniteScroll from 'react-infinite-scroll-component';

export default function FollowersPage() {
  const { username } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/users/profile?username=${username}`);
      const data = await res.json();
      if (res.ok) setProfile(data.data?.user || data.data);
    } catch { /* silent */ }
  }, [username]);

  const fetchFollowers = useCallback(async (pageNum = 1) => {
    if (!profile?._id) return;
    try {
      const res = await fetch(`/api/users/${profile._id}/followers?page=${pageNum}&limit=24`);
      const data = await res.json();
      if (res.ok) {
        const docs = data.data?.docs || data.data || [];
        pageNum === 1 ? setUsers(docs) : setUsers(prev => [...prev, ...docs]);
        setHasMore(data.data?.hasNextPage || false);
      }
    } catch { setHasMore(false); } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      fetchFollowers(1);
    }
  }, [profile, fetchFollowers]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchFollowers(next);
  };

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
            <h1 className="text-2xl font-bold">{profile.displayName || profile.username}'s Followers</h1>
            <p className="text-sm text-muted-foreground">{profile.followersCount || 0} people follow {profile.displayName || profile.username}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center glass-card rounded-3xl">
          <Users className="w-14 h-14 text-muted-foreground opacity-40 mb-4" />
          <h2 className="text-xl font-semibold mb-1">No followers yet</h2>
          <p className="text-sm text-muted-foreground">When people follow {profile?.displayName || profile?.username}, they'll appear here.</p>
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
