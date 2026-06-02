const API_URL = import.meta.env.VITE_API_URL ?? "";

export interface LyricsFeatures {
  sentiment: number;
  mood: string;
  wordCount: number;
  uniqueWordRatio: number;
  topThemes: string[];
}

// Sends raw lyrics text to the NLP pipeline (Max/Dilraj's backend).
export async function analyzeLyrics(lyrics: string): Promise<LyricsFeatures> {
  const res = await fetch(`${API_URL}/analyze/lyrics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lyrics }),
  });
  if (!res.ok) throw new Error(`Lyrics analysis failed: ${res.statusText}`);
  return res.json();
}
