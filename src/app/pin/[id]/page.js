'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toaster';
import Avatar from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import {
  Heart, BookmarkPlus, BookmarkCheck, Share2, Download,
  ChevronLeft, ChevronRight, ExternalLink, MoreHorizontal,
  Loader2, Send, Trash2, Flag, Copy, Check, Pencil, Gift, BadgeCheck
} from 'lucide-react';
import CollaboratorInput from '@/components/pins/CollaboratorInput';

function ReportPinModal({ pinId, onClose }) {
  const { toast } = useToast();
  const REASONS = ['spam', 'inappropriate', 'copyright', 'harassment', 'other'];
  const [reason, setReason] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: pinId, entityType: 'pin', reason, description: desc }),
      });
      const d = await res.json();
      toast({ title: res.ok ? '✅ Report submitted — thank you!' : (d.error || 'Failed to report') });
      if (res.ok) onClose();
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-[2rem] w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-black mb-1">Report Pin</h2>
        <p className="text-sm text-muted-foreground mb-5">Help us understand what's wrong with this pin.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {REASONS.map(r => (
              <button type="button" key={r} onClick={() => setReason(r)}
                className={`px-3 py-2 rounded-xl text-sm font-semibold capitalize border-2 transition-all ${reason === r ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'}`}>
                {r}
              </button>
            ))}
          </div>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Additional details (optional)..."
            className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none min-h-[70px]" maxLength={500} />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full bg-secondary text-sm font-semibold hover:bg-secondary/70">Cancel</button>
            <button type="submit" disabled={!reason || submitting}
              className="flex-1 py-2.5 rounded-full bg-primary text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


const TIP_AMOUNTS = [
  { label: '$1', cents: 100 },
  { label: '$2', cents: 200 },
  { label: '$5', cents: 500 },
  { label: '$10', cents: 1000 },
];

