'use client';

import { useSidebar } from '@/context/SidebarContext';
import { useAuth } from '@/context/AuthContext';
import SearchBar from '@/components/search/SearchBar';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function LayoutShell({ children }) {
  const { collapsed } = useSidebar();
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  
  const [maintenance, setMaintenance] = useState(false);
  const [firstCheckDone, setFirstCheckDone] = useState(false);

  useEffect(() => {
    fetch(`/api/system/status?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => {
        setMaintenance(data.success && data.data.maintenanceMode);
      })
      .catch(() => { setMaintenance(false); })
      .finally(() => setFirstCheckDone(true));
  }, [pathname]); // re-check on every navigation

  // Show maintenance screen for non-admins (only after first check completes)
  if (firstCheckDone && !authLoading && maintenance && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-4">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <svg viewBox="0 0 40 40" className="w-10 h-10" fill="currentColor"><path d="M20 1C9.5 1 1 9.5 1 20c0 7.8 4.7 14.6 11.6 17.6-.2-1.5-.4-3.8.1-5.4l2.8-11.7s-.7-1.4-.7-3.5c0-3.3 1.9-5.7 4.3-5.7 2 0 3 1.5 3 3.3 0 2-1.3 5-2 7.8-.6 2.3 1.2 4.2 3.5 4.2 4.2 0 7.4-4.4 7.4-10.8 0-5.7-4.1-9.6-9.9-9.6-6.8 0-10.8 5.1-10.8 10.3 0 2 .8 4.2 1.9 5.4.2.2.2.5.1.7l-.7 3c-.1.5-.4.6-.8.4-3-1.4-4.9-5.9-4.9-9.5C5.5 7.3 11.4 1 21 1c8.5 0 15 6 15 14.1 0 8.4-5.3 15.1-12.6 15.1-2.5 0-4.8-1.3-5.6-2.8l-1.5 5.7c-.5 2.1-2 4.7-3 6.3C14.2 39.5 15.6 40 20 40 30.5 40 39 31.5 39 21c0-10.5-8.5-19-19-19z" /></svg>
        </div>
        <h1 className="text-4xl font-black mb-3">Under Maintenance</h1>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          We're currently performing some scheduled updates to improve your experience. We'll be back shortly!
        </p>
      </div>
    );
  }

  // Admin pages get a clean full-screen canvas — no navbar offset, no sidebar offset
  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <main
      className={[
        /* Mobile: full-width below the top navbar */
        'min-h-screen pt-14 overflow-x-hidden',
        /* Desktop: shift right by sidebar width, smoothly. 0 padding if guest */
        user ? 'lg:pt-0' : '',
        !user ? 'lg:pl-0' : (collapsed ? 'lg:pl-[72px]' : 'lg:pl-[220px]'),
        'transition-[padding-left] duration-300 ease-in-out bg-background text-foreground',
      ].join(' ')}
    >
      {/* Desktop Search Header */}
      {user && (
        <div className="hidden lg:flex items-center h-16 px-8 sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 mb-4">
          <div className="w-full max-w-4xl">
            <SearchBar />
          </div>
        </div>
      )}
      
      {/* Inner wrapper to center + cap content width */}
      <div className="w-full max-w-[1800px] mx-auto pb-10">
        {children}
      </div>
    </main>
  );
}
