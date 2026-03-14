'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toaster';
import Avatar from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Heart, MoreHorizontal, Send, Loader2, Reply, Trash2 } from 'lucide-react';
import Link from 'next/link';

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function CommentItem({ comment, pinId, onDelete }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likesCount || 0);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = user && (user._id === comment.userId?._id || user._id === comment.userId);

  const toggleLike = async () => {
    if (!user) return;
    const prev = liked;
    setLiked(!prev);
    setLikeCount(c => prev ? c - 1 : c + 1);
    try {
      await fetch(`/api/comments/${comment._id}/like`, { method: prev ? 'DELETE' : 'POST' });
    } catch {
      setLiked(prev);
      setLikeCount(c => prev ? c + 1 : c - 1);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/comments/${comment._id}`, { method: 'DELETE' });
      if (res.ok) {
        onDelete(comment._id);
        toast({ title: 'Comment deleted' });
      }
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  return (
    <div className="flex gap-3 group">
      <Link href={`/${comment.userId?.username || '#'}`} className="flex-shrink-0">
        <Avatar src={comment.userId?.profileImage} alt={comment.userId?.username} size="sm" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-secondary/60 rounded-2xl px-4 py-3 inline-block max-w-full">
          <Link href={`/${comment.userId?.username || '#'}`} className="font-semibold text-sm text-foreground hover:underline">
            {comment.userId?.displayName || comment.userId?.username}
          </Link>
          <p className="text-sm text-foreground mt-0.5 break-words">{comment.text}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 pl-2">
          <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 text-xs font-semibold transition-colors hover:text-primary ${liked ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-primary' : ''}`} />
            {likeCount > 0 && likeCount}
          </button>
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute left-0 top-5 bg-card border border-border rounded-xl shadow-lg py-1 z-20 min-w-[120px]">
                  <button
                    onClick={() => { setShowMenu(false); handleDelete(); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentThread({ pinId }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`/api/pins/${pinId}/comments?limit=50`);
        const data = await res.json();
        if (mounted && res.ok) setComments(data.data?.docs || []);
      } catch { /* silent */ } finally {
        if (mounted) setLoading(false);
      }
    }
    if (pinId) load();
    return () => { mounted = false; };
  }, [pinId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/pins/${pinId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments(prev => [data.data, ...prev]);
        setNewComment('');
      } else {
        toast({ title: data.error || 'Failed to post comment', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to post comment', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (commentId) => {
    setComments(prev => prev.filter(c => c._id !== commentId));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Comment Input */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-3 items-start">
          <Avatar src={user.profileImage} alt={user.username} size="sm" className="flex-shrink-0 mt-1" />
          <div className="flex-1 flex gap-2">
            <input
              ref={inputRef}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-secondary/60 rounded-full px-4 py-2.5 text-sm outline-none ring-2 ring-transparent focus:ring-primary/30 transition-all placeholder:text-muted-foreground"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex-shrink-0"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          <Link href="/login" className="font-semibold text-primary hover:underline">Log in</Link> to comment
        </p>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
      ) : (
        <div className="flex flex-col gap-4 max-h-64 overflow-y-auto pr-1 hide-scrollbar">
          {comments.map(c => (
            <CommentItem key={c._id} comment={c} pinId={pinId} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
