import { useState, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Settings, Eye, Footprints, Grid3x3,
  Play, Pause, RotateCcw, Volume2, Maximize2,
  MousePointer2, PenLine, Type, Eraser,
  Undo2, Redo2, Trash2, Save, BookmarkPlus, Clock, ChevronRight,
} from "lucide-react";
import { VideoPlayer, type VideoPlayerHandle } from "@/components/salsa/VideoPlayer";
import { useSalsaLibrary } from "@/contexts/SalsaLibraryContext";
import { LIBRARY_ITEMS } from "@/data/salsaData";
import type { LibraryEntry } from "@/components/salsa/LibraryItem";
import { SalsaCanvas, type SalsaCanvasHandle } from "@/components/salsa/SalsaCanvas";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────
interface Note { id: string; text: string; timestamp: number }

type DrawTool = "select" | "draw" | "text" | "eraser";
type CountMode = "salsa-on1" | "full-8" | "syncopation" | "custom";
type TimingStyle = "on1" | "on2" | "cuban" | "custom";
type FootSide = "left" | "right";

const COLORS = ["#ffffff","#e53935","#fb8c00","#fdd835","#43a047","#1e88e5","#8e24aa","#e91e63"];
const SIZES = ["1px","2px","4px","8px"];

const ON1_COUNTS = ["1","2","3","5","7"];
const FULL8_COUNTS = ["1","2","3","4","5","6","7","8"];
const SYNCO_COUNTS = ["&","1&","2&","3&","4&","5&","6&","7&","8&"];

