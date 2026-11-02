import type { ReactNode } from "react";

/** Horizontally scrolling shelf with a title. */
export function Shelf({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="animate-fade-up">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="section-title">{title}</h2>
        {action}
      </div>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </section>
  );
}
