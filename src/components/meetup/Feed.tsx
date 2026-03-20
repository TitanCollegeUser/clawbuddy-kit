import { motion } from "framer-motion";
import type { OutreachLogEntry } from "./types";

interface FeedProps {
  entries: OutreachLogEntry[];
}

const Feed = ({ entries }: FeedProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-4 rounded-full bg-primary shadow-[0_0_8px_hsl(25_95%_53%/0.5)]" />
        <h3 className="text-sm font-heading font-bold text-foreground/90 uppercase tracking-widest">Outreach Log</h3>
      </div>
      <div className="space-y-0.5">
        {entries.map((entry, i) => {
          const date = new Date(entry.timestamp);
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="timeline-item py-3.5 px-2 border-b border-border/50 last:border-0 rounded-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading font-semibold text-foreground">{entry.title}</p>
                  <p className="text-xs text-foreground/50 mt-1.5 leading-relaxed">{entry.detail}</p>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                  <span className="text-[10px] font-mono-data text-muted-foreground">
                    {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono-data tracking-wider border"
                    style={{ backgroundColor: '#f9731610', color: '#fb923c', borderColor: '#f9731620' }}>
                    {entry.agent}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Feed;
