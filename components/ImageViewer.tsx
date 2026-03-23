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

  const markLoaded  = useCallback((i: number) => setLoaded(p  => { const n=[...p]; n[i]=true;  return n; }), []);
  const markErrored = useCallback((i: number) => { setLoaded(p => { const n=[...p]; n[i]=true; return n; }); setErrored(p => { const n=[...p]; n[i]=true; return n; }); }, []);

  const prev = () => setCurrent(c => (c - 1 + images.length) % images.length);
  const next = () => setCurrent(c => (c + 1) % images.length);

  // ── Swipe detection ──────────────────────────────────────────────────────
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (images.length <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // نتجاهل لو السحب رأسي أكتر من أفقي
    if (Math.abs(dx) < Math.abs(dy) || Math.abs(dx) < 40) return;
    if (dx < 0) next(); else prev();
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
      <div className="flex-grow flex items-center justify-center relative bg-black" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

        {/* spinner */}
        {!loaded[current] && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="ps-spinner" style={{ width: 36, height: 36, borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'white' }} />
          </div>
        )}

        {/* الصورة */}
        {!errored[current] ? (
          <img
            key={img}
            src={img}
            alt={title}
            className="max-w-full max-h-full object-contain"
            style={{ opacity: loaded[current] ? 1 : 0, transition: 'opacity 0.2s ease' }}
            onLoad={() => markLoaded(current)}
            onError={() => markErrored(current)}
            draggable={false}
          />
        ) : (
          /* صورة فشلت */
          <div className="flex flex-col items-center gap-4 text-white/50 p-8 text-center">
            <span className="text-5xl">🖼️</span>
            <p className="text-sm font-bold">الصورة غير متاحة</p>
            <button
              onClick={() => window.open(img, '_blank')}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl text-white text-[12px] font-black transition-all"
            >
              فتح في المتصفح ↗
            </button>
          </div>
        )}

        {/* أسهم التنقل */}
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/40 backdrop-blur rounded-full text-white active:scale-90">
              ‹
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/40 backdrop-blur rounded-full text-white active:scale-90">
              ›
            </button>
          </>
        )}
      </div>

      {/* dots */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          {images.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${i === current ? 'w-4 h-2 bg-white' : 'w-2 h-2 bg-white/30'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageViewer;
