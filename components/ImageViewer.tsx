import React, { useState, useRef, useEffect } from 'react';
import { TFunction } from '../types';
import BackIcon from './icons/BackIcon';
import GlobeIcon from './icons/GlobeIcon';

interface Props {
  images: string[];
  initialIndex: number;
  title: string;
  t: TFunction;
  indexFlags: boolean[];
  onBack: () => void;
}

const ImageViewer: React.FC<Props> = ({ images, initialIndex, title, indexFlags, onBack }) => {
  const [current, setCurrent] = useState(initialIndex);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  // Scroll to initial index on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = initialIndex * el.clientWidth;
  }, []);

  // Track current page via scroll
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== current) setCurrent(idx);
  };

  const goTo = (idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' });
    setCurrent(idx);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col" style={{ direction: 'ltr' }}>

      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 pb-6"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
        }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
        >
          <div className="w-5 h-5"><BackIcon /></div>
        </button>

        <div className="flex-1 text-center">
          <p className="text-white font-bold text-sm truncate">{title}</p>
          {images.length > 1 && (
            <p className="text-white/50 text-[10px]">{current + 1} / {images.length}</p>
          )}
        </div>

        <div className="w-9 h-9 flex items-center justify-center">
          {indexFlags[current] && (
            <button
              onClick={() => window.open(images[current], '_blank')}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <div className="w-4 h-4"><GlobeIcon /></div>
            </button>
          )}
        </div>
      </div>

      {/* Images — native CSS scroll snap */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 flex overflow-x-auto overflow-y-hidden"
        style={{
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          scrollbarWidth: 'none',
        }}
      >
        {images.map((img, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-full h-full flex items-center justify-center bg-black"
            style={{ scrollSnapAlign: 'center', scrollSnapStop: 'always' }}
          >
            <img
              src={img}
              alt={title}
              className="max-w-full max-h-full object-contain"
              style={{ userSelect: 'none', WebkitUserDrag: 'none' } as any}
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Dots */}
      {images.length > 1 && (
        <div
          className="flex justify-center gap-2 py-4"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
        >
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all ${
                i === current ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/35'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageViewer;
