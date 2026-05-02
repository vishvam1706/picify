'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toaster';
import { Button } from '@/components/ui/Button';
import { History, Trash2, Eye, Heart, Bookmark, Loader2, Clock, ImageIcon } from 'lucide-react';

function PinHistoryCard({ pin }) {
  const thumb = pin.images?.[0]?.url;
  return (
    <Link href={`/pin/${pin._id}`} className="group relative rounded-2xl overflow-hidden bg-secondary/50 border border-border hover:border-primary/40 transition-all hover:shadow-lg">
      <div className="aspect-square bg-muted overflow-hidden">
        {thumb ? (
          <img src={thumb} alt={pin.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm truncate">{pin.title || 'Untitled'}</p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(pin.viewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{pin.views || 0}</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{pin.likesCount || 0}</span>
          <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />{pin.savesCount || 0}</span>
        </div>
      </div>
    </Link>
  );
}

export default function WatchHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/watch-history?limit=30');
      const data = await res.json();
      if (res.ok) setPins(data.data?.docs || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetchHistory();
  }, [user, authLoading, router, fetchHistory]);

  const handleClear = async () => {
    if (!confirm('Clear your entire watch history?')) return;
    setClearing(true);
    try {
      const res = await fetch('/api/watch-history', { method: 'DELETE' });
      if (res.ok) {
        setPins([]);
        toast({ title: 'Watch history cleared!' });
      }
    } catch { toast({ title: 'Failed to clear history', variant: 'destructive' }); }
    finally { setClearing(false); }
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
    <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Watch History</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Pins you viewed in the last 30 days</p>
          </div>
        </div>
        {pins.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClear}
            disabled={clearing}
            className="rounded-full"
          >
            {clearing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Clear History
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : pins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-4">
            <History className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h2 className="text-xl font-bold mb-2">No history yet</h2>
          <p className="text-muted-foreground text-sm mb-6">Pins you view will appear here.</p>
          <Link href="/">
            <Button className="rounded-full">Explore Pins</Button>
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">{pins.length} pin{pins.length !== 1 ? 's' : ''} viewed recently</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {pins.map((pin) => (
              <PinHistoryCard key={pin._id} pin={pin} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
