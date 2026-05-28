import type { Board } from "@/components/salsa/BoardCard";
import type { LibraryEntry } from "@/components/salsa/LibraryItem";

export const BOARDS: Board[] = [
  {
    id: "1", title: "Cross Body Lead Variations", category: "Partnerwork", style: "On1",
    bpm: 92, duration: "04:21", tags: ["#cbl", "#inside-turn", "#beginner"],
    editedAt: "2h ago", beat: "1-2-3/5-6-7",
  },
  {
    id: "2", title: "Inside Turn Breakdown", category: "Partnerwork", style: "On2",
    bpm: 96, duration: "03:45", tags: ["#inside-turn", "#timing", "#on2"],
    editedAt: "1d ago", beat: "1-2-3/5-6-7",
  },
  {
    id: "3", title: "Copa Step Sequence", category: "Footwork", style: "On1",
    bpm: 90, duration: "05:18", tags: ["#copa", "#footwork", "#shines"],
    editedAt: "1d ago", beat: "1-2-3/5-6-7",
  },
  {
    id: "4", title: "Shines Routine Ideas", category: "Shines", style: "On2",
    bpm: 98, duration: "06:10", tags: ["#shines", "#styling"],
    editedAt: "3d ago", beat: "1-2-3/5-6-7",
  },
  {
    id: "5", title: "Dile Que No Variants", category: "Partnerwork", style: "On1",
    bpm: 88, duration: "03:30", tags: ["#dileQueno", "#leads"],
    editedAt: "4d ago", beat: "1-2-3/5-6-7",
  },
  {
    id: "6", title: "Mambo Timing Drill", category: "Timing", style: "On2",
    bpm: 94, duration: "02:50", tags: ["#mambo", "#timing", "#on2"],
    editedAt: "5d ago", beat: "1-2-3/5-6-7",
  },
];

export const LIBRARY_ITEMS: LibraryEntry[] = [
  {
    id: "1", title: "Cross Body Lead Variations", category: "Partnerwork", style: "On1",
    bpm: 92, duration: "04:21", addedAt: "Edited 2h ago", beat: "1-2-3/5-6-7",
  },
  {
    id: "2", title: "Inside Turn Breakdown", category: "Partnerwork", style: "On2",
    bpm: 96, duration: "03:45", addedAt: "Edited 1d ago", beat: "1-2-3/5-6-7",
  },
  {
    id: "3", title: "Copa Step Sequence", category: "Footwork", style: "On2",
    bpm: 90, duration: "05:18", addedAt: "Edited 1d ago", beat: "1-2-3/5-6-7",
  },
  {
    id: "4", title: "Shines Routine Ideas", category: "Shines", style: "On2",
    bpm: 98, duration: "06:10", addedAt: "Edited 3d ago", beat: "1-2-3/5-6-7",
  },
  {
    id: "5", title: "Outside Turn Breakdown", category: "Partnerwork", style: "On2",
    bpm: 94, duration: "04:55", addedAt: "Edited 4d ago", beat: "1-2-3/5-6-7",
  },
  {
    id: "6", title: "Class with Maria (YouTube)", category: "On1", style: "On1",
    bpm: 96, duration: "03:30", addedAt: "Added 5d ago", beat: "1-2-3/5-6-7",
    sourceType: "youtube",
  },
  {
    id: "7", title: "Beginner Footwork Drills (Drive)", category: "Footwork", style: "On1",
    bpm: 90, duration: "07:12", addedAt: "Added 1w ago", beat: "1-2-3/5-6-7",
    sourceType: "drive",
  },
  {
    id: "8", title: "Copa Variations (YouTube)", category: "On2", style: "On2",
    bpm: 92, duration: "02:28", addedAt: "Added 1w ago", beat: "1-2-3/5-6-7",
    sourceType: "youtube",
  },
];

export const PLAYLISTS = [
  { id: "1", name: "Partnerwork", count: 12, icon: "👫", updatedAt: "Updated today" },
  { id: "2", name: "Shines", count: 8, icon: "⭐", updatedAt: "Updated 2d ago" },
  { id: "3", name: "Beginner Foundations", count: 15, icon: "🎓", updatedAt: "Updated 3d ago" },
  { id: "4", name: "Classes with Maria", count: 6, icon: "🟢", updatedAt: "Updated 1d ago", videos: true },
];

export const CONTINUE_PRACTICING = [
  { id: "1", icon: "👣", title: "Cross Body Lead", desc: "You used this in 8 boards." },
  { id: "2", icon: "🔄", title: "Inside Turn", desc: "3 timestamped notes added this week." },
  { id: "3", icon: "🎵", title: "On2 Timing", desc: "Your recent boards are mostly On1. Try On2?" },
  { id: "4", icon: "⭐", title: "Copa", desc: "Review your Copa sequences and variations." },
];

export const TOP_TAGS = [
  { name: "Cross Body Lead", count: 18, color: "#e53935" },
  { name: "Inside Turn", count: 12, color: "#fb8c00" },
  { name: "Copa", count: 7, color: "#fdd835" },
  { name: "Shines", count: 6, color: "#43a047" },
  { name: "Footwork", count: 5, color: "#1e88e5" },
];

export const PRACTICE_ACTIVITY = [
  { day: "Mon", count: 1 },
  { day: "Tue", count: 0 },
  { day: "Wed", count: 2 },
  { day: "Thu", count: 1 },
  { day: "Fri", count: 0 },
  { day: "Sat", count: 3 },
  { day: "Sun", count: 4 },
];
