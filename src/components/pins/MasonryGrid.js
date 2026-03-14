'use client';

import Masonry from 'react-masonry-css';
import PinCard from './PinCard';

export default function MasonryGrid({ pins }) {
  const breakpointColumnsObj = {
    default: 5,
    1536: 4, // 2xl
    1280: 4, // xl
    1024: 3, // lg
    768: 2,  // md
    640: 2   // sm
  };

  if (!pins || pins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">No pins found.</p>
        <p className="text-sm">Try exploring different ideas.</p>
      </div>
    );
  }

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex w-auto -ml-4"
      columnClassName="pl-4 bg-clip-padding"
    >
      {pins.map(pin => (
        <PinCard key={pin._id} pin={pin} />
      ))}
    </Masonry>
  );
}
