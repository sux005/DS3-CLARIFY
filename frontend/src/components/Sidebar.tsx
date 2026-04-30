import { useState } from "react";
import { Sparkles, History, Settings as SettingsIcon } from "lucide-react";

const items = [
  { id: "analyze", label: "Analyze", icon: Sparkles },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar() {
  const [active, setActive] = useState("analyze");

  return (
    <aside className="w-60 shrink-0 bg-sidebar text-sidebar-foreground border-r border-border flex flex-col p-6">
      <div className="mb-12">
        <h1 className="text-xl font-bold tracking-[0.2em] text-foreground">CLARIFY</h1>
        <div className="mt-2 h-[2px] w-10 bg-gradient-to-r from-primary to-primary-glow rounded-full" />
      </div>

      <nav className="flex flex-col gap-1">
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-accent text-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/8%)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-primary-glow" : ""}`} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 text-xs text-muted-foreground">
        v0.1 · beta
      </div>
    </aside>
  );
}
