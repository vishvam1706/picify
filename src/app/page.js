'use client';

import { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import MasonryGrid from '@/components/pins/MasonryGrid';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [pins, setPins] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchPins = async (pageNum = 1) => {
    try {
      const res = await fetch(`/api/pins?page=${pageNum}&limit=20`);
      const data = await res.json();
      
      if (res.ok) {
        if (pageNum === 1) {
          setPins(data.data.docs);
        } else {
          setPins(prev => [...prev, ...data.data.docs]);
        }
        setHasMore(data.data.hasNextPage);
      } else {
        console.error('Failed to fetch pins:', data.error);
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching pins:', err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPins(1);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPins(nextPage);
  };

  if (loading && page === 1) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 md:px-6">
      <InfiniteScroll
        dataLength={pins.length}
        next={loadMore}
        hasMore={hasMore}
        loader={
          <div className="flex w-full justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
        endMessage={
          <div className="flex w-full justify-center py-12 text-muted-foreground font-medium">
            You've caught up! Check back later for more ideas.
          </div>
        }
      >
        <MasonryGrid pins={pins} />
      </InfiniteScroll>
    </div>
  );
}
