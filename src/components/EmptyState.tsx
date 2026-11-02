import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-elevated text-muted">
        {icon}
      </span>
      <p className="text-sm font-semibold">{title}</p>
      {hint && <p className="max-w-xs text-xs text-muted">{hint}</p>}
      {action}
    </div>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-label="Загрузка" role="status">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2">
          <div className="skeleton h-10 w-10 !rounded-md" />
          <div className="flex-1 space-y-1.5">
            <div className="skeleton h-3 w-2/5 !rounded-pill" />
            <div className="skeleton h-2.5 w-1/4 !rounded-pill" />
          </div>
          <div className="skeleton h-2.5 w-8 !rounded-pill" />
        </div>
      ))}
    </div>
  );
}
