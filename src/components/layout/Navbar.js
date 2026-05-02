'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import SearchBar from '@/components/search/SearchBar';
import Avatar from '@/components/ui/Avatar';
import {
  Home, Compass, Plus, Bell, Settings,
  Moon, Sun, User, LogOut, ChevronDown, Flame, Shield, DollarSign, BadgeCheck, Gift
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const dropdownRef = useRef(null);
  const pathname = usePathname();



  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetch('/api/notifications?unreadOnly=true&limit=1')
      .then(r => r.json())
      .then(d => { if (d.success) setNotifCount(d.data?.totalDocs || 0); })
      .catch(() => {});
  }, [user]);

  // Don't render on admin pages
  if (pathname?.startsWith('/admin')) return null;

  return (
    /* Shows on mobile, OR on desktop if user is a guest (Sidebar handles logged-in desktop). */
    <nav className={`${user ? 'lg:hidden' : ''} fixed top-0 left-0 right-0 h-14 z-50 glass flex items-center px-3 gap-2`}>
      {/* Logo */}
      <Link href="/" className="flex-shrink-0 flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-sm">
          <svg viewBox="0 0 40 40" className="w-4 h-4" fill="white">
            <path d="M20 1C9.5 1 1 9.5 1 20c0 7.8 4.7 14.6 11.6 17.6-.2-1.5-.4-3.8.1-5.4l2.8-11.7s-.7-1.4-.7-3.5c0-3.3 1.9-5.7 4.3-5.7 2 0 3 1.5 3 3.3 0 2-1.3 5-2 7.8-.6 2.3 1.2 4.2 3.5 4.2 4.2 0 7.4-4.4 7.4-10.8 0-5.7-4.1-9.6-9.9-9.6-6.8 0-10.8 5.1-10.8 10.3 0 2 .8 4.2 1.9 5.4.2.2.2.5.1.7l-.7 3c-.1.5-.4.6-.8.4-3-1.4-4.9-5.9-4.9-9.5C5.5 7.3 11.4 1 21 1c8.5 0 15 6 15 14.1 0 8.4-5.3 15.1-12.6 15.1-2.5 0-4.8-1.3-5.6-2.8l-1.5 5.7c-.5 2.1-2 4.7-3 6.3C14.2 39.5 15.6 40 20 40 30.5 40 39 31.5 39 21c0-10.5-8.5-19-19-19z" />
          </svg>
        </div>
      </Link>

      {/* Search */}
      <div className="flex-1">
        <SearchBar />
      </div>

      {/* Right icons (mobile all-in-top) */}
      <div className="flex items-center gap-0.5">
        {user ? (
          <>
            {/* Nav shortcuts */}
            <Link href="/" className="p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Home">
              <Home className="w-4.5 h-4.5" />
            </Link>
            <Link href="/explore" className="p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Explore">
              <Compass className="w-4.5 h-4.5" />
            </Link>
            <Link href="/trending" className="p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Trending">
              <Flame className="w-4.5 h-4.5" />
            </Link>
            <Link href="/create" className="p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Create">
              <Plus className="w-4.5 h-4.5" />
            </Link>
            <Link href="/notifications" className="relative p-2 rounded-full hover:bg-secondary transition-colors" aria-label="Notifications">
              <Bell className="w-4.5 h-4.5" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-3.5 bg-primary rounded-full text-white text-[9px] font-black flex items-center justify-center px-0.5">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>

            {/* Avatar dropdown */}
            <div className="relative ml-0.5" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1 p-0.5 rounded-full"
              >
                <Avatar src={user.profileImage} alt={user.username} size="xs" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] w-52 bg-card border border-border rounded-2xl shadow-2xl py-2 animate-slide-down z-50">
                  <div className="px-4 py-2.5 border-b border-border">
                    <p className="font-bold text-sm flex items-center gap-1">
                      {user.displayName || user.username}
                      {user.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  {[
                    { href: `/${user.username}`, icon: User, label: 'Profile' },
                    { href: '/dashboard', icon: Flame, label: 'Creator Dashboard' },
                    { href: '/monetization', icon: DollarSign, label: 'Monetization' },
                    { href: '/tip/history', icon: Gift, label: 'Tip History' },
                    { href: '/safety', icon: Shield, label: 'Safety & Privacy' },
                    { href: '/settings', icon: Settings, label: 'Settings' },
                    ...(user.role === 'admin' ? [{ href: '/admin', icon: Shield, label: '⚡ Admin Panel' }] : []),
                  ].map(({ href, icon: Icon, label }) => (
                    <Link key={href} href={href} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors" onClick={() => setDropdownOpen(false)}>
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      {label}
                    </Link>
                  ))}
                  <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-accent transition-colors">
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  </button>
                  <div className="border-t border-border mt-1 pt-1">
                    <button onClick={() => { setDropdownOpen(false); logout(); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <LogOut className="w-4 h-4" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full hover:bg-secondary transition-colors">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/login" className="px-3 py-1.5 text-sm font-semibold rounded-full hover:bg-secondary transition-colors">Log in</Link>
            <Link href="/register" className="px-3 py-1.5 text-sm font-bold rounded-full bg-primary text-white hover:bg-primary/90 transition-colors">Sign up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
