'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageCarousel({ images, altText }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/5] bg-secondary flex items-center justify-center rounded-3xl">
        <span className="text-muted-foreground">No imagery available</span>
      </div>
    );
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="relative w-full h-[70vh] max-h-[85vh] rounded-[2rem] overflow-hidden bg-black/5 flex items-center justify-center group">
      {/* Images container */}
      <div
        ref={containerRef}
        className="w-full h-full flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, idx) => (
          <div key={idx} className="relative w-full h-full flex-shrink-0 flex items-center justify-center">
            <Image
              src={img.url}
              alt={`${altText || 'Pin image'} - Slide ${idx + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority={idx === 0}
              unoptimized
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-black shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white text-black shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 rounded-full bg-black/20 backdrop-blur-md">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50'}`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
