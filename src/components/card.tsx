import type { ReactNode } from "react";

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 shadow-sm ${className}`}>
      {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2 text-xl font-bold tracking-tight">
      <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-honey text-honey-ink">✓</span>
      Honeydone
    </span>
  );
}
