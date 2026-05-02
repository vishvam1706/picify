'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Heart, Download, ExternalLink, BadgeCheck, ShieldAlert } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';

// Direct redirect — no hook, no router, no dependencies
function requireLogin(user) {
  if (!user) {
    window.location.href = '/login';
    return true; // blocked
  }
  return false;
}

export default function PinCard({ pin }) {
  const { user } = useAuth();
  const [hovered, setHovered] = useState(false);
  const [saved, setSaved] = useState(pin.isSaved || false);
  const [saving, setSaving] = useState(false);
  const [liked, setLiked] = useState(pin.isLiked || false);
  const [liking, setLiking] = useState(false);
  const [likesCount, setLikesCount] = useState(pin.likesCount || 0);
  const [nsfwRevealed, setNsfwRevealed] = useState(false);

  const isOwner = user && pin.userId && (pin.userId._id || pin.userId) === user._id;
  const showNsfwBlur = pin.isNSFW && !nsfwRevealed && !isOwner;

  const img = pin.images?.[0];
  const imgUrl = img?.url;
  const aspectRatio = img?.width && img?.height
    ? img.width / img.height
    : pin.orientation === 'landscape' ? 1.5
    : pin.orientation === 'square' ? 1
    : 0.67;

  const sourceHostname = (() => {
    try { return new URL(pin.sourceLink).hostname.replace('www.', ''); } catch { return null; }
  })();

  const handleSave = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (requireLogin(user)) return;
    if (saving) return;
    setSaving(true);
    try {
      const method = saved ? 'DELETE' : 'POST';
      const res = await fetch(`/api/pins/${pin._id}/save`, { method });
      if (res.ok) setSaved(s => !s);
    } catch {}
    finally { setSaving(false); }
  };

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (requireLogin(user)) return;
    if (liking) return;
    setLiking(true);
    const wasLiked = liked;
    setLiked(!liked);
    setLikesCount(c => wasLiked ? c - 1 : c + 1);
    try {
      await fetch(`/api/pins/${pin._id}/like`, { method: wasLiked ? 'DELETE' : 'POST' });
    } catch {
      setLiked(wasLiked);
      setLikesCount(c => wasLiked ? c + 1 : c - 1);
    }
    finally { setLiking(false); }
  };

  return (
    <div
      className="pin-card group mb-3"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image area — relative container */}
      <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio }}>

        {/* Clickable image → goes to pin page */}
        <Link href={`/pin/${pin._id}`} className="block w-full h-full">
          {imgUrl ? (
            <div className="relative w-full h-full bg-muted">
              <Image
                src={imgUrl}
                alt={pin.title || 'Pin'}
                fill
                className={`object-contain transition-all duration-300 ${showNsfwBlur ? 'blur-xl scale-110' : ''}`}
                sizes="(max-width: 640px) 50vw,(max-width: 1024px) 33vw, 22vw"
              />
            </div>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
          <div className="pin-overlay" />
        </Link>

        {/* NSFW overlay — click to reveal */}
        {showNsfwBlur && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setNsfwRevealed(true); }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-black/40 backdrop-blur-sm rounded-2xl"
          >
            <ShieldAlert className="w-8 h-8 text-white drop-shadow" />
            <span className="text-white font-bold text-sm drop-shadow">Sensitive Content</span>
            <span className="text-white/70 text-xs">Tap to reveal</span>
          </button>
        )}

        {/* Action buttons — SIBLINGS of Link, positioned absolute, z-20 */}
        <div
          className="pin-action absolute top-2.5 inset-x-2.5 flex items-start justify-between"
          style={{ zIndex: 20 }}
        >
          {/* Save */}
          <button
            type="button"
            onPointerUp={handleSave}
            disabled={saving}
            style={{ background: saved ? '#111' : '#e60023', color: '#fff' }}
            className="font-bold py-1.5 px-3.5 rounded-full text-sm shadow-lg hover:opacity-90 transition-all active:scale-95"
          >
            {saved ? '✓ Saved' : 'Save'}
          </button>

          <div className="flex gap-1.5">
            {/* Like */}
            <button
              type="button"
              onPointerUp={handleLike}
              disabled={liking}
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90"
              style={{ background: liked ? '#e60023' : 'rgba(255,255,255,0.92)', color: liked ? '#fff' : '#111', zIndex: 20 }}
              title="Like"
            >
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
            </button>

            {/* Download */}
            <a
              href={imgUrl}
              download
              onPointerUp={e => e.stopPropagation()}
              className="w-8 h-8 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg hover:bg-white transition-all"
              title="Download"
              style={{ zIndex: 20 }}
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Source link */}
        {sourceHostname && (
          <div className="pin-action absolute bottom-2.5 left-2.5 right-2.5" style={{ zIndex: 20 }}>
            <a
              href={pin.sourceLink}
              target="_blank"
              rel="noreferrer"
              onPointerUp={e => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 bg-white/90 text-black text-xs font-semibold py-1.5 px-3 rounded-full shadow-lg max-w-[180px] hover:bg-white transition-colors"
            >
              <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{sourceHostname}</span>
            </a>
          </div>
        )}
      </div>

      {/* Metadata below image */}
      <div className="px-1 pt-2 pb-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          {pin.isSponsored && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded-md shrink-0">
              Sponsored
            </span>
          )}
          {pin.title && (
            <Link href={`/pin/${pin._id}`} className="min-w-0">
              <p className="text-sm font-semibold leading-snug truncate hover:text-primary transition-colors">
                {pin.title}
              </p>
            </Link>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          {pin.userId && (
            <Link href={`/${pin.userId.username}`} className="flex items-center gap-1.5 group/a min-w-0">
              <Avatar src={pin.userId.profileImage} alt={pin.userId.username} size="xs" />
              <span className="text-xs text-muted-foreground group-hover/a:text-foreground transition-colors truncate flex items-center gap-0.5">
                {pin.userId.displayName || pin.userId.username}
                {pin.userId.isVerified && <BadgeCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />}
              </span>
            </Link>
          )}
          {likesCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0 ml-1">
              <Heart className={`w-3 h-3 ${liked ? 'fill-primary text-primary' : ''}`} />
              <span className="text-xs">{likesCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
