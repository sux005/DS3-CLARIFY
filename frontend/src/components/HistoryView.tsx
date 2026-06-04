import { useState, useEffect } from "react";
import { Music2, Clock, Trash2, Flame } from "lucide-react";
import { loadHistory, clearHistory, type HistoryItem } from "@/lib/history";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90 ? "text-emerald-400 bg-emerald-400/10" :
    score >= 85 ? "text-primary-glow bg-primary/10" :
                  "text-muted-foreground bg-secondary";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      <Flame className="h-3 w-3" />
      {score}
    </span>
  );
}

export function HistoryView() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setItems(loadHistory());
  }, []);

  const handleClear = () => {
    clearHistory();
    setItems([]);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 py-24 text-center">
        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
          <Clock className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">No history yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Analyze a song to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-foreground">History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{items.length} song{items.length !== 1 ? "s" : ""} analyzed</p>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-3 overflow-y-auto min-h-0 pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-border bg-background/40 p-4 hover:border-primary/30 hover:bg-background/60 transition-all"
          >
            {/* Song title row */}
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/40 to-primary-glow/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Music2 className="h-4 w-4 text-primary-glow" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{item.title}</p>
                  <ScoreBadge score={item.hitScore} />
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {item.artist}{item.year ? ` · ${item.year}` : ""}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
              {item.key   && <span className="font-medium text-foreground">{item.key}</span>}
              {item.tempo && <span>{Math.round(item.tempo)} BPM</span>}
              <span className="ml-auto">{timeAgo(item.analyzedAt)}</span>
            </div>

            {/* Concept tags */}
            {item.topConcepts.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {item.topConcepts.map((concept) => (
                  <span
                    key={concept}
                    className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
