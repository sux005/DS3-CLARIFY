import type { AudioFeatures } from "./audioService";
import type { SongRecord } from "./songService";
import type { LyricsFeatures } from "./lyricsService";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export interface SongRecommendation {
  title: string;
  artist: string;
  reason: string;
}

export interface Prediction {
  hitScore: number;        // 0–100
  nostalgiaScore: number;  // 0–100
  genre: string;
  mood: string;
  tempo: number;
  key: string;
  recommendations: SongRecommendation[];
}

// Sends combined audio + lyrics features to the ML model.
// audioInput can be a SongRecord (from searchSong) or AudioFeatures (from file upload).
// lyricsFeatures is null when no lyrics were provided.
export async function predict(
  audioInput: AudioFeatures | SongRecord,
  lyricsFeatures: LyricsFeatures | null,
): Promise<Prediction> {
  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioFeatures: audioInput, lyricsFeatures }),
  });
  if (!res.ok) throw new Error(`Prediction failed: ${res.statusText}`);
  return res.json();
}
