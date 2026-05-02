'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toaster';
import { Button } from '@/components/ui/Button';
import { CalendarClock, Clock, Eye, EyeOff, Loader2, Plus, Trash2, ImageIcon, Calendar } from 'lucide-react';

function ScheduledPinCard({ pin, onDelete }) {
  const { toast } = useToast();
  const thumb = pin.images?.[0]?.url;
  const scheduledDate = new Date(pin.scheduledFor);
  const isPast = scheduledDate < new Date();

  const handleDelete = async () => {
    if (!confirm('Delete this scheduled pin?')) return;
    try {
      const res = await fetch(`/api/pins/${pin._id}`, { method: 'DELETE' });
      if (res.ok) { toast({ title: 'Pin deleted' }); onDelete(pin._id); }
      else toast({ title: 'Failed to delete', variant: 'destructive' });
    } catch { toast({ title: 'Failed to delete', variant: 'destructive' }); }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all group">
      <div className="relative aspect-video bg-muted overflow-hidden">
        {thumb ? (
          <img src={thumb} alt={pin.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${isPast ? 'bg-destructive text-white' : 'bg-primary text-white'}`}>
          {isPast ? 'Missed' : 'Scheduled'}
        </div>
        {!pin.isPublic && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold bg-black/70 text-white flex items-center gap-1">
            <EyeOff className="w-3 h-3" /> Private
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-bold text-sm mb-1 truncate">{pin.title}</p>
        {pin.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{pin.description}</p>}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className={isPast ? 'text-destructive' : ''}>
              {scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span>at {scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <button
            onClick={handleDelete}
            className="w-7 h-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {pin.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {pin.tags.slice(0, 3).map(t => (
              <span key={t} className="px-2 py-0.5 bg-secondary rounded-full text-xs text-muted-foreground">#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ScheduledPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduled = useCallback(async () => {
    try {
      const res = await fetch('/api/pins/scheduled?limit=50');
      const data = await res.json();
      if (res.ok) setPins(data.data?.docs || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    // Only creators can schedule
    if (user && !user.isCreator && user.role !== 'admin') {
      router.push('/settings');
      return;
    }
    fetchScheduled();
  }, [user, authLoading, router, fetchScheduled]);

  const handleDelete = (id) => setPins(prev => prev.filter(p => p._id !== id));

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Scheduled Posts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your upcoming pin schedule</p>
          </div>
        </div>
        <Link href="/create">
          <Button className="rounded-full gap-2">
            <Plus className="w-4 h-4" /> Schedule New Pin
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : pins.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mb-4">
            <CalendarClock className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h2 className="text-xl font-bold mb-2">No scheduled posts</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm">
            Schedule pins as a Creator to auto-publish at the perfect time.
          </p>
          <Link href="/create">
            <Button className="rounded-full gap-2"><Plus className="w-4 h-4" />Create & Schedule</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{pins.length} post{pins.length !== 1 ? 's' : ''} scheduled</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pins.map(pin => (
              <ScheduledPinCard key={pin._id} pin={pin} onDelete={handleDelete} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
