
import React, { useState, useRef, useLayoutEffect, useCallback } from 'react';
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
  const [isReady, setIsReady] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [lastScale, setLastScale] = useState(1);
  const [startDist, setStartDist] = useState(0);

  // التمرير الفوري للصورة المختارة قبل إظهار المكون للمستخدم
  useLayoutEffect(() => {
    let animationFrameId: number;
    
    const jumpToInitial = () => {
      if (scrollRef.current) {
        const container = scrollRef.current;
        const width = container.clientWidth;
        
        if (width > 0) {
          // التمرير الفوري بدون أنيميشن
          container.scrollLeft = width * initialIndex;
          
          // ننتظر قليلاً للتأكد من أن المتصفح طبق موقع التمرير
          animationFrameId = requestAnimationFrame(() => {
            setIsReady(true);
          });
        } else {
          animationFrameId = requestAnimationFrame(jumpToInitial);
        }
      }
    };
    
    setIsReady(false);
    jumpToInitial();
    
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [initialIndex]);

  const handleScroll = useCallback(() => {
    if (scrollRef.current && isReady && scale === 1) {
      const container = scrollRef.current;
      const width = container.clientWidth;
      if (width <= 0) return;
      const newIndex = Math.round(container.scrollLeft / width);
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < images.length) {
        setCurrentIndex(newIndex);
      }
    }
  }, [currentIndex, images.length, isReady, scale]);

  // زوم الأصابع (Pinch to Zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      setStartDist(dist);
      setLastScale(scale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && startDist > 0) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const newScale = (dist / startDist) * lastScale;
      setScale(Math.max(1, Math.min(newScale, 4)));
    }
  };

  const handleTouchEnd = () => {
    setStartDist(0);
    // إذا كان الزوم صغيراً جداً، نعيده للوضع الطبيعي
    if (scale < 1.1) setScale(1);
  };

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setScale(prev => (prev > 1 ? 1 : 2.5));
  };

  const handleSourceClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(images[currentIndex], '_blank');
  };

  const isCurrentIndexImage = indexFlags[currentIndex];

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-black flex flex-col select-none touch-none overflow-hidden transition-opacity duration-300 ${isReady ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
      style={{ direction: 'ltr' }}
    >
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[10001] flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/20 to-transparent pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <button 
          onClick={onBack}
          className="p-2 text-white/90 bg-white/10 backdrop-blur-xl rounded-full active:scale-90 transition-all"
        >
          <div className="w-6 h-6 transform rtl:rotate-180"><BackIcon /></div>
        </button>
        
        <div className="text-center px-4 flex-grow truncate">
          <h2 className="text-white font-bold text-sm drop-shadow-lg truncate">{title}</h2>
          <p className="text-white/60 text-[10px] font-black tracking-widest">{currentIndex + 1} / {images.length}</p>
        </div>

        <div className="flex gap-2">
          {isCurrentIndexImage && (
            <button 
              onClick={handleSourceClick}
              className="p-2 text-primary bg-white/10 backdrop-blur-xl rounded-full active:scale-90"
              title="المصدر الأصلي"
            >
              <div className="w-5 h-5"><GlobeIcon /></div>
            </button>
          )}
          <button 
            onClick={onBack}
            className="p-2 text-white/90 bg-white/10 backdrop-blur-xl rounded-full active:scale-90"
          >
            <ClearIcon />
          </button>
        </div>
      </header>

      {/* Images Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`flex-grow flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar bg-black ${scale > 1 ? 'touch-none' : 'touch-pan-x'}`}
        style={{ scrollBehavior: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        {images.map((img, idx) => (
          <div 
            key={idx} 
            className="w-full h-full flex-shrink-0 snap-center snap-always flex items-center justify-center relative"
            onDoubleClick={handleDoubleTap}
          >
            <img 
              src={img} 
              alt={`${title} ${idx}`}
              className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out will-change-transform"
              style={{ 
                transform: idx === currentIndex ? `scale(${scale})` : 'scale(1)',
                transitionProperty: scale === 1 ? 'none' : 'transform' 
              }}
              loading="eager"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Bottom Indicators */}
      {images.length > 1 && (
        <footer className="absolute bottom-0 left-0 right-0 p-8 text-center pb-[calc(env(safe-area-inset-bottom)+2rem)] pointer-events-none bg-gradient-to-t from-black/80 via-transparent to-transparent">
          <div className="inline-flex flex-col gap-4 items-center">
            <div className="flex gap-2">
              {images.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 bg-primary shadow-[0_0_10px_rgba(20,184,166,0.6)]' : 'w-1 bg-white/20'}`} 
                />
              ))}
            </div>
            <div className="mt-2">
              <span className="px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-full text-white/30 text-[9px] font-black uppercase tracking-widest border border-white/5">
                {scale > 1 ? 'Double tap to reset' : 'Pinch to zoom • Swipe to browse'}
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default ImageViewer;
