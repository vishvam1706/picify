'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    async function handleAuth() {
      const error = searchParams.get('error');
      if (error) {
        router.push(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      try {
        await refreshUser();
        router.push('/');
      } catch (err) {
        router.push('/login');
      }
    }

    handleAuth();
  }, [router, searchParams, refreshUser]);

  return null;
}

export default function GoogleCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
        <h1 className="text-xl font-bold">Completing Sign In</h1>
        <p className="text-muted-foreground mt-2">Please wait while we redirect you...</p>
        <Suspense fallback={null}>
          <CallbackHandler />
        </Suspense>
      </div>
    </div>
  );
}
