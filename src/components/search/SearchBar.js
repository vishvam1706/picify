'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Clock, Loader2 } from 'lucide-react';

export default function SearchBar({ placeholder = 'Search for ideas, tags, colors...', className = '' }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('picify_recent_searches') || '[]');
      setRecent(stored.slice(0, 5));
    } catch { /* ignore */ }
  }, []);

  const saveRecent = (q) => {
    try {
      const stored = JSON.parse(localStorage.getItem('picify_recent_searches') || '[]');
      const updated = [q, ...stored.filter(s => s !== q)].slice(0, 8);
      localStorage.setItem('picify_recent_searches', JSON.stringify(updated));
      setRecent(updated.slice(0, 5));
    } catch { /* ignore */ }
  };

  const fetchSuggestions = useCallback(async (q) => {
    if (!q.trim() || q.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok) setSuggestions(data.data?.suggestions || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (q) => {
    if (!q.trim()) return;
    saveRecent(q.trim());
    setFocused(false);
    setQuery('');
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const showDropdown = focused && (query.trim().length > 0 || recent.length > 0);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch(query); if (e.key === 'Escape') { setFocused(false); inputRef.current?.blur(); } }}
          className="w-full h-12 bg-secondary/80 focus:bg-background border-none rounded-full pl-10 pr-10 outline-none ring-2 ring-transparent focus:ring-primary/25 transition-all font-medium text-sm placeholder:text-muted-foreground"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-14 left-0 right-0 glass-card rounded-2xl shadow-2xl overflow-hidden z-50 py-2">
          {loading && (
            <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching...</span>
            </div>
          )}

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <p className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggestions</p>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(typeof s === 'string' ? s : s.text)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                >
                  <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span>{typeof s === 'string' ? s : s.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {recent.length > 0 && !query.trim() && (
            <div>
              <p className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> Recent
              </p>
              {recent.map((r, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(r)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                >
                  <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span>{r}</span>
                </button>
              ))}
            </div>
          )}

          {/* Trending */}
          {!query.trim() && suggestions.length === 0 && (
            <div>
              <p className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Popular
              </p>
              {['summer vibes', 'minimalist design', 'aesthetic room', 'dark academia', 'street style'].map((t, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(t)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span>{t}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
