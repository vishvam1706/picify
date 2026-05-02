'use client';

import { useState, useEffect, useCallback } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import MasonryGrid from '@/components/pins/MasonryGrid';
import { Loader2 } from 'lucide-react';

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: '🎨 Art', value: 'art' },
  { label: '📸 Photography', value: 'photography' },
  { label: '🏠 Interior', value: 'interior' },
  { label: '🌿 Nature', value: 'nature' },
  { label: '✈️ Travel', value: 'travel' },
  { label: '👗 Fashion', value: 'fashion' },
  { label: '🍕 Food', value: 'food' },
  { label: '💪 Fitness', value: 'fitness' },
  { label: '🏗️ Architecture', value: 'architecture' },
  { label: '🎭 Design', value: 'design' },
  { label: '📚 Books', value: 'books' },
];

export default function Home() {
  const [pins, setPins] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  const fetchPins = useCallback(async (pageNum = 1, cat = '') => {
    try {
      const url = new URL('/api/pins/explore', window.location.origin);
      url.searchParams.set('page', pageNum);
      url.searchParams.set('limit', 24);
      if (cat) url.searchParams.set('category', cat);

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.success) {
        const docs = data.data.docs || [];
        if (pageNum === 1) {
          setPins(docs);
        } else {
          setPins(prev => [...prev, ...docs]);
        }
        setHasMore(!!data.data.hasNextPage);
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchPins(1, category);
  }, [category, fetchPins]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPins(next, category);
  };

  return (
    <div>
      {/* Category filter bar */}
      <div className="sticky top-14 lg:top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-4 py-3 max-w-screen-2xl mx-auto">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                category === cat.value
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
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="font-semibold text-base text-foreground">You're all caught up!</p>
                  <p className="text-sm mt-1">Check back later for fresh inspiration.</p>
                </div>
              ) : null
            }
          >
            <MasonryGrid pins={pins} />
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
}
