import { ReactNode } from "react";
import { Cpu, Disc3, Flame } from "lucide-react";
import { Panel } from "./Panel";

function SubCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center text-primary-glow">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function Analysis() {
  const score = 0;

  return (
    <Panel title="Analysis">
      <div className="flex flex-col gap-4">
        <SubCard title="Model Outputs" icon={<Cpu className="h-4 w-4" />}>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Run an analysis to see model predictions — genre, mood, tempo, key and
            sentiment will appear here.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Genre", "Mood", "Tempo", "Key"].map((t) => (
              <span
                key={t}
                className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-secondary text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </SubCard>

        <SubCard title="Song Recommendations" icon={<Disc3 className="h-4 w-4" />}>
          <ul className="space-y-2">
            {[1, 2, 3].map((i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-lg bg-secondary/40 px-3 py-2"
              >
                <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary/40 to-primary-glow/40" />
                <div className="flex-1 min-w-0">
                  <div className="h-2.5 w-24 rounded-full bg-muted" />
                  <div className="h-2 w-16 rounded-full bg-muted/60 mt-1.5" />
                </div>
              </li>
            ))}
          </ul>
        </SubCard>

        <SubCard title="Hit Score" icon={<Flame className="h-4 w-4" />}>
          <div className="flex items-end gap-3">
            <div className="text-4xl font-bold bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">
              {score}
            </div>
            <span className="text-sm text-muted-foreground mb-1">/ 100</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${score}%`,
                background: "var(--gradient-primary)",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Awaiting analysis to estimate commercial potential.
          </p>
        </SubCard>
      </div>
    </Panel>
  );
}
