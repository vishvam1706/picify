'use client';

import Masonry from 'react-masonry-css';
import PinCard from './PinCard';

const BREAKPOINTS = {
  default: 5,
  1536: 5,
  1280: 4,
  1024: 3,
  768: 3,
  640: 2,
  480: 2,
};

function PinSkeleton() {
  const heights = [280, 220, 340, 190, 300, 260, 380, 210];
  return (
    <div className="flex w-auto -ml-3">
      {[0, 1, 2, 3, 4].map(col => (
        <div key={col} className="pl-3 flex-1">
          {heights.slice(col % 4, col % 4 + 3).map((h, i) => (
            <div
              key={i}
              className="skeleton mb-3 rounded-2xl"
              style={{ height: h }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function MasonryGrid({ pins, loading }) {
  if (loading) return <PinSkeleton />;

  if (!pins || pins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground animate-fade-in">
        <div className="text-6xl mb-4">📌</div>
        <p className="text-xl font-bold text-foreground mb-2">No pins yet</p>
        <p className="text-sm">Start exploring to find beautiful things.</p>
      </div>
    );
  }

  return (
    <Masonry
      breakpointCols={BREAKPOINTS}
      className="flex w-auto -ml-3"
      columnClassName="pl-3 bg-clip-padding"
    >
      {pins.map(pin => (
        <PinCard key={pin._id} pin={pin} />
      ))}
    </Masonry>
  );
}
