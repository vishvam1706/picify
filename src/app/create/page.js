'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toaster';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import ImageUploader from '@/components/pins/ImageUploader';
import CollaboratorInput from '@/components/pins/CollaboratorInput';
import { Sparkles, Loader2 } from 'lucide-react';
import { useEffect } from 'react';


export default function CreatePinPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [files, setFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [tags, setTags] = useState('');
  const [boardId, setBoardId] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isDraft, setIsDraft] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  
  // Board states
  const [boards, setBoards] = useState([]);
  const [showNewBoardInput, setShowNewBoardInput] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [creatingBoard, setCreatingBoard] = useState(false);

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch user boards on load
  useEffect(() => {
    if (user) {
      fetch(`/api/boards?userId=${user._id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.docs) {
            setBoards(data.data.docs);
          }
        })
        .catch(() => { });
    }
  }, [user]);

  // Helper to get base64 from the first file for AI purposes
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // get raw b64
      reader.onerror = error => reject(error);
    });
  };

  const generateAIContent = async () => {
    if (files.length === 0) {
      toast({ title: 'Upload an image first', variant: 'destructive' });
      return;
    }

    setAiLoading(true);
    try {
      const base64 = await getBase64(files[0]);
      const mimeType = files[0].type;

      const payload = { imageBase64: base64, mimeType };

      // Make 3 simultaneous calls: Title, Description, Hashtags
      const [titleRes, descRes, tagsRes] = await Promise.all([
        fetch('/api/ai/title', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } }),
        fetch('/api/ai/description', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } }),
        fetch('/api/ai/hashtags', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
      ]);

      if (titleRes.ok) {
        const tData = await titleRes.json();
        setTitle(tData.data.title);
      }

      if (descRes.ok) {
        const dData = await descRes.json();
        setDescription(dData.data.description);
      }

      if (tagsRes.ok) {
        const hData = await tagsRes.json();
        if (hData.data?.hashtags?.length > 0) {
          setTags(prev => {
            const current = prev ? prev.split(',').map(t => t.trim()).filter(Boolean) : [];
            const newTags = [...new Set([...current, ...hData.data.hashtags])];
            return newTags.join(', ');
          });
        }
      }

      toast({ title: 'Magic applied!', description: 'Title and description generated.', variant: 'default' });
    } catch (err) {
      toast({ title: 'AI Generation Failed', description: 'Could not generate content.', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    setCreatingBoard(true);
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBoardName.trim(), isPublic: true })
      });
      const data = await res.json();
      if (res.ok) {
        setBoards(prev => [data.data, ...prev]);
        setBoardId(data.data._id);
        setShowNewBoardInput(false);
        setNewBoardName('');
        toast({ title: 'Board created!' });
      } else {
        toast({ title: 'Failed to create board', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error creating board', variant: 'destructive' });
    } finally {
      setCreatingBoard(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      toast({ title: 'Image required', description: 'Please upload at least one image.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    formData.append('title', title);
    formData.append('description', description);
    formData.append('sourceLink', sourceLink);
    formData.append('tags', tags);
    formData.append('isPublic', isPublic);
    formData.append('isDraft', isDraft);
    if (boardId) formData.append('boardId', boardId);
    if (collaborators.length > 0) formData.append('collaborators', collaborators.map(c => c._id).join(','));
    if (scheduledFor) formData.append('scheduledFor', scheduledFor);

    try {
      const res = await fetch('/api/pins', {
        method: 'POST',
        // DO NOT set content-type, browser sets multipart/form-data with boundaries automatically
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: 'Success!', description: 'Your Pin has been published.', variant: 'default' });
        router.push(`/pin/${data.data._id}`);
      } else {
        toast({ title: 'Upload failed', description: data.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Something went fundamentally wrong.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Create Pin</h1>
      </div>

      <div className="glass-card rounded-[2.5rem] p-6 md:p-10 shadow-lg border-none flex flex-col md:flex-row gap-8">

        {/* Left Side: Uploader */}
        <div className="w-full md:w-5/12">
          <ImageUploader onFilesSelected={setFiles} />
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-7/12 flex flex-col pt-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-8 h-full">

            <div className="flex flex-col gap-2 relative group">
              <label className="text-sm font-semibold text-muted-foreground ml-2">Title</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Add a title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-4xl font-bold bg-transparent border-b-2 border-border focus:border-primary outline-none py-2 pb-4 transition-colors placeholder:text-muted-foreground/50 placeholder:font-bold"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between bg-primary/5 rounded-2xl p-4 border border-primary/10">
              <div className="flex flex-col">
                <span className="font-semibold text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Magic
                </span>
                <span className="text-xs text-muted-foreground">Auto-generate title and description from your image</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={generateAIContent}
                disabled={aiLoading || files.length === 0}
                className="rounded-full shadow-sm"
              >
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground ml-2">Description</label>
              <textarea
                placeholder="Tell everyone what your Pin is about"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent border-b-2 border-border focus:border-primary outline-none py-2 resize-none min-h-[100px] transition-colors"
                maxLength={500}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground ml-2">Link (Optional)</label>
              <Input
                type="url"
                placeholder="Add a destination link"
                value={sourceLink}
                onChange={(e) => setSourceLink(e.target.value)}
                className="h-12 rounded-xl bg-secondary/50 border-none px-4"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-muted-foreground ml-2">Board</label>
              {!showNewBoardInput ? (
                <div className="flex gap-2">
                  <select
                    value={boardId}
                    onChange={(e) => setBoardId(e.target.value)}
                    className="flex-1 h-12 rounded-xl bg-secondary/50 border-none px-4 outline-none"
                  >
                    <option value="">Choose a Board</option>
                    {boards.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                  <Button type="button" variant="secondary" onClick={() => setShowNewBoardInput(true)} className="h-12 rounded-xl px-6">
                    New
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input 
                    type="text" 
                    placeholder="Board name" 
                    value={newBoardName} 
                    onChange={e => setNewBoardName(e.target.value)} 
                    className="flex-1 h-12 rounded-xl bg-secondary/50 border-none px-4"
                    autoFocus
                  />
                  <Button type="button" onClick={handleCreateBoard} disabled={creatingBoard || !newBoardName.trim()} className="h-12 rounded-xl px-4">
                    {creatingBoard ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowNewBoardInput(false)} className="h-12 px-4">
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground ml-2">Tags (comma separated)</label>
              <Input
                type="text"
                placeholder="e.g. nature, photography, art"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="h-12 rounded-xl bg-secondary/50 border-none px-4"
              />
            </div>

            <CollaboratorInput 
              collaborators={collaborators} 
              setCollaborators={setCollaborators} 
            />

            <div className="flex flex-col gap-4 bg-secondary/20 p-4 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="w-4 h-4" />
                <span className="text-sm font-medium">Public</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isDraft} onChange={e => setIsDraft(e.target.checked)} className="w-4 h-4" />
                <span className="text-sm font-medium">Save as Draft</span>
              </label>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-muted-foreground">Schedule Date (Optional)</label>
                <Input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  className="h-12 rounded-xl bg-secondary/50 border-none px-4"
                />
              </div>
            </div>

            <div className="mt-auto pt-8 flex justify-end gap-4 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                className="rounded-full font-semibold"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-full font-semibold px-8"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {loading ? (scheduledFor ? 'Scheduling...' : 'Publishing...') : (scheduledFor ? 'Schedule' : 'Publish')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
