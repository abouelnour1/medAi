
import React, { useState, useRef, useEffect } from 'react';
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
  isIndexImage?: boolean;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ images, initialIndex, title, onBack, t, isIndexImage }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isImgLoading, setIsImgLoading] = useState(false); // Changed to false to avoid initial flash gap
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const lastTouchDistance = useRef<number | null>(null);
  const isDragging = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });
  const startX = useRef(0);
  const currentSwipeX = useRef(0);

  const imageUrl = images[currentIndex];

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1) {
      isDragging.current = true;
      lastPointerPos.current = { x: e.touches[0].pageX, y: e.touches[0].pageY };
      startX.current = e.touches[0].pageX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      const distance = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const delta = distance / lastTouchDistance.current;
      setScale(prev => Math.min(Math.max(1, prev * delta), 4));
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1 && isDragging.current) {
      const deltaX = e.touches[0].pageX - lastPointerPos.current.x;
      const deltaY = e.touches[0].pageY - lastPointerPos.current.y;
      
      if (scale > 1) {
        setPosition(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
      } else {
        currentSwipeX.current = e.touches[0].pageX - startX.current;
      }
      lastPointerPos.current = { x: e.touches[0].pageX, y: e.touches[0].pageY };
    }
  };

  const handleTouchEnd = () => {
    if (scale === 1 && Math.abs(currentSwipeX.current) > 50) {
      if (currentSwipeX.current > 50 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        resetZoom();
      } else if (currentSwipeX.current < -50 && currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1);
        resetZoom();
      }
    }
    lastTouchDistance.current = null;
    isDragging.current = false;
    currentSwipeX.current = 0;
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleSourceClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      window.open(imageUrl, '_blank');
  };

  // Prevent back action if scaled
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
        if (scale > 1) {
            window.history.pushState(null, '', window.location.href);
            resetZoom();
        }
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [scale]);

  return (
    <div 
        ref={containerRef}
        className="fixed inset-0 z-[9999] bg-black flex flex-col animate-fade-in overflow-hidden select-none touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      <header className="flex items-center justify-between p-4 bg-slate-900/90 backdrop-blur-xl border-b border-white/5 pt-[calc(env(safe-area-inset-top)+1rem)] z-[10000]">
        <button 
          onClick={onBack}
          className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-90"
        >
          <div className="w-6 h-6 transform rtl:rotate-180">
            <BackIcon />
          </div>
        </button>
        
        <div className="flex flex-col items-center min-w-0 flex-1 px-2">
            <h2 className="text-white font-bold text-xs truncate max-w-[180px]">
              {title} {images.length > 1 ? `(${currentIndex + 1}/${images.length})` : ''}
            </h2>
            {scale > 1 && (
                <button onClick={resetZoom} className="text-[10px] text-primary font-bold uppercase tracking-wider">Reset Zoom</button>
            )}
        </div>

        <div className="flex items-center gap-1">
            {isIndexImage && (
                <button 
                  onClick={handleSourceClick}
                  className="p-2 text-primary hover:text-primary-light transition-colors rounded-full hover:bg-white/10 active:scale-90"
                >
                  <div className="w-6 h-6"><GlobeIcon /></div>
                </button>
            )}
            <button 
              onClick={onBack}
              className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-90"
            >
              <ClearIcon />
            </button>
        </div>
      </header>

      <div className="flex-grow flex items-center justify-center relative bg-black">
        {images.length > 1 && scale === 1 && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 z-50">
                {images.map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 bg-primary' : 'w-1.5 bg-white/30'}`} />
                ))}
            </div>
        )}

        <div 
            style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging.current ? 'none' : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="w-full h-full flex items-center justify-center"
        >
            <img 
              key={imageUrl} // Important to force smooth transition on src change
              ref={imageRef}
              src={imageUrl} 
              alt={title}
              decoding="sync"
              loading="eager"
              className="max-w-full max-h-full object-contain shadow-2xl pointer-events-none"
              style={{ imageRendering: 'auto' }}
              onDoubleClick={resetZoom}
            />
        </div>
      </div>

      <footer className="p-4 text-center pb-[calc(env(safe-area-inset-bottom)+1rem)] z-[10000] pointer-events-none">
        <div className="inline-flex px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-white/40 text-[9px] font-black uppercase tracking-widest">
          {scale > 1 ? 'Drag to Pan' : (images.length > 1 ? 'Swipe to browse • Pinch to zoom' : 'Pinch to zoom')}
        </div>
      </footer>
    </div>
  );
};

export default ImageViewer;
