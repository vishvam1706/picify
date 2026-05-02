'use client';

import { useState, useEffect, useCallback } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import MasonryGrid from '@/components/pins/MasonryGrid';
import { Loader2, TrendingUp, Flame } from 'lucide-react';

const CATEGORIES = [
  { label: 'All', value: 'all' },
  { label: '🎨 Art', value: 'art' },
  { label: '📐 Design', value: 'design' },
  { label: '📸 Photography', value: 'photography' },
  { label: '🏠 Interior', value: 'interior' },
  { label: '✈️ Travel', value: 'travel' },
  { label: '🍕 Food', value: 'food' },
  { label: '👗 Fashion', value: 'fashion' },
  { label: '🌿 Nature', value: 'nature' },
  { label: '💪 Fitness', value: 'fitness' },
  { label: '🏗️ Architecture', value: 'architecture' },
];

const PERIODS = [
  { label: 'Today', value: 'daily' },
  { label: 'This Week', value: 'weekly' },
];

export default function TrendingPage() {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [period, setPeriod] = useState('daily');

  const fetchTrending = useCallback(async (pageNum = 1, cat = 'all', per = 'daily') => {
    try {
      const url = new URL('/api/pins/trending', window.location.origin);
      url.searchParams.set('page', pageNum);
      url.searchParams.set('limit', 24);
      url.searchParams.set('category', cat);
      url.searchParams.set('period', per);

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.success) {
        const docs = data.data.docs || [];
        if (pageNum === 1) setPins(docs);
        else setPins(prev => [...prev, ...docs]);
        setHasMore(!!data.data.hasNextPage);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching trending pins:', err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setPins([]);
    setPage(1);
    fetchTrending(1, activeCategory, period);
  }, [activeCategory, period, fetchTrending]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchTrending(next, activeCategory, period);
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center py-10 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <Flame className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Trending</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          The most liked and saved ideas across Picify right now.
        </p>

        {/* Period Toggle */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                period === p.value
                  ? 'bg-foreground text-background'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="sticky top-14 lg:top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-4 py-3 max-w-screen-2xl mx-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat.value
                  ? 'bg-foreground text-background'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/70'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-screen-2xl mx-auto px-3 py-6">
        {loading && page === 1 ? (
          <MasonryGrid pins={[]} loading />
        ) : (
          <InfiniteScroll
            dataLength={pins.length}
            next={loadMore}
            hasMore={hasMore}
            loader={
              <div className="flex w-full justify-center py-10">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            }
            endMessage={
              pins.length > 0 ? (
                <div className="flex flex-col items-center py-16 text-muted-foreground">
                  <div className="text-4xl mb-3">🔥</div>
                  <p className="font-semibold text-foreground">You've seen all trending pins!</p>
                  <p className="text-sm mt-1">Check back later for new trends.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-lg font-medium">Not enough data yet.</p>
                  <p className="text-sm mt-1">Be the first to create trending content!</p>
                </div>
              )
            }
          >
            <MasonryGrid pins={pins} />
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
}

