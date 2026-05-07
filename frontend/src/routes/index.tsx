import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/Sidebar";
import { UploadSong } from "@/components/UploadSong";
import { LyricsInput } from "@/components/LyricsInput";
import { Analysis } from "@/components/Analysis";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Clarify — AI Song Analysis Dashboard" },
      {
        name: "description",
        content:
          "Upload a song, paste lyrics and get AI-powered analysis: model outputs, recommendations and a hit score.",
      },
    ],
  }),
});

function Index() {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-1 lg:grid-cols-3 md:h-full md:min-h-[calc(100vh-4rem)]">
          <UploadSong />
          <LyricsInput />
          <Analysis />
        </div>
      </main>
    </div>
  );
}
