const API_URL = import.meta.env.VITE_API_URL ?? "";

export interface SongSearchResult {
  title: string;
  artist: string;
  spotifyId?: string;
  previewUrl?: string;
  audioFeatures?: {
    tempo: number;
    energy: number;
    danceability: number;
    valence: number;
    loudness: number;
    key: number;
    mode: number;
  };
}

export async function searchSong(
  title: string,
  artist: string,
): Promise<SongSearchResult> {
  const params = new URLSearchParams({ title, artist });
  const res = await fetch(`${API_URL}/search?${params}`);
  if (!res.ok) throw new Error(`Song search failed: ${res.statusText}`);
  return res.json();
}
