import React, { useState, useRef, useEffect, useCallback } from 'react';
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

// ── Single zoomable image ──────────────────────────────────────────────────
const ZoomableImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [scale, setScale]   = useState(1);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [pan, setPan]       = useState({ x: 0, y: 0 });

  const lastDist   = useRef(0);
  const lastScale  = useRef(1);
  const lastPan    = useRef({ x: 0, y: 0 });
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const imgRef     = useRef<HTMLImageElement>(null);
  const lastTap    = useRef(0);

  const reset = useCallback(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
    setOrigin({ x: 50, y: 50 });
    lastScale.current = 1;
    lastPan.current   = { x: 0, y: 0 };
  }, []);

  const clampPan = (s: number, px: number, py: number) => {
    if (s <= 1) return { x: 0, y: 0 };
    const el = imgRef.current;
    if (!el) return { x: px, y: py };
    const maxX = (el.offsetWidth  * (s - 1)) / 2;
    const maxY = (el.offsetHeight * (s - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, px)),
      y: Math.min(maxY, Math.max(-maxY, py)),
    };
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      lastDist.current = Math.hypot(dx, dy);
      const rect = imgRef.current?.getBoundingClientRect();
      if (rect) {
        const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        setOrigin({
          x: ((mx - rect.left) / rect.width)  * 100,
          y: ((my - rect.top)  / rect.height) * 100,
        });
      }
    } else if (e.touches.length === 1) {
      touchStart.current = {
        x: e.touches[0].clientX - lastPan.current.x,
        y: e.touches[0].clientY - lastPan.current.y,
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist   = Math.hypot(dx, dy);
      const ratio  = dist / (lastDist.current || dist);
      const newScale = Math.min(5, Math.max(1, lastScale.current * ratio));
      setScale(newScale);
    } else if (e.touches.length === 1 && lastScale.current > 1 && touchStart.current) {
      const nx = e.touches[0].clientX - touchStart.current.x;
      const ny = e.touches[0].clientY - touchStart.current.y;
      setPan(clampPan(lastScale.current, nx, ny));
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      lastScale.current = scale < 1.05 ? 1 : scale;
      if (scale < 1.05) reset();
      else lastPan.current = pan;
    }
    if (e.touches.length === 0) touchStart.current = null;

    // double-tap zoom
    const now = Date.now();
    if (now - lastTap.current < 280 && e.changedTouches.length === 1) {
      if (scale > 1.5) {
        reset();
      } else {
        const rect = imgRef.current?.getBoundingClientRect();
        if (rect) {
          const t = e.changedTouches[0];
          setOrigin({
            x: ((t.clientX - rect.left) / rect.width)  * 100,
            y: ((t.clientY - rect.top)  / rect.height) * 100,
          });
        }
        const ns = 2.5;
        setScale(ns);
        lastScale.current = ns;
        lastPan.current   = { x: 0, y: 0 };
        setPan({ x: 0, y: 0 });
      }
    }
    lastTap.current = now;
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden bg-black select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: scale > 1 ? 'none' : 'pan-x' }}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        className="max-w-full max-h-full object-contain"
        style={{
          transform: `scale(${scale}) translate(${pan.x / scale}px, ${pan.y / scale}px)`,
          transformOrigin: `${origin.x}% ${origin.y}%`,
          transition: lastDist.current > 0 ? 'none' : 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          userSelect: 'none',
          WebkitUserDrag: 'none',
        } as any}
      />
    </div>
  );
};

// ── Main viewer ────────────────────────────────────────────────────────────
const ImageViewer: React.FC<Props> = ({ images, initialIndex, title, indexFlags, onBack }) => {
  const [current, setCurrent] = useState(initialIndex);
  const [closing, setClosing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = initialIndex * el.clientWidth;
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onBack, 180);
  };

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
    <div className={`fixed inset-0 z-[9999] bg-black flex flex-col ${closing ? 'anim-img-out' : 'anim-img-in'}`} style={{ direction: 'ltr' }}>

      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 pb-6"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
        }}
      >
        <button
          onClick={handleClose}
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

      {/* Scrollable pages */}
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
            className="flex-shrink-0 w-full h-full"
            style={{ scrollSnapAlign: 'center', scrollSnapStop: 'always' }}
          >
            <ZoomableImage src={img} alt={title} />
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
