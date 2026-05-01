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
  const winH  = window.innerHeight;
  const maxH  = Math.round(winH * 0.92);
  const minH  = Math.round(winH * 0.45);

  const [height, setHeight] = useState(maxH);
  const sheetRef            = useRef<HTMLDivElement>(null);
  const contentRef          = useRef<HTMLDivElement>(null);
  const isExpanded          = height > (minH + maxH) / 2;

  const drag = useCallback((startY: number, startH: number, fromHandle: boolean) => {
    let curH    = startH;
    let totalDy = 0;
    let t0      = Date.now();
    let lastY   = startY;

    const onMove = (ev: TouchEvent) => {
      const dy = ev.touches[0].clientY - startY;
      totalDy  = dy;
      lastY    = ev.touches[0].clientY;

      if (fromHandle) {
        ev.preventDefault();
        curH = Math.min(maxH, Math.max(60, startH - dy));
        setHeight(curH);
        if (sheetRef.current) sheetRef.current.style.transition = 'none';
        return;
      }

      // Content: only drag down when at scroll top
      const el = contentRef.current;
      if (!el || el.scrollTop > 4) return;
      if (dy < 12) return;
      ev.preventDefault();
      curH = Math.min(maxH, Math.max(60, startH - dy));
      setHeight(curH);
      if (sheetRef.current) sheetRef.current.style.transition = 'none';
    };

    const onEnd = () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend',  onEnd);
      if (sheetRef.current) sheetRef.current.style.transition = '';

      const elapsed  = Math.max(1, Date.now() - t0);
      const velocity = Math.abs(totalDy) / elapsed; // px/ms

      if (totalDy > 80 || (totalDy > 30 && velocity > 0.5)) {
        onClose();
      } else if (totalDy < -30) {
        setHeight(maxH);
      } else {
        setHeight(totalDy > 0 ? minH : maxH);
      }
    };

    t0 = Date.now();
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend',  onEnd,  { passive: true });
  }, [maxH, minH, onClose]);

  return (
    <div
      className="fixed inset-0 z-[400]"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 flex flex-col rounded-t-3xl overflow-hidden"
        style={{
          height,
          background: 'var(--surface, #fff)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
          transition: 'height 0.22s cubic-bezier(0.4,0,0.2,1)',
          willChange: 'height',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Handle ── */}
        <div
          className="flex-shrink-0 select-none pt-2 pb-0"
          style={{ touchAction: 'none' }}
          onTouchStart={e => { e.stopPropagation(); drag(e.touches[0].clientY, height, true); }}
          onMouseDown={e => {
            const sy = e.clientY, sh = height;
            const onMove = (ev: MouseEvent) => setHeight(Math.min(maxH, Math.max(60, sh-(ev.clientY-sy))));
            const onUp   = (ev: MouseEvent) => {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
              const dy = ev.clientY - sy;
              if (dy > 60) onClose(); else setHeight(dy > 0 ? minH : maxH);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
        >
          {/* Drag indicator + buttons in one row */}
          <div className="flex items-center px-3">
            <button onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-300 active:bg-slate-100 dark:active:bg-slate-800 active:scale-90 transition-all flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <div className="flex-1 flex justify-center">
              <div className="w-8 h-[3px] rounded-full bg-slate-200 dark:bg-slate-700"/>
            </div>
            <button onClick={() => setHeight(isExpanded ? minH : maxH)}
              className="w-7 h-7 flex items-center justify-center rounded-xl text-slate-300 active:bg-slate-100 dark:active:bg-slate-800 active:scale-90 transition-all flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={isExpanded ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar bg-white dark:bg-dark-card"
          style={{
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          } as React.CSSProperties}
          onTouchStart={e => {
            const el = contentRef.current;
            if (!el || el.scrollTop > 4) return;
            drag(e.touches[0].clientY, height, false);
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
