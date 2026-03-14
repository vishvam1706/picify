'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import MasonryGrid from '@/components/pins/MasonryGrid';
import BoardCard from '@/components/boards/BoardCard';
import { Loader2, Share2, MoreHorizontal } from 'lucide-react';
import InfiniteScroll from 'react-infinite-scroll-component';
import FollowButton from '@/components/users/FollowButton';

export default function UserProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const router = useRouter();

  const [profileUser, setProfileUser] = useState(null);
  const [activeTab, setActiveTab] = useState('created'); // 'created' or 'saved' (which contains boards)

  const [pins, setPins] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [savedPins, setSavedPins] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);

  const [boards, setBoards] = useState([]);

  const [loading, setLoading] = useState(true);

  // Is this the currently logged in user?
  const isOwner = user && user.username === username;

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      try {
        const res = await fetch(`/api/users/profile?username=${username}`);
        const data = await res.json();

        if (res.ok && isMounted) {
          setProfileUser(data.data);
          setBoards(data.data.boards || []);
        } else if (isMounted) {
          router.push('/404');
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (username) fetchProfile();
    return () => { isMounted = false; };
  }, [username, router]);

  const fetchPins = async (pageNum = 1) => {
    if (!profileUser) return;
    try {
      // If tab is 'created', we fetch Pins where userId = profileUser._id
      // In a real app we'd have a specific endpoint, e.g., /api/users/[id]/pins
      // For simplicity, reusing /api/pins (assuming we updated it to filter by userId if passed)

      const userId = profileUser._id;
      const res = await fetch(`/api/pins?userId=${userId}&page=${pageNum}&limit=20`);
      const data = await res.json();

      if (res.ok) {
        if (pageNum === 1) {
          setPins(data.data.docs);
        } else {
          setPins(prev => [...prev, ...data.data.docs]);
        }
        setHasMore(data.data.hasNextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      setHasMore(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'created' && profileUser) {
      setPage(1);
      fetchPins(1);
    }
    if (activeTab === 'saved' && profileUser && isOwner) {
      setSavedLoading(true);
      fetch('/api/users/me/saved-pins?limit=50')
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            // saved-pins returns { docs: [{pinId: <populated pin>, ...}] }
            setSavedPins((data.data?.docs || []).map(d => d.pinId).filter(Boolean));
          }
        })
        .catch(() => {})
        .finally(() => setSavedLoading(false));
    }
  }, [activeTab, profileUser]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPins(nextPage);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!profileUser) return null;

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="flex flex-col items-center max-w-2xl mx-auto mb-12">
        <Avatar src={profileUser.profileImage} alt={profileUser.username} size="xxl" className="mb-4 shadow-xl" />
        <h1 className="text-4xl font-bold text-center">{profileUser.displayName || profileUser.username}</h1>
        <p className="text-muted-foreground text-center mt-2 flex items-center gap-1">
          <span className="font-semibold text-foreground">picify.com/{profileUser.username}</span>
        </p>

        {profileUser.bio && (
          <p className="text-center mt-4 text-foreground leading-relaxed">
            {profileUser.bio}
          </p>
        )}

        <div className="flex gap-4 mt-4 font-medium text-sm">
          <Link href={`/${profileUser.username}/followers`} className="hover:underline">
            <span className="font-bold text-foreground">{profileUser.followersCount}</span>{' '}
            <span className="text-muted-foreground">followers</span>
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link href={`/${profileUser.username}/following`} className="hover:underline">
            <span className="font-bold text-foreground">{profileUser.followingCount}</span>{' '}
            <span className="text-muted-foreground">following</span>
          </Link>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="secondary" className="rounded-full px-6 font-semibold">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </Button>
          {isOwner ? (
            <Button variant="secondary" className="rounded-full px-6 font-semibold" onClick={() => router.push('/settings')}>
              Edit Profile
            </Button>
          ) : (
            <FollowButton targetUserId={profileUser._id} initialFollowing={profileUser.isFollowing} />
          )}
          <Button variant="secondary" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-8 mb-8 border-b border-border">
        <button
          className={`pb-4 font-semibold text-lg transition-colors relative ${activeTab === 'created' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('created')}
        >
          Created
          {activeTab === 'created' && <div className="absolute bottom-0 left-0 w-full h-1 bg-foreground rounded-t-md" />}
        </button>
        <button
          className={`pb-4 font-semibold text-lg transition-colors relative ${activeTab === 'saved' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('saved')}
        >
          Saved
          {activeTab === 'saved' && <div className="absolute bottom-0 left-0 w-full h-1 bg-foreground rounded-t-md" />}
        </button>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === 'created' ? (
          <InfiniteScroll
            dataLength={pins.length}
            next={loadMore}
            hasMore={hasMore}
            loader={<div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>}
            endMessage={<div className="py-8 text-center text-muted-foreground">End of created pins.</div>}
          >
            <MasonryGrid pins={pins} />
          </InfiniteScroll>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Saved Pins */}
            {isOwner && (
              savedLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : savedPins.length > 0 ? (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Saved Pins</h2>
                  <MasonryGrid pins={savedPins} />
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6">No saved pins yet.</p>
              )
            )}
            {/* Boards */}
            {boards.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Boards</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {boards.map(board => (
                    <BoardCard key={board._id} board={board} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
