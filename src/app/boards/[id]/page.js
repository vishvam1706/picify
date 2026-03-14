'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import MasonryGrid from '@/components/pins/MasonryGrid';
import { Loader2, Plus, Share2, MoreHorizontal, ChevronLeft } from 'lucide-react';

export default function BoardDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [board, setBoard] = useState(null);
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchBoard() {
      try {
        const [boardRes, pinsRes] = await Promise.all([
          fetch(`/api/boards/${id}`),
          fetch(`/api/boards/${id}/pins?limit=50`)
        ]);

        const boardData = await boardRes.json();
        const pinsData = await pinsRes.json();

        if (boardRes.ok && isMounted) {
          setBoard(boardData.data);
          setPins(pinsData.data || []);
        } else if (isMounted) {
          router.push('/404');
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (id) fetchBoard();
    return () => { isMounted = false; };
  }, [id, router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!board) return null;

  const isOwner = user && board.userId?._id === user._id;

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <button 
        onClick={() => router.back()} 
        className="absolute top-20 left-6 flex items-center justify-center w-12 h-12 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-10"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <div className="flex flex-col items-center max-w-2xl mx-auto mb-10 pt-4">
        <h1 className="text-4xl font-bold text-center mb-4">{board.name}</h1>
        {board.description && (
          <p className="text-center text-foreground leading-relaxed mb-6">
            {board.description}
          </p>
        )}
        
        <div className="flex items-center gap-2 mb-8">
          {board.userId && (
            <Avatar src={board.userId.profileImage} alt={board.userId.username} size="sm" className="mr-2" />
          )}
          {board.collaborators?.map(collab => (
            <Avatar key={collab.user._id} src={collab.user.profileImage} alt={collab.user.username} size="sm" className="-ml-4 border-2 border-background" />
          ))}
          {isOwner && (
            <button className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 -ml-2 border-2 border-background z-10">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center justify-between w-full max-w-md">
          <p className="text-muted-foreground font-medium">{board.pinsCount || pins.length} Pins</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="secondary" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full">
        <MasonryGrid pins={pins} />
      </div>

      {isOwner && (
        <div className="fixed bottom-8 right-8 z-40">
          <Button size="lg" className="rounded-full shadow-2xl w-14 h-14 p-0 flex items-center justify-center bg-primary hover:bg-primary/90 text-white hover:scale-105 transition-transform" onClick={() => router.push('/create')}>
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
