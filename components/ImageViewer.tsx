import React, { useState, useCallback, useRef } from 'react';
import { TFunction } from '../types';
import BackIcon from './icons/BackIcon';
import ClearIcon from './icons/ClearIcon';
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
  const [current, setCurrent]   = useState(initialIndex);
  const [loaded,  setLoaded]    = useState<boolean[]>(images.map(() => false));
  const [errored, setErrored]   = useState<boolean[]>(images.map(() => false));

  // ── Zoom state ──────────────────────────────────────────────────────────
  const [scale, setScale]       = useState(1);
  const [offset, setOffset]     = useState({ x: 0, y: 0 });
  const lastScale               = useRef(1);
  const lastOffset              = useRef({ x: 0, y: 0 });
  const pinchStartDist          = useRef(0);
  const pinchStartScale         = useRef(1);
  const dragStart               = useRef<{ x: number; y: number } | null>(null);
  const isDragging              = useRef(false);

  const markLoaded  = useCallback((i: number) => setLoaded(p  => { const n=[...p]; n[i]=true;  return n; }), []);
  const markErrored = useCallback((i: number) => { setLoaded(p => { const n=[...p]; n[i]=true; return n; }); setErrored(p => { const n=[...p]; n[i]=true; return n; }); }, []);

  const resetZoom = () => { setScale(1); setOffset({ x: 0, y: 0 }); lastScale.current = 1; lastOffset.current = { x: 0, y: 0 }; };

  const prev = () => { resetZoom(); setCurrent(c => (c - 1 + images.length) % images.length); };
  const next = () => { resetZoom(); setCurrent(c => (c + 1) % images.length); };

  // ── Touch handlers ───────────────────────────────────────────────────────
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const getDist = (t: React.TouchList) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  const getMid = (t: React.TouchList) => ({
    x: (t[0].clientX + t[1].clientX) / 2,
    y: (t[0].clientY + t[1].clientY) / 2,
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      pinchStartDist.current  = getDist(e.touches);
      pinchStartScale.current = lastScale.current;
      isDragging.current = false;
    } else if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      if (lastScale.current > 1) {
        // Pan mode when zoomed
        dragStart.current = { x: e.touches[0].clientX - lastOffset.current.x, y: e.touches[0].clientY - lastOffset.current.y };
        isDragging.current = true;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      e.preventDefault();
      const dist = getDist(e.touches);
      const newScale = Math.min(5, Math.max(1, pinchStartScale.current * (dist / pinchStartDist.current)));
      lastScale.current = newScale;
      setScale(newScale);
    } else if (e.touches.length === 1 && isDragging.current && dragStart.current) {
      // Pan
      e.preventDefault();
      const ox = e.touches[0].clientX - dragStart.current.x;
      const oy = e.touches[0].clientY - dragStart.current.y;
      lastOffset.current = { x: ox, y: oy };
      setOffset({ x: ox, y: oy });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0 && !isDragging.current && lastScale.current <= 1) {
      // Swipe to next/prev only when not zoomed
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (images.length > 1 && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) >= 40) {
        if (dx < 0) next(); else prev();
      }
    }
    if (e.touches.length === 0) isDragging.current = false;
    // Double-tap to reset zoom
    // handled by double-tap logic below
  };

  // Double tap to zoom toggle
  const lastTap = useRef(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (lastScale.current > 1) resetZoom();
      else { lastScale.current = 2.5; lastOffset.current = { x: 0, y: 0 }; setScale(2.5); setOffset({ x: 0, y: 0 }); }
    }
    lastTap.current = now;
  };

  const img = images[current];

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col" style={{ direction: 'ltr' }}>

      {/* هيدر */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 p-3 bg-gradient-to-b from-black/80 to-transparent pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <button onClick={onBack} className="p-2 text-white/90 bg-white/10 backdrop-blur-xl rounded-full active:scale-90">
          <div className="w-6 h-6"><BackIcon /></div>
        </button>
        <div className="flex-grow text-center">
          <h2 className="text-white font-bold text-[11px] truncate">{title}</h2>
          {images.length > 1 && (
            <p className="text-white/50 text-[9px] font-black">{current + 1} / {images.length}</p>
          )}
        </div>
        <div className="flex gap-1.5">
          {scale > 1 && (
            <button onClick={resetZoom} className="px-2.5 py-2 bg-white/20 rounded-full text-white text-[9px] font-black">
              Reset
            </button>
          )}
          {indexFlags[current] && (
            <button onClick={() => window.open(img, '_blank')} className="flex items-center gap-1 px-2.5 py-2 bg-primary rounded-full text-white text-[9px] font-black">
              <div className="w-3.5 h-3.5"><GlobeIcon /></div>
              عرض الكامل
            </button>
          )}
          <button onClick={onBack} className="p-2.5 text-white/90 bg-white/10 backdrop-blur-xl rounded-full active:scale-90">
            <ClearIcon />
          </button>
        </div>
      </header>

      {/* الصورة */}
      <div
        className="flex-grow flex items-center justify-center relative bg-black overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleDoubleTap}
        style={{ touchAction: scale > 1 ? 'none' : 'pan-x' }}
      >
        {!loaded[current] && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="ps-spinner" style={{ width: 36, height: 36, borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'white' }} />
          </div>
        )}

        {!errored[current] ? (
          <img
            key={img}
            src={img}
            alt={title}
            className="max-w-full max-h-full object-contain"
            style={{
              opacity: loaded[current] ? 1 : 0,
              transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
              transition: isDragging.current ? 'none' : 'transform 0.1s ease, opacity 0.2s ease',
              cursor: scale > 1 ? 'grab' : 'default',
              userSelect: 'none',
            }}
            onLoad={() => markLoaded(current)}
            onError={() => markErrored(current)}
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 text-white/50 p-8 text-center">
            <span className="text-5xl">🖼️</span>
            <p className="text-sm font-bold">الصورة غير متاحة</p>
            <button onClick={() => window.open(img, '_blank')}
              className="px-5 py-2.5 bg-white/10 rounded-2xl text-white text-[12px] font-black">
              فتح في المتصفح ↗
            </button>
          </div>
        )}

        {/* أسهم التنقل — تظهر بس لما scale = 1 */}
        {images.length > 1 && scale === 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/40 backdrop-blur rounded-full text-white active:scale-90">‹</button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/40 backdrop-blur rounded-full text-white active:scale-90">›</button>
          </>
        )}

        {/* zoom hint */}
        {loaded[current] && scale === 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-white/30 text-[9px] font-bold pointer-events-none">
            Pinch or double-tap to zoom
          </div>
        )}
      </div>

      {/* dots */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          {images.map((_, i) => (
            <button key={i} onClick={() => { resetZoom(); setCurrent(i); }}
              className={`rounded-full ${i === current ? 'w-4 h-2 bg-white' : 'w-2 h-2 bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageViewer;
