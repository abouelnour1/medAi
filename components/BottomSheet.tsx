import React, { useEffect, useRef, useState, useCallback } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[]; // نسب من ارتفاع الشاشة: [0.5, 0.92]
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  snapPoints = [0.55, 0.93],
}) => {
  const sheetRef        = useRef<HTMLDivElement>(null);
  const contentRef      = useRef<HTMLDivElement>(null);
  const dragStartY      = useRef(0);
  const dragStartHeight = useRef(0);
  const isDragging      = useRef(false);

  const vh = window.innerHeight;
  const minH = Math.round(vh * snapPoints[0]);
  const maxH = Math.round(vh * snapPoints[1]);

  const [height, setHeight]   = useState(minH);
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  // Open animation
  useEffect(() => {
    if (isOpen) {
      setHeight(minH);
      setVisible(true);
      requestAnimationFrame(() => setAnimate(true));
    } else {
      setAnimate(false);
      const t = setTimeout(() => setVisible(false), 220);
      return () => clearTimeout(t);
    }
  }, [isOpen, minH]);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onDragStart = useCallback((clientY: number) => {
    isDragging.current   = true;
    dragStartY.current   = clientY;
    dragStartHeight.current = height;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  }, [height]);

  const onDragMove = useCallback((clientY: number) => {
    if (!isDragging.current) return;
    const delta  = dragStartY.current - clientY;
    const newH   = Math.min(maxH, Math.max(100, dragStartHeight.current + delta));
    setHeight(newH);
  }, [maxH]);

  const onDragEnd = useCallback((clientY: number) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (sheetRef.current) sheetRef.current.style.transition = '';

    const delta = dragStartY.current - clientY;
    const cur   = dragStartHeight.current + delta;

    // لو سحب لتحت كتير → اقفل
    if (cur < minH * 0.55) {
      onClose();
      return;
    }
    // snap للأقرب
    const mid = (minH + maxH) / 2;
    setHeight(cur > mid ? maxH : minH);
  }, [minH, maxH, onClose]);

  // Touch
  const onTouchStart = (e: React.TouchEvent) => onDragStart(e.touches[0].clientY);
  const onTouchMove  = (e: React.TouchEvent) => onDragMove(e.touches[0].clientY);
  const onTouchEnd   = (e: React.TouchEvent) => onDragEnd(e.changedTouches[0].clientY);

  // Mouse (للـ web)
  const onMouseDown = (e: React.MouseEvent) => {
    onDragStart(e.clientY);
    const move = (ev: MouseEvent) => onDragMove(ev.clientY);
    const up   = (ev: MouseEvent) => { onDragEnd(ev.clientY); window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
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
        style={{ opacity: animate ? 1 : 0, transition: 'opacity 0.2s ease' }}
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
          transition: isDragging.current ? 'none' : 'transform 0.22s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.2s ease, height 0.22s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          willChange: 'transform, height',
        }}
      >
        {/* Handle */}
        <div
          className="flex-shrink-0 flex flex-col items-center pt-3 pb-1 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-600 rounded-full" />
          <div className="w-full flex justify-between items-center px-4 pt-2">
            <button
              onClick={onClose}
              className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              onClick={() => setHeight(isExpanded ? minH : maxH)}
              className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            >
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={isExpanded ? "M19 15l-7-7-7 7" : "M5 15l7-7 7 7"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div ref={contentRef} className="flex-grow overflow-y-auto no-scrollbar overscroll-contain px-4 pb-8" style={{ direction: 'rtl' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
