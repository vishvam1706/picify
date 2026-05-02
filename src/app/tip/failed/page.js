'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { XCircle, ArrowLeft, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function TipFailedContent() {
  const searchParams = useSearchParams();
  const pinId = searchParams.get('pin');
  const reason = searchParams.get('reason') || 'cancelled';

  const isCancelled = reason === 'cancelled';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        {/* Failure icon */}
        <div className="relative mx-auto w-32 h-32 mb-8">
          <div className={`relative flex items-center justify-center w-32 h-32 rounded-full shadow-2xl ${isCancelled ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/30' : 'bg-gradient-to-br from-red-400 to-rose-600 shadow-red-500/30'}`}>
            <XCircle className="w-16 h-16 text-white" />
          </div>
        </div>

        <h1 className={`text-3xl font-black mb-3 ${isCancelled ? 'text-amber-500' : 'text-red-500'}`}>
          {isCancelled ? 'Tip Cancelled' : 'Payment Failed'}
        </h1>

        <p className="text-muted-foreground mb-8">
          {isCancelled
            ? "No worries — your tip was cancelled and you haven't been charged."
            : "Something went wrong with your payment. No charge was made. Please try again."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {pinId && (
            <>
              <Button asChild className="rounded-full px-8 font-bold bg-primary hover:bg-primary/90">
                <Link href={`/pin/${pinId}?retry_tip=1`}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-full px-6 font-semibold">
                <Link href={`/pin/${pinId}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Pin
                </Link>
              </Button>
            </>
          )}
          {!pinId && (
            <Button asChild variant="secondary" className="rounded-full px-6 font-semibold">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TipFailedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <TipFailedContent />
    </Suspense>
  );
}
