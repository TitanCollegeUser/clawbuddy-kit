import { motion } from "framer-motion";
import { User, Clock } from "lucide-react";
import type { OutreachRecord } from "./types";

interface KanbanColumn {
  id: string;
  label: string;
  color: string;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  items: OutreachRecord[];
}

const KanbanBoard = ({ columns, items }: KanbanBoardProps) => {
  const gradientColors = columns.map((c) => c.color).join(", ");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="surface-card p-5 relative overflow-hidden"
    >
      {/* Top gradient bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, ${gradientColors})`,
          boxShadow: `0 0 20px 2px ${columns[0]?.color}30`,
        }}
      />

      <div className="flex items-center gap-3 mb-5 mt-1">
        <div className="w-1 h-4 rounded-full bg-primary shadow-[0_0_8px_hsl(25_95%_53%/0.5)]" />
        <h3 className="text-sm font-heading font-bold text-foreground/90 uppercase tracking-widest">
          Outreach Board
        </h3>
        <div
          className="ml-2 h-[1px] flex-1"
          style={{ background: `linear-gradient(90deg, hsl(var(--primary) / 0.4), transparent)` }}
        />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {columns.map((col) => {
          const colItems = items.filter((item) => item.status === col.id);
          return (
            <div key={col.id} className="min-w-[230px] flex-1">
              {/* Column Header */}
              <div className="mb-3 pb-2 relative">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full status-pulse"
                    style={{ backgroundColor: col.color, color: col.color }}
                  />
                  <span className="text-xs font-heading font-bold text-foreground/85 uppercase tracking-widest">
                    {col.label}
                  </span>
                  <span
                    className="text-[10px] font-mono-data ml-auto px-2 py-0.5 rounded-md border"
                    style={{
                      backgroundColor: `${col.color}15`,
                      color: col.color,
                      borderColor: `${col.color}30`,
                      boxShadow: `0 0 12px ${col.color}20`,
                      textShadow: `0 0 8px ${col.color}60`,
                    }}
                  >
                    {colItems.length}
                  </span>
                </div>
                {/* Glowing bottom border */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[1px]"
                  style={{
                    background: `linear-gradient(90deg, ${col.color}50, ${col.color}10, transparent)`,
                    boxShadow: `0 0 8px ${col.color}25`,
                  }}
                />
              </div>

              {/* Cards */}
              <div className="space-y-2.5">
                {colItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 }}
                    className="relative surface-card-static rounded-lg cursor-default group overflow-hidden"
                    style={{
                      boxShadow: `inset 0 0 0 1px hsl(0 0% 100% / 0.05)`,
                    }}
                    whileHover={{
                      y: -4,
                      scale: 1.02,
                      boxShadow: `0 12px 32px -4px hsl(0 0% 0% / 0.5), 0 0 24px ${col.color}18, inset 0 0 0 1px hsl(0 0% 100% / 0.08)`,
                    }}
                  >
                    {/* Neon left accent bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg"
                      style={{
                        background: `linear-gradient(180deg, ${col.color}, ${col.color}60)`,
                        boxShadow: `0 0 10px ${col.color}40`,
                      }}
                    />

                    <div className="pl-4 pr-3.5 py-3.5">
                      <p
                        className="text-sm font-heading font-bold text-foreground transition-all duration-300 group-hover:text-primary"
                        style={{ textShadow: undefined }}
                      >
                        <span className="group-hover:[text-shadow:0_0_16px_hsl(25_95%_53%/0.4)]">
                          {item.title}
                        </span>
                      </p>

                      <div className="flex items-center gap-1.5 mt-1.5">
                        <User className="w-3 h-3 text-muted-foreground/50" />
                        <p className="text-xs text-foreground/55">{item.data.contact_name}</p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                        {/* Channel badge with glow dot */}
                        <span
                          className="inline-flex items-center gap-1.5 text-[10px] font-heading font-semibold px-2 py-0.5 rounded-md border"
                          style={{
                            backgroundColor: item.data.type === "venue" ? "#60a5fa10" : "#fb923c10",
                            color: item.data.type === "venue" ? "#60a5fa" : "#fb923c",
                            borderColor: item.data.type === "venue" ? "#60a5fa25" : "#fb923c25",
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: item.data.type === "venue" ? "#60a5fa" : "#fb923c",
                              boxShadow: `0 0 6px ${item.data.type === "venue" ? "#60a5fa" : "#fb923c"}80`,
                            }}
                          />
                          {item.data.channel}
                        </span>

                        {/* HUD-style days counter */}
                        {item.data.days_since_contact !== null && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] text-muted-foreground font-mono-data px-1.5 py-0.5 rounded border border-border/50"
                            style={{
                              background: "hsl(0 0% 100% / 0.03)",
                            }}
                          >
                            <Clock className="w-2.5 h-2.5 opacity-50" />
                            {item.data.days_since_contact}d
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Empty state */}
                {colItems.length === 0 && (
                  <motion.div
                    animate={{ borderColor: ["hsl(0 0% 100% / 0.08)", "hsl(0 0% 100% / 0.15)", "hsl(0 0% 100% / 0.08)"] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="border border-dashed rounded-xl p-6 text-center relative overflow-hidden"
                  >
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                      backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(0 0% 100% / 0.04) 2px, hsl(0 0% 100% / 0.04) 4px)`,
                    }} />
                    <span className="text-xs text-muted-foreground/40 relative z-10">No items</span>
                  </motion.div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default KanbanBoard;
