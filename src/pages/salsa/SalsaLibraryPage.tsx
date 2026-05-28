import { useState } from "react";
import { Search, Filter, LayoutGrid, List } from "lucide-react";
import { LibraryItem } from "@/components/salsa/LibraryItem";
import { BoardCard } from "@/components/salsa/BoardCard";
import { LIBRARY_ITEMS, BOARDS } from "@/data/salsaData";
import { useSalsaLibrary } from "@/hooks/useSalsaLibrary";

const TABS = ["All", "Boards", "Videos", "Templates"] as const;
type Tab = typeof TABS[number];

const SORT_OPTIONS = ["Recent", "Oldest", "A–Z", "BPM High", "BPM Low"];

export function SalsaLibraryPage() {
  const [tab, setTab] = useState<Tab>("All");
  const [view, setView] = useState<"list" | "grid">("list");
  const [sort, setSort] = useState("Recent");
  const [search, setSearch] = useState("");
  const { userItems } = useSalsaLibrary();

  const allItems = [...userItems, ...LIBRARY_ITEMS];

  const filteredItems = allItems.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredBoards = BOARDS.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">My Library</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <Search className="w-4 h-4 text-white/60" />
          </button>
          <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <Filter className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/10 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-red-500 text-red-400"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white/70 focus:outline-none focus:border-red-500/50"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o} value={o} className="bg-[#161616]">
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView("grid")}
            className={`p-1.5 rounded-lg transition-colors ${view === "grid" ? "bg-red-600/20 text-red-400" : "bg-white/5 text-white/40 hover:text-white"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-lg transition-colors ${view === "list" ? "bg-red-600/20 text-red-400" : "bg-white/5 text-white/40 hover:text-white"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search library..."
          className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
        />
      </div>

      {/* Content */}
      {(tab === "All" || tab === "Videos") && (
        <>
          {view === "list" ? (
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <LibraryItem key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredBoards.map((board) => (
                <BoardCard key={board.id} board={board} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "Boards" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredBoards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      )}

      {tab === "Templates" && (
        <div className="text-center py-16 text-white/30">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm">No templates yet.</p>
          <p className="text-xs mt-1">Save a board as a template to reuse it.</p>
        </div>
      )}
    </div>
  );
}
