'use client';

import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toaster';

/**
 * Returns a guard function.
 * Call it before any authenticated action.
 * Returns true (and redirects to /login) if not logged in.
 * Returns false if user is logged in — action can proceed.
 */
export function useGuestGuard() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  return (message = 'Sign in to continue') => {
    // While auth is still loading, don't block
    if (loading) return false;

    if (!user) {
      toast({
        title: "👋 You're not logged in",
        description: message,
      });
      // Use hard redirect — works in all contexts including inside callbacks
      window.location.href = '/login';
      return true; // blocked
    }
    return false; // allowed
  };
}
