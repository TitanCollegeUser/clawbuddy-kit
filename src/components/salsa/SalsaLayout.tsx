import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Home, BookOpen, ListMusic, Edit3, BarChart2, Users, ShieldCheck,
  Settings, Search, Bell, Upload, Plus, ChevronDown, LayoutGrid, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SalsaCaptureModal } from "./SalsaCaptureModal";

const NAV_ITEMS = [
  { to: "/salsa/home", icon: Home, label: "Dashboard" },
  { to: "/salsa/library", icon: BookOpen, label: "Library" },
  { to: "/salsa/playlists", icon: ListMusic, label: "Playlists" },
  { to: "/salsa/editor", icon: Edit3, label: "Editor" },
  { to: "/salsa/analytics", icon: BarChart2, label: "Analytics" },
  { to: "/salsa/shared", icon: Users, label: "Shared with Me" },
];

const NAV_ITEMS_BOTTOM = [
  { to: "/salsa/instructor", icon: ShieldCheck, label: "Instructor Mode", pro: true },
  { to: "/salsa/settings", icon: Settings, label: "Settings" },
];

const MOBILE_NAV = [
  { to: "/salsa/home", icon: Home, label: "Home" },
  { to: "/salsa/library", icon: BookOpen, label: "Library" },
  { to: "/salsa/analytics", icon: BarChart2, label: "Analytics" },
  { to: "/salsa/settings", icon: Settings, label: "Settings" },
];

export function SalsaLayout() {
  const [captureOpen, setCaptureOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Navigation — desktop */}
      <header className="hidden md:flex items-center h-16 px-6 border-b border-white/10 bg-[#0f0f0f] gap-4 shrink-0 z-20">
        <div className="flex items-center gap-2 w-52 shrink-0">
          <span className="text-red-500 text-2xl">🕺</span>
          <span className="font-bold text-lg tracking-tight">Salsa Notes</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search boards, videos, moves, tags, BPM..."
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-white/30 focus:outline-none focus:border-red-500/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={() => setCaptureOpen(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Video
          </button>
          <button className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10">
            <Plus className="w-4 h-4" />
            New Whiteboard
          </button>
          <button className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5 text-white/70" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button className="flex items-center gap-2">
            <img src="https://i.pravatar.cc/32?img=3" alt="Jon" className="w-8 h-8 rounded-full object-cover" />
            <ChevronDown className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden flex items-center h-14 px-4 bg-[#0f0f0f] border-b border-white/10 z-20">
        <span className="text-red-500 text-xl mr-2">🕺</span>
        <span className="font-bold text-base tracking-tight">Salsa Notes</span>
        <div className="ml-auto flex items-center gap-3">
          <Search className="w-5 h-5 text-white/50" />
          <Bell className="w-5 h-5 text-white/50" />
          <img src="https://i.pravatar.cc/32?img=3" alt="Jon" className="w-7 h-7 rounded-full object-cover" />
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex flex-col w-52 shrink-0 bg-[#0f0f0f] border-r border-white/10 py-4 z-10">
          <nav className="flex-1 px-3 space-y-0.5">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-red-600/20 text-red-400 font-medium"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="px-3 space-y-0.5 mb-4">
            {NAV_ITEMS_BOTTOM.map(({ to, icon: Icon, label, pro }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-red-600/20 text-red-400 font-medium"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {pro && (
                  <span className="ml-auto text-[10px] font-bold bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                    PRO
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Plan info */}
          <div className="mx-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-400">Pro Plan</span>
            </div>
            <p className="text-xs text-white/50 mb-2">Boatero used</p>
            <div className="flex items-center justify-between text-xs text-white/70 mb-1.5">
              <span>23 / 100</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
              <div className="h-full bg-yellow-500 rounded-full" style={{ width: "23%" }} />
            </div>
            <button className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1">
              <LayoutGrid className="w-3 h-3" />
              Upgrade Plan
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-0 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-white/10 flex items-center z-20">
        {MOBILE_NAV.slice(0, 2).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center gap-1 py-2 text-[10px]",
                isActive ? "text-red-400" : "text-white/40"
              )
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}

        {/* Center capture button */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={() => setCaptureOpen(true)}
            className="w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center shadow-lg shadow-red-600/30 transition-colors -mt-5"
          >
            <Plus className="w-6 h-6 text-white" />
          </button>
        </div>

        {MOBILE_NAV.slice(2).map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex-1 flex flex-col items-center gap-1 py-2 text-[10px]",
                isActive ? "text-red-400" : "text-white/40"
              )
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <SalsaCaptureModal open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </div>
  );
}
