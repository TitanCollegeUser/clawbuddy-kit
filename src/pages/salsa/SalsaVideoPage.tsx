import { useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Plus, Trash2, BookmarkPlus } from "lucide-react";
import { VideoPlayer, type VideoPlayerHandle } from "@/components/salsa/VideoPlayer";
import { Whiteboard } from "@/components/salsa/Whiteboard";
import { useSalsaLibrary } from "@/contexts/SalsaLibraryContext";
import { LIBRARY_ITEMS } from "@/data/salsaData";
import type { LibraryEntry } from "@/components/salsa/LibraryItem";

interface Note {
  id: string;
  text: string;
  timestamp: number;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function SalsaVideoPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { userItems } = useSalsaLibrary();
  const playerRef = useRef<VideoPlayerHandle>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [activePanel, setActivePanel] = useState<"whiteboard" | "notes">("whiteboard");

  // Find the item — user items first, then mock data
  const item: LibraryEntry | undefined =
    (location.state as any)?.item ??
    userItems.find((i) => i.id === id) ??
    LIBRARY_ITEMS.find((i) => i.id === id);

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-white/50">Video not found.</p>
        <button onClick={() => navigate("/salsa/library")} className="text-red-400 text-sm">
          Back to Library
        </button>
      </div>
    );
  }

  function addNote() {
    const text = noteInput.trim();
    if (!text) return;
    const timestamp = playerRef.current?.getCurrentTime() ?? 0;
    setNotes((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, timestamp },
    ]);
    setNoteInput("");
  }

  function deleteNote(noteId: string) {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  function seekTo(t: number) {
    playerRef.current?.seekTo(t);
  }

  const hasYoutube = !!item.youtubeId;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#0f0f0f] border-b border-white/10 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-white truncate">{item.title}</h1>
          <p className="text-xs text-white/40">
            {item.category} · {item.style} · {item.bpm} BPM
          </p>
        </div>
        <div className="flex gap-1">
          <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded">
            {item.beat}
          </span>
          <span className="text-[10px] font-bold bg-red-700 text-white px-2 py-1 rounded">
            {item.style}
          </span>
        </div>
      </div>

      {/* Main layout — desktop: side by side, mobile: stacked */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">

        {/* Left: Video */}
        <div className="lg:w-[55%] flex flex-col bg-black shrink-0 lg:border-r lg:border-white/10">
          <div className="flex-1 flex flex-col justify-center p-3 lg:p-4 min-h-0">
            {hasYoutube ? (
              <VideoPlayer ref={playerRef} videoId={item.youtubeId!} />
            ) : (
              <div className="aspect-video bg-[#1a1a1a] rounded-xl flex flex-col items-center justify-center gap-3">
                <div className="text-4xl opacity-30">🎬</div>
                <p className="text-sm text-white/30">No video attached</p>
              </div>
            )}
          </div>

          {/* Mobile panel toggle */}
          <div className="lg:hidden flex border-t border-white/10">
            {(["whiteboard", "notes"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setActivePanel(p)}
                className={`flex-1 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 ${
                  activePanel === p
                    ? "text-red-400 border-red-500"
                    : "text-white/40 border-transparent"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Whiteboard + Notes */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Desktop tabs */}
          <div className="hidden lg:flex border-b border-white/10">
            {(["whiteboard", "notes"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setActivePanel(p)}
                className={`px-5 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activePanel === p
                    ? "text-red-400 border-red-500"
                    : "text-white/40 border-transparent hover:text-white"
                }`}
              >
                {p}
                {p === "notes" && notes.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded-full">
                    {notes.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Whiteboard panel */}
          {(activePanel === "whiteboard" || window.innerWidth >= 1024) && (
            <div className={`flex-1 p-3 lg:p-4 min-h-0 ${activePanel !== "whiteboard" ? "hidden lg:flex" : "flex"} flex-col`}>
              <Whiteboard className="flex-1" />
            </div>
          )}

          {/* Notes panel */}
          {activePanel === "notes" && (
            <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
              {/* Add note */}
              <div className="shrink-0">
                <div className="flex gap-2">
                  <input
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addNote()}
                    placeholder="Add a note at current timestamp..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
                  />
                  <button
                    onClick={addNote}
                    disabled={!noteInput.trim()}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {hasYoutube && (
                  <p className="text-[11px] text-white/30 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Note will be timestamped at current video position
                  </p>
                )}
              </div>

              {/* Notes list */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {notes.length === 0 && (
                  <div className="text-center py-12 text-white/20">
                    <BookmarkPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notes yet.</p>
                    <p className="text-xs mt-1">Pause the video and type a note above.</p>
                  </div>
                )}
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 group transition-colors"
                  >
                    <button
                      onClick={() => seekTo(note.timestamp)}
                      className="text-[11px] font-mono bg-red-600/20 text-red-400 px-2 py-1 rounded shrink-0 hover:bg-red-600/30 transition-colors"
                    >
                      {formatTime(note.timestamp)}
                    </button>
                    <p className="text-sm text-white/80 flex-1 leading-snug pt-0.5">{note.text}</p>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 pt-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
