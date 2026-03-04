import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TFunction } from '../types';
import ClearIcon from './icons/ClearIcon';
import BackIcon from './icons/BackIcon';
import GlobeIcon from './icons/GlobeIcon';

interface ImageViewerProps {
  images: string[];
  initialIndex: number;
  title: string;
  onBack: () => void;
  t: TFunction;
  indexFlags?: boolean[];
}

const ImageViewer: React.FC<ImageViewerProps> = ({ images, initialIndex, title, onBack, t, indexFlags = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imgLoaded, setImgLoaded] = useState<boolean[]>(images.map(() => false));
  const scrollRef = useRef<HTMLDivElement>(null);

  // Zoom & pan state
  const [scale, setScale]   = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const lastTouchRef = useRef<{ x: number; y: number; dist: number }>({ x: 0, y: 0, dist: 0 });
  const isDragging   = useRef(false);

  // اسكرول فوري للـ initialIndex
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const go = () => {
      const w = el.clientWidth;
      if (w > 0) {
        el.scrollLeft = w * initialIndex;
      } else {
        requestAnimationFrame(go);
      }
    };
    go();
  }, [initialIndex]);

  // reset zoom لما تتبدل الصورة
  useEffect(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, [currentIndex]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || scale > 1) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const idx = Math.round(el.scrollLeft / w);
    if (idx !== currentIndex && idx >= 0 && idx < images.length) setCurrentIndex(idx);
  }, [currentIndex, images.length, scale]);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = scale > 1;
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 };
    } else if (e.touches.length === 2) {
      isDragging.current = false;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchRef.current = { ...lastTouchRef.current, dist };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (scale > 1 && e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0 };
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor   = dist / lastTouchRef.current.dist;
      const newScale = Math.max(1, Math.min(scale * factor, 5));
      setScale(newScale);
      lastTouchRef.current.dist = dist;
    }
  };

  const onTouchEnd = () => {
    isDragging.current = false;
    if (scale <= 1.1) { setScale(1); setOffset({ x: 0, y: 0 }); }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scale > 1) { setScale(1); setOffset({ x: 0, y: 0 }); }
    else setScale(2.5);
  };

  const markLoaded = (idx: number) => {
    setImgLoaded(prev => { const n = [...prev]; n[idx] = true; return n; });
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col" style={{ direction: 'ltr' }}>

      {/* ── هيدر ── */}
      <header className="absolute top-0 left-0 right-0 z-[10001] flex items-center gap-2 p-3 bg-gradient-to-b from-black/80 to-transparent pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <button onClick={onBack} className="p-2 text-white/90 bg-white/10 backdrop-blur-xl rounded-full active:scale-90 shadow-lg">
          <div className="w-6 h-6 transform rtl:rotate-180"><BackIcon /></div>
        </button>
        <div className="flex-grow min-w-0 text-center">
          <h2 className="text-white font-bold text-[10px] truncate drop-shadow-md">{title}</h2>
          <p className="text-white/60 text-[9px] font-black uppercase tracking-widest">{currentIndex + 1} / {images.length}</p>
        </div>
        <div className="flex gap-1.5">
          {indexFlags[currentIndex] && (
            <button
              onClick={e => { e.stopPropagation(); window.open(images[currentIndex], '_blank'); }}
              className="flex items-center gap-1 px-2.5 py-2 bg-primary backdrop-blur-xl rounded-full active:scale-90 shadow-lg text-white flex-shrink-0"
            >
              <div className="w-3.5 h-3.5 flex-shrink-0"><GlobeIcon /></div>
              <span className="text-[9px] font-black whitespace-nowrap">عرض الكامل</span>
            </button>
          )}
          <button onClick={onBack} className="p-2.5 text-white/90 bg-white/10 backdrop-blur-xl rounded-full active:scale-90 shadow-lg">
            <ClearIcon />
          </button>
        </div>
      </header>

      {/* ── الصور ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`flex-grow flex overflow-x-auto snap-x snap-mandatory no-scrollbar bg-black ${scale > 1 ? 'touch-none overflow-hidden' : 'touch-pan-x'}`}
        style={{ scrollBehavior: 'auto' }}
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center relative overflow-hidden"
            onDoubleClick={handleDoubleClick}
          >
            {/* Spinner لحد ما الصورة تتحمل */}
            {!imgLoaded[idx] && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="ps-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              </div>
            )}
            <img
              src={img}
              alt={`${title} ${idx}`}
              className="max-w-full max-h-full object-contain will-change-transform"
              style={{
                transform: idx === currentIndex
                  ? `translate(${offset.x}px, ${offset.y}px) scale(${scale})`
                  : 'scale(1)',
                cursor:  scale > 1 ? 'move' : 'default',
                opacity: imgLoaded[idx] ? 1 : 0,
                transition: 'opacity 0.25s ease',
              }}
              loading="eager"
              draggable={false}
              onLoad={() => markLoaded(idx)}
              onError={() => markLoaded(idx)}
            />
          </div>
        ))}
      </div>

      {/* ── فوتر ── */}
      {images.length > 1 && (
        <footer className="absolute bottom-0 left-0 right-0 p-8 pb-[calc(env(safe-area-inset-bottom)+2rem)] pointer-events-none bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center gap-4">
          <div className="flex gap-2">
            {images.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 bg-primary shadow-[0_0_8px_rgba(20,184,166,0.8)]' : 'w-1 bg-white/20'}`} />
            ))}
          </div>
          <span className="px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-full text-white/40 text-[9px] font-black uppercase tracking-widest border border-white/5">
            {scale > 1 ? 'Move with 1 finger · Pinch to zoom out' : 'Pinch to zoom · Swipe to browse'}
          </span>
        </footer>
      )}
    </div>
  );
};

export default ImageViewer;
