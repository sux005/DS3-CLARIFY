import { ReactNode } from "react";

export function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex flex-col rounded-2xl border border-border bg-panel text-panel-foreground p-6 ${className}`}
      style={{
        background: "var(--gradient-panel)",
        boxShadow: "var(--shadow-panel)",
      }}
    >
      <h2 className="text-base font-semibold tracking-tight mb-5">{title}</h2>
      <div className="flex-1 flex flex-col min-h-0">{children}</div>
    </section>
  );
}
