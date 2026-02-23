import React from 'react';

const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-dark-card rounded-3xl p-4 shadow-sm border border-slate-100 dark:border-dark-border animate-pulse">
    <div className="flex gap-3 items-start">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
      <div className="flex-grow space-y-2">
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/4" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-1/2" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-lg w-2/3" />
      </div>
      <div className="w-14 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0" />
    </div>
    <div className="flex gap-2 mt-3">
      <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full" />
      <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full" />
    </div>
  </div>
);

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3 animate-fade-in">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default SkeletonCard;
