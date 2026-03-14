'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MasonryGrid from '@/components/pins/MasonryGrid';
import UserCard from '@/components/users/UserCard';
import { Search, Loader2, ImageIcon, Users, LayoutGrid } from 'lucide-react';
import InfiniteScroll from 'react-infinite-scroll-component';

const TABS = [
  { id: 'pins', label: 'Pins', icon: LayoutGrid },
  { id: 'people', label: 'People', icon: Users },
];

const CATEGORIES = ['All', 'Art', 'Travel', 'Food', 'Fashion', 'Technology', 'Nature', 'Design', 'Photography'];

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') || '';

  const [tab, setTab] = useState('pins');
  const [category, setCategory] = useState('All');
  const [pins, setPins] = useState([]);
  const [people, setPeople] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q) return;
    setPins([]);
    setPeople([]);
    setPage(1);
    setHasMore(true);
    fetchResults(q, tab, 1, category);
  }, [q, tab, category]);

  const fetchResults = async (query, activeTab, pageNum, cat) => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query, page: pageNum, limit: 20 });
      if (cat && cat !== 'All') params.set('category', cat);

      if (activeTab === 'pins') {
        const res = await fetch(`/api/search?${params}`);
        const data = await res.json();
        if (res.ok) {
          const docs = data.data?.docs || data.data?.pins || [];
          pageNum === 1 ? setPins(docs) : setPins(prev => [...prev, ...docs]);
          setHasMore(data.data?.hasNextPage || false);
        }
      } else {
        const res = await fetch(`/api/users/discover?q=${encodeURIComponent(query)}&page=${pageNum}&limit=20`);
        const data = await res.json();
        if (res.ok) {
          const users = data.data?.docs || data.data?.users || [];
          pageNum === 1 ? setPeople(users) : setPeople(prev => [...prev, ...users]);
          setHasMore(data.data?.hasNextPage || false);
        }
      }
    } catch { setHasMore(false); } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchResults(q, tab, next, category);
  };

  return (
    <div className="min-h-screen">
      {/* Header bar */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4">
          {/* Tab nav */}
          <div className="flex gap-6 pt-4">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 pb-3 font-semibold text-sm transition-colors relative ${tab === id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {tab === id && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-foreground rounded-t" />}
              </button>
            ))}
          </div>

          {/* Category pills (pins only) */}
          {tab === 'pins' && (
            <div className="flex gap-2 pb-3 overflow-x-auto hide-scrollbar">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${category === cat ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Query heading */}
        {q && (
          <h1 className="text-2xl font-bold mb-6">
            Results for <span className="text-primary">"{q}"</span>
          </h1>
        )}

        {!q && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Search className="w-16 h-16 text-muted-foreground mb-4 opacity-40" />
            <h2 className="text-2xl font-bold mb-2">Find ideas that inspire you</h2>
            <p className="text-muted-foreground">Search for pins, people, and boards</p>
          </div>
        )}

        {q && tab === 'pins' && (
          loading && pins.length === 0 ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : pins.length === 0 && !loading ? (
            <div className="flex flex-col items-center py-20 text-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
              <h3 className="text-xl font-semibold mb-1">No pins found</h3>
              <p className="text-muted-foreground">Try different keywords or browse categories</p>
            </div>
          ) : (
            <InfiniteScroll
              dataLength={pins.length}
              next={loadMore}
              hasMore={hasMore}
              loader={<div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin" /></div>}
              endMessage={<p className="text-center text-sm text-muted-foreground py-8">End of results</p>}
            >
              <MasonryGrid pins={pins} />
            </InfiniteScroll>
          )
        )}

        {q && tab === 'people' && (
          loading && people.length === 0 ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : people.length === 0 && !loading ? (
            <div className="flex flex-col items-center py-20 text-center">
              <Users className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
              <h3 className="text-xl font-semibold mb-1">No people found</h3>
              <p className="text-muted-foreground">Try a different search term</p>
            </div>
          ) : (
            <InfiniteScroll
              dataLength={people.length}
              next={loadMore}
              hasMore={hasMore}
              loader={<div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin" /></div>}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {people.map(u => <UserCard key={u._id} user={u} />)}
              </div>
            </InfiniteScroll>
          )
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <SearchResults />
    </Suspense>
  );
}
