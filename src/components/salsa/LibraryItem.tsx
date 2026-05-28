import { Play, Link, MoreVertical } from "lucide-react";

export interface LibraryEntry {
  id: string;
  title: string;
  category: string;
  style: "On1" | "On2";
  bpm: number;
  duration: string;
  addedAt: string;
  beat: string;
  thumbnail?: string;
  sourceType?: "upload" | "youtube" | "drive";
}

interface Props {
  item: LibraryEntry;
}

const SOURCE_ICONS: Record<string, string> = {
  youtube: "🔴",
  drive: "🟢",
  upload: "📤",
};

export function LibraryItem({ item }: Props) {
  const bg = "linear-gradient(135deg, #1a0a0a 0%, #2d0f0f 60%, #0a0a1a 100%)";

  return (
    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer group transition-colors">
      {/* Thumbnail */}
      <div
        className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0"
        style={{ background: bg, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
          </div>
        </div>
        {item.sourceType && item.sourceType !== "upload" && (
          <div className="absolute top-1 right-1 text-sm leading-none">
            {SOURCE_ICONS[item.sourceType] || <Link className="w-3 h-3" />}
          </div>
        )}
        <div className="absolute bottom-1 right-1">
          <span className="text-[10px] bg-black/70 text-white px-1 py-0.5 rounded">
            {item.duration}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded leading-none">
            {item.beat}
          </span>
          <span className="text-[10px] font-bold bg-red-700 text-white px-1.5 py-0.5 rounded leading-none">
            {item.style}
          </span>
        </div>
        <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
        <p className="text-xs text-white/40">
          {item.category} • {item.bpm} BPM
        </p>
      </div>

      {/* Meta */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-[10px] text-white/30">{item.addedAt}</span>
        <div className="flex items-center gap-1">
          <img src="https://i.pravatar.cc/20?img=3" className="w-4 h-4 rounded-full" alt="" />
          <button className="text-white/30 hover:text-white transition-colors">
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
