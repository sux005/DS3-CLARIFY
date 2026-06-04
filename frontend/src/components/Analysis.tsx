import { ReactNode } from "react";
import { Cpu, Disc3, Flame, Loader2, AlertCircle, Music2, Zap } from "lucide-react";
import { Panel } from "./Panel";
import type { Prediction } from "@/services/predictionService";

function SubCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
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

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground truncate">{value}</span>
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
  const maxConceptScore = Math.max(...concepts.map((c) => c.score), 1);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Panel title="Analysis">
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing your song…</p>
          <p className="text-xs text-muted-foreground/60 text-center max-w-[200px]">
            First-time searches may take 30–60s while audio is processed
          </p>
        </div>
      </Panel>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <Panel title="Analysis">
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16">
          <AlertCircle className="h-9 w-9 text-destructive" />
          <p className="text-sm text-destructive text-center max-w-[220px]">{error}</p>
        </div>
      </Panel>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!prediction) {
    return (
      <Panel title="Analysis">
        <div className="flex flex-col gap-4">
          <SubCard title="Model Outputs" icon={<Cpu className="h-4 w-4" />}>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Run an analysis to see CBM concept predictions.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Love", "Heartbreak", "Partying", "Success", "Loneliness"].map((label) => (
                <span key={label} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-md bg-secondary text-muted-foreground">
                  {label}
                </span>
              ))}
            </div>
          </SubCard>
          <SubCard title="Song Recommendations" icon={<Disc3 className="h-4 w-4" />}>
            <ul className="space-y-2">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-center gap-3 rounded-lg bg-secondary/40 px-3 py-2">
                  <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary/40 to-primary-glow/40 flex-shrink-0" />
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
              <div className="text-4xl font-bold bg-gradient-to-br from-primary to-primary-glow bg-clip-text text-transparent">0</div>
              <span className="text-sm text-muted-foreground mb-1">/ 100</span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-secondary" />
            <p className="text-xs text-muted-foreground mt-2">Awaiting analysis to estimate commercial potential.</p>
          </SubCard>
        </div>
      </Panel>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  return (
    <Panel title="Analysis">
      <div className="flex flex-col gap-4">

        {/* Song Header */}
        {prediction.title && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center flex-shrink-0 shadow-[var(--shadow-glow)]">
              <Music2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{prediction.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {prediction.artist}{prediction.year ? ` · ${prediction.year}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Audio Profile */}
        <SubCard title="Audio Profile" icon={<Zap className="h-4 w-4" />}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {prediction.key    && <StatPill label="Key"        value={prediction.key} />}
            {prediction.tempo  && <StatPill label="Tempo"      value={`${Math.round(prediction.tempo)} BPM`} />}
            {prediction.year   && <StatPill label="Year"       value={prediction.year} />}
            {prediction.mood   && <StatPill label="Mood"       value={prediction.mood} />}
          </div>

          {/* Brightness bar */}
          {prediction.brightness != null && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                <span>Brightness</span>
                <span>{prediction.brightness}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${prediction.brightness}%`, background: "var(--gradient-primary)" }}
                />
              </div>
            </div>
          )}
        </SubCard>

        {/* CBM Concepts */}
        <SubCard title="Lyric Concepts" icon={<Cpu className="h-4 w-4" />}>
          {concepts.length ? (
            <div className="flex flex-col gap-2.5">
              {concepts.slice(0, 5).map((concept) => {
                const pct = Math.round((concept.score / maxConceptScore) * 100);
                return (
                  <div key={concept.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-foreground">{concept.name}</span>
                      <span className="text-muted-foreground">{concept.score.toFixed(1)}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: "var(--gradient-primary)" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              No concept data — song not in the lyrics dataset.
            </p>
          )}
        </SubCard>

        {/* Song Recommendations */}
        <SubCard title="Similar Songs" icon={<Disc3 className="h-4 w-4" />}>
          <ul className="space-y-2">
            {prediction.recommendations.length ? (
              prediction.recommendations.slice(0, 5).map((rec, i) => (
                <li key={`${rec.title}-${i}`} className="flex items-center gap-3 rounded-lg bg-secondary/40 px-3 py-2">
                  <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary/40 to-primary-glow/40 flex-shrink-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-primary-glow">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{rec.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{rec.artist}</p>
                  </div>
                  {rec.similarity != null && (
                    <span className="text-[10px] font-medium text-primary-glow flex-shrink-0">
                      {(rec.similarity * 100).toFixed(0)}%
                    </span>
                  )}
                </li>
              ))
            ) : (
              [1, 2, 3].map((i) => (
                <li key={i} className="flex items-center gap-3 rounded-lg bg-secondary/40 px-3 py-2">
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

        {/* Hit Score */}
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
              style={{ width: `${score}%`, background: "var(--gradient-primary)" }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Fusion model estimate of Billboard rank strength.
          </p>
        </SubCard>

      </div>
    </Panel>
  );
}