const PRESET_PATTERNS = ["Basic Step","Side Step","Cross Body Lead","Right Turn"];

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2,"0")}`;
}

// ── Main Page ─────────────────────────────────────────────────────────────
export function SalsaVideoPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { userItems } = useSalsaLibrary();
  const playerRef = useRef<VideoPlayerHandle>(null);
  const canvasRef = useRef<SalsaCanvasHandle>(null);

  // Video state
  const [mirror, setMirror] = useState(false);
  const [perspective, setPerspective] = useState<"leader"|"follower">("leader");
  const [showPath, setShowPath] = useState(true);
  const [countsOnFloor, setCountsOnFloor] = useState(true);

  // Whiteboard state
  const [rightTab, setRightTab] = useState<"whiteboard"|"notes">("whiteboard");
  const [drawTool, setDrawTool] = useState<DrawTool>("draw");
  const [drawColor, setDrawColor] = useState("#ffffff");
  const [drawSize, setDrawSize] = useState("2px");
  const [countMode, setCountMode] = useState<CountMode>("salsa-on1");
  const [timingStyle, setTimingStyle] = useState<TimingStyle>("on1");
  const [activeFoot, setActiveFoot] = useState<FootSide>("left");
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  // Notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState("");

  // Video tab
  const [videoTab, setVideoTab] = useState<"info"|"sequence"|"chapters"|"resources">("info");

  const item: LibraryEntry | undefined =
    (location.state as any)?.item ??
    userItems.find(i => i.id === id) ??
    LIBRARY_ITEMS.find(i => i.id === id);

  const counts = countMode === "full-8" ? FULL8_COUNTS
    : countMode === "syncopation" ? SYNCO_COUNTS
    : ON1_COUNTS;

  function addNote() {
    const text = noteInput.trim();
    if (!text) return;
    setNotes(prev => [...prev, { id: crypto.randomUUID(), text, timestamp: playerRef.current?.getCurrentTime() ?? 0 }]);
    setNoteInput("");
  }

  function handleCountClick(count: string) {
    canvasRef.current?.addFootstep(count, activeFoot, drawColor);
  }

  function handlePatternClick(pattern: string) {
    canvasRef.current?.addPresetPattern(pattern, timingStyle);
  }

  if (!item) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#0a0a0a]">
      <p className="text-white/50">Video not found.</p>
      <button onClick={() => navigate("/salsa/library")} className="text-red-400 text-sm">Back to Library</button>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#0d0d0d] text-white overflow-hidden">

      {/* ── Top bar ── */}
      <header className="flex items-center gap-4 px-4 h-14 bg-[#111] border-b border-white/10 shrink-0">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-white/40 uppercase tracking-wider">
            {item.category}
          </span>
          <span className="text-sm font-semibold truncate max-w-xs">{item.title}</span>
        </div>
        <div className="flex items-center gap-3 ml-2 text-sm">
          <span className="text-white/40 text-xs">Level</span>
          <span className="text-white/80 text-xs font-medium">Beginner</span>
          <span className="text-white/40 text-xs ml-2">BPM</span>
          <span className="text-white/80 text-xs font-medium">{item.bpm}</span>
          <span className="text-white/40 text-xs ml-2">Timing</span>
          <span className="text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded">{item.style}</span>
        </div>

        {/* Top-right controls */}
        <div className="ml-auto flex items-center gap-1">
          <TopBtn active={mirror} onClick={() => setMirror(v => !v)} icon={<Grid3x3 className="w-4 h-4"/>} label="Mirror" />
          <TopBtn
            active={perspective === "leader"}
            onClick={() => setPerspective(v => v === "leader" ? "follower" : "leader")}
            icon={<Footprints className="w-4 h-4"/>}
            label={perspective === "leader" ? "Leader" : "Follower"}
            activeClass="bg-red-600/30 text-red-400 border-red-600/40"
          />
          <TopBtn active={showPath} onClick={() => setShowPath(v => !v)} icon={<ChevronRight className="w-4 h-4"/>} label="Show Path" />
          <TopBtn active={countsOnFloor} onClick={() => setCountsOnFloor(v => !v)} icon={<Eye className="w-4 h-4"/>} label="Counts on Floor" />
          <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 transition-colors ml-1">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left: Video + lesson info ── */}
        <div className="flex flex-col w-[48%] border-r border-white/10 min-h-0">
          {/* Video */}
          <div className="bg-black relative" style={{ aspectRatio: "16/9" }}>
            {item.youtubeId ? (
              <div className={mirror ? "scale-x-[-1]" : ""} style={{ width: "100%", height: "100%" }}>
                <VideoPlayer ref={playerRef} videoId={item.youtubeId} />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <div className="text-5xl opacity-20">🎬</div>
                <p className="text-sm text-white/30">No video attached</p>
              </div>
            )}
          </div>

          {/* Lesson tabs */}
          <div className="flex border-b border-white/10 shrink-0">
            {(["info","sequence","chapters","resources"] as const).map(t => (
              <button key={t} onClick={() => setVideoTab(t)}
                className={cn("px-4 py-2.5 text-xs font-medium capitalize border-b-2 -mb-px transition-colors",
                  videoTab === t ? "border-red-500 text-red-400" : "border-transparent text-white/40 hover:text-white"
                )}>
                {t === "info" ? "Lesson Info" : t === "sequence" ? "Step Sequence" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {videoTab === "info" && (
              <div className="space-y-4">
                <div>
                  <h2 className="font-semibold text-base mb-1">{item.title}</h2>
                  <p className="text-sm text-white/50 leading-relaxed">
                    Learn the foundational steps of salsa {item.style} timing. This is the building block for all partner work.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["Fundamentals", `${item.style} Timing`, "Footwork"].map(tag => (
                    <span key={tag} className="text-xs bg-white/5 border border-white/10 text-white/60 px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "Duration", value: item.duration || "—" },
                    { label: "Difficulty", value: "Beginner" },
                    { label: "BPM", value: String(item.bpm) },
                    { label: "Timing", value: item.style },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white/5 rounded-xl p-3 text-center">
                      <div className="text-xs text-white/40 mb-1">{label}</div>
                      <div className="text-sm font-semibold">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Next up */}
                <div>
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Next Up</h3>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {LIBRARY_ITEMS.filter(li => li.id !== item.id).slice(0, 4).map((li, i) => (
                      <button key={li.id}
                        onClick={() => navigate(`/salsa/video/${li.id}`, { state: { item: li } })}
                        className="shrink-0 w-36 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl overflow-hidden text-left transition-colors">
                        <div className="relative aspect-video bg-[#1a1a1a]">
                          {li.thumbnail && <img src={li.thumbnail} alt={li.title} className="w-full h-full object-cover" />}
                          <span className="absolute top-1 left-1 text-[10px] font-bold bg-black/60 text-white px-1 py-0.5 rounded">{i + 2}</span>
                        </div>
                        <div className="p-2">
                          <p className="text-[11px] font-medium leading-tight truncate">{li.title}</p>
                          <p className="text-[10px] text-white/40 mt-0.5">{li.style} · {li.bpm} BPM</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {videoTab === "sequence" && (
              <div className="space-y-2">
                <p className="text-xs text-white/40 mb-3">Step-by-step breakdown of the choreography.</p>
                {["Basic Step","Side Step","Cross Body Lead","Right Turn","Underarm Turn"].map((step, i) => (
                  <div key={step} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <span className="text-xs font-bold w-5 text-white/40">{i+1}</span>
                    <span className="text-sm">{step}</span>
                    <span className="ml-auto text-xs text-white/30">{item.style} · {item.bpm} BPM</span>
                  </div>
                ))}
              </div>
            )}

            {videoTab === "chapters" && (
              <div className="space-y-2">
                {[["0:00","Introduction"],["1:20","Basic Step Breakdown"],["3:45","Common Mistakes"],["6:00","Practice with Music"],["8:00","Summary"]].map(([t, label]) => (
                  <button key={t}
                    onClick={() => playerRef.current?.seekTo(parseInt(t.split(":")[0]) * 60 + parseInt(t.split(":")[1]))}
                    className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left transition-colors">
                    <span className="text-xs font-mono text-red-400 w-10 shrink-0">{t}</span>
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {videoTab === "resources" && (
              <p className="text-sm text-white/30 text-center py-8">No resources attached to this lesson.</p>
            )}
          </div>
        </div>

        {/* ── Right: Whiteboard + tools ── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-white/10 shrink-0">
            {(["whiteboard","notes"] as const).map(t => (
              <button key={t} onClick={() => setRightTab(t)}
                className={cn("px-5 py-3 text-sm font-medium capitalize border-b-2 -mb-px transition-colors",
                  rightTab === t ? "border-red-500 text-red-400" : "border-transparent text-white/40 hover:text-white"
                )}>
                {t}
                {t === "notes" && notes.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded-full">{notes.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Whiteboard tab ── */}
          {rightTab === "whiteboard" && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Drawing toolbar */}
              <div className="flex items-center gap-2 px-3 py-2 bg-[#161616] border-b border-white/5 shrink-0 flex-wrap">
                <div className="flex items-center gap-0.5 border-r border-white/10 pr-2 mr-1">
                  {([
                    { id: "select", icon: <MousePointer2 className="w-3.5 h-3.5"/>, label: "Select" },
                    { id: "draw",   icon: <PenLine className="w-3.5 h-3.5"/>,       label: "Draw"   },
                    { id: "text",   icon: <Type className="w-3.5 h-3.5"/>,           label: "Text"   },
                    { id: "eraser", icon: <Eraser className="w-3.5 h-3.5"/>,         label: "Eraser" },
                  ] as const).map(({ id, icon, label }) => (
                    <button key={id} onClick={() => { setDrawTool(id); canvasRef.current?.setTool(id); }}
                      className={cn("flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-[10px] transition-colors",
                        drawTool === id ? "bg-white/15 text-white" : "text-white/40 hover:text-white hover:bg-white/10"
                      )}>
                      {icon}{label}
                    </button>
                  ))}
                </div>
                {/* Colors */}
                <div className="flex items-center gap-1 border-r border-white/10 pr-2 mr-1">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => { setDrawColor(c); canvasRef.current?.setColor(c); }}
                      className={cn("w-5 h-5 rounded-full border-2 transition-transform hover:scale-110",
                        drawColor === c ? "border-white scale-125" : "border-transparent"
                      )} style={{ background: c }} />
                  ))}
                </div>
                {/* Size */}
                <select value={drawSize} onChange={e => { setDrawSize(e.target.value); canvasRef.current?.setSize(parseInt(e.target.value)); }}
                  className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/70 focus:outline-none">
                  {SIZES.map(s => <option key={s} value={s} className="bg-[#1a1a1a]">{s}</option>)}
                </select>
                {/* Actions */}
                <div className="flex items-center gap-0.5 ml-auto">
                  <IconBtn onClick={() => canvasRef.current?.undo()} title="Undo"><Undo2 className="w-3.5 h-3.5"/></IconBtn>
                  <IconBtn onClick={() => canvasRef.current?.redo()} title="Redo"><Redo2 className="w-3.5 h-3.5"/></IconBtn>
                  <IconBtn onClick={() => canvasRef.current?.clear()} title="Clear"><Trash2 className="w-3.5 h-3.5"/></IconBtn>
                  <IconBtn onClick={() => canvasRef.current?.download()} title="Save" className="text-green-400 hover:bg-green-500/10">
                    <Save className="w-3.5 h-3.5"/>
                  </IconBtn>
                </div>
              </div>

              {/* Canvas + tools side panel */}
              <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Left tools panel */}
                <div className="w-52 shrink-0 border-r border-white/10 overflow-y-auto p-3 space-y-4 bg-[#111]">

                  {/* Footstep counts */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Footstep Tools</span>
                    </div>
                    <p className="text-[10px] text-white/30 mb-2">
                      {countMode === "salsa-on1" ? "Standard (On1)" : countMode === "full-8" ? "Full 8 Count" : "Syncopation"}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {counts.map(c => (
                        <button key={c} onClick={() => handleCountClick(c)}
                          className="w-8 h-8 bg-[#2a1a1a] hover:bg-red-600 border border-red-900/50 hover:border-red-500 rounded-lg text-sm font-bold text-white/80 hover:text-white transition-colors">
                          {c}
                        </button>
                      ))}
                    </div>

                    {/* Foot selector */}
                    <div>
                      <p className="text-[10px] text-white/30 mb-1.5 uppercase tracking-wider">Foot</p>
                      <div className="flex gap-2">
                        {(["left","right"] as const).map(f => (
                          <button key={f} onClick={() => setActiveFoot(f)}
                            className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-colors",
                              activeFoot === f
                                ? "bg-white/15 border-white/30 text-white"
                                : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                            )}>
                            <span className="text-base">{f === "left" ? "🦶" : "👟"}</span>
                            <span>{f.charAt(0).toUpperCase() + f.slice(1)} Foot</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preset patterns */}
                  <div>
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Preset Patterns</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {PRESET_PATTERNS.map(p => (
                        <button key={p} onClick={() => handlePatternClick(p)}
                          className="py-2 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-medium text-white/70 hover:text-white transition-colors text-center leading-tight">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Count mode */}
                  <div>
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Count Mode</p>
                    <div className="grid grid-cols-2 gap-1">
                      {([
                        { id: "salsa-on1", label: "Salsa On1" },
                        { id: "full-8",    label: "Full 8 Count" },
                        { id: "syncopation", label: "Syncopation" },
                        { id: "custom",    label: "Custom" },
                      ] as const).map(({ id, label }) => (
                        <button key={id} onClick={() => setCountMode(id)}
                          className={cn("py-1.5 px-2 rounded-lg text-[10px] font-medium border transition-colors",
                            countMode === id
                              ? "bg-red-600 border-red-500 text-white"
                              : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                          )}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timing style */}
                  <div>
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">Timing Style</p>
                    <div className="grid grid-cols-4 gap-1">
                      {(["on1","on2","cuban","custom"] as const).map(t => (
                        <button key={t} onClick={() => setTimingStyle(t)}
                          className={cn("py-1.5 rounded-lg text-[10px] font-medium border transition-colors",
                            timingStyle === t
                              ? "bg-red-600 border-red-500 text-white"
                              : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                          )}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 min-h-0 relative bg-[#111]">
                  <SalsaCanvas
                    ref={canvasRef}
                    tool={drawTool}
                    color={drawColor}
                    size={parseInt(drawSize)}
                    showPath={showPath}
                    countsOnFloor={countsOnFloor}
                    onStepSelect={setSelectedStep}
                  />
                </div>

                {/* Step inspector */}
                {selectedStep && (
                  <div className="w-44 shrink-0 border-l border-white/10 bg-[#111] p-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold">Step Inspector</span>
                      <button onClick={() => setSelectedStep(null)} className="text-white/30 hover:text-white text-xs">✕</button>
                    </div>
                    <StepInspectorField label="Count Label" value={selectedStep} />
                    <StepInspectorField label="Foot" value={activeFoot === "left" ? "Left Foot" : "Right Foot"} />
                    <StepInspectorField label="Next Step" value="1 (Loop)" />
                    <StepInspectorField label="Arrow" value="Curved" />
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <button onClick={() => { canvasRef.current?.deleteSelected(); setSelectedStep(null); }}
                        className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 border border-red-900/30 transition-colors">
                        <Trash2 className="w-3 h-3" /> Delete Step
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Notes tab ── */}
          {rightTab === "notes" && (
            <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
              <div className="shrink-0 flex gap-2">
                <input value={noteInput} onChange={e => setNoteInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addNote()}
                  placeholder="Add a note at current timestamp..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/50" />
                <button onClick={addNote} disabled={!noteInput.trim()}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium">
                  Add
                </button>
              </div>
              {item.youtubeId && (
                <p className="text-[11px] text-white/30 -mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Stamped at current video position
                </p>
              )}
              <div className="flex-1 overflow-y-auto space-y-2">
                {notes.length === 0 && (
                  <div className="text-center py-12 text-white/20">
                    <BookmarkPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notes yet. Pause and type one above.</p>
                  </div>
                )}
                {notes.map(note => (
                  <div key={note.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 group">
                    <button onClick={() => playerRef.current?.seekTo(note.timestamp)}
                      className="text-[11px] font-mono bg-red-600/20 text-red-400 px-2 py-1 rounded shrink-0 hover:bg-red-600/30">
                      {formatTime(note.timestamp)}
                    </button>
                    <p className="text-sm text-white/80 flex-1 leading-snug pt-0.5">{note.text}</p>
                    <button onClick={() => setNotes(prev => prev.filter(n => n.id !== note.id))}
                      className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0">
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

// ── Small helpers ──────────────────────────────────────────────────────────
function TopBtn({ active, onClick, icon, label, activeClass }: {
  active: boolean; onClick: () => void; icon: React.ReactNode;
  label: string; activeClass?: string;
}) {
  return (
    <button onClick={onClick}
      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
        active
          ? (activeClass ?? "bg-white/15 text-white border-white/20")
          : "text-white/40 border-transparent hover:text-white hover:bg-white/10"
      )}>
      {icon}{label}
    </button>
  );
}

function IconBtn({ children, onClick, title, className }: {
  children: React.ReactNode; onClick: () => void; title?: string; className?: string;
}) {
  return (
    <button onClick={onClick} title={title}
      className={cn("w-7 h-7 rounded flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors", className)}>
      {children}
    </button>
  );
}

function StepInspectorField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <p className="text-[10px] text-white/30 mb-0.5">{label}</p>
      <div className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white/80">{value}</div>
    </div>
  );
}
