const API_URL = import.meta.env.VITE_API_URL ?? "";

// Matches the output of song_search.py → extract_librosa_features()
// Used when the user uploads their own audio file (not a known song)
export interface AudioFeatures {
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
}

// Uploads an audio file to the backend, which runs librosa on it and returns features.
// POST /analyze/audio — accepts multipart/form-data with a "file" field
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
