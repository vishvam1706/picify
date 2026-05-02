'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toaster';
import { Button } from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import MasonryGrid from '@/components/pins/MasonryGrid';
import InfiniteScroll from 'react-infinite-scroll-component';
import { Loader2, Globe, Lock, Share2, Settings, ChevronLeft } from 'lucide-react';

export default function BoardDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [board, setBoard] = useState(null);
  const [pins, setPins] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [pinsLoading, setPinsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/boards/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setBoard(d.data);
        else router.push('/');
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const fetchPins = useCallback(async (pageNum = 1) => {
    try {
      const res = await fetch(`/api/boards/${id}/pins?page=${pageNum}&limit=20`);
      const data = await res.json();
      if (res.ok && data.success) {
        const docs = data.data.docs || [];
        if (pageNum === 1) setPins(docs);
        else setPins(prev => [...prev, ...docs]);
        setHasMore(!!data.data.hasNextPage);
      } else {
        setHasMore(false);
      }
    } catch { setHasMore(false); }
    finally { setPinsLoading(false); }
  }, [id]);

  useEffect(() => {
    if (id) fetchPins(1);
  }, [id, fetchPins]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPins(next);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!board) return null;

  const isOwner = user && (user._id === board.userId?._id || user.id === board.userId?._id);

  return (
    <div className="min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10">
          {board.sampleImages?.length > 0 && (
            <div className="w-full max-w-xs h-44 rounded-3xl overflow-hidden mb-6 bg-secondary flex gap-1 p-1">
              {board.sampleImages.slice(0, 3).map((url, i) => (
                <div key={i} className={`relative rounded-2xl overflow-hidden ${i === 0 ? 'flex-[2]' : 'flex-1'}`}>
                  <Image src={url} alt="Board cover" fill className="object-cover" sizes="200px" />
                </div>
              ))}
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold">{board.name}</h1>
          {board.description && (
            <p className="text-muted-foreground mt-2 text-sm max-w-md leading-relaxed">{board.description}</p>
          )}

          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            {board.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{board.isPublic ? 'Public' : 'Private'}</span>
            <span>·</span>
            <span>{board.pinsCount || pins.length} pins</span>
          </div>

          {board.userId && (
            <Link href={`/${board.userId.username}`} className="flex items-center gap-2 mt-4 hover:opacity-80 transition-opacity">
              <Avatar src={board.userId.profileImage} alt={board.userId.username} size="sm" />
              <span className="text-sm font-semibold">{board.userId.displayName || board.userId.username}</span>
            </Link>
          )}

          <div className="flex gap-2 mt-5">
            <Button variant="secondary" className="rounded-full" onClick={() => navigator.clipboard.writeText(window.location.href).then(() => toast({ title: 'Link copied!' }))}>
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            {isOwner && (
              <Button variant="secondary" className="rounded-full">
                <Settings className="w-4 h-4 mr-2" /> Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-3 pb-16">
        {pinsLoading ? (
          <MasonryGrid pins={[]} loading />
        ) : (
          <InfiniteScroll
            dataLength={pins.length}
            next={loadMore}
            hasMore={hasMore}
            loader={<div className="flex justify-center py-8"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>}
          >
            <MasonryGrid pins={pins} />
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
}
