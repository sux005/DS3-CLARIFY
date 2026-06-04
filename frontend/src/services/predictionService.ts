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
  hitScore: number;
  concepts: ConceptScore[];
  recommendations: SongRecommendation[];
  key?: string;
  tempo?: number;
  brightness?: number;
  year?: number;
  title?: string;
  artist?: string;
  mood?: string | null;
}

function normalizePrediction(data: any): Prediction {
  const rawScore = data.hitScore ?? data.hit_score?.score_100 ?? data.hit_score?.score ?? 0;
  const concepts = data.concepts ?? data.model_outputs?.concepts ?? [];

  return {
    hitScore:    Math.round(Number(rawScore) || 0),
    key:         data.key ?? undefined,
    tempo:       data.tempo ? Number(data.tempo) : undefined,
    brightness:  data.brightness != null ? Number(data.brightness) : undefined,
    year:        data.year ? Number(data.year) : undefined,
    title:       data.title || undefined,
    artist:      data.artist || undefined,
    mood:        data.mood ?? null,
    concepts: concepts.map((c: any) => ({
      name:   String(c.name ?? c.label ?? ""),
      score:  Number(c.score ?? c.value ?? 0),
      column: c.column,
    })),
    recommendations: (data.recommendations ?? []).map((rec: any) => ({
      title:      String(rec.title ?? ""),
      artist:     String(rec.artist ?? ""),
      reason:     String(rec.reason ?? "Similar audio, lyrics, and CBM concepts"),
      similarity: rec.similarity,
      song_id:    rec.song_id,
      audio_id:   rec.audio_id,
    })),
  };
}

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
