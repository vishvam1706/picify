'use client';

import { useState, useEffect, useCallback } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import MasonryGrid from '@/components/pins/MasonryGrid';
import { Loader2, Compass } from 'lucide-react';

export default function ExplorePage() {
  const [pins, setPins] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([{ label: 'All', value: '' }]);
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    fetch('/api/categories?type=category')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const fetchedCategories = data.data.map(c => ({ label: `${c.emoji || ''} ${c.name}`.trim(), value: c.slug }));
          setCategories([{ label: 'All', value: '' }, ...fetchedCategories]);
        }
      })
      .catch(() => {});
  }, []);

  const fetchExplore = useCallback(async (pageNum = 1, category = '') => {
    try {
      const url = new URL('/api/pins', window.location.origin);
      url.searchParams.set('page', pageNum);
      url.searchParams.set('limit', 24);
      if (category) url.searchParams.set('category', category);

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
    } catch { setHasMore(false); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchExplore(1, activeCategory);
  }, [activeCategory, fetchExplore]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchExplore(next, activeCategory);
  };

  return (
    <div>
      {/* Header */}
      <div className="text-center py-10 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <Compass className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Explore</h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Discover ideas, trending aesthetics, and top creators.
        </p>
      </div>

      {/* Category filter */}
      <div className="sticky top-14 lg:top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border mt-4">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar px-4 py-3 max-w-screen-2xl mx-auto">
          {categories.map(cat => (
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
                  <div className="text-4xl mb-3">🎯</div>
                  <p className="font-semibold text-foreground">You've explored everything!</p>
                  <p className="text-sm mt-1">Try a different category.</p>
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
