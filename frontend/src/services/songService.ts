const API_URL = import.meta.env.VITE_API_URL ?? "";

// Matches the output of song_search.py → get_song_features()
// Keys follow the Python naming convention (SCREAMING_SNAKE for IDs, snake_case for features)
export interface SongRecord {
  SONG_ID: number;
  SONG_TITLE: string;
  ARTIST_NAME: string;
  year: number;

  // librosa features (from extract_librosa_features)
  tempo: number;
  mfcc_1: number;  mfcc_2: number;  mfcc_3: number;  mfcc_4: number;  mfcc_5: number;
  mfcc_6: number;  mfcc_7: number;  mfcc_8: number;  mfcc_9: number;  mfcc_10: number;
  mfcc_11: number; mfcc_12: number; mfcc_13: number;
  chroma_mean_1:  number; chroma_mean_2:  number; chroma_mean_3:  number;
  chroma_mean_4:  number; chroma_mean_5:  number; chroma_mean_6:  number;
  chroma_mean_7:  number; chroma_mean_8:  number; chroma_mean_9:  number;
  chroma_mean_10: number; chroma_mean_11: number; chroma_mean_12: number;
  chroma_std_1:  number; chroma_std_2:  number; chroma_std_3:  number;
  chroma_std_4:  number; chroma_std_5:  number; chroma_std_6:  number;
  chroma_std_7:  number; chroma_std_8:  number; chroma_std_9:  number;
  chroma_std_10: number; chroma_std_11: number; chroma_std_12: number;
  spectral_centroid: number;

  // Spotify audio features (optional — absent for local-only records)
  spotify_tempo?:            number;
  spotify_key?:              number;
  spotify_mode?:             number;
  spotify_energy?:           number;
  spotify_danceability?:     number;
  spotify_valence?:          number;
  spotify_acousticness?:     number;
  spotify_instrumentalness?: number;
  spotify_liveness?:         number;
  spotify_speechiness?:      number;
  spotify_loudness?:         number;
  spotify_duration_ms?:      number;
}

// Calls the backend's /search endpoint which runs song_search.py → get_song_features()
export async function searchSong(
  title: string,
  artist: string,
): Promise<SongRecord | null> {
  const params = new URLSearchParams({ title, artist });
  const res = await fetch(`${API_URL}/search?${params}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Song search failed: ${res.statusText}`);
  return res.json();
}
