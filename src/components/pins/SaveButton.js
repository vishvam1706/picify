'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toaster';
import { Button } from '@/components/ui/Button';
import { Bookmark } from 'lucide-react';

export default function SaveButton({ pinId, initialSaved = false, size = 'default', className = '' }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  const toggle = async () => {
    if (!user) return router.push('/login');
    setLoading(true);
    const prev = saved;
    setSaved(!prev);
    try {
      const method = prev ? 'DELETE' : 'POST';
      const res = await fetch(`/api/pins/${pinId}/save`, { method });
      if (!res.ok) throw new Error();
      toast({ title: prev ? 'Removed from saved' : 'Pin saved!', description: prev ? '' : 'Saved to your collection.' });
    } catch {
      setSaved(prev);
      toast({ title: 'Action failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (size === 'icon') {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        aria-label={saved ? 'Unsave pin' : 'Save pin'}
        className={`flex items-center justify-center rounded-full p-2 transition-all hover:bg-accent ${className}`}
      >
        <Bookmark className={`w-5 h-5 ${saved ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
      </button>
    );
  }

  return (
    <Button
      onClick={toggle}
      disabled={loading}
      size={size}
      className={`rounded-full font-semibold px-6 ${saved ? 'bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80' : ''} ${className}`}
    >
      {saved ? 'Saved' : 'Save'}
    </Button>
  );
}
