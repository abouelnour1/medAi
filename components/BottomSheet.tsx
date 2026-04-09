import React, { useEffect, useRef, useState, useCallback } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  skipOpenAnimation?: boolean; // لما الـ sheet كان مفتوح ومش محتاج animation فتح
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  snapPoints = [0.68, 0.93],
  skipOpenAnimation = false,
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
      setAnimate(false);   // ابدأ مترجمة لتحت
      setVisible(true);
      // في الـ frame التاني ابدأ الـ animation
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnimate(true))
      );
      return () => cancelAnimationFrame(id);
    } else {
      setAnimate(false);
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen, minH, skipOpenAnimation]);

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
    // resistance خفيف للسحب لفوق، مباشر للسحب لتحت
    const resistance = delta > 0 ? 1 : 0.6;
    const newH   = Math.min(maxH, Math.max(80, dragStartHeight.current + delta * resistance));
    setHeight(newH);
  }, [maxH]);

  const onDragEnd = useCallback((clientY: number) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (sheetRef.current) sheetRef.current.style.transition = '';

    const delta = dragStartY.current - clientY;
    const cur   = dragStartHeight.current + delta;

    // لو سحب لتحت → اقفل بسرعة
    if (cur < minH * 0.75) {
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
          transition: isDragging.current ? 'none' : 'transform 0.15s cubic-bezier(0.22, 1, 0.36, 1), height 0.15s cubic-bezier(0.22, 1, 0.36, 1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          willChange: 'transform, height',
        contain: 'layout style',
        }}
      >
        {/* Handle */}
        <div
          className="flex-shrink-0 flex flex-col items-center pt-2 pb-0 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          <div className="w-10 h-1 rounded-full" style={{background: "linear-gradient(90deg, #14b8a6, #0ea5e9)"}} />
          <div className="w-full flex justify-between items-center px-4 pt-1.5">
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-slate-400 active:scale-90 rounded-full">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button onClick={() => setHeight(isExpanded ? minH : maxH)} className="w-7 h-7 flex items-center justify-center text-slate-400 active:scale-90 rounded-full">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={isExpanded ? "M19 15l-7-7-7 7" : "M5 15l7-7 7 7"} />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="flex-grow overflow-y-auto no-scrollbar overscroll-none px-4 pb-8"
          style={{ direction: 'ltr', willChange: 'transform', touchAction: 'pan-y' }}
          onTouchStart={(e) => {
            const el = contentRef.current;
            if (el && el.scrollTop === 0) {
              // نسجل نقطة البداية بس — مش نبدأ drag لحد ما نعرف الاتجاه
              isDragging.current = false;
              dragStartY.current = e.touches[0].clientY;
              dragStartHeight.current = height;
            }
          }}
          onTouchMove={(e) => {
            const el = contentRef.current;
            if (!el) return;
            const dy = e.touches[0].clientY - dragStartY.current;
            // بس لو سحب لتحت (dy > 0) وفي أعلى الـ scroll
            if (el.scrollTop === 0 && dy > 8) {
              if (!isDragging.current) {
                isDragging.current = true;
                if (sheetRef.current) sheetRef.current.style.transition = 'none';
              }
              e.preventDefault();
              const newH = Math.min(maxH, Math.max(80, dragStartHeight.current - dy));
              setHeight(newH);
            }
          }}
          onTouchEnd={(e) => {
            if (isDragging.current) onDragEnd(e.changedTouches[0].clientY);
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
