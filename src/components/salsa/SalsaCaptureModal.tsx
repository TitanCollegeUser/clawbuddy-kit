import { useState } from "react";
import { X, Camera, Upload, Youtube, HardDrive, Loader2, ArrowLeft, Check } from "lucide-react";
import { fetchYouTubeMeta, type YouTubeMeta } from "@/lib/youtube";
import { useSalsaLibrary } from "@/contexts/SalsaLibraryContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Screen = "menu" | "youtube" | "success";

const STYLES = ["On1", "On2"] as const;

export function SalsaCaptureModal({ open, onClose }: Props) {
  const [screen, setScreen] = useState<Screen>("menu");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<YouTubeMeta | null>(null);
  const [style, setStyle] = useState<"On1" | "On2">("On1");
  const [bpm, setBpm] = useState("");
  const [category, setCategory] = useState("");
  const { addItem } = useSalsaLibrary();

  function reset() {
    setScreen("menu");
    setUrl("");
    setError("");
    setMeta(null);
    setBpm("");
    setCategory("");
    setStyle("On1");
    setLoading(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFetch() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchYouTubeMeta(url.trim());
      setMeta(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch video info");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!meta) return;
    addItem({
      title: meta.title,
      category: category || meta.channelName,
      style,
      bpm: Number(bpm) || 90,
      duration: "",
      beat: "1-2-3/5-6-7",
      sourceType: "youtube",
      youtubeId: meta.videoId,
      thumbnail: meta.thumbnail,
    });
    setScreen("success");
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-sm md:max-w-md bg-[#161616] border border-white/10 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Menu screen ── */}
        {screen === "menu" && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">⚡</span>
                <h2 className="text-lg font-bold">Quick Capture</h2>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-white/50 mb-5">Capture a class or idea quickly, add notes later.</p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Camera, label: "Record from Camera", iconBg: "bg-red-600", border: "border-red-600/30 text-red-400", onClick: () => {} },
                { icon: Upload, label: "Upload from Device", iconBg: "bg-orange-500", border: "border-orange-600/30 text-orange-400", onClick: () => {} },
                { icon: Youtube, label: "Paste YouTube Link", iconBg: "bg-red-700", border: "border-red-700/30 text-red-300", onClick: () => setScreen("youtube") },
                { icon: HardDrive, label: "Attach from Drive", iconBg: "bg-blue-600", border: "border-blue-600/30 text-blue-400", onClick: () => {} },
              ].map(({ icon: Icon, label, iconBg, border, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border bg-white/5 hover:bg-white/10 transition-colors ${border}`}
                >
                  <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── YouTube screen ── */}
        {screen === "youtube" && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => { setScreen("menu"); setError(""); setMeta(null); setUrl(""); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-red-700 rounded-lg flex items-center justify-center">
                  <Youtube className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-bold">Paste YouTube Link</h2>
              </div>
              <button onClick={handleClose} className="ml-auto p-1.5 rounded-lg hover:bg-white/10 text-white/50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* URL input */}
            {!meta && (
              <>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                    placeholder="https://youtube.com/watch?v=..."
                    autoFocus
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
                  />
                  <button
                    onClick={handleFetch}
                    disabled={loading || !url.trim()}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fetch"}
                  </button>
                </div>
                {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
                <p className="text-xs text-white/30">Works with any public YouTube video or Shorts link</p>
              </>
            )}

            {/* Preview + details */}
            {meta && (
              <div className="space-y-4">
                {/* Thumbnail preview */}
                <div className="relative rounded-xl overflow-hidden aspect-video bg-black">
                  <img src={meta.thumbnail} alt={meta.title} className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2">
                    <span className="text-[10px] bg-red-700 text-white px-2 py-0.5 rounded font-bold">YouTube</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-white leading-snug">{meta.title}</p>
                  <p className="text-xs text-white/40 mt-0.5">{meta.channelName}</p>
                </div>

                {/* Metadata fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Category / Move</label>
                    <input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Partnerwork"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-500/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">BPM</label>
                    <input
                      type="number"
                      value={bpm}
                      onChange={(e) => setBpm(e.target.value)}
                      placeholder="e.g. 92"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 mb-1 block">Style</label>
                  <div className="flex gap-2">
                    {STYLES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStyle(s)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          style === s
                            ? "bg-red-600 border-red-600 text-white"
                            : "bg-white/5 border-white/10 text-white/50 hover:text-white"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setMeta(null); setUrl(""); }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  >
                    Change URL
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    Add to Library
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Success screen ── */}
        {screen === "success" && (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <Check className="w-7 h-7 text-green-400" />
            </div>
            <h2 className="text-lg font-bold mb-1">Added to Library!</h2>
            <p className="text-sm text-white/50 mb-6">The video is now in your library. Add notes anytime.</p>
            <div className="flex gap-3 w-full">
              <button onClick={reset} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                Add Another
              </button>
              <button onClick={handleClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-colors">
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
