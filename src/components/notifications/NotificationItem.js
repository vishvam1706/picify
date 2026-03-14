'use client';

import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import { Heart, MessageCircle, UserPlus, Bookmark, Bell } from 'lucide-react';

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const iconMap = {
  like: { Icon: Heart, color: 'text-red-500 bg-red-100 dark:bg-red-950' },
  comment: { Icon: MessageCircle, color: 'text-blue-500 bg-blue-100 dark:bg-blue-950' },
  follow: { Icon: UserPlus, color: 'text-green-500 bg-green-100 dark:bg-green-950' },
  save: { Icon: Bookmark, color: 'text-purple-500 bg-purple-100 dark:bg-purple-950' },
  default: { Icon: Bell, color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-950' },
};

export default function NotificationItem({ notification, onMarkRead }) {
  const { Icon, color } = iconMap[notification.type] || iconMap.default;
  const isUnread = !notification.isRead;

  const handleClick = async () => {
    if (isUnread) {
      try {
        await fetch(`/api/notifications/${notification._id}`, { method: 'PATCH' });
        onMarkRead?.(notification._id);
      } catch { /* silent */ }
    }
  };

  const getLinkHref = () => {
    if (notification.pinId) return `/pin/${notification.pinId._id || notification.pinId}`;
    if (notification.actorId?.username) return `/${notification.actorId.username}`;
    return '#';
  };

  return (
    <Link
      href={getLinkHref()}
      onClick={handleClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-accent/60 ${isUnread ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
    >
      {/* Actor Avatar with type icon overlay */}
      <div className="relative flex-shrink-0">
        <Avatar
          src={notification.actorId?.profileImage}
          alt={notification.actorId?.username || 'User'}
          size="md"
        />
        <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${color}`}>
          <Icon className="w-2.5 h-2.5" />
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground leading-snug">
          <span className="font-semibold">{notification.actorId?.displayName || notification.actorId?.username}</span>{' '}
          <span className="text-muted-foreground">{notification.message}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(notification.createdAt)}</p>
      </div>

      {/* Unread dot */}
      {isUnread && (
        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" aria-label="Unread" />
      )}

      {/* Pin thumbnail */}
      {notification.pinId?.images?.[0] && (
        <img
          src={notification.pinId.images[0]}
          alt="Pin"
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
        />
      )}
    </Link>
  );
}
