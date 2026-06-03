import { useRef, DragEvent } from "react";
import { Upload, Music, Loader2 } from "lucide-react";
import { Panel } from "./Panel";

interface UploadSongProps {
  file: File | null;
  setFile: (f: File | null) => void;
  title: string;
  setTitle: (v: string) => void;
  artist: string;
  setArtist: (v: string) => void;
  isLoading: boolean;
  onAnalyze: () => void;
}

export function UploadSong({
  file, setFile,
  title, setTitle,
  artist, setArtist,
  isLoading,
  onAnalyze,
}: UploadSongProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("audio/")) return;
    setFile(f);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const canAnalyze = (!!file || title.trim().length > 0) && !isLoading;

  return (
    <Panel title="Upload Song">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`flex-1 min-h-[140px] cursor-pointer rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 p-6 text-center transition-all ${
          file
            ? "border-primary bg-primary/5"
            : "border-border bg-background/40 hover:border-primary/60 hover:bg-background/60"
        }`}
      >
        {file ? (
          <>
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-[var(--shadow-glow)]">
              <Music className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground truncate max-w-[220px]">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Click to change file</p>
          </>
        ) : (
          <>
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Drag & drop audio</p>
              <p className="text-xs text-muted-foreground mt-1">
                MP3, WAV, FLAC, M4A, OGG — or enter title below
              </p>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg,.aac"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Song Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Bohemian Rhapsody"
            className="rounded-lg border border-border bg-input/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Artist</span>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="e.g. Queen"
            className="rounded-lg border border-border bg-input/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={onAnalyze}
        disabled={!canAnalyze}
        className="mt-5 w-full rounded-xl py-3 text-sm font-semibold text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{
          background: "var(--gradient-primary)",
          boxShadow: canAnalyze ? "var(--shadow-glow)" : "none",
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing…
          </>
        ) : (
          "Analyze"
        )}
      </button>
    </Panel>
  );
}
