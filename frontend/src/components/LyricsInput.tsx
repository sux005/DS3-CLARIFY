import { useState } from "react";
import { Panel } from "./Panel";

export function LyricsInput() {
  const [lyrics, setLyrics] = useState("");
  const wordCount = lyrics.trim() ? lyrics.trim().split(/\s+/).length : 0;

  return (
    <Panel title="Lyrics">
      <textarea
        value={lyrics}
        onChange={(e) => setLyrics(e.target.value)}
        placeholder="Paste lyrics..."
        className="flex-1 w-full resize-none rounded-xl border border-border bg-background/40 p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
      />
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{wordCount} words</span>
        <span>{lyrics.length} chars</span>
      </div>
    </Panel>
  );
}
