import type { Prediction } from "@/services/predictionService";

export interface HistoryItem {
  id: string;
  title: string;
  artist: string;
  year?: number;
  hitScore: number;
  topConcepts: string[];
  key?: string;
  tempo?: number;
  analyzedAt: string; // ISO timestamp
}

const STORAGE_KEY = "clarify_history";
const MAX_ITEMS = 30;

export function saveToHistory(prediction: Prediction): void {
  if (!prediction.title) return;

  const item: HistoryItem = {
    id:          `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title:       prediction.title,
    artist:      prediction.artist ?? "",
    year:        prediction.year,
    hitScore:    prediction.hitScore,
    topConcepts: prediction.concepts.slice(0, 3).map((c) => c.name),
    key:         prediction.key,
    tempo:       prediction.tempo,
    analyzedAt:  new Date().toISOString(),
  };

  const existing = loadHistory();

  // Avoid duplicate back-to-back entries for the same song
  const isDuplicate =
    existing.length > 0 &&
    existing[0].title === item.title &&
    existing[0].artist === item.artist;

  if (isDuplicate) return;

  const updated = [item, ...existing].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage full — trim and retry
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 10)));
  }
}

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
