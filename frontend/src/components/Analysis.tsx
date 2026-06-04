import { ReactNode } from "react";
import { Cpu, Disc3, Flame, Loader2, AlertCircle } from "lucide-react";
import { Panel } from "./Panel";
import type { Prediction } from "@/services/predictionService";

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

interface AnalysisProps {
  prediction: Prediction | null;
  isLoading: boolean;
  error: string | null;
}

export function Analysis({ prediction, isLoading, error }: AnalysisProps) {
  const score = prediction?.hitScore ?? 0;
  const concepts = prediction?.concepts ?? [];

  if (isLoading) {
    return (
      <Panel title="Analysis">
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing your song...</p>
          <p className="text-xs text-muted-foreground/60">
            First-time searches download audio, which may take 30-60s.
          </p>
        </div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel title="Analysis">
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-12">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive text-center max-w-[220px]">{error}</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Analysis">
      <div className="flex flex-col gap-4">
        <SubCard title="Model Outputs" icon={<Cpu className="h-4 w-4" />}>
          {prediction && concepts.length ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {concepts.slice(0, 5).map((concept) => (
                <div key={concept.name} className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {concept.name}
                  </span>
                  <span className="text-xs font-medium text-foreground px-2 py-1 rounded-md bg-secondary">
                    {concept.score.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Run an analysis to see CBM concept predictions.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Love", "Heartbreak", "Partying", "Success"].map((label) => (
                  <span
                    key={label}
                    className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-secondary text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </>
          )}
        </SubCard>

        <SubCard title="Song Recommendations" icon={<Disc3 className="h-4 w-4" />}>
          <ul className="space-y-2">
            {prediction?.recommendations?.length ? (
              prediction.recommendations.map((rec, i) => (
                <li
                  key={`${rec.title}-${rec.artist}-${i}`}
                  className="flex items-center gap-3 rounded-lg bg-secondary/40 px-3 py-2"
                >
                  <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary/40 to-primary-glow/40 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{rec.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{rec.artist}</p>
                  </div>
                  {typeof rec.similarity === "number" ? (
                    <span className="text-[10px] text-muted-foreground">
                      {(rec.similarity * 100).toFixed(0)}%
                    </span>
                  ) : null}
                </li>
              ))
            ) : (
              [1, 2, 3].map((i) => (
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
              ))
            )}
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
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${score}%`,
                background: "var(--gradient-primary)",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {prediction
              ? "Fusion model estimate of Billboard rank strength."
              : "Awaiting analysis to estimate commercial potential."}
          </p>
        </SubCard>
      </div>
    </Panel>
  );
}
