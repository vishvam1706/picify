'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function BoardCard({ board }) {
  // A board card usually shows up to 3-4 images of its pins in a collage
  const coverImages = board.coverImages || [];
  
  return (
    <div className="flex flex-col gap-2 group mb-6">
      <Link href={`/boards/${board._id}`} className="block relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-secondary">
        <div className="flex w-full h-full p-1 gap-1">
          {/* Main left image (50%) */}
          <div className="relative w-1/2 h-full rounded-2xl overflow-hidden bg-muted">
            {coverImages[0] && (
              <Image src={coverImages[0]} alt="Board Cover" fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, 25vw" />
            )}
          </div>
          
          {/* Right side stacked images */}
          <div className="flex flex-col w-1/2 h-full gap-1">
            <div className="relative w-full h-1/2 rounded-2xl overflow-hidden bg-muted">
              {coverImages[1] && (
                <Image src={coverImages[1]} alt="Board Cover" fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, 25vw" />
              )}
            </div>
            <div className="relative w-full h-1/2 rounded-2xl overflow-hidden bg-muted">
              {coverImages[2] && (
                <Image src={coverImages[2]} alt="Board Cover" fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, 25vw" />
              )}
            </div>
          </div>
        </div>
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        </div>
      </Link>
      
      <div className="px-2">
        <Link href={`/boards/${board._id}`} className="hover:underline">
          <h3 className="font-bold text-lg text-foreground truncate">{board.name}</h3>
        </Link>
        <p className="text-sm text-muted-foreground">{board.pinsCount || 0} Pins • {board.isSecret ? 'Secret' : 'Public'}</p>
      </div>
    </div>
  );
}
