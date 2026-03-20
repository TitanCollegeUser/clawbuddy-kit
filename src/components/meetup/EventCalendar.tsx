import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EventRecord } from "./types";

const eventTypeColors: Record<string, string> = {
  openclaw_connect: "#f97316",
  ai_for_business: "#3b82f6",
  prep_day: "#f59e0b",
  follow_up: "#a855f7",
};

interface EventCalendarProps {
  events: EventRecord[];
}

const EventCalendar = ({ events }: EventCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const days = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [firstDay, daysInMonth]);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.data.date === dateStr);
  };

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-4 rounded-full bg-primary" />
          <h3 className="text-sm font-heading font-semibold text-muted-foreground uppercase tracking-wider">Event Calendar</h3>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="p-2 rounded-lg hover:bg-secondary/60 transition-all duration-200 hover:shadow-md">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-heading font-semibold text-foreground min-w-[150px] text-center">{monthName}</span>
          <button onClick={next} className="p-2 rounded-lg hover:bg-secondary/60 transition-all duration-200 hover:shadow-md">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-[10px] font-heading uppercase tracking-widest text-muted-foreground/40 text-center py-2">
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          const dayEvents = day ? getEventsForDay(day) : [];
          const isToday = day === 8 && month === 2 && year === 2026;
          return (
            <div
              key={i}
              className={`min-h-[85px] p-1.5 rounded-lg calendar-day ${
                day ? "bg-secondary/10" : ""
              } ${isToday ? "ring-1 ring-primary/30 bg-primary/5" : ""}`}
            >
              {day && (
                <>
                  <span className={`text-xs font-mono-data ${isToday ? "text-primary font-bold" : "text-muted-foreground/50"}`}>
                    {day}
                  </span>
                  {dayEvents.map((ev) => {
                    const color = eventTypeColors[ev.data.event_type] || "#6b7280";
                    return (
                      <div
                        key={ev.id}
                        className="mt-1 px-1.5 py-1 rounded-md text-[10px] font-heading font-medium truncate border cursor-default transition-all duration-200 hover:scale-[1.02]"
                        style={{
                          backgroundColor: `${color}12`,
                          color,
                          borderColor: `${color}20`,
                        }}
                        title={ev.title}
                      >
                        {ev.title.length > 16 ? ev.title.slice(0, 16) + "…" : ev.title}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default EventCalendar;
