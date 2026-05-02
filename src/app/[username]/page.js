'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toaster';
import { Button } from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import MasonryGrid from '@/components/pins/MasonryGrid';
import BoardCard from '@/components/boards/BoardCard';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Loader2, Share2, Settings, MapPin, Globe, BadgeCheck, UserX, Flag, MoreHorizontal, Gift, CheckCircle, Briefcase, Lock } from 'lucide-react';

const TIP_AMOUNTS = [
  { label: '$1', cents: 100 },
  { label: '$2', cents: 200 },
  { label: '$5', cents: 500 },
  { label: '$10', cents: 1000 },
];

function ProfileTipModal({ profileUser, creatorTipsEnabled, onClose }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const effectiveAmount = customAmount ? Math.round(parseFloat(customAmount) * 100) : selectedAmount;

  const handleTip = async () => {
    if (!user) return;
    if (!effectiveAmount || effectiveAmount < 100) {
      toast({ title: 'Minimum tip is $1.00', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/monetization/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: profileUser._id, amount: effectiveAmount }),
      });
      const data = await res.json();
      if (res.ok && data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        toast({ title: data.error || 'Failed to start tip', variant: 'destructive' });
        setLoading(false);
      }
    } catch {
      toast({ title: 'Error processing tip', variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-[2rem] w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black">Send a Tip</h2>
            <p className="text-xs text-muted-foreground">Support {profileUser?.displayName || profileUser?.username}</p>
          </div>
        </div>

        {!creatorTipsEnabled ? (
          <div className="mt-5 text-center py-4">
            <p className="text-4xl mb-3">💸</p>
            <p className="font-bold mb-1">Tips not enabled yet</p>
            <p className="text-sm text-muted-foreground">{profileUser?.displayName || profileUser?.username} hasn't connected a payment account yet. Check back later!</p>
            <button onClick={onClose} className="mt-5 w-full py-3 rounded-full bg-secondary text-sm font-semibold hover:bg-secondary/70">Got it</button>
          </div>
        ) : !user ? (
          <div className="mt-5 text-center py-4">
            <p className="font-bold mb-1">Sign in to send a tip</p>
            <p className="text-sm text-muted-foreground mb-4">You need an account to tip creators.</p>
            <a href="/login" className="block w-full py-3 rounded-full bg-primary text-white text-sm font-bold text-center">Sign In</a>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mt-3 mb-5">Creator keeps 90%. Picify takes a 10% platform fee.</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {TIP_AMOUNTS.map(a => (
                <button key={a.cents} onClick={() => { setSelectedAmount(a.cents); setCustomAmount(''); }}
                  className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${selectedAmount === a.cents && !customAmount ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                    }`}>
                  {a.label}
                </button>
              ))}
            </div>
            <div className="relative mb-5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
              <input type="number" min="1" step="0.01" placeholder="Custom amount" value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
                className="w-full bg-secondary/50 rounded-2xl pl-8 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-full bg-secondary text-sm font-semibold hover:bg-secondary/70">Cancel</button>
              <button onClick={handleTip} disabled={loading || effectiveAmount < 100}
                className="flex-1 py-3 rounded-full bg-primary text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                {loading ? 'Processing...' : `Tip $${(effectiveAmount / 100).toFixed(2)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [profileUser, setProfileUser] = useState(null);
  const [activeTab, setActiveTab] = useState('created');
  const [pins, setPins] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pinsLoading, setPinsLoading] = useState(false);
  const [boards, setBoards] = useState([]);
  const [savedPins, setSavedPins] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [likedPins, setLikedPins] = useState([]);
  const [likedLoading, setLikedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);

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
          setFollowing(data.data.isFollowing || false);
        } else if (isMounted) {
          router.push('/not-found');
        }
      } catch { if (isMounted) router.push('/'); }
      finally { if (isMounted) setLoading(false); }
    }
    if (username) fetchProfile();
    return () => { isMounted = false; };
  }, [username, router]);

  const fetchPins = useCallback(async (pageNum = 1) => {
    if (!profileUser) return;
    setPinsLoading(true);
    try {
      const res = await fetch(`/api/pins?userId=${profileUser._id}&page=${pageNum}&limit=20`);
      const data = await res.json();
      if (res.ok) {
        const docs = data.data.docs || [];
        if (pageNum === 1) setPins(docs);
        else setPins(prev => [...prev, ...docs]);
        setHasMore(!!data.data.hasNextPage);
      } else setHasMore(false);
    } catch { setHasMore(false); }
    finally { setPinsLoading(false); }
  }, [profileUser]);

  useEffect(() => {
    if (activeTab === 'created' && profileUser) {
      setPage(1);
      fetchPins(1);
    }
    if (activeTab === 'saved' && profileUser) {
      setSavedLoading(true);
      fetch(`/api/users/${profileUser._id}/saved-pins?limit=50`)
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            setSavedPins((d.data?.docs || []).map(item => item.pinId).filter(Boolean));
          }
        })
        .catch(() => { })
        .finally(() => setSavedLoading(false));
    }
    if (activeTab === 'liked' && profileUser && isOwner) {
      setLikedLoading(true);
      fetch('/api/users/me/liked-pins?limit=50')
        .then(r => r.json())
        .then(d => {
          if (d.success) setLikedPins(d.data?.docs || []);
        })
        .catch(() => { })
        .finally(() => setLikedLoading(false));
    }
  }, [activeTab, profileUser, isOwner, fetchPins]);

  const handleFollow = async () => {
    if (!user) { toast({ title: 'Please log in to follow', variant: 'destructive' }); return; }
    setFollowLoading(true);
    try {
      const method = following ? 'DELETE' : 'POST';
      const res = await fetch(`/api/users/${profileUser._id}/follow`, { method });
      if (res.ok) {
        setFollowing(f => !f);
        setProfileUser(p => ({ ...p, followersCount: (p.followersCount || 0) + (following ? -1 : 1) }));
      }
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
    finally { setFollowLoading(false); }
  };

  const handleBlock = async () => {
    if (!user) return;
    if (!confirm(blocked ? `Unblock @${profileUser.username}?` : `Block @${profileUser.username}? They won't be able to see your content.`)) return;
    setBlockLoading(true);
    try {
      const method = blocked ? 'DELETE' : 'POST';
      const res = await fetch(`/api/users/${profileUser._id}/block`, { method });
      if (res.ok) {
        setBlocked(b => !b);
        toast({ title: blocked ? 'User unblocked' : 'User blocked' });
        setShowMoreMenu(false);
      }
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
    finally { setBlockLoading(false); }
  };

  const handleReportUser = async (reason) => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: profileUser._id, entityType: 'user', reason }),
      });
      const d = await res.json();
      toast({ title: res.ok ? 'Report submitted — thank you' : (d.error || 'Failed') });
      setShowMoreMenu(false);
    } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPins(next);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!profileUser) return null;

  const tabs = [
    { id: 'created', label: 'Created' },
  ];
  if (isOwner || profileUser.privacy?.showSavedPins !== false) {
    tabs.push({ id: 'saved', label: 'Saved' });
  }
  if (isOwner) {
    tabs.push({ id: 'liked', label: 'Liked' });
  }
  tabs.push({ id: 'boards', label: `Boards (${boards.length})` });

  const isPrivate = !isOwner && profileUser.privacy?.isPublic === false;

  return (
    <div className="min-h-screen">
      {/* Tip Modal */}
      {showTipModal && profileUser && (
        <ProfileTipModal
          profileUser={profileUser}
          creatorTipsEnabled={!!(profileUser.tipsEnabled && profileUser.stripeConnectedAccountId)}
          onClose={() => setShowTipModal(false)}
        />
      )}

      {/* Cover image */}
      {profileUser.coverImage && (
        <div className="relative w-full h-48 md:h-64 bg-muted">
          <img src={profileUser.coverImage} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/30" />
        </div>
      )}

      {/* Profile header */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-col items-center text-center">
          <Avatar
            src={profileUser.profileImage}
            alt={profileUser.username}
            size="xxl"
            className="ring-4 ring-background shadow-xl"
          />

          <div className="mt-4 flex items-center gap-2">
            <h1 className="text-3xl font-bold">{profileUser.displayName || profileUser.username}</h1>
            {profileUser.isVerified && <BadgeCheck className="w-6 h-6 text-blue-500 flex-shrink-0" />}
          </div>

          <p className="text-muted-foreground mt-1 text-sm">@{profileUser.username}</p>

          {profileUser.bio && (
            <p className="mt-3 text-sm leading-relaxed max-w-md text-foreground">
              {profileUser.bio}
            </p>
          )}

          {profileUser.portfolioUrl && (
            <a
              href={profileUser.portfolioUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 mt-2 text-sm text-primary hover:underline"
            >
              <Globe className="w-3.5 h-3.5" />
              {(() => { try { return new URL(profileUser.portfolioUrl).hostname; } catch { return profileUser.portfolioUrl; } })()}
            </a>
          )}

          {/* Stats */}
          <div className="flex gap-6 mt-4 text-sm">
            {(isOwner || profileUser.privacy?.showFollowers !== false) && (
              <>
                <Link href={`/${profileUser.username}/followers`} className="text-center hover:text-primary transition-colors">
                  <p className="text-lg font-bold text-foreground">{(profileUser.followersCount || 0).toLocaleString()}</p>
                  <p className="text-muted-foreground">Followers</p>
                </Link>
                <div className="w-px bg-border" />
              </>
            )}
            <Link href={`/${profileUser.username}/following`} className="text-center hover:text-primary transition-colors">
              <p className="text-lg font-bold text-foreground">{(profileUser.followingCount || 0).toLocaleString()}</p>
              <p className="text-muted-foreground">Following</p>
            </Link>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6 items-center">
            {isOwner ? (
              <Link href="/settings">
                <Button variant="secondary" className="rounded-full px-6 font-semibold">
                  <Settings className="w-4 h-4 mr-2" /> Edit profile
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`rounded-full px-8 font-bold ${following ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-primary text-white hover:bg-primary/90'}`}
                >
                  {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (following ? 'Following' : 'Follow')}
                </Button>

                {/* Tip button */}
                {profileUser.tipsEnabled && (
                  <Button
                    variant="secondary"
                    onClick={() => setShowTipModal(true)}
                    className="rounded-full font-bold px-5 gap-2 border border-primary/20 hover:border-primary/50 hover:text-primary transition-colors"
                    title={`Tip ${profileUser.displayName || profileUser.username}`}
                  >
                    <Gift className="w-4 h-4 text-primary" />
                    Tip
                  </Button>
                )}

                {/* Subscribe button */}
                {profileUser.creatorSubscriptionsEnabled && (
                  <Button
                    variant="secondary"
                    onClick={() => toast({ title: 'Simulated: Subscription flow opened', description: `Subscribe for $${(profileUser.subscriptionPrice / 100).toFixed(2)}/mo` })}
                    className="rounded-full font-bold px-5 gap-2 border border-blue-500/20 hover:border-blue-500/50 hover:text-blue-500 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    Subscribe ${(profileUser.subscriptionPrice / 100).toFixed(2)}/mo
                  </Button>
                )}

                {/* Brand Deal button */}
                {profileUser.brandCollabsEnabled && (
                  <Button
                    variant="secondary"
                    onClick={() => toast({ title: 'Simulated: Brand Deal requested', description: 'The creator has been notified of your interest.' })}
                    className="rounded-full font-bold px-5 gap-2 border border-purple-500/20 hover:border-purple-500/50 hover:text-purple-500 transition-colors"
                  >
                    <Briefcase className="w-4 h-4 text-purple-500" />
                    Brand Deal
                  </Button>
                )}

                {/* More options: Block + Report */}
                {user && (
                  <div className="relative">
                    <Button variant="secondary" className="rounded-full w-10 h-10 p-0" onClick={() => setShowMoreMenu(m => !m)}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                    {showMoreMenu && (
                      <div className="absolute right-0 top-12 w-48 bg-card border border-border rounded-2xl shadow-2xl py-2 z-50 animate-slide-down">
                        <button onClick={handleBlock} disabled={blockLoading}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-accent transition-colors text-red-500">
                          <UserX className="w-4 h-4" /> {blocked ? 'Unblock User' : 'Block User'}
                        </button>
                        {['spam', 'harassment', 'inappropriate', 'other'].map(reason => (
                          <button key={reason} onClick={() => handleReportUser(reason)}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-accent transition-colors capitalize">
                            <Flag className="w-4 h-4 text-muted-foreground" /> Report: {reason}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast({ title: 'Profile link copied!' }))}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Privacy Gate */}
      {isPrivate ? (
        <div className="max-w-md mx-auto mt-12 text-center py-20 px-4 border border-border/50 rounded-[2rem] bg-secondary/20 backdrop-blur-sm shadow-xl">
          <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-black mb-2">This account is private</h2>
          <p className="text-muted-foreground text-sm">Only approved followers can see their pins and boards.</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-md border-b border-border">
            <div className="max-w-screen-xl mx-auto px-4">
              <div className="flex gap-6 overflow-x-auto hide-scrollbar">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative pb-3 pt-4 font-semibold text-sm flex-shrink-0 transition-colors ${activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab content */}
          <div className="max-w-screen-2xl mx-auto px-3 py-6">
            {activeTab === 'created' && (
              pinsLoading && page === 1 ? <MasonryGrid pins={[]} loading /> : (
                <InfiniteScroll
                  dataLength={pins.length}
                  next={loadMore}
                  hasMore={hasMore}
                  loader={<div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
                >
                  <MasonryGrid pins={pins} />
                </InfiniteScroll>
              )
            )}

            {activeTab === 'saved' && (
              savedLoading ? (
                <MasonryGrid pins={[]} loading />
              ) : (
                <MasonryGrid pins={savedPins} />
              )
            )}

            {activeTab === 'liked' && (
              !isOwner ? (
                <div className="flex flex-col items-center py-20 text-muted-foreground">
                  <p className="text-lg font-semibold text-foreground">This is private</p>
                  <p className="text-sm mt-1">Only the account owner can see liked pins.</p>
                </div>
              ) : likedLoading ? (
                <MasonryGrid pins={[]} loading />
              ) : (
                <MasonryGrid pins={likedPins} />
              )
            )}

            {activeTab === 'boards' && (
              boards.length === 0 ? (
                <div className="flex flex-col items-center py-20 text-muted-foreground">
                  <div className="text-5xl mb-4">📌</div>
                  <p className="text-lg font-semibold text-foreground">No boards yet</p>
                  {isOwner && (
                    <Link href="/create" className="mt-4">
                      <Button className="rounded-full bg-primary text-white">Create your first pin</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {boards.map(board => (
                    <BoardCard key={board._id} board={board} />
                  ))}
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
