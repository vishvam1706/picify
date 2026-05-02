'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Avatar from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Loader2, Bell, Heart, MessageCircle, UserPlus, Bookmark, Check, Trash2 } from 'lucide-react';

const TYPE_CONFIG = {
  like: { icon: Heart, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
  comment: { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  follow: { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
  pin_saved: { icon: Bookmark, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  mention: { icon: MessageCircle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
};

function NotifIcon({ type }) {
  const cfg = TYPE_CONFIG[type] || { icon: Bell, color: 'text-muted-foreground', bg: 'bg-muted' };
  const Icon = cfg.icon;
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
      <Icon className={`w-4 h-4 ${cfg.color}`} />
    </div>
  );
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetch('/api/notifications?limit=50')
      .then(r => r.json())
      .then(d => { if (d.success) setNotifications(d.data.docs || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  const markAllRead = async () => {
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = async () => {
    if (!confirm('Clear all notifications?')) return;
    await fetch('/api/notifications', { method: 'DELETE' });
    setNotifications([]);
  };

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="secondary" className="rounded-full text-sm" onClick={markAllRead}>
              <Check className="w-3.5 h-3.5 mr-1.5" /> Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="ghost" className="rounded-full text-sm text-muted-foreground" onClick={clearAll}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-muted-foreground">
          <Bell className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-bold text-foreground">All caught up!</p>
          <p className="text-sm mt-1">No notifications yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {notifications.map(notif => (
            <div
              key={notif._id}
              className={`flex items-start gap-3 p-4 rounded-2xl transition-colors ${
                !notif.isRead ? 'bg-primary/5 border border-primary/10' : 'hover:bg-secondary/50'
              }`}
            >
              {notif.actorId ? (
                <Link href={`/${notif.actorId.username}`}>
                  <Avatar src={notif.actorId.profileImage} alt={notif.actorId.username} size="md" />
                </Link>
              ) : (
                <NotifIcon type={notif.type} />
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed">
                  {notif.actorId && (
                    <Link href={`/${notif.actorId.username}`} className="font-bold hover:underline">
                      {notif.actorId.displayName || notif.actorId.username}{' '}
                    </Link>
                  )}
                  {notif.message?.replace(notif.actorId?.displayName + ' ', '').replace(notif.actorId?.username + ' ', '') || notif.message}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {!notif.isRead && (
                <div className="w-2 h-2 bg-primary rounded-full mt-1.5 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
