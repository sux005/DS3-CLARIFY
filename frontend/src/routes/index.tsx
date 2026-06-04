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
      { title: "CLARIFY — AI Song Analysis" },
      {
        name: "description",
        content:
          "Upload a song, paste lyrics and get AI-powered analysis: CBM concepts, song recommendations and a hit score.",
      },
    ],
  }),
});

function Index() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!file && !title.trim()) return;

    if (!import.meta.env.VITE_API_URL) {
      setError("Backend not connected yet — deploy the Render API and set VITE_API_URL.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPrediction(null);

    try {
      const [audioResult, lyricsResult] = await Promise.all([
        file
          ? extractAudioFeatures(file)
          : searchSong(title.trim(), artist.trim()),
        lyrics.trim() ? analyzeLyrics(lyrics.trim()) : Promise.resolve(null),
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
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {/* Two-column layout: inputs left, analysis right (bigger) */}
        <div className="h-full grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6 min-h-[calc(100vh-3rem)]">

          {/* Left column — Upload + Lyrics stacked, Lyrics grows to fill */}
          <div className="flex flex-col gap-4 lg:col-span-2 h-full">
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
          </div>

          {/* Right column — Analysis (wider) */}
          <div className="lg:col-span-3 flex flex-col">
            <Analysis
              prediction={prediction}
              isLoading={isLoading}
              error={error}
            />
          </div>

        </div>
      </main>
    </div>
  );
}
