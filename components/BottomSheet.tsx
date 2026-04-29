import React, { useEffect, useRef, useState, useCallback } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[];
  skipOpenAnimation?: boolean;
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
  const handleRef       = useRef<HTMLDivElement>(null);
  const dragStartY      = useRef(0);
  const dragStartX      = useRef(0);
  const dragStartHeight = useRef(0);
  const isDragging      = useRef(false);

  const vh = window.innerHeight;
  const minH = Math.round(vh * snapPoints[0]);
  const maxH = Math.round(vh * snapPoints[1]);

  const [height, setHeight]   = useState(minH);
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  // Open/close animation
  useEffect(() => {
    if (isOpen) {
      setHeight(minH);
      if (skipOpenAnimation) {
        setVisible(true);
        setAnimate(true);
        if (sheetRef.current) {
          sheetRef.current.style.transition = 'none';
          requestAnimationFrame(() => {
            if (sheetRef.current) sheetRef.current.style.transition = '';
          });
        }
      } else {
        setAnimate(false);
        setVisible(true);
        const id = requestAnimationFrame(() =>
          requestAnimationFrame(() => setAnimate(true))
        );
        return () => cancelAnimationFrame(id);
      }
    } else {
      setAnimate(false);
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [isOpen, minH, skipOpenAnimation]);

  // ── Drag logic (handle only) ───────────────────────────────────────────────
  const onDragStart = useCallback((clientY: number, clientX: number) => {
    isDragging.current      = true;
    dragStartY.current      = clientY;
    dragStartX.current      = clientX;
    dragStartHeight.current = height;
    if (sheetRef.current) sheetRef.current.style.transition = 'none';
  }, [height]);

  const onDragMove = useCallback((clientY: number, clientX: number) => {
    if (!isDragging.current) return;
    const dy = dragStartY.current - clientY;
    const dx = Math.abs(dragStartX.current - clientX);
    // horizontal swipe مش drag للـ sheet
    if (dx > Math.abs(dy) * 1.5) return;
    const resistance = dy > 0 ? 1 : 0.6;
    const newH = Math.min(maxH, Math.max(80, dragStartHeight.current + dy * resistance));
    setHeight(newH);
  }, [maxH]);

  const onDragEnd = useCallback((clientY: number) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (sheetRef.current) sheetRef.current.style.transition = '';
    const delta = dragStartY.current - clientY;
    const cur   = dragStartHeight.current + delta;
    if (cur < minH * 0.75) { onClose(); return; }
    const mid = (minH + maxH) / 2;
    setHeight(cur > mid ? maxH : minH);
  }, [minH, maxH, onClose]);

  // Handle touch — ONLY on the handle bar, not on content
  const onHandleTouchStart = (e: React.TouchEvent) => {
    onDragStart(e.touches[0].clientY, e.touches[0].clientX);
  };
  const onHandleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // handle bar drag: prevent scroll
    onDragMove(e.touches[0].clientY, e.touches[0].clientX);
  };
  const onHandleTouchEnd = (e: React.TouchEvent) => {
    onDragEnd(e.changedTouches[0].clientY);
  };

  // Mouse (web only)
  const onHandleMouseDown = (e: React.MouseEvent) => {
    onDragStart(e.clientY, e.clientX);
    const move = (ev: MouseEvent) => onDragMove(ev.clientY, ev.clientX);
    const up   = (ev: MouseEvent) => {
      onDragEnd(ev.clientY);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  // Content scroll-to-drag: لما الـ user يسحب لتحت وهو في أعلى الـ scroll
  // نستخدم native touch event listener عشان نقدر نتحكم في passive
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    let startY = 0;
    let startX = 0;
    let startH = 0;
    let dragging = false;

    const onStart = (e: TouchEvent) => {
      startY   = e.touches[0].clientY;
      startX   = e.touches[0].clientX;
      startH   = height;
      dragging = false;
    };

    const onMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - startY;
      const dx = Math.abs(e.touches[0].clientX - startX);

      // بدأنا drag للـ sheet: لما scroll في أعلى + سحب لتحت + مش horizontal
      if (!dragging && el.scrollTop === 0 && dy > 10 && dy > dx * 1.5) {
        dragging = true;
        if (sheetRef.current) sheetRef.current.style.transition = 'none';
      }

      if (dragging) {
        e.preventDefault(); // منع الـ scroll
        const newH = Math.min(maxH, Math.max(80, startH - dy * 0.6));
        setHeight(newH);
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (!dragging) return;
      dragging = false;
      if (sheetRef.current) sheetRef.current.style.transition = '';
      const dy  = e.changedTouches[0].clientY - startY;
      const cur = startH - dy;
      if (cur < minH * 0.75) { onClose(); return; }
      const mid = (minH + maxH) / 2;
      setHeight(cur > mid ? maxH : minH);
    };

    // { passive: false } عشان نقدر نعمل preventDefault
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
    };
  }, [height, minH, maxH, onClose]);

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
          transition: 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), height 0.15s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.12s ease',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          willChange: 'transform, height',
          contain: 'layout style',
        }}
      >
        {/* Handle — الـ drag بيشتغل هنا بس */}
        <div
          ref={handleRef}
          className="flex-shrink-0 flex flex-col items-center pt-2 pb-0 cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'none' }}
          onTouchStart={onHandleTouchStart}
          onTouchMove={onHandleTouchMove}
          onTouchEnd={onHandleTouchEnd}
          onMouseDown={onHandleMouseDown}
        >
          <div className="w-10 h-1 rounded-full" style={{ background: 'linear-gradient(90deg, #14b8a6, #0ea5e9)' }} />
          <div className="w-full flex justify-between items-center px-4 pt-1.5">
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-slate-400 active:scale-90 rounded-full">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button onClick={() => setHeight(isExpanded ? minH : maxH)} className="w-7 h-7 flex items-center justify-center text-slate-400 active:scale-90 rounded-full">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={isExpanded ? 'M19 15l-7-7-7 7' : 'M5 15l7-7 7 7'} />
              </svg>
            </button>
          </div>
        </div>

        {/* Content — free scroll, no touch interception on React side */}
        <div
          ref={contentRef}
          className="flex-grow overflow-y-auto no-scrollbar px-4 bg-white dark:bg-dark-card"
          style={{
            touchAction: 'pan-y',
            overscrollBehavior: 'contain',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            direction: 'ltr',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default BottomSheet;