function TipModal({ pin, creatorTipsEnabled, onClose }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState(500); // default $5
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const effectiveAmount = customAmount ? Math.round(parseFloat(customAmount) * 100) : selectedAmount;

  const handleTip = async () => {
    if (!user) { toast({ title: 'Sign in to send a tip' }); return; }
    if (!effectiveAmount || effectiveAmount < 100) {
      toast({ title: 'Minimum tip is $1.00', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/monetization/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: pin.userId._id, pinId: pin._id, amount: effectiveAmount }),
      });
      const data = await res.json();
      if (res.ok && data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      } else {
        toast({ title: data.error || 'Failed to start tip payment', variant: 'destructive' });
        setLoading(false);
      }
    } catch {
      toast({ title: 'Error processing tip', variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-[2rem] w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black">Send a Tip</h2>
            <p className="text-xs text-muted-foreground">Support {pin.userId?.displayName || pin.userId?.username}</p>
          </div>
        </div>

        {/* Creator hasn't enabled tips yet */}
        {!creatorTipsEnabled ? (
          <div className="mt-5 text-center py-4">
            <p className="text-4xl mb-3">💸</p>
            <p className="font-bold mb-1">Tips not enabled yet</p>
            <p className="text-sm text-muted-foreground">{pin.userId?.displayName || pin.userId?.username} hasn't connected a payment account yet. Check back later!</p>
            <button onClick={onClose} className="mt-5 w-full py-3 rounded-full bg-secondary text-sm font-semibold hover:bg-secondary/70">Got it</button>
          </div>
        ) : !user ? (
          <div className="mt-5 text-center py-4">
            <p className="font-bold mb-1">Sign in to send a tip</p>
            <p className="text-sm text-muted-foreground mb-4">You need an account to tip creators.</p>
            <a href="/login" className="block w-full py-3 rounded-full bg-primary text-white text-sm font-bold text-center">Sign In</a>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mt-3 mb-5">Creator keeps 90%. Picify takes a 10% platform fee.</p>
            {/* Preset amounts */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {TIP_AMOUNTS.map(a => (
                <button
                  key={a.cents}
                  onClick={() => { setSelectedAmount(a.cents); setCustomAmount(''); }}
                  className={`py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                    selectedAmount === a.cents && !customAmount
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            {/* Custom amount */}
            <div className="relative mb-5">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
              <input
                type="number" min="1" step="0.01" placeholder="Custom amount"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
                className="w-full bg-secondary/50 rounded-2xl pl-8 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-full bg-secondary text-sm font-semibold hover:bg-secondary/70">Cancel</button>
              <button
                onClick={handleTip}
                disabled={loading || effectiveAmount < 100}
                className="flex-1 py-3 rounded-full bg-primary text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
                {loading ? 'Processing...' : `Tip $${(effectiveAmount / 100).toFixed(2)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ModalToggle({ checked, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-primary' : 'bg-secondary'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

const DEFAULT_CATEGORIES = [
  { label: '🎨 Art', value: 'art' },
  { label: '🏠 Home Decor', value: 'home-decor' },
  { label: '👗 Fashion', value: 'fashion' },
  { label: '🍕 Food', value: 'food' },
  { label: '✈️ Travel', value: 'travel' },
  { label: '💪 Fitness', value: 'fitness' },
  { label: '📸 Photography', value: 'photography' },
  { label: '🌿 Nature', value: 'nature' },
  { label: '💻 Tech', value: 'tech' },
  { label: '📚 Education', value: 'education' },
  { label: '🎵 Music', value: 'music' },
  { label: '🐾 Animals', value: 'animals' },
];

function EditPinModal({ pin, onClose, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [boards, setBoards] = useState([]);
  const [allCategories, setAllCategories] = useState(DEFAULT_CATEGORIES);

  const [formData, setFormData] = useState({
    title: pin.title || '',
    description: pin.description || '',
    sourceLink: pin.sourceLink || '',
    tags: (pin.tags || []).join(', '),
    boardId: pin.boardId?._id || pin.boardId || '',
    categories: pin.categories || [],
    isPublic: pin.isPublic !== false,
    isDraft: pin.isDraft || false,
    collaborators: pin.collaborators || [],
  });

  useEffect(() => {
    if (user) {
      fetch('/api/boards/mine')
        .then(r => r.json())
        .then(d => { if (d.success && Array.isArray(d.data)) setBoards(d.data); })
        .catch(() => {});
    }
    fetch('/api/categories?type=category')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data) && d.data.length > 0) {
          setAllCategories(d.data.map(c => ({ label: `${c.emoji || ''} ${c.name}`.trim(), value: c.slug })));
        }
      }).catch(() => {});
  }, [user]);

  const toggleCategory = (catVal) => {
    setFormData(prev => {
      if (prev.categories.includes(catVal)) {
        return { ...prev, categories: prev.categories.filter(c => c !== catVal) };
      }
      if (prev.categories.length >= 3) {
        toast({ title: 'You can select up to 3 categories', variant: 'destructive' });
        return prev;
      }
      return { ...prev, categories: [...prev.categories, catVal] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean);

      const res = await fetch(`/api/pins/${pin._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          sourceLink: formData.sourceLink.trim(),
          tags: tagsArray,
          boardId: formData.boardId || undefined,
          categories: formData.categories,
          isPublic: formData.isPublic,
          isDraft: formData.isDraft,
          collaborators: formData.collaborators.map(c => c._id || c)
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Pin updated successfully!' });
        onUpdated(data.data);
        onClose();
      } else {
        toast({ title: data.error || 'Failed to update pin', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'An error occurred', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card w-full max-w-lg rounded-[2rem] shadow-2xl p-6 md:p-8 animate-scale-in max-h-[90vh] overflow-y-auto custom-scroll" onClick={e => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-6">Edit Pin</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold mb-1.5 ml-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/20 transition-all font-medium"
              placeholder="Add a title"
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 ml-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/20 transition-all min-h-[100px] resize-none"
              placeholder="Tell everyone what your Pin is about"
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5 ml-1">Destination Link</label>
              <input
                type="url"
                value={formData.sourceLink}
                onChange={e => setFormData({ ...formData, sourceLink: e.target.value })}
                className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/20 transition-all"
                placeholder="Add a destination link"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5 ml-1">Board</label>
              <select
                value={formData.boardId}
                onChange={e => setFormData({ ...formData, boardId: e.target.value })}
                className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/20 transition-all appearance-none font-medium text-foreground cursor-pointer"
              >
                <option value="">No Board (Profile only)</option>
                {boards.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 ml-1">Tags (comma separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              className="w-full bg-secondary/50 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 border border-transparent focus:border-primary/20 transition-all"
              placeholder="e.g. aesthetic, nature, wallpaper"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 ml-1">Categories (Max 3)</label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(c => {
                const isSelected = formData.categories.includes(c.value);
                return (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => toggleCategory(c.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border-2 ${
                      isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-secondary/30 rounded-2xl p-4 space-y-4 border border-border/40">
            <ModalToggle
              checked={formData.isPublic}
              onChange={v => setFormData({ ...formData, isPublic: v })}
              label="Publicly visible"
              desc="Allow anyone to see this pin"
            />
            <div className="h-px bg-border/50" />
            <ModalToggle
              checked={formData.isDraft}
              onChange={v => setFormData({ ...formData, isDraft: v })}
              label="Save as Draft"
              desc="Hide this pin from your profile for now"
            />
            <div className="h-px bg-border/50" />
            <CollaboratorInput
              collaborators={formData.collaborators}
              setCollaborators={v => setFormData({ ...formData, collaborators: v })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-2 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={onClose} className="rounded-full px-6 font-semibold">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()} className="rounded-full px-8 font-semibold shadow-lg hover:shadow-primary/25 transition-all">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SaveModal({ pinId, onClose, onSaved }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    fetch('/api/boards/mine')
      .then(r => r.json())
      .then(d => { if (d.success && Array.isArray(d.data)) setBoards(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const saveToBoard = async (boardId) => {
    setSaving(boardId);
    try {
      const res = await fetch(`/api/pins/${pinId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId }),
      });
      if (res.ok) {
        toast({ title: 'Saved to board!' });
        onSaved(true);
        onClose();
      }
    } catch { toast({ title: 'Failed to save', variant: 'destructive' }); }
    finally { setSaving(null); }
  };

  const createBoard = async () => {
    if (!newBoardName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBoardName.trim(), isPublic: true }),
      });
      const d = await res.json();
      if (res.ok) {
        setBoards(prev => [d.data, ...prev]);
        setNewBoardName('');
        await saveToBoard(d.data._id);
      }
    } catch { toast({ title: 'Failed to create board', variant: 'destructive' }); }
    finally { setCreating(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">Save to board</h3>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scroll mb-4">
            {boards.map(b => (
              <button
                key={b._id}
                onClick={() => saveToBoard(b._id)}
                disabled={saving === b._id}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-colors text-left w-full"
              >
                <div className="w-12 h-12 bg-secondary rounded-xl overflow-hidden flex-shrink-0">
                  {b.coverImage && <Image src={b.coverImage} alt={b.name} width={48} height={48} className="object-cover w-full h-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.pinsCount || 0} pins</p>
                </div>
                {saving === b._id && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
            ))}
            {boards.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No boards yet</p>}
          </div>
        )}

        <div className="flex gap-2 border-t border-border pt-4">
          <input
            type="text"
            placeholder="Create new board..."
            value={newBoardName}
            onChange={e => setNewBoardName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createBoard()}
            className="flex-1 h-10 bg-secondary rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button onClick={createBoard} disabled={creating || !newBoardName.trim()} className="h-10 rounded-xl px-4 text-sm">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, pinId, onDelete, currentUserId }) {
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this comment?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/comments/${comment._id}`, { method: 'DELETE' });
      if (res.ok) onDelete(comment._id);
      else toast({ title: 'Failed to delete', variant: 'destructive' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setDeleting(false); }
  };

  const isOwner = currentUserId && comment.userId?._id === currentUserId;

  return (
    <div className="flex gap-3 group/comment">
      <Link href={`/${comment.userId?.username}`}>
        <Avatar src={comment.userId?.profileImage} alt={comment.userId?.username} size="sm" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="bg-secondary rounded-2xl px-4 py-3">
          <Link href={`/${comment.userId?.username}`} className="font-semibold text-sm hover:underline">
            {comment.userId?.displayName || comment.userId?.username}
          </Link>
          <p className="text-sm mt-1 leading-relaxed">{comment.text}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1 ml-2">
          {new Date(comment.createdAt).toLocaleDateString()}
        </p>
      </div>
      {isOwner && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-0 group-hover/comment:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}

export default function PinDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  // Show tip result toast when returning from Stripe
  useEffect(() => {
    if (!searchParams) return;
    const tipStatus = searchParams.get('tip');
    if (tipStatus === 'success') {
      toast({ title: '🎉 Tip sent! Thank you for supporting this creator.' });
      // Clean URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    } else if (tipStatus === 'cancelled') {
      toast({ title: 'Tip cancelled', variant: 'destructive' });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (tipStatus === 'error') {
      toast({ title: 'Something went wrong with the tip. Please try again.', variant: 'destructive' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [pin, setPin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [following, setFollowing] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [copied, setCopied] = useState(false);

  // Edit and Delete
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [pinCreatorTipsEnabled, setPinCreatorTipsEnabled] = useState(false);

  const isOwner = user && pin?.userId && (user._id === pin.userId._id || user.id === pin.userId._id);

  // Check if pin creator has tips enabled
  useEffect(() => {
    if (pin?.userId?._id && user && !isOwner) {
      fetch(`/api/users/${pin.userId._id}/tips-status`)
        .then(r => r.json())
        .then(d => { if (d.success) setPinCreatorTipsEnabled(d.data.tipsEnabled); })
        .catch(() => {});
    }
  }, [pin?.userId?._id, user, isOwner]);

  useEffect(() => {
    const fetchPin = async () => {
      try {
        const res = await fetch(`/api/pins/${id}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setPin(data.data);
          setLiked(data.data.isLiked || false);
          setSaved(data.data.isSaved || false);
          setLikesCount(data.data.likesCount || 0);
          setFollowing(data.data.userId?.isFollowing || false);
        } else {
          router.push('/');
        }
      } catch { router.push('/'); }
      finally { setLoading(false); }
    };
    if (id) fetchPin();
  }, [id, router]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/pins/${id}/comments?limit=30`)
      .then(r => r.json())
      .then(d => { if (d.success) setComments(d.data.docs || []); })
      .catch(() => {})
      .finally(() => setCommentsLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!user) { window.location.href = '/login'; return; }
    const method = liked ? 'DELETE' : 'POST';
    setLiked(!liked);
    setLikesCount(c => liked ? c - 1 : c + 1);
    try {
      await fetch(`/api/pins/${id}/like`, { method });
    } catch {
      setLiked(liked);
      setLikesCount(c => liked ? c + 1 : c - 1);
    }
  };

  const handleQuickSave = async () => {
    if (!user) { window.location.href = '/login'; return; }
    if (saved) {
      try {
        await fetch(`/api/pins/${id}/save`, { method: 'DELETE' });
        setSaved(false);
        toast({ title: 'Removed from saved' });
      } catch { toast({ title: 'Failed', variant: 'destructive' }); }
    } else {
      setShowSaveModal(true);
    }
  };

  const handleFollow = async () => {
    if (!user) { window.location.href = '/login'; return; }
    if (!pin?.userId) return;
    const method = following ? 'DELETE' : 'POST';
    setFollowing(!following);
    try {
      await fetch(`/api/users/${pin.userId._id}/follow`, { method });
    } catch { setFollowing(following); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) { window.location.href = '/login'; return; }
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/pins/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments(prev => [data.data, ...prev]);
        setCommentText('');
        setPin(p => p ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p);
      } else {
        toast({ title: data.error || 'Failed to post comment', variant: 'destructive' });
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    finally { setSubmittingComment(false); }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this Pin? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pins/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Pin deleted successfully' });
        router.push(`/${user.username}`);
      } else {
        toast({ title: 'Failed to delete pin', variant: 'destructive' });
        setDeleting(false);
      }
    } catch {
      toast({ title: 'An error occurred', variant: 'destructive' });
      setDeleting(false);
    }
  };

  if (loading || deleting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!pin) return null;

  const images = pin.images || [];
  const currentImg = images[activeImg];
  const aspectRatio = currentImg?.width && currentImg?.height
    ? currentImg.width / currentImg.height
    : 2 / 3;

  return (
    <>
      {showEditModal && (
        <EditPinModal
          pin={pin}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updatedPin) => {
            setPin({ ...pin, ...updatedPin });
          }}
        />
      )}

      {showSaveModal && (
        <SaveModal
          pinId={pin._id}
          onClose={() => setShowSaveModal(false)}
          onSaved={setSaved}
        />
      )}

      {showTipModal && pin && (
        <TipModal
          pin={pin}
          creatorTipsEnabled={pinCreatorTipsEnabled}
          onClose={() => setShowTipModal(false)}
        />
      )}

      <div className="min-h-screen bg-background">
        {/* Back button */}
        <div className="max-w-screen-xl mx-auto px-4 pt-4">
          <button onClick={() => router.back()} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
        </div>

        <div className="max-w-screen-xl mx-auto px-4 pb-16">
          <div className="bg-card border border-border rounded-[2.5rem] shadow-xl overflow-hidden">
            <div className="flex flex-col lg:flex-row">

              {/* ── Left: Images ── */}
              <div className="bg-black flex-shrink-0 lg:w-[45%] xl:w-[50%] relative min-h-[300px] flex flex-col">
                {/* Main image */}
                <div className="relative flex-1 min-h-[300px]" style={{ aspectRatio: aspectRatio > 1 ? `${aspectRatio}` : undefined }}>
                  {currentImg?.url && (
                    <Image
                      src={currentImg.url}
                      alt={pin.title || 'Pin'}
                      fill
                      className="object-contain lg:object-cover"
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  )}

                  {/* Carousel nav */}
                  {images.length > 1 && (
                    <>
                      {activeImg > 0 && (
                        <button
                          onClick={() => setActiveImg(i => i - 1)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                      )}
                      {activeImg < images.length - 1 && (
                        <button
                          onClick={() => setActiveImg(i => i + 1)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      )}
                      {/* Dots */}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImg(i)}
                            className={`rounded-full transition-all ${i === activeImg ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/60'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto hide-scrollbar bg-black/80">
                    {images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${i === activeImg ? 'border-white' : 'border-transparent opacity-60 hover:opacity-90'}`}
                      >
                        <Image src={img.url} alt={`Thumbnail ${i + 1}`} width={56} height={56} className="object-cover w-full h-full" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Right: Details ── */}
              <div className="flex-1 flex flex-col p-6 md:p-8 overflow-y-auto custom-scroll max-h-screen">

                {/* Action bar */}
                <div className="flex items-center gap-2 mb-6">
                  <Button
                    onClick={handleLike}
                    variant="ghost"
                    className={`rounded-full gap-2 font-semibold ${liked ? 'text-primary' : ''}`}
                  >
                    <Heart className={`w-5 h-5 ${liked ? 'fill-primary' : ''}`} />
                    {likesCount > 0 && <span className="text-sm">{likesCount}</span>}
                  </Button>

                  <button
                    onClick={handleCopyLink}
                    className="p-2.5 rounded-full hover:bg-secondary transition-colors"
                    title="Copy link"
                  >
                    {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                  </button>

                  <a
                    href={currentImg?.url}
                    download={`${pin.title || 'pin'}.jpg`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-full hover:bg-secondary transition-colors"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </a>

                  <div className="ml-auto flex items-center gap-2 relative">
                    {/* Owner Menu */}
                    {isOwner && (
                      <div className="relative">
                        <button
                          onClick={() => setShowMenu(!showMenu)}
                          onBlur={() => setTimeout(() => setShowMenu(false), 200)}
                          className={`p-2.5 rounded-full transition-colors ${showMenu ? 'bg-secondary' : 'hover:bg-secondary'}`}
                          title="More options"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showMenu && (
                          <div className="absolute right-0 top-12 w-48 bg-card rounded-2xl shadow-xl overflow-hidden py-2 border border-border z-50 animate-in fade-in zoom-in duration-200">
                            <button
                              onMouseDown={(e) => { e.preventDefault(); setShowMenu(false); setShowEditModal(true); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-secondary transition-colors text-left"
                            >
                              <Pencil className="w-4 h-4 text-muted-foreground" /> Edit Pin
                            </button>
                            <button
                              onMouseDown={(e) => { e.preventDefault(); setShowMenu(false); handleDelete(); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-red-500/10 text-red-500 transition-colors text-left"
                            >
                              <Trash2 className="w-4 h-4" /> Delete Pin
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Report button for non-owners */}
                    {!isOwner && user && (
                      <button
                        onClick={() => setShowReportModal(true)}
                        className="p-2.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-red-500"
                        title="Report this pin"
                      >
                        <Flag className="w-5 h-5" />
                      </button>
                    )}

                    <Button
                      onClick={handleQuickSave}
                      className={`rounded-full font-bold px-6 ${saved ? 'bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black' : 'bg-primary text-white hover:bg-primary/90'}`}
                    >
                      {saved ? (
                        <><BookmarkCheck className="w-4 h-4 mr-2" /> Saved</>
                      ) : (
                        <><BookmarkPlus className="w-4 h-4 mr-2" /> Save</>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Report Modal */}
                {showReportModal && (
                  <ReportPinModal pinId={id} onClose={() => setShowReportModal(false)} />
                )}

                {/* Source link */}
                {pin.sourceLink && (
                  <a
                    href={pin.sourceLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
                    <span className="truncate underline underline-offset-2">
                      {(() => { try { return new URL(pin.sourceLink).hostname; } catch { return pin.sourceLink; } })()}
                    </span>
                  </a>
                )}

                {/* Title & Description */}
                <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3">
                  {pin.title || 'Untitled Pin'}
                </h1>

                {pin.description && (
                  <p className="text-muted-foreground leading-relaxed mb-5 text-sm">
                    {pin.description}
                  </p>
                )}

                {/* Affiliate Link Button */}
                {pin.affiliateLink && (
                  <a
                    href={pin.affiliateLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 mb-6 rounded-2xl bg-black text-white dark:bg-white dark:text-black font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Get it here
                  </a>
                )}

                {/* Tags */}
                {pin.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {pin.tags.map(tag => (
                      <Link
                        key={tag}
                        href={`/search?q=${tag}`}
                        className="tag-pill text-xs"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Color palette */}
                {pin.colorPalette?.length > 0 && (
                  <div className="flex gap-2 mb-6">
                    {pin.colorPalette.slice(0, 6).map((color, i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                )}

                {/* Author & Collaborators */}
                {pin.userId && (
                  <div className="flex flex-col gap-4 py-4 border-y border-border mb-6">
                    <div className="flex items-center gap-3">
                      <Link href={`/${pin.userId.username}`}>
                        <Avatar src={pin.userId.profileImage} alt={pin.userId.username} size="lg" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link href={`/${pin.userId.username}`} className="font-bold hover:underline truncate flex items-center gap-1 w-fit">
                          {pin.userId.displayName || pin.userId.username}
                          {pin.userId.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                        </Link>
                        {pin.userId.privacy?.showFollowers !== false && (
                          <p className="text-sm text-muted-foreground">
                            {pin.userId.followersCount?.toLocaleString() || 0} followers
                          </p>
                        )}
                      </div>
                      {/* Tip + Follow buttons — show for all non-owners incl. guests */}
                      {!isOwner && pin.userId && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            onClick={handleFollow}
                            variant={following ? 'secondary' : 'default'}
                            className="rounded-full font-semibold px-5"
                          >
                            {following ? 'Following' : 'Follow'}
                          </Button>
                          <Button
                            onClick={() => {
                              if (!user) { window.location.href = '/login'; return; }
                              setShowTipModal(true);
                            }}
                            variant="secondary"
                            className="rounded-full font-semibold px-4 gap-1.5 border border-primary/20 hover:border-primary/50 hover:text-primary transition-colors"
                            title="Send a tip to this creator"
                          >
                            <Gift className="w-4 h-4 text-primary" />
                            Tip
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Collaborators */}
                    {pin.collaborators?.length > 0 && (
                      <div className="bg-secondary/30 rounded-2xl p-3 border border-border/40 mt-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">Collaborators</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {pin.collaborators.map(collaborator => (
                            <Link key={collaborator._id} href={`/${collaborator.username}`} className="flex items-center gap-2 hover:bg-secondary p-1.5 rounded-xl transition-colors">
                              <Avatar src={collaborator.profileImage} alt={collaborator.username} size="sm" />
                              <div className="flex-1 min-w-0 flex items-center gap-1">
                                <span className="font-semibold text-sm truncate">{collaborator.displayName || collaborator.username}</span>
                                {collaborator.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Board info */}
                {pin.boardId && (
                  <Link
                    href={`/boards/${pin.boardId._id || pin.boardId}`}
                    className="flex items-center gap-2 mb-6 p-3 bg-secondary/50 rounded-2xl hover:bg-secondary transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-lg">📌</div>
                    <div>
                      <p className="text-xs text-muted-foreground">Saved to board</p>
                      <p className="text-sm font-semibold">{pin.boardId.name || 'Board'}</p>
                    </div>
                  </Link>
                )}

                {/* Comments */}
                <div>
                  <h2 className="font-bold text-base mb-4">
                    {pin.commentsCount > 0 ? `${pin.commentsCount} Comments` : 'Comments'}
                  </h2>

                  {/* Add comment */}
                  {user ? (
                    <form onSubmit={handleComment} className="flex gap-3 mb-6">
                      <Avatar src={user.profileImage} alt={user.username} size="sm" />
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          className="flex-1 bg-secondary rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <button
                          type="submit"
                          disabled={submittingComment || !commentText.trim()}
                          className="p-2.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          {submittingComment
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Send className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { window.location.href = '/login'; }}
                      className="w-full mb-6 flex items-center gap-3 py-3 px-4 bg-secondary/50 rounded-2xl hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <span className="text-sm text-muted-foreground flex-1 text-left">Add a comment...</span>
                      <span className="text-xs font-bold text-primary">Log in →</span>
                    </button>
                  )}

                  <div className="flex flex-col gap-4">
                    {commentsLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-4">No comments yet. Be the first!</p>
                    ) : (
                      comments.map(comment => (
                        <CommentItem
                          key={comment._id}
                          comment={comment}
                          pinId={id}
                          currentUserId={user?._id || user?.id}
                          onDelete={cid => setComments(prev => prev.filter(c => c._id !== cid))}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
