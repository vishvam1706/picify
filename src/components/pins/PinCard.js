'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Download, ExternalLink, MoreHorizontal } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

export default function PinCard({ pin }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Pinterest style random height for masonry effect if original aspect ratio isn't known
  // (In a real app, we'd use the width/height from Cloudinary saved in the DB)
  const isTall = pin.orientation === 'portrait' || pin.title?.length > 30;

  return (
    <div 
      className="relative flex flex-col gap-2 mb-6 group cursor-zoom-in"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/pin/${pin._id}`} className="block relative w-full rounded-[1.5rem] overflow-hidden bg-muted transition-transform duration-300 group-hover:brightness-75 group-hover:scale-[0.99]" style={{ aspectRatio: isTall ? '3/4' : '4/3' }}>
        {pin.images?.[0]?.url ? (
          <Image 
            src={pin.images[0].url}
            alt={pin.title || 'Pin image'}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">No Image</div>
        )}

        {/* Hover Overlay Actions */}
        <div className={`absolute inset-0 p-4 flex flex-col justify-between transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex justify-between items-start">
            <button className="bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-5 rounded-full text-base transition-colors shadow-lg" onClick={(e) => { e.preventDefault(); /* Save Logic */ }}>
              Save
            </button>
          </div>

          <div className="flex justify-between items-end gap-2">
            {pin.sourceUrl && (
              <a 
                href={pin.sourceUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 bg-white/90 hover:bg-white text-black font-semibold py-2 px-3 rounded-full text-xs max-w-[140px] truncate transition-colors shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="truncate">{new URL(pin.sourceUrl).hostname}</span>
              </a>
            )}

            <div className="flex gap-2 ml-auto">
              <button 
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center transition-colors shadow-lg"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <Download className="w-4 h-4" />
              </button>
              <button 
                className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-black flex items-center justify-center transition-colors shadow-lg"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Pin Metadata */}
      {pin.title && (
        <div className="flex items-center justify-between px-1">
          <Link href={`/pin/${pin._id}`}>
            <h3 className="text-sm font-semibold truncate max-w-[200px] text-foreground hover:underline">
              {pin.title}
            </h3>
          </Link>
        </div>
      )}
      
      {pin.userId && (
        <div className="flex items-center gap-2 px-1 mt-0.5">
          <Link href={`/${pin.userId.username}`}>
            <Avatar src={pin.userId.profileImage} alt={pin.userId.username} size="sm" className="w-6 h-6" />
          </Link>
          <Link href={`/${pin.userId.username}`} className="text-xs text-muted-foreground hover:underline truncate">
            {pin.userId.displayName || pin.userId.username}
          </Link>
        </div>
      )}
    </div>
  );
}
