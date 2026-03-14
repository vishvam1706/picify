'use client';

import { useState, useEffect } from 'react';
import MasonryGrid from '@/components/pins/MasonryGrid';
import { Loader2, TrendingUp } from 'lucide-react';

export default function TrendingPage() {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Trending is usually a concise top list (e.g. top 50), so we don't necessarily use infinite scroll here
  const fetchTrending = async () => {
    try {
      const res = await fetch(`/api/pins/trending`);
      const data = await res.json();
      
      if (res.ok) {
        setPins(data.data);
      }
    } catch (err) {
      console.error('Error fetching trending pins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 md:px-6">
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Today's Inspiration</h1>
        <p className="text-muted-foreground text-center max-w-lg mb-8">
          The most popular and saved ideas across Picify in the last 24 hours.
        </p>
      </div>

      {loading ? (
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pins.length > 0 ? (
        <MasonryGrid pins={pins} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Not enough data to determine trends yet.</p>
        </div>
      )}
    </div>
  );
}
