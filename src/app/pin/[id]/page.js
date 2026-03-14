'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toaster';
import { Button } from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import ImageCarousel from '@/components/pins/ImageCarousel';
import CommentThread from '@/components/pins/CommentThread';
import LikeButton from '@/components/pins/LikeButton';
import SaveButton from '@/components/pins/SaveButton';
import FollowButton from '@/components/users/FollowButton';
import { Upload, MoreHorizontal, ChevronLeft, Loader2, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

export default function PinDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [pin, setPin] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: pin?.title || 'Pin', url });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: 'Link copied!', description: 'Pin link copied to clipboard.' });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link copied!', description: 'Pin link copied to clipboard.' });
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchPin() {
      try {
        // Track view concurrently
        fetch(`/api/pins/${id}/view`, { method: 'POST' }).catch(() => {});
        
        const res = await fetch(`/api/pins/${id}`);
        const data = await res.json();
        
        if (res.ok && isMounted) {
          setPin(data.data);
        } else if (isMounted) {
          toast({ title: 'Error', description: 'Pin not found', variant: 'destructive' });
          router.push('/');
        }
      } catch (err) {
        if (isMounted) {
          toast({ title: 'Error', description: 'Failed to load pin', variant: 'destructive' });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (id) fetchPin();
    
    return () => { isMounted = false; };
  }, [id, user, router, toast]);



  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!pin) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <button 
        onClick={() => router.back()} 
        className="mb-6 flex items-center justify-center w-12 h-12 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      {/* Main Glassmorphic Container Wrapper */}
      <div className="glass-card rounded-[2.5rem] p-0 md:p-2 overflow-hidden shadow-2xl flex flex-col md:flex-row w-full bg-white dark:bg-zinc-900 border-none">
        
        {/* Left Side: Image/Carousel block */}
        <div className="w-full md:w-1/2 p-2">
          <ImageCarousel images={pin.images} altText={pin.title} />
        </div>

        {/* Right Side: Meta Data, Action Bar & Comments */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col max-h-[85vh] overflow-y-auto hide-scrollbar">
          
          {/* Top Action Bar */}
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur z-10 py-2">
            <div className="flex gap-1">
              <LikeButton pinId={id} initialLiked={pin.isLiked} initialCount={pin.likesCount} />
              <button onClick={handleShare} title="Share" className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <Upload className="w-6 h-6" />
              </button>
              <button onClick={handleCopyLink} title="Copy link" className="w-12 h-12 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                <LinkIcon className="w-6 h-6" />
              </button>
            </div>

            <SaveButton pinId={id} initialSaved={pin.isSaved} size="lg" />
          </div>

          {/* Source Link */}
          {pin.sourceUrl && (() => {
            try {
              return (
                <a href={pin.sourceUrl} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline text-foreground mb-4">
                  {new URL(pin.sourceUrl).hostname}
                </a>
              );
            } catch {
              return (
                <a href={pin.sourceUrl} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline text-foreground mb-4">
                  {pin.sourceUrl}
                </a>
              );
            }
          })()}

          {/* Title & Description */}
          <h1 className="text-3xl font-bold tracking-tight mb-4">{pin.title}</h1>
          <p className="text-base leading-relaxed text-muted-foreground mb-8">
            {pin.description}
          </p>

          {/* User Author Block */}
          {pin.userId && (
            <div className="flex items-center justify-between mb-8 bg-secondary/50 rounded-2xl p-4">
              <Link href={`/${pin.userId.username}`} className="flex items-center gap-3">
                <Avatar src={pin.userId.profileImage} alt={pin.userId.username} size="lg" />
                <div>
                  <h3 className="font-semibold text-lg">{pin.userId.displayName || pin.userId.username}</h3>
                  <p className="text-sm text-muted-foreground">{pin.userId.followersCount || 0} followers</p>
                </div>
              </Link>
              <FollowButton targetUserId={pin.userId._id} initialFollowing={pin.userId.isFollowing} />
            </div>
          )}

          {/* Tags */}
          {pin.tags && pin.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {pin.tags.map(tag => (
                <Link key={tag} href={`/search?q=${tag}`} className="bg-secondary hover:bg-secondary/70 text-secondary-foreground px-4 py-2 text-sm rounded-full font-medium transition-colors">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Comments Section */}
          <div className="mt-auto border-t border-border pt-6">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Comments {pin.commentsCount > 0 && <span className="text-muted-foreground font-normal">({pin.commentsCount})</span>}
            </h2>
            <CommentThread pinId={id} />
          </div>

        </div>
      </div>
    </div>
  );
}
