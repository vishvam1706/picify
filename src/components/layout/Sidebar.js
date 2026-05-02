'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Avatar from '@/components/ui/Avatar';
import {
  Home, Compass, Plus, Bell, BarChart3,
  Settings, LogOut, Moon, Sun, ChevronLeft, ChevronRight,
  History, Activity, CalendarClock, ShieldAlert, Flame, DollarSign, Shield, BadgeCheck, Gift
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { useState, useEffect, useRef } from 'react';

const BASE_NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/explore', icon: Compass, label: 'Explore' },
  { href: '/trending', icon: Flame, label: 'Trending' },
  { href: '/create', icon: Plus, label: 'Create' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { href: '/monetization', icon: DollarSign, label: 'Monetize' },
  { href: '/tip/history', icon: Gift, label: 'Tip History' },
  { href: '/safety', icon: Shield, label: 'Safety' },
  { href: '/activity', icon: Activity, label: 'Activity' },
  { href: '/watch-history', icon: History, label: 'Watch History' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [notifCount, setNotifCount] = useState(0);
  const { collapsed, setCollapsed } = useSidebar();

  useEffect(() => {
    if (!user) return;
    fetch('/api/notifications?unreadOnly=true&limit=1')
      .then(r => r.json())
      .then(d => { if (d.success) setNotifCount(d.data?.totalDocs || 0); })
      .catch(() => { });
  }, [user]);

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  if (!user) return null;
  // Don't render on admin pages — admin has its own sidebar
  if (pathname?.startsWith('/admin')) return null;

  return (
    <aside className={`hidden lg:flex flex-col fixed left-0 top-0 h-full z-40 bg-card border-r border-border/60 transition-all duration-300 shadow-sm ${collapsed ? 'w-[72px]' : 'w-[220px]'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-border/60 ${collapsed ? 'justify-center' : ''}`}>
        <Link href="/" aria-label="Picify">
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center flex-shrink-0 hover:bg-primary/90 transition-colors shadow-md">
            <svg viewBox="0 0 40 40" className="w-5 h-5" fill="white">
              <path d="M20 1C9.5 1 1 9.5 1 20c0 7.8 4.7 14.6 11.6 17.6-.2-1.5-.4-3.8.1-5.4l2.8-11.7s-.7-1.4-.7-3.5c0-3.3 1.9-5.7 4.3-5.7 2 0 3 1.5 3 3.3 0 2-1.3 5-2 7.8-.6 2.3 1.2 4.2 3.5 4.2 4.2 0 7.4-4.4 7.4-10.8 0-5.7-4.1-9.6-9.9-9.6-6.8 0-10.8 5.1-10.8 10.3 0 2 .8 4.2 1.9 5.4.2.2.2.5.1.7l-.7 3c-.1.5-.4.6-.8.4-3-1.4-4.9-5.9-4.9-9.5C5.5 7.3 11.4 1 21 1c8.5 0 15 6 15 14.1 0 8.4-5.3 15.1-12.6 15.1-2.5 0-4.8-1.3-5.6-2.8l-1.5 5.7c-.5 2.1-2 4.7-3 6.3C14.2 39.5 15.6 40 20 40 30.5 40 39 31.5 39 21c0-10.5-8.5-19-19-19z" />
            </svg>
          </div>
        </Link>
        {!collapsed && <span className="font-black text-xl tracking-tight">Picify</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
        {BASE_NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          const showBadge = href === '/notifications' && notifCount > 0;
          return (
            <Link key={href} href={href} title={collapsed ? label : undefined}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all group relative ${active
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                } ${collapsed ? 'justify-center' : ''}`}>
                <div className="relative flex-shrink-0">
                  <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.5 : 1.8} />
                  {showBadge && (
                    <span className="absolute -top-2 -right-2 min-w-[16px] h-4 bg-white text-primary text-[10px] font-black flex items-center justify-center px-0.5 rounded-full">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </div>
                {!collapsed && <span>{label}</span>}
              </div>
            </Link>
          );
        })}
        {user?.role === 'admin' && (() => {
          const active = isActive('/admin');
          return (
            <Link href="/admin" title={collapsed ? 'Admin Panel' : undefined}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all group relative ${active
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                } ${collapsed ? 'justify-center' : ''}`}>
                <div className="relative flex-shrink-0">
                  <ShieldAlert className="w-[18px] h-[18px]" strokeWidth={active ? 2.5 : 1.8} />
                </div>
                {!collapsed && <span>Admin Panel</span>}
              </div>
            </Link>
          );
        })()}
      </nav>

      {/* Bottom panel */}
      <div className="px-3 pb-4 flex flex-col gap-1 border-t border-border/60 pt-3">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? (theme === 'dark' ? 'Light mode' : 'Dark mode') : undefined}
        >
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px] flex-shrink-0" /> : <Moon className="w-[18px] h-[18px] flex-shrink-0" />}
          {!collapsed && <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
        </button>

        <Link href="/settings" title={collapsed ? 'Settings' : undefined}>
          <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all ${collapsed ? 'justify-center' : ''}`}>
            <Settings className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </div>
        </Link>

        <Link href={`/${user.username}`} title={collapsed ? `@${user.username}` : undefined}>
          <div className={`flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-secondary transition-all cursor-pointer ${collapsed ? 'justify-center' : ''}`}>
            <Avatar src={user.profileImage} alt={user.username} size="sm" className="flex-shrink-0" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate leading-tight flex items-center gap-1">
                  {user.displayName || user.username}
                  {user.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                </p>
                <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              </div>
            )}
          </div>
        </Link>

        <button
          onClick={logout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all w-full ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Log out' : undefined}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3.5 top-20 w-7 h-7 bg-card border border-border rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow z-50"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
