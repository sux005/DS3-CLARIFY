import type { AudioFeatures } from "./audioService";
import type { LyricsFeatures } from "./lyricsService";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export interface SongRecommendation {
  title: string;
  artist: string;
  reason: string;
}

export interface Prediction {
  hitScore: number;
  nostalgiaScore: number;
  genre: string;
  mood: string;
  tempo: number;
  key: string;
  recommendations: SongRecommendation[];
}

// Sends combined audio + lyrics features to the ML model, returns hit/nostalgia scores.
export async function predict(
  audioFeatures: AudioFeatures,
  lyricsFeatures: LyricsFeatures,
): Promise<Prediction> {
  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audioFeatures, lyricsFeatures }),
  });
  if (!res.ok) throw new Error(`Prediction failed: ${res.statusText}`);
  return res.json();
}
