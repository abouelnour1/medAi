import React, { useRef, useState, useCallback } from 'react';

interface Props {
  onClose: () => void;
  children: React.ReactNode;
  minH?: number;
  maxH?: number;
  initialH?: number;
  isOpen?: boolean;
  skipOpenAnimation?: boolean;
}

const BottomSheet: React.FC<Props> = ({ onClose, children }) => {
  const winH = window.innerHeight;
  const maxH = Math.round(winH * 0.92);
  const minH = Math.round(winH * 0.45);

  const [height, setHeight]   = useState(maxH);
  const sheetRef               = useRef<HTMLDivElement>(null);
  const contentRef             = useRef<HTMLDivElement>(null);
  const isExpanded             = height > (minH + maxH) / 2;

  const drag = useCallback((startY: number, startH: number, fromHandle: boolean) => {
    let totalDy = 0;
    const t0    = Date.now();

    const onMove = (ev: TouchEvent) => {
      const dy = ev.touches[0].clientY - startY;
      totalDy  = dy;
      if (fromHandle) {
        ev.preventDefault();
        setHeight(Math.min(maxH, Math.max(60, startH - dy)));
        if (sheetRef.current) sheetRef.current.style.transition = 'none';
      } else {
        const el = contentRef.current;
        if (!el || el.scrollTop > 4 || dy < 12) return;
        ev.preventDefault();
        setHeight(Math.min(maxH, Math.max(60, startH - dy)));
        if (sheetRef.current) sheetRef.current.style.transition = 'none';
      }
    };

    const onEnd = () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend',  onEnd);
      if (sheetRef.current) sheetRef.current.style.transition = '';
      const v = Math.abs(totalDy) / Math.max(1, Date.now() - t0);
      if (totalDy > 80 || (totalDy > 30 && v > 0.5)) onClose();
      else if (totalDy < -30) setHeight(maxH);
      else setHeight(totalDy > 0 ? minH : maxH);
    };

    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend',  onEnd,  { passive: true });
  }, [maxH, minH, onClose]);

  return (
    <div className="fixed inset-0 z-[400]" style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 flex flex-col rounded-t-3xl overflow-hidden bg-white dark:bg-dark-card"
        style={{ height, boxShadow:'0 -4px 32px rgba(0,0,0,0.18)', transition:'height 0.22s cubic-bezier(0.4,0,0.2,1)', willChange:'height' }}
        onClick={e => e.stopPropagation()}>

        {/* ── Handle: single compact row ── */}
        <div className="flex-shrink-0 flex items-center gap-2 px-3 pt-2.5 pb-1 select-none"
          style={{ touchAction: 'none' }}
          onTouchStart={e => { e.stopPropagation(); drag(e.touches[0].clientY, height, true); }}
          onMouseDown={e => {
            const sy = e.clientY, sh = height;
            const mv = (ev: MouseEvent) => setHeight(Math.min(maxH, Math.max(60, sh-(ev.clientY-sy))));
            const up = (ev: MouseEvent) => { window.removeEventListener('mousemove',mv); window.removeEventListener('mouseup',up); if(ev.clientY-sy>60) onClose(); else setHeight(ev.clientY-sy>0?minH:maxH); };
            window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
          }}>
          {/* Close ↓ */}
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg active:bg-slate-100 dark:active:bg-slate-800 active:scale-90 transition-all flex-shrink-0">
            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
          {/* Drag pill */}
          <div className="flex-1 flex justify-center">
            <div className="w-10 h-[3px] rounded-full bg-slate-200 dark:bg-slate-700"/>
          </div>
          {/* Expand ↑ */}
          <button onClick={() => setHeight(isExpanded ? minH : maxH)}
            className="w-7 h-7 flex items-center justify-center rounded-lg active:bg-slate-100 dark:active:bg-slate-800 active:scale-90 transition-all flex-shrink-0">
            <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={isExpanded ? 'M19 9l-7 7-7-7' : 'M5 15l7-7 7 7'}/>
            </svg>
          </button>
        </div>

        {/* ── Content ── */}
        <div ref={contentRef}
          className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar"
          style={{ touchAction:'pan-y', overscrollBehavior:'contain', WebkitOverflowScrolling:'touch', paddingBottom:'max(2rem,env(safe-area-inset-bottom))', overflowAnchor:'none' } as React.CSSProperties}
          onTouchStart={e => { const el=contentRef.current; if(!el||el.scrollTop>4) return; drag(e.touches[0].clientY,height,false); }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
