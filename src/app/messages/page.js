'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { MessageSquareOff } from 'lucide-react';

export default function MessagesPlaceholderPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="container mx-auto px-4 py-8 h-[calc(100vh-4rem)] flex flex-col items-center justify-center">
      <div className="glass-card rounded-3xl p-12 text-center max-w-lg flex flex-col items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageSquareOff className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground text-lg">
            Direct Messaging is currently under construction. Check back soon for updates!
          </p>
        </div>
      </div>
    </div>
  );
}
