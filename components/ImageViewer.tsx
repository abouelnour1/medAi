
import React, { useState, useRef, useEffect } from 'react';
import { TFunction } from '../types';
import ClearIcon from './icons/ClearIcon';
import BackIcon from './icons/BackIcon';
import GlobeIcon from './icons/GlobeIcon';

interface ImageViewerProps {
  imageUrl: string;
  title: string;
  onBack: () => void;
  t: TFunction;
  isIndexImage?: boolean;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, title, onBack, t, isIndexImage }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isImgLoading, setIsImgLoading] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // تتبع اللمس للتكبير اليدوي (Pinch Zoom)
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number, y: number } | null>(null);
  const isDragging = useRef(false);
  const lastPointerPos = useRef({ x: 0, y: 0 });

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
    } else if (e.touches.length === 1 && isDragging.current && scale > 1) {
      const deltaX = e.touches[0].pageX - lastPointerPos.current.x;
      const deltaY = e.touches[0].pageY - lastPointerPos.current.y;
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      lastPointerPos.current = { x: e.touches[0].pageX, y: e.touches[0].pageY };
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
    isDragging.current = false;
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleSourceClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      window.open(imageUrl, '_blank');
  };

  return (
    <div 
        ref={containerRef}
        className="fixed inset-0 z-[9999] bg-black flex flex-col animate-fade-in overflow-hidden select-none touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
      {/* التحكم العلوي */}
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
            <h2 className="text-white font-bold text-sm truncate max-w-[180px]">
              {title}
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
                  title="Source"
                >
                  <div className="w-6 h-6">
                    <GlobeIcon />
                  </div>
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

      {/* منطقة الصورة التفاعلية */}
      <div className="flex-grow flex items-center justify-center relative bg-black p-2">
        {isImgLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Loading High-Res...</span>
            </div>
        )}
        <div 
            style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging.current ? 'none' : 'transform 0.1s ease-out'
            }}
            className="w-full h-full flex items-center justify-center"
        >
            <img 
              ref={imageRef}
              src={imageUrl} 
              alt={title}
              className={`max-w-full max-h-full object-contain shadow-2xl pointer-events-none transition-opacity duration-700 ${isImgLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsImgLoading(false)}
              onDoubleClick={resetZoom}
            />
        </div>
      </div>

      {/* التلميح السفلي */}
      <footer className="p-4 text-center pb-[calc(env(safe-area-inset-bottom)+1rem)] z-[10000] pointer-events-none">
        <div className="inline-flex px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-white/30 text-[9px] font-black uppercase tracking-[0.4em]">
          {scale > 1 ? 'Drag to Pan' : 'Pinch to zoom'}
        </div>
      </footer>
    </div>
  );
};

export default ImageViewer;
