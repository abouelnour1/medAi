
import React from 'react';
import { TFunction } from '../types';
import ClearIcon from './icons/ClearIcon';
import DownloadIcon from './icons/DownloadIcon';
import BackIcon from './icons/BackIcon';

interface ImageViewerProps {
  imageUrl: string;
  title: string;
  onBack: () => void;
  t: TFunction;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageUrl, title, onBack, t }) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('CORS limitation');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `PharmaSource_${title.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(imageUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col animate-fade-in touch-none overflow-hidden">
      {/* التحكم العلوي */}
      <header className="flex items-center justify-between p-4 bg-slate-900/80 backdrop-blur-md border-b border-white/5 pt-[calc(env(safe-area-inset-top)+1rem)]">
        <button 
          onClick={onBack}
          className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-90"
        >
          <div className="w-6 h-6 transform rtl:rotate-180">
            <BackIcon />
          </div>
        </button>
        
        <h2 className="text-white font-bold text-sm truncate max-w-[200px] text-center px-2">
          {title}
        </h2>

        <button 
          onClick={handleDownload}
          className="p-2 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/10 active:scale-90"
        >
          <div className="w-6 h-6">
            <DownloadIcon />
          </div>
        </button>
      </header>

      {/* منطقة الصورة */}
      <div className="flex-grow flex items-center justify-center p-2">
        <img 
          src={imageUrl} 
          alt={title}
          className="max-w-full max-h-full object-contain rounded-sm shadow-2xl animate-zoom-in select-none"
          style={{ touchAction: 'pinch-zoom' }}
        />
      </div>

      {/* التلميح السفلي */}
      <footer className="p-6 text-center pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="inline-flex px-4 py-2 bg-white/5 rounded-full border border-white/10 text-white/40 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
          Pinch to zoom
        </div>
      </footer>
    </div>
  );
};

export default ImageViewer;
