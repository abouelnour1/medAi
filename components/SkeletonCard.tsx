import React from "react";

const SkeletonCard: React.FC = () => (
  <div
    className="bg-white dark:bg-dark-card rounded-xl p-4 border border-slate-100/80 dark:border-dark-border"
    style={{ boxShadow: "var(--shadow-sm)" }}
  >
    <div className="flex gap-3 items-start">
      <div className="w-14 h-14 rounded-xl flex-shrink-0 skeleton" />
      <div className="flex-grow space-y-2 pt-0.5">
        <div className="h-3 skeleton rounded-lg w-1/4" />
        <div className="h-4 skeleton rounded-lg w-3/4" />
        <div className="h-3 skeleton rounded-lg w-1/2" />
      </div>
      <div className="w-14 h-12 skeleton rounded-xl flex-shrink-0" />
    </div>
    <div className="flex gap-2 mt-3">
      <div className="h-5 w-14 skeleton rounded-lg" />
      <div className="h-5 w-16 skeleton rounded-lg" />
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
