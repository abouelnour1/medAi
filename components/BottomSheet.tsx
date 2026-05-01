import React, { useRef, useEffect, useState, useCallback } from 'react';

interface Props {
  onClose: () => void;
  children: React.ReactNode;
  minH?: number;
  maxH?: number;
  initialH?: number;
  isOpen?: boolean;
  skipOpenAnimation?: boolean;
}

const BottomSheet: React.FC<Props> = ({ onClose, children, minH: _minH, maxH: _maxH, initialH }) => {
  const winH = window.innerHeight;
  const minH  = _minH  ?? Math.round(winH * 0.45);
  const maxH  = _maxH  ?? Math.round(winH * 0.92);
  const initH = initialH ?? Math.round(winH * 0.65);

  const [height, setHeight]       = useState(initH);
  const sheetRef                   = useRef<HTMLDivElement>(null);
  const contentRef                 = useRef<HTMLDivElement>(null);
  const handleRef                  = useRef<HTMLDivElement>(null);
  const isExpanded                 = height > (minH + maxH) / 2;

  // ── Unified drag helper ───────────────────────────────────────────────────
  const startDrag = useCallback((startY: number, startH: number, fromHandle: boolean) => {
    let dragging = false;
    let lastDy   = 0;
    let lastTime = Date.now();

    const onTouchMove = (ev: TouchEvent) => {
      const dy = ev.touches[0].clientY - startY;
      lastDy = dy;
      lastTime = Date.now();

      if (fromHandle) {
        // Handle: always drag
        ev.preventDefault();
        const newH = Math.min(maxH, Math.max(60, startH - dy));
        setHeight(newH);
        dragging = true;
        if (sheetRef.current) sheetRef.current.style.transition = 'none';
      } else {
        // Content area: only when scrolled to top AND moving down
        const el = contentRef.current;
        const atTop = !el || el.scrollTop <= 0;
        const dxAbs = Math.abs(ev.touches[0].clientX - (ev.touches[0].clientX));
        if (!dragging && atTop && dy > 12) {
          dragging = true;
          if (sheetRef.current) sheetRef.current.style.transition = 'none';
        }
        if (dragging) {
          ev.preventDefault();
          const newH = Math.min(maxH, Math.max(60, startH - dy));
          setHeight(newH);
        }
      }
    };

    const onTouchEnd = (ev: TouchEvent) => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend',  onTouchEnd);
      if (sheetRef.current) sheetRef.current.style.transition = '';

      if (!dragging) return;

      const dy       = lastDy;
      const elapsed  = Date.now() - lastTime + 1;
      const velocity = Math.abs(dy) / elapsed; // px/ms

      // Close: dragged down significantly OR fast downward flick
      if (dy > 60 || (dy > 20 && velocity > 0.6)) {
        onClose();
      } else {
        setHeight(dy > 0 ? minH : maxH);
      }
    };

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend',  onTouchEnd,  { passive: true });
  }, [maxH, minH, onClose]);

  // ── Handle mouse drag ─────────────────────────────────────────────────────
  const onHandleMouseDown = useCallback((e: React.MouseEvent) => {
    const sy = e.clientY;
    const sh = height;
    const onMove = (ev: MouseEvent) => {
      const newH = Math.min(maxH, Math.max(60, sh - (ev.clientY - sy)));
      setHeight(newH);
    };
    const onUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      const dy = ev.clientY - sy;
      if (dy > 60) onClose(); else setHeight(dy > 0 ? minH : maxH);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [height, maxH, minH, onClose]);

  // ── Backdrop click ────────────────────────────────────────────────────────
  const onBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[400]"
      style={{ background: 'rgba(0,0,0,0.45)', touchAction: 'none' }}
      onClick={onBackdropClick}
    >
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 flex flex-col rounded-t-[1.75rem] overflow-hidden"
        style={{
          height,
          background: 'var(--surface)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
          transition: 'height 0.2s cubic-bezier(0.4,0,0.2,1)',
          willChange: 'height',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Handle bar ───────────────────────────────────────────── */}
        <div
          ref={handleRef}
          className="flex-shrink-0 flex flex-col items-center pt-2 pb-0 cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
          onMouseDown={onHandleMouseDown}
          onTouchStart={e => {
            e.stopPropagation();
            startDrag(e.touches[0].clientY, height, true);
          }}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: 'linear-gradient(90deg,#14b8a6,#0ea5e9)' }} />
          <div className="w-full flex justify-between items-center px-4 pt-1.5">
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center text-slate-400 active:scale-90 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <button
              onClick={() => setHeight(isExpanded ? minH : maxH)}
              className="w-7 h-7 flex items-center justify-center text-slate-400 active:scale-90 rounded-full"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={isExpanded ? 'M19 15l-7-7-7 7' : 'M5 15l7-7 7 7'}/>
              </svg>
            </button>
          </div>
        </div>

        {/* ── Scrollable content ───────────────────────────────────── */}
        <div
          ref={contentRef}
          className="flex-grow overflow-y-auto overflow-x-hidden no-scrollbar bg-white dark:bg-dark-card"
          style={{
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          } as React.CSSProperties}
          onTouchStart={e => {
            const el = contentRef.current;
            if (el && el.scrollTop > 2) return; // only act when at very top
            startDrag(e.touches[0].clientY, height, false);
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
