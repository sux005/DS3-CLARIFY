import type { AudioFeatures } from "./audioService";
import type { SongRecord } from "./songService";
import type { LyricsFeatures } from "./lyricsService";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export interface SongRecommendation {
  title: string;
  artist: string;
  reason: string;
  similarity?: number;
  song_id?: string;
  audio_id?: string;
}

export interface ConceptScore {
  name: string;
  score: number;
  column?: string;
}

export interface Prediction {
  hitScore: number; // 0-100
  concepts: ConceptScore[];
  recommendations: SongRecommendation[];
}

function normalizePrediction(data: any): Prediction {
  const rawScore = data.hitScore ?? data.hit_score?.score_100 ?? data.hit_score?.score ?? 0;
  const concepts = data.concepts ?? data.model_outputs?.concepts ?? [];

  return {
    hitScore: Math.round(Number(rawScore) || 0),
    concepts: concepts.map((concept: any) => ({
      name: String(concept.name ?? concept.label ?? ""),
      score: Number(concept.score ?? concept.value ?? 0),
      column: concept.column,
    })),
    recommendations: (data.recommendations ?? []).map((rec: any) => ({
      title: String(rec.title ?? rec.recommended_title ?? ""),
      artist: String(rec.artist ?? rec.recommended_artist ?? ""),
      reason: String(rec.reason ?? "Similar audio, lyrics, and CBM concepts"),
      similarity: rec.similarity,
      song_id: rec.song_id ?? rec.recommended_song_id,
      audio_id: rec.audio_id ?? rec.recommended_audio_id,
    })),
  };
}

// Sends combined audio + lyrics features to the ML model.
// audioInput can be a SongRecord from searchSong or AudioFeatures from file upload.
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
  return normalizePrediction(await res.json());
}
