import React, { useRef, useState, useCallback } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  language?: 'ar' | 'en';
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, language = 'ar' }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const THRESHOLD = 70;
  const ar = language === 'ar';

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const el = e.currentTarget as HTMLElement;
    if (el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const el = e.currentTarget as HTMLElement;
    if (el.scrollTop > 0) { isPulling.current = false; return; }
    const dist = Math.max(0, e.touches[0].clientY - startY.current);
    setPullDistance(Math.min(dist * 0.5, THRESHOLD + 20));
  }, [isRefreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD);
      try { await onRefresh(); } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const isReady = pullDistance >= THRESHOLD;

  return (
    <div className="relative h-full overflow-hidden">
      {/* مؤشر السحب */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 transition-all duration-200"
        style={{ height: pullDistance, opacity: progress }}
      >
        <div className={`flex items-center gap-2 bg-white dark:bg-dark-card rounded-full px-4 py-2 shadow-lg ${isReady ? 'scale-110' : 'scale-100'} transition-transform`}>
          {isRefreshing ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              className="w-4 h-4 text-primary transition-transform duration-200"
              style={{ transform: `rotate(${progress * 180}deg)` }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
          <span className="text-[11px] font-black text-primary">
            {isRefreshing
              ? (ar ? 'جاري التحديث...' : 'Refreshing...')
              : isReady
                ? (ar ? 'أرسل للتحديث' : 'Release to refresh')
                : (ar ? 'اسحب للتحديث' : 'Pull to refresh')}
          </span>
        </div>
      </div>

      {/* المحتوى */}
      <div
        className="h-full overflow-y-auto no-scrollbar"
        style={{ transform: `translateY(${pullDistance}px)`, transition: isPulling.current ? 'none' : 'transform 0.3s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
