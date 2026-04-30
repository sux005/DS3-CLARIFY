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
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[calc(100vh-4rem)]">
          <UploadSong />
          <LyricsInput />
          <Analysis />
        </div>
      </main>
    </div>
  );
}
