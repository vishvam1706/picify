'use client';

import { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import MasonryGrid from '@/components/pins/MasonryGrid';
import { Loader2, Compass } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const CATEGORIES = ['Art', 'Design', 'Photography', 'Architecture', 'Travel', 'Food', 'DIY', 'Fashion'];

export default function ExplorePage() {
  const { user } = useAuth();
  const [pins, setPins] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  const fetchExplore = async (pageNum = 1, category = 'All') => {
    try {
      // If we are logged in, /explore provides a personalized smart feed
      // If not, it falls back to a popular feed. We add a category filter.
      const url = new URL('/api/pins/explore', window.location.origin);
      url.searchParams.append('page', pageNum);
      url.searchParams.append('limit', 20);
      if (category !== 'All') {
        url.searchParams.append('category', category.toLowerCase());
      }
      
      const res = await fetch(url);
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
      console.error('Error fetching explore pins:', err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchExplore(1, activeCategory);
  }, [activeCategory, user]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchExplore(nextPage, activeCategory);
  };

  return (
    <div className="container mx-auto px-4 py-6 md:px-6">
      <div className="flex flex-col items-center mb-8">
        <Compass className="w-12 h-12 text-primary mb-4" />
        <h1 className="text-3xl font-bold tracking-tight mb-2">Explore</h1>
        <p className="text-muted-foreground text-center max-w-lg mb-8">
          Discover new ideas, trending aesthetics, and top creators tailored just for you.
        </p>

        {/* Category Pills */}
        <div className="flex gap-3 overflow-x-auto pb-4 w-full justify-start md:justify-center hide-scrollbar px-4">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-6 py-2 rounded-full font-semibold transition-colors flex-shrink-0 ${
              activeCategory === 'All' ? 'bg-foreground text-background' : 'bg-secondary hover:bg-secondary/80 text-foreground'
            }`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full font-semibold transition-colors flex-shrink-0 ${
                activeCategory === cat ? 'bg-foreground text-background' : 'bg-secondary hover:bg-secondary/80 text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading && page === 1 ? (
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
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
              You've explored everything! Let's search for something specific.
            </div>
          }
        >
          <MasonryGrid pins={pins} />
        </InfiniteScroll>
      )}
    </div>
  );
}
