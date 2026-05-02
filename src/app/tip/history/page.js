'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Avatar from '@/components/ui/Avatar';
import { Loader2, Gift, ArrowLeft, BadgeCheck, ChevronRight } from 'lucide-react';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatAmount(cents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default function TipHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    async function fetchTips() {
      setLoading(true);
      try {
        const res = await fetch(`/api/monetization/tip/history?page=1&limit=50`);
        const data = await res.json();
        if (res.ok) {
          const docs = data.data?.docs || [];
          setTips(docs);
          setHasMore(data.data?.hasNextPage || false);
          setTotalSpent(docs.reduce((sum, t) => sum + (t.amount || 0), 0));
        }
      } catch {}
      finally { setLoading(false); }
    }
    fetchTips();
  }, [user]);

  if (authLoading || (!user && !authLoading)) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-secondary transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black">Tip History</h1>
          <p className="text-sm text-muted-foreground">Tips you've sent to creators</p>
        </div>
      </div>

      {/* Stats card */}
      {tips.length > 0 && (
        <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-5 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Tipped</p>
            <p className="text-2xl font-black">{formatAmount(totalSpent)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{tips.length} tip{tips.length !== 1 ? 's' : ''} sent</p>
          </div>
        </div>
      )}

      {/* Tips list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : tips.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center bg-secondary/20 rounded-3xl">
          <Gift className="w-16 h-16 text-muted-foreground opacity-30 mb-4" />
          <h2 className="text-xl font-bold mb-2">No tips sent yet</h2>
          <p className="text-sm text-muted-foreground mb-6">Start supporting your favourite creators by tipping them!</p>
          <Link href="/" className="px-6 py-2 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary/90 transition-colors">
            Explore Creators
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tips.map((tip) => {
            const creator = tip.userId;
            const pin = tip.pinId;
            const pinImage = pin?.images?.[0]?.url;

            return (
              <div key={tip._id} className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                {/* Creator avatar */}
                <Link href={creator ? `/${creator.username}` : '#'} className="flex-shrink-0">
                  <Avatar src={creator?.profileImage} alt={creator?.username || '?'} size="md" />
                </Link>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Link href={creator ? `/${creator.username}` : '#'} className="font-bold text-sm hover:underline truncate flex items-center gap-1">
                      {creator?.displayName || creator?.username || 'Unknown creator'}
                      {creator?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                    </Link>
                  </div>
                  {pin ? (
                    <Link href={`/pin/${pin._id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors line-clamp-1">
                      📌 {pin.title || 'Untitled Pin'}
                    </Link>
                  ) : (
                    <p className="text-xs text-muted-foreground">Profile tip</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(tip.createdAt)}</p>
                </div>

                {/* Pin thumbnail */}
                {pinImage && (
                  <Link href={`/pin/${pin._id}`} className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-secondary">
                    <Image src={pinImage} alt={pin?.title || 'pin'} width={48} height={48} className="object-cover w-full h-full" />
                  </Link>
                )}

                {/* Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-primary">{formatAmount(tip.amount, tip.currency)}</p>
                  <p className="text-xs text-green-500 font-semibold mt-0.5">✓ Sent</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
