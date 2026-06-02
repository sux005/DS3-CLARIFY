const API_URL = import.meta.env.VITE_API_URL ?? "";

export interface AudioFeatures {
  tempo: number;
  key: string;
  loudness: number;
  energy: number;
  spectralCentroid: number;
  mfccs: number[];
  chroma: number[];
}

// Uploads audio file to the backend (Render), returns librosa-extracted features.
export async function extractAudioFeatures(file: File): Promise<AudioFeatures> {
  const body = new FormData();
  body.append("file", file);

  const res = await fetch(`${API_URL}/analyze/audio`, {
    method: "POST",
    body,
  });
  if (!res.ok) throw new Error(`Audio analysis failed: ${res.statusText}`);
  return res.json();
}
