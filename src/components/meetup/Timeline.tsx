import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Trophy, Calendar, RotateCw, LucideIcon } from "lucide-react";
import type { TimelineEvent } from "./types";

const iconMap: Record<string, LucideIcon> = {
  email_sent: Mail,
  call_made: Phone,
  venue_visit: MapPin,
  sponsor_close: Trophy,
  event_completed: Calendar,
  follow_up: RotateCw,
};

const colorMap: Record<string, string> = {
  email_sent: "#60a5fa",
  call_made: "#34d399",
  venue_visit: "#fb923c",
  sponsor_close: "#fbbf24",
  event_completed: "#c084fc",
  follow_up: "#9ca3af",
};

interface TimelineProps {
  events: TimelineEvent[];
}

const Timeline = ({ events }: TimelineProps) => {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-4 rounded-full bg-primary shadow-[0_0_8px_hsl(25_95%_53%/0.5)]" />
        <h3 className="text-sm font-heading font-bold text-foreground/90 uppercase tracking-widest">Launch Activity</h3>
      </div>
      <div className="relative">
        <div className="absolute left-[13px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />
        <div className="space-y-0.5">
          {events.map((event, i) => {
            const Icon = iconMap[event.event_type] || Calendar;
            const color = colorMap[event.event_type] || "#9ca3af";
            const date = new Date(event.timestamp);

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className="timeline-item flex items-start gap-3 py-3 rounded-lg px-1"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 relative z-10 transition-shadow duration-300"
                  style={{
                    backgroundColor: `${color}18`,
                    boxShadow: `0 0 0px ${color}00`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 0 20px ${color}40`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 0 0px ${color}00`; }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{event.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground font-mono-data">
                      {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </span>
                    {event.agent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono-data tracking-wider border"
                        style={{ backgroundColor: '#f9731610', color: '#fb923c', borderColor: '#f9731620' }}>
                        {event.agent}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;
