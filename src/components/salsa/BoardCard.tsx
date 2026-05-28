import { Play, MoreVertical } from "lucide-react";

export interface Board {
  id: string;
  title: string;
  category: string;
  style: "On1" | "On2";
  bpm: number;
  duration: string;
  tags: string[];
  editedAt: string;
  thumbnail?: string;
  beat: string;
}

interface Props {
  board: Board;
  compact?: boolean;
}

export function BoardCard({ board, compact }: Props) {
  const thumbnailBg = board.thumbnail
    ? `url(${board.thumbnail})`
    : "linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 50%, #0a0a1a 100%)";

  return (
    <div
      className={`bg-[#161616] rounded-xl overflow-hidden border border-white/5 hover:border-white/15 transition-all cursor-pointer group ${compact ? "w-full" : "w-44 md:w-52 shrink-0"}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#1a1a1a]" style={{ background: thumbnailBg, backgroundSize: "cover", backgroundPosition: "center" }}>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Beat + Style badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1">
          <span className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">
            {board.beat}
          </span>
          <span className="text-[10px] font-bold bg-red-700 text-white px-1.5 py-0.5 rounded">
            {board.style}
          </span>
        </div>

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Duration */}
        <div className="absolute bottom-2 right-2">
          <span className="text-[11px] font-medium bg-black/60 text-white px-1.5 py-0.5 rounded">
            {board.duration}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-white leading-tight mb-0.5 truncate">{board.title}</h3>
        <p className="text-xs text-white/50 mb-2">
          {board.category} • {board.style} • {board.bpm} BPM
        </p>
        <div className="flex flex-wrap gap-1 mb-2">
          {board.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/30">Edited {board.editedAt}</span>
          <div className="flex items-center gap-1">
            <div className="flex -space-x-1">
              <img src="https://i.pravatar.cc/20?img=3" className="w-5 h-5 rounded-full border border-[#161616]" alt="" />
              <img src="https://i.pravatar.cc/20?img=5" className="w-5 h-5 rounded-full border border-[#161616]" alt="" />
            </div>
            <button className="p-0.5 hover:text-white text-white/30 transition-colors">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
