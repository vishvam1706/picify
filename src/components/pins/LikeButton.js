'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toaster';
import { Heart } from 'lucide-react';

export default function LikeButton({ pinId, initialLiked = false, initialCount = 0, className = '' }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [initialLiked, initialCount]);

  const toggle = async () => {
    if (!user) return router.push('/login');
    setLoading(true);
    const prev = liked;
    setLiked(!prev);
    setCount(c => prev ? c - 1 : c + 1);
    try {
      const method = prev ? 'DELETE' : 'POST';
      const res = await fetch(`/api/pins/${pinId}/like`, { method });
      if (!res.ok) throw new Error();
    } catch {
      setLiked(prev);
      setCount(c => prev ? c + 1 : c - 1);
      toast({ title: 'Action failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={liked ? 'Unlike pin' : 'Like pin'}
      className={`group flex items-center gap-1 rounded-full px-3 py-2 transition-all hover:bg-primary/10 ${className}`}
    >
      <Heart
        className={`w-5 h-5 transition-all duration-200 ${liked ? 'fill-primary text-primary scale-110' : 'text-muted-foreground group-hover:text-primary'}`}
        fill={liked ? "currentColor" : "none"}
      />
      {count > 0 && <span className={`text-sm font-medium ${liked ? 'text-primary' : 'text-muted-foreground'}`}>{count}</span>}
    </button>
  );
}
