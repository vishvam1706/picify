'use client';

import { useState, useEffect } from 'react';
import { X, Megaphone, AlertTriangle, CheckCircle2, Wrench, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const TYPE_CONFIG = {
  info:        { bg: 'bg-blue-500/10 border-blue-500/20',   text: 'text-blue-400',  icon: Megaphone,      label: 'Announcement' },
  warning:     { bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400', icon: AlertTriangle,  label: 'Warning' },
  success:     { bg: 'bg-green-500/10 border-green-500/20', text: 'text-green-400', icon: CheckCircle2,   label: 'Update' },
  maintenance: { bg: 'bg-red-500/10 border-red-500/20',     text: 'text-red-400',   icon: Wrench,         label: 'Maintenance' },
};

const DISMISSED_KEY = 'picify_dismissed_announcements';

function getDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]'); } catch { return []; }
}
function dismiss(id) {
  try {
    const existing = getDismissed();
    if (!existing.includes(id)) localStorage.setItem(DISMISSED_KEY, JSON.stringify([...existing, id]));
  } catch {}
}

export default function AnnouncementBanner() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const role = user?.role || 'all';
    fetch(`/api/announcements?role=${role}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          const dismissed = getDismissed();
          setAnnouncements(d.data.filter(a => !dismissed.includes(a._id)));
        }
      })
      .catch(() => {});
  }, [user]);

  if (!mounted || announcements.length === 0) return null;

  const ann = announcements[index];
  const cfg = TYPE_CONFIG[ann.type] || TYPE_CONFIG.info;
  const Icon = cfg.icon;
  const hasMultiple = announcements.length > 1;

  const handleDismiss = () => {
    dismiss(ann._id);
    const next = announcements.filter(a => a._id !== ann._id);
    setAnnouncements(next);
    setIndex(i => Math.min(i, next.length - 1));
  };

  const prev = () => setIndex(i => (i - 1 + announcements.length) % announcements.length);
  const next = () => setIndex(i => (i + 1) % announcements.length);

  return (
    <div className={`w-full border-b ${cfg.bg} backdrop-blur-sm px-4 py-2.5 flex items-center gap-3 z-40`}>
      {/* Icon + type label */}
      <div className={`flex items-center gap-1.5 shrink-0 ${cfg.text}`}>
        <Icon className="w-4 h-4" />
        {ann.isPinned && <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">📌</span>}
        <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">{cfg.label}</span>
      </div>

      {/* Divider */}
      <div className={`w-px h-4 ${cfg.text} opacity-30 shrink-0`} style={{ background: 'currentColor' }} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{ann.title}</p>
        <p className="text-xs text-muted-foreground truncate">{ann.body}</p>
      </div>

      {/* Pagination (multiple announcements) */}
      {hasMultiple && (
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={prev} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <span className="text-[11px] text-muted-foreground font-medium">{index + 1}/{announcements.length}</span>
          <button onClick={next} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
        title="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
