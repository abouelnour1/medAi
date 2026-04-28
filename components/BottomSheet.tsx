import React, { useEffect, useRef, useState, useCallback } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  skipOpenAnimation?: boolean;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen, onClose, children,
  snapPoints = [0.93, 0.93],
  skipOpenAnimation = false,
}) => {
  const sheetRef   = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const handleRef  = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartX = useRef(0);
  const dragStartH = useRef(0);
  const isDragging = useRef(false);

  const vh   = window.innerHeight;
  const minH = Math.round(vh * snapPoints[0]);
  const maxH = Math.round(vh * snapPoints[1]);

  const [height, setHeight]   = useState(minH);
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  // ── open/close ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setHeight(minH);
      setVisible(true);
      if (skipOpenAnimation) {
        setAnimate(true);
      } else {
        setAnimate(false);
        const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
        return () => cancelAnimationFrame(id);
      }
    } else {
      setAnimate(false);
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen, minH, skipOpenAnimation]);

  // ── drag helpers ───────────────────────────────────────────────────────────
  const startDrag = useCallback((y: number, x: number) => {
    isDragging.current = true;
    dragStartY.current = y;
    dragStartX.current = x;
    dragStartH.current = height;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  }, [height]);

  const moveDrag = useCallback((y: number, x: number) => {
    if (!isDragging.current) return;
    const dy = y - dragStartY.current;
    const dx = Math.abs(x - dragStartX.current);
    if (dx > Math.abs(dy) * 1.5) return; // horizontal swipe → ignore
    const newH = Math.min(maxH, Math.max(80, dragStartH.current - dy * 0.8));
    setHeight(newH);
  }, [maxH]);

  const endDrag = useCallback((y: number) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (sheetRef.current) sheetRef.current.style.transition = '';
    const delta = dragStartY.current - y;
    const cur   = dragStartH.current + delta;
    if (cur < minH * 0.75) { onClose(); return; }
    const mid = (minH + maxH) / 2;
    setHeight(cur > mid ? maxH : minH);
  }, [minH, maxH, onClose]);

  // ── handle bar touch (the ONLY drag zone) ──────────────────────────────────
  useEffect(() => {
    const el = handleRef.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => { startDrag(e.touches[0].clientY, e.touches[0].clientX); };
    const onMove  = (e: TouchEvent) => { e.preventDefault(); moveDrag(e.touches[0].clientY, e.touches[0].clientX); };
    const onEnd   = (e: TouchEvent) => { endDrag(e.changedTouches[0].clientY); };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    el.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
      el.removeEventListener('touchend',   onEnd);
    };
  }, [startDrag, moveDrag, endDrag]);

  // mouse (web)
  const onHandleMouseDown = (e: React.MouseEvent) => {
    startDrag(e.clientY, e.clientX);
    const move = (ev: MouseEvent) => moveDrag(ev.clientY, ev.clientX);
    const up   = (ev: MouseEvent) => { endDrag(ev.clientY); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!visible) return null;
  const isExpanded = height > (minH + maxH) / 2;

  return (
    <div className="fixed inset-0 z-[200]" style={{ direction: 'ltr' }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        style={{ opacity: animate ? 0.45 : 0, transition: 'opacity 0.18s ease' }}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 bg-white dark:bg-dark-card flex flex-col overflow-hidden"
        style={{
          height,
          borderRadius: isExpanded ? '1.5rem 1.5rem 0 0' : '2rem 2rem 0 0',
          transform: animate ? 'translateY(0)' : 'translateY(100%)',
          opacity: animate ? 1 : 0,
          transition: 'transform 0.18s cubic-bezier(0.22,1,0.36,1), height 0.15s cubic-bezier(0.22,1,0.36,1), opacity 0.12s ease',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          willChange: 'transform, height',
        }}
      >
        {/* Handle — ONLY drag zone */}
        <div
          ref={handleRef}
          className="flex-shrink-0 flex flex-col items-center pt-2 pb-0 cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
          onMouseDown={onHandleMouseDown}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: 'linear-gradient(90deg,#14b8a6,#0ea5e9)' }} />
          <div className="w-full flex justify-between items-center px-4 pt-1.5">
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-slate-400 active:scale-90 rounded-full">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <button onClick={() => setHeight(isExpanded ? minH : maxH)} className="w-7 h-7 flex items-center justify-center text-slate-400 active:scale-90 rounded-full">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={isExpanded ? 'M19 15l-7-7-7 7' : 'M5 15l7-7 7 7'}/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content — free scroll + drag-to-close when at top */}
        <div
          ref={contentRef}
          className="flex-grow overflow-y-auto no-scrollbar bg-white dark:bg-dark-card"
          style={{
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            direction: 'ltr',
          } as React.CSSProperties}
          onTouchStart={e => {
            const el = contentRef.current;
            if (!el || el.scrollTop > 4) return;
            const sy = e.touches[0].clientY;
            const sx = e.touches[0].clientX;
            const sh = height;
            let dragging = false;
            const onMove = (ev: TouchEvent) => {
              const dy = ev.touches[0].clientY - sy;
              const dx = Math.abs(ev.touches[0].clientX - sx);
              if (!dragging && dy > 12 && dy > dx * 1.5) {
                dragging = true;
                if (sheetRef.current) sheetRef.current.style.transition = 'none';
              }
              if (dragging) {
                ev.preventDefault();
                const newH = Math.min(maxH, Math.max(80, sh - dy * 0.7));
                setHeight(newH);
              }
            };
            const onEnd = (ev: TouchEvent) => {
              if (!dragging) return;
              if (sheetRef.current) sheetRef.current.style.transition = '';
              const dy = ev.changedTouches[0].clientY - sy;
              if (sh - dy < minH * 0.75) onClose();
              else setHeight(dy > 0 ? minH : maxH);
              document.removeEventListener('touchmove', onMove);
              document.removeEventListener('touchend', onEnd);
            };
            document.addEventListener('touchmove', onMove, { passive: false });
            document.addEventListener('touchend', onEnd, { passive: true });
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
