'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    // The actual passport callback handles setting the httpOnly cookie.
    // By the time we redirect here, the backend has already issued the JWT cookie.
    // If the token matches the 2FA requirement (token payload has requiresTwoFactor: true),
    // we need to detect that and redirect to /2fa/verify.
    // Otherwise, we refresh the user context and go to home.
    
    // In our implementation, Next.js API handles the google callback and sets the cookie,
    // then redirects here with ?success=true or ?error=SomeError
    
    // If 2FA is required, the API would redirect to /2fa/verify instead of here.
    async function handleAuth() {
      const error = searchParams.get('error');
      if (error) {
        // We'll let the user see a flash message / redirect to login
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
        <h1 className="text-xl font-bold">Completing Sign In</h1>
        <p className="text-muted-foreground mt-2">Please wait while we redirect you...</p>
      </div>
    </div>
  );
}
