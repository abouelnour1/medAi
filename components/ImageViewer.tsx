
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scales, setScales] = useState<number[]>(new Array(images.length).fill(1));

  // تزامن السحب عند الفتح
  useEffect(() => {
    if (scrollRef.current) {
        const width = scrollRef.current.offsetWidth;
        scrollRef.current.scrollTo({ left: width * initialIndex, behavior: 'auto' });
    }
  }, [initialIndex]);

  const handleScroll = () => {
    if (scrollRef.current) {
        const width = scrollRef.current.offsetWidth;
        const newIndex = Math.round(scrollRef.current.scrollLeft / width);
        if (newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
            // إعادة ضبط الزوم للصور الأخرى عند الانتقال
            setScales(prev => prev.map((s, i) => i === newIndex ? s : 1));
        }
    }
  };

  const toggleZoom = (index: number) => {
    setScales(prev => {
        const next = [...prev];
        next[index] = next[index] > 1 ? 1 : 2.5;
        return next;
    });
  };

  const handleSourceClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      window.open(images[currentIndex], '_blank');
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-fade-in select-none">
      {/* Header Overlay */}
      <header className="absolute top-0 left-0 right-0 z-[10001] flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent pt-[calc(env(safe-area-inset-top)+0.5rem)]">
        <button 
          onClick={onBack}
          className="p-2 text-white/90 hover:text-white bg-white/10 backdrop-blur-md rounded-full active:scale-90 transition-all"
        >
          <div className="w-6 h-6 transform rtl:rotate-180">
            <BackIcon />
          </div>
        </button>
        
        <div className="text-center">
            <h2 className="text-white font-bold text-sm drop-shadow-md truncate max-w-[200px]">
              {title}
            </h2>
            <p className="text-white/60 text-[10px] font-bold">{currentIndex + 1} / {images.length}</p>
        </div>

        <div className="flex gap-2">
            {isIndexImage && (
                <button 
                  onClick={handleSourceClick}
                  className="p-2 text-primary bg-white/10 backdrop-blur-md rounded-full active:scale-90"
                >
                  <div className="w-5 h-5"><GlobeIcon /></div>
                </button>
            )}
            <button 
              onClick={onBack}
              className="p-2 text-white/90 bg-white/10 backdrop-blur-md rounded-full active:scale-90"
            >
              <ClearIcon />
            </button>
        </div>
      </header>

      {/* Main Swiper Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-grow flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar bg-black touch-pan-x"
        style={{ scrollBehavior: 'smooth' }}
      >
        {images.map((img, idx) => (
            <div 
                key={idx} 
                className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center relative overflow-hidden"
                onDoubleClick={() => toggleZoom(idx)}
            >
                <img 
                    src={img} 
                    alt={`${title} ${idx}`}
                    className="max-w-full max-h-full object-contain transition-transform duration-300 ease-out"
                    style={{ 
                        transform: `scale(${scales[idx]})`,
                        touchAction: scales[idx] > 1 ? 'auto' : 'none'
                    }}
                />
            </div>
        ))}
      </div>

      {/* Footer Instructions */}
      <footer className="absolute bottom-0 left-0 right-0 p-6 text-center pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pointer-events-none bg-gradient-to-t from-black/60 to-transparent">
        <div className="inline-flex gap-4 items-center">
             {images.length > 1 && (
                 <div className="flex gap-1.5">
                    {images.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 bg-primary' : 'w-1.5 bg-white/30'}`} />
                    ))}
                 </div>
             )}
        </div>
        <div className="mt-3">
             <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white/50 text-[9px] font-black uppercase tracking-widest border border-white/5">
                {scales[currentIndex] > 1 ? 'Double tap to exit zoom' : 'Swipe to browse • Double tap to zoom'}
             </span>
        </div>
      </footer>
    </div>
  );
};

export default ImageViewer;
