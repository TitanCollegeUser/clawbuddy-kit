import { useState } from "react";
import { ChevronRight, Camera, Upload, Youtube, HardDrive } from "lucide-react";
import { BoardCard } from "@/components/salsa/BoardCard";
import { SalsaCaptureModal } from "@/components/salsa/SalsaCaptureModal";
import { BOARDS, PLAYLISTS, CONTINUE_PRACTICING } from "@/data/salsaData";

const STATS = [
  {
    icon: "📋", label: "Boards Created", value: "44", sub: "+4 this week",
    color: "from-red-900/30 to-red-900/10", iconColor: "text-red-400",
  },
  {
    icon: "🎬", label: "Videos Annotated", value: "12", sub: "8 with notes",
    color: "from-orange-900/30 to-orange-900/10", iconColor: "text-orange-400",
  },
  {
    icon: "👣", label: "Top Move", value: "Cross Body Lead", sub: "18 boards",
    color: "from-yellow-900/30 to-yellow-900/10", iconColor: "text-yellow-400",
    isText: true,
  },
  {
    icon: "🎵", label: "Average BPM", value: "94", sub: "Range 88–96",
    color: "from-green-900/30 to-green-900/10", iconColor: "text-green-400",
  },
];

export function SalsaHomePage() {
  const [captureOpen, setCaptureOpen] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Hero */}
      <section
        className="relative rounded-2xl overflow-hidden min-h-[160px] md:min-h-[180px] flex flex-col justify-end p-5 md:p-8"
        style={{
          background: "linear-gradient(135deg, #1a0505 0%, #2d0808 40%, #0d0d1a 100%)",
        }}
      >
        {/* Dancer silhouette overlay */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1/2 md:w-2/5 opacity-20 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at right, #e53935 0%, transparent 70%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0505] via-transparent to-transparent opacity-80" />

        <div className="relative z-10">
          <h1 className="text-xl md:text-3xl font-bold mb-1">
            Welcome back, Jon! 👋
          </h1>
          <p className="text-sm text-white/60 mb-4 md:mb-5">
            Continue building your salsa library.
          </p>
          <p className="text-sm text-white/50 mb-4 md:mb-5">
            You have{" "}
            <span className="text-red-400 font-medium">3 boards in progress</span> and{" "}
            <span className="text-red-400 font-medium">2 videos</span> waiting for notes.
          </p>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 md:gap-3">
            <button
              onClick={() => setCaptureOpen(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-red-600/20"
            >
              <Upload className="w-4 h-4" />
              <div className="text-left">
                <div className="font-semibold leading-tight">Upload Video</div>
                <div className="text-[10px] text-red-200 leading-tight">Upload from device</div>
              </div>
            </button>
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors backdrop-blur-sm">
              <span className="text-lg">+</span>
              <div className="text-left">
                <div className="font-semibold leading-tight">New Whiteboard</div>
                <div className="text-[10px] text-white/40 leading-tight">Start blank</div>
              </div>
            </button>
            <button className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors backdrop-blur-sm">
              <span className="text-lg">🔗</span>
              <div className="text-left">
                <div className="font-semibold leading-tight">Attach Link</div>
                <div className="text-[10px] text-white/40 leading-tight">YouTube / Drive</div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Stats / KPI Cards */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white/80">Stats Overview</h2>
          <button className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">
            View all
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className={`bg-gradient-to-br ${stat.color} border border-white/5 rounded-xl p-4`}
            >
              <div className={`text-2xl mb-2 ${stat.iconColor}`}>{stat.icon}</div>
              <div className="text-xs text-white/50 mb-0.5">{stat.label}</div>
              <div className={`font-bold text-white ${stat.isText ? "text-sm leading-tight" : "text-2xl"}`}>
                {stat.value}
              </div>
              <div className="text-[11px] text-white/40 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Boards */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white/80">Recent Boards</h2>
            <button className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">
              View all
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {BOARDS.map((board) => (
              <BoardCard key={board.id} board={board} />
            ))}
          </div>
        </section>

        {/* Continue Practising */}
        <section>
          <h2 className="text-base font-semibold text-white/80 mb-3">Continue Practising</h2>
          <div className="space-y-2">
            {CONTINUE_PRACTICING.map((item) => (
              <button
                key={item.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-xl shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                  <div className="text-xs text-white/40 truncate">{item.desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 shrink-0" />
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Quick Capture + Library Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Capture Preview */}
        <section className="bg-[#161616] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-400">⚡</span>
            <h2 className="text-base font-semibold">Quick Capture</h2>
          </div>
          <p className="text-xs text-white/40 mb-4">
            Capture a class or idea quickly, add notes later.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Camera, label: "Record from Camera", color: "bg-red-600" },
              { icon: Upload, label: "Upload from Device", color: "bg-orange-500" },
              { icon: Youtube, label: "Paste YouTube Link", color: "bg-red-700" },
              { icon: HardDrive, label: "Attach from Drive", color: "bg-blue-600" },
            ].map(({ icon: Icon, label, color }) => (
              <button
                key={label}
                onClick={() => setCaptureOpen(true)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
              >
                <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs text-white/70 text-center leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Library/Playlists Preview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white/80">Library / Playlists</h2>
            <button className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors">
              View all
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {PLAYLISTS.map((pl) => (
              <div
                key={pl.id}
                className="bg-[#161616] border border-white/5 rounded-xl p-4 hover:border-white/15 cursor-pointer transition-all"
              >
                <div className="text-3xl mb-2">{pl.icon}</div>
                <div className="font-semibold text-sm mb-0.5">{pl.name}</div>
                <div className="text-xs text-white/50">
                  {pl.count} {pl.videos ? "videos" : "boards"}
                </div>
                <div className="text-[10px] text-white/30 mt-1">{pl.updatedAt}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <SalsaCaptureModal open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </div>
  );
}
