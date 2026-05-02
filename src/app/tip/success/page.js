'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, Heart, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function TipSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pinId = searchParams.get('pin');
  const creator = searchParams.get('creator');
  const amount = searchParams.get('amount');

  const [count, setCount] = useState(5);

  useEffect(() => {
    if (!pinId) return;
    const interval = setInterval(() => {
      setCount(c => {
        if (c <= 1) {
          clearInterval(interval);
          router.push(`/pin/${pinId}`);
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pinId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        {/* Success animation */}
        <div className="relative mx-auto w-32 h-32 mb-8">
          <div className="absolute inset-0 rounded-full bg-green-500/10 animate-ping" />
          <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-2xl shadow-green-500/30">
            <CheckCircle className="w-16 h-16 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-black mb-3 bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
          Tip Sent! 🎉
        </h1>
        <p className="text-muted-foreground mb-2">
          {amount
            ? `Your $${(parseInt(amount) / 100).toFixed(2)} tip has been sent!`
            : 'Your tip has been sent successfully!'}
        </p>
        {creator && (
          <p className="text-sm text-muted-foreground mb-6">
            Thank you for supporting <span className="font-semibold text-foreground">{creator}</span> 💛
          </p>
        )}

        {!creator && (
          <p className="text-sm text-muted-foreground mb-6">
            Thank you for supporting this creator!
          </p>
        )}

        {/* Hearts animation */}
        <div className="flex justify-center gap-2 mb-8">
          {[...Array(5)].map((_, i) => (
            <Heart
              key={i}
              className="w-5 h-5 text-pink-500 fill-pink-500"
              style={{ animationDelay: `${i * 0.1}s`, animation: 'bounce 1s infinite' }}
            />
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {pinId && (
            <Button asChild className="rounded-full px-8 font-bold bg-primary hover:bg-primary/90">
              <Link href={`/pin/${pinId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Pin {count > 0 ? `(${count})` : ''}
              </Link>
            </Button>
          )}
          <Button asChild variant="secondary" className="rounded-full px-6 font-semibold">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          <Link href="/tip/history" className="hover:underline text-primary">
            View your tip history →
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function TipSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <TipSuccessContent />
    </Suspense>
  );
}
