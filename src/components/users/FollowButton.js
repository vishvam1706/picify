'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toaster';
import { UserCheck, UserPlus } from 'lucide-react';

export default function FollowButton({ targetUserId, initialFollowing = false, className = '' }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing]);

  // A user cannot follow themselves
  if (!targetUserId || (user && (user._id === targetUserId || user.id === targetUserId))) {
    return null;
  }

  const toggle = async () => {
    if (!user) return router.push('/login');
    setLoading(true);
    const prev = following;
    setFollowing(!prev);
    try {
      const method = prev ? 'DELETE' : 'POST';
      const res = await fetch(`/api/users/${targetUserId}/follow`, { method });
      if (!res.ok) throw new Error();
      toast({ title: prev ? 'Unfollowed' : 'Following!', description: prev ? '' : 'You are now following this user.' });
    } catch {
      setFollowing(prev);
      toast({ title: 'Action failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={toggle}
      disabled={loading}
      variant={following ? 'secondary' : 'default'}
      className={`rounded-full font-semibold px-6 transition-all ${className}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {following ? (
        hovering ? (
          <><UserPlus className="w-4 h-4 mr-2" />Unfollow</>
        ) : (
          <><UserCheck className="w-4 h-4 mr-2" />Following</>
        )
      ) : (
        'Follow'
      )}
    </Button>
  );
}
