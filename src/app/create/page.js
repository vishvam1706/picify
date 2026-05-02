'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toaster';
import { Button } from '@/components/ui/Button';
import ImageUploader from '@/components/pins/ImageUploader';
import CollaboratorInput from '@/components/pins/CollaboratorInput';
import MentionTextarea from '@/components/pins/MentionTextarea';
import {
  Sparkles, Loader2, X, Link2, Tag, Globe, Lock,
  BookmarkPlus, Clock, DollarSign, ChevronDown, Plus, ArrowLeft, ShieldAlert, AlertTriangle, Trash2
} from 'lucide-react';

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

function FieldLabel({ children, optional }) {
  return (
    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
      {children}
      {optional && <span className="normal-case font-normal tracking-normal text-muted-foreground/60">— optional</span>}
    </label>
  );
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <div className="flex items-center justify-between gap-4">
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

export default function CreatePinPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [tags, setTags] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tagList, setTagList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [boardId, setBoardId] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isDraft, setIsDraft] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [isSponsored, setIsSponsored] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [boards, setBoards] = useState([]);
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [allCategories, setAllCategories] = useState(DEFAULT_CATEGORIES);
  const [nsfwModal, setNsfwModal] = useState(null); // { message } shown after publish rejection

  useEffect(() => {
    if (user) {
      // Only fetch THIS user's boards
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
        // else keep DEFAULT_CATEGORIES
      })
      .catch(() => {});
  }, [user]);

  const toggleCategory = (v) =>
    setCategories(p => p.includes(v) ? p.filter(c => c !== v) : [...p, v]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tagList.includes(t)) setTagList(p => [...p, t]);
    setTagInput('');
  };

  const removeTag = (t) => setTagList(p => p.filter(x => x !== t));

  const getBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => res(r.result.split(',')[1]);
    r.onerror = rej;
  });

  const generateAI = async () => {
    if (!files.length) { toast({ title: 'Upload an image first', variant: 'destructive' }); return; }
    setAiLoading(true);
    try {
      const base64 = await getBase64(files[0]);
      const res = await fetch('/api/ai/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: files[0].type }),
      });
      const data = await res.json();
      if (!res.ok) { toast({ title: data.error || 'AI failed', variant: 'destructive' }); return; }
      if (data.data?.title) setTitle(data.data.title);
      if (data.data?.description) setDescription(data.data.description);
      if (data.data?.tags?.length) setTagList(p => [...new Set([...p, ...data.data.tags])]);
      toast({ title: '✨ AI Magic applied!' });
    } catch (e) {
      toast({ title: 'AI failed', description: e.message, variant: 'destructive' });
    } finally { setAiLoading(false); }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    setCreatingBoard(true);
    try {
      const res = await fetch('/api/boards', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBoardName.trim(), isPublic: true }),
      });
      const d = await res.json();
      if (res.ok) {
        setBoards(p => [d.data, ...p]);
        setBoardId(d.data._id);
        setShowNewBoard(false);
        setNewBoardName('');
        toast({ title: 'Board created!' });
      }
    } catch {} finally { setCreatingBoard(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!files.length) errs.image = 'Please upload an image';
    if (!title.trim()) errs.title = 'Title is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    const fd = new FormData();
    files.forEach(f => fd.append('images', f));
    fd.append('title', title);
    fd.append('description', description);
    fd.append('sourceLink', sourceLink);
    fd.append('tags', [...tagList, ...tags.split(',').map(t => t.trim()).filter(Boolean)].join(','));
    fd.append('categories', categories.join(','));
    fd.append('isPublic', isPublic);
    fd.append('isDraft', isDraft);
    if (boardId) fd.append('boardId', boardId);
    if (collaborators.length) fd.append('collaborators', collaborators.map(c => c._id).join(','));
    if (scheduledFor) fd.append('scheduledFor', scheduledFor);
    if (affiliateLink) fd.append('affiliateLink', affiliateLink);
    fd.append('isSponsored', isSponsored);

    try {
      const res = await fetch('/api/pins', { method: 'POST', body: fd });
      const d = await res.json();
      if (res.ok) {
        toast({ title: scheduledFor ? '⏰ Pin Scheduled!' : '🎉 Pin Published!' });
        router.push(`/pin/${d.data._id}`);
      } else if (res.status === 422) {
        // Post-publish NSFW rejection — pin was deleted by server
        setNsfwModal({ message: d.error });
      } else {
        toast({ title: 'Failed', description: d.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* ── NSFW Warning Modal (post-publish) ── */}
      {nsfwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-destructive/30 rounded-3xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-5">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 mx-auto">
              <ShieldAlert className="w-9 h-9 text-destructive" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black mb-2">Pin Removed</h2>
              <p className="text-sm text-muted-foreground">{nsfwModal.message}</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col gap-2 text-sm">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>A warning notification has been sent to your account.</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Repeated violations may result in account restrictions.</span>
              </div>
            </div>
            <button
              onClick={() => { setNsfwModal(null); setFiles([]); }}
              className="w-full py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors text-sm"
            >
              OK, I Understand
            </button>
          </div>
        </div>
      )}
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-lg font-black tracking-tight">Create Pin</h1>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" size="sm" className="rounded-full px-5"
              onClick={() => { setIsDraft(true); document.getElementById('pin-form').requestSubmit(); }}
              disabled={loading}>
              Save Draft
            </Button>
            <Button form="pin-form" type="submit" size="sm"
              className="rounded-full px-6 font-bold shadow-lg shadow-primary/20"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {loading ? 'Publishing...' : scheduledFor ? 'Schedule' : 'Publish'}
            </Button>
          </div>
        </div>
      </div>

      <form id="pin-form" onSubmit={handleSubmit}>
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">

          {/* ── Left: Image Upload ── */}
          <div className="w-full lg:w-[420px] flex-shrink-0">
            <div className="sticky top-24">
              <ImageUploader onFilesSelected={(f) => { setFiles(f); setErrors(p => ({ ...p, image: undefined })); }} />
              {errors.image && (
                <p className="text-sm text-destructive text-center mt-3 font-semibold">{errors.image}</p>
              )}

              {/* AI Magic */}
              <div className={`mt-4 rounded-2xl p-4 border transition-all ${files.length > 0 ? 'bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20' : 'bg-secondary/30 border-border/40'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm flex items-center gap-2 ${aiLoading ? 'animate-pulse' : ''}`}>
                      <Sparkles className={`w-4 h-4 text-primary ${aiLoading ? 'animate-spin' : ''}`} />
                      AI Magic
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {aiLoading ? 'Gemini is reading your image...' : 'Auto-fill title, description & tags'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={generateAI}
                    disabled={aiLoading || !files.length}
                    className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed ${files.length > 0 ? 'bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/25' : 'bg-secondary text-muted-foreground'}`}
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    {aiLoading ? 'Generating' : 'Generate'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Form ── */}
          <div className="flex-1 flex flex-col gap-6 min-w-0">

            {/* Title */}
            <div>
              <FieldLabel>Title</FieldLabel>
              <input
                type="text"
                placeholder="Give your pin a catchy title..."
                value={title}
                onChange={e => { setTitle(e.target.value); setErrors(p => ({ ...p, title: undefined })); }}
                maxLength={200}
                className={`w-full text-3xl font-black bg-transparent border-b-2 outline-none py-2 pb-3 transition-colors placeholder:text-muted-foreground/30 placeholder:font-black ${errors.title ? 'border-destructive' : 'border-border focus:border-primary'}`}
              />
              <div className="flex justify-between mt-1">
                {errors.title ? <p className="text-xs text-destructive font-semibold">{errors.title}</p> : <span />}
                <span className="text-xs text-muted-foreground">{title.length}/200</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <FieldLabel optional>Description <span className="normal-case font-normal tracking-normal text-muted-foreground/60 text-xs">— type @ to mention</span></FieldLabel>
              <MentionTextarea
                value={description}
                onChange={val => setDescription(val)}
                placeholder="Tell the story behind your pin..."
                className="w-full bg-secondary/40 rounded-2xl p-4 text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all min-h-[110px] resize-none"
              />
              <p className={`text-xs mt-1.5 text-right ${description.length > 1900 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {description.length}/2000
              </p>
            </div>

            {/* Categories */}
            <div>
              <FieldLabel optional>Category</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {allCategories.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                      categories.includes(cat.value)
                        ? 'bg-primary text-white border-primary shadow-sm shadow-primary/25'
                        : 'bg-secondary/60 text-secondary-foreground border-border/50 hover:border-primary/40 hover:bg-secondary'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <FieldLabel optional>Tags</FieldLabel>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                    placeholder="Type a tag and press Enter..."
                    className="w-full h-10 bg-secondary/40 rounded-xl pl-8 pr-3 text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all"
                  />
                </div>
                <button type="button" onClick={addTag} className="h-10 w-10 rounded-xl bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {tagList.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tagList.map(t => (
                    <span key={t} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-3 py-1 rounded-full font-medium">
                      #{t}
                      <button type="button" onClick={() => removeTag(t)} className="hover:opacity-60 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Board */}
            <div>
              <FieldLabel optional>Save to Board</FieldLabel>
              {!showNewBoard ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <BookmarkPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <select
                      value={boardId}
                      onChange={e => setBoardId(e.target.value)}
                      className="w-full h-11 bg-secondary/40 rounded-xl pl-10 pr-4 text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all appearance-none"
                    >
                      <option value="">
                        {boards.length === 0 ? 'No boards yet — create one →' : 'Choose a board...'}
                      </option>
                      {boards.map(b => (
                        <option key={b._id} value={b._id}>
                          {b.name}{!b.isPublic ? ' 🔒' : ''}{b.pinsCount > 0 ? ` (${b.pinsCount})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="button" onClick={() => setShowNewBoard(true)}
                    className="h-11 px-4 rounded-xl bg-secondary/60 hover:bg-secondary text-sm font-semibold transition-colors flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> New
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={newBoardName}
                    onChange={e => setNewBoardName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateBoard())}
                    placeholder="Board name..."
                    className="flex-1 h-11 bg-secondary/40 rounded-xl px-4 text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all"
                  />
                  <button type="button" onClick={handleCreateBoard} disabled={creatingBoard || !newBoardName.trim()}
                    className="h-11 px-4 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50 transition-all">
                    {creatingBoard ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                  </button>
                  <button type="button" onClick={() => setShowNewBoard(false)}
                    className="h-11 w-11 rounded-xl bg-secondary/60 flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Source link */}
            <div>
              <FieldLabel optional>Source Link</FieldLabel>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="url"
                  value={sourceLink}
                  onChange={e => setSourceLink(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-11 bg-secondary/40 rounded-xl pl-10 pr-4 text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="border border-border/50 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(p => !p)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/30 transition-colors"
              >
                <span className="text-sm font-bold">Advanced Settings</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>

              {showAdvanced && (
                <div className="px-5 pb-5 flex flex-col gap-5 border-t border-border/50 pt-5">
                  {/* Visibility toggles */}
                  <Toggle checked={isPublic} onChange={setIsPublic} label="Public Pin" desc="Anyone can discover and save this pin" />
                  <Toggle checked={isDraft} onChange={setIsDraft} label="Save as Draft" desc="Not published until you manually publish" />

                  {/* Schedule */}
                  <div>
                    <FieldLabel optional>Schedule Publish</FieldLabel>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="datetime-local"
                        value={scheduledFor}
                        onChange={e => setScheduledFor(e.target.value)}
                        className="w-full h-11 bg-secondary/40 rounded-xl pl-10 pr-4 text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Collaborators */}
                  <CollaboratorInput collaborators={collaborators} setCollaborators={setCollaborators} />

                  {/* Creator Monetization */}
                  {user?.isCreator && (
                    <div className="rounded-2xl bg-gradient-to-br from-primary/8 to-purple-500/8 border border-primary/15 p-4 flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-primary">Creator Monetization</span>
                      </div>
                      <div>
                        <FieldLabel optional>Affiliate Link</FieldLabel>
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="url"
                            value={affiliateLink}
                            onChange={e => setAffiliateLink(e.target.value)}
                            placeholder="https://amzn.to/..."
                            className="w-full h-11 bg-background/60 rounded-xl pl-10 pr-4 text-sm outline-none ring-2 ring-transparent focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </div>
                      <Toggle checked={isSponsored} onChange={setIsSponsored} label="Sponsored Post" desc="Marks this pin with a sponsored badge" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Visibility pill summary */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${isPublic ? 'bg-green-500/10 text-green-500' : 'bg-secondary text-muted-foreground'}`}>
                {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {isPublic ? 'Public' : 'Private'}
              </span>
              {isDraft && <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-500"><BookmarkPlus className="w-3 h-3" />Draft</span>}
              {scheduledFor && <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-500"><Clock className="w-3 h-3" />Scheduled</span>}
              {categories.length > 0 && <span className="text-xs text-muted-foreground">{categories.length} categor{categories.length > 1 ? 'ies' : 'y'}</span>}
              {tagList.length > 0 && <span className="text-xs text-muted-foreground">{tagList.length} tag{tagList.length > 1 ? 's' : ''}</span>}
            </div>

          </div>
        </div>
      </form>
    </div>
  );
}
