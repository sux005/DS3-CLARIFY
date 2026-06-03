import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { UploadSong } from "@/components/UploadSong";
import { LyricsInput } from "@/components/LyricsInput";
import { Analysis } from "@/components/Analysis";
import { searchSong } from "@/services/songService";
import { extractAudioFeatures } from "@/services/audioService";
import { analyzeLyrics } from "@/services/lyricsService";
import { predict, type Prediction } from "@/services/predictionService";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Clarify — AI Song Analysis" },
      {
        name: "description",
        content:
          "Upload a song, paste lyrics and get AI-powered analysis: model outputs, recommendations and a hit score.",
      },
    ],
  }),
});

function Index() {
  // Shared input state (lifted from UploadSong + LyricsInput)
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [lyrics, setLyrics] = useState("");

  // Analysis state
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    // Need at least a file or a song title
    if (!file && !title.trim()) return;

    // Backend must be configured
    if (!import.meta.env.VITE_API_URL) {
      setError("Backend not connected yet — deploy the Render API and set VITE_API_URL.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      // Run audio retrieval and lyrics analysis in parallel
      const [audioResult, lyricsResult] = await Promise.all([
        file
          ? extractAudioFeatures(file)                      // uploaded file → librosa
          : searchSong(title.trim(), artist.trim()),        // title/artist → song_search.py
        lyrics.trim()
          ? analyzeLyrics(lyrics.trim())
          : Promise.resolve(null),
      ]);

      if (!audioResult) {
        setError(`"${title}" wasn't found. Try a different song name or artist.`);
        return;
      }

      const result = await predict(audioResult, lyricsResult);
      setPrediction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed — check the console.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-1 lg:grid-cols-3 md:h-full md:min-h-[calc(100vh-4rem)]">
          <UploadSong
            file={file}
            setFile={setFile}
            title={title}
            setTitle={setTitle}
            artist={artist}
            setArtist={setArtist}
            isLoading={isLoading}
            onAnalyze={handleAnalyze}
          />
          <LyricsInput lyrics={lyrics} setLyrics={setLyrics} />
          <Analysis prediction={prediction} isLoading={isLoading} error={error} />
        </div>
      </main>
    </div>
  );
}
