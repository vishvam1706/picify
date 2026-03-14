'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import SearchBar from '@/components/search/SearchBar';
import { Home, Plus, Bell, MessageCircle, User, Moon, Sun, Settings, LogOut, BarChart3 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 glass z-40 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-4 flex-1">
        <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
          {/* Pinterest-style Logo */}
          <div className="w-8 h-8 bg-primary rounded-full text-white flex items-center justify-center font-bold text-xl">
            P
          </div>
        </Link>

        {user && (
          <div className="hidden md:flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" className="font-semibold text-foreground">Home</Button>
            </Link>
            <Link href="/explore">
              <Button variant="ghost" className="font-semibold text-foreground">Explore</Button>
            </Link>
            <Link href="/create">
              <Button variant="ghost" className="font-semibold text-foreground">Create</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="flex-1 max-w-2xl px-4 hidden sm:block">
        <SearchBar />
      </div>

      <div className="flex items-center justify-end gap-2 flex-1">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>

        {user ? (
          <>
            <Link href="/notifications" className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1 right-2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background"></span>
            </Link>

            <Link href="/messages" className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors hidden md:block">
              <MessageCircle className="w-6 h-6" />
            </Link>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="ml-2 hover:opacity-80 transition-opacity"
              >
                <Avatar src={user.profileImage} alt={user.displayName || user.username} size="sm" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-12 w-64 glass-card rounded-xl shadow-xl py-2 flex flex-col animate-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold">{user.displayName || user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>

                  <Link
                    href={`/${user.username}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <BarChart3 className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </Link>

                  <div className="border-t border-border my-1"></div>

                  <button
                    onClick={() => { setDropdownOpen(false); logout(); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" className="font-semibold">Log in</Button>
            </Link>
            <Link href="/register">
              <Button className="font-semibold rounded-full">Sign up</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
