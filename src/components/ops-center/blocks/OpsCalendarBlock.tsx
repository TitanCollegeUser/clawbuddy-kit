import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday, isSameDay,
  addMonths, subMonths,
} from 'date-fns';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { useOpsData } from '@/hooks/useOpsData';

interface Props { block: OpsBlock; appId: string }

export const OpsCalendarBlock = ({ block, appId }: Props) => {
  const config = block.config as Record<string, unknown>;
  const eventColors = (config.event_colors as Record<string, string>) || {};
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week'>((config.default_view as string) === 'week' ? 'week' : 'month');
  const showWeekView = config.show_week_view !== false;

  const { data: items = [], isLoading } = useOpsData({ appId, blockId: block.id, itemType: 'calendar_event' });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof items>();
    items.forEach(item => {
      const d = item.data as Record<string, unknown>;
      const dateStr = (d?.date as string) || item.created_at.split('T')[0];
      const arr = map.get(dateStr) || [];
      arr.push(item);
      map.set(dateStr, arr);
    });
    return map;
  }, [items]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const selectedEvents = selectedDay
    ? eventsByDate.get(format(selectedDay, 'yyyy-MM-dd')) || []
    : [];

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-5">
        <div className="grid grid-cols-7 gap-1">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-16 bg-muted/20 animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-white/[0.06] rounded transition">
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>
          <h3 className="font-orbitron text-sm font-semibold uppercase tracking-wider text-foreground min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-white/[0.06] rounded transition">
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>
        {showWeekView && (
          <div className="flex gap-1 bg-white/[0.04] rounded-lg p-0.5">
            {(['month', 'week'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`text-[10px] font-orbitron uppercase tracking-wider px-3 py-1 rounded-md transition ${view === v ? 'bg-white/[0.1] text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {weekDays.map(d => (
          <div key={d} className="text-center text-[9px] font-orbitron uppercase tracking-widest text-muted-foreground/60 py-1.5">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px px-2 pb-2">
        {days.map(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          const events = eventsByDate.get(dateKey) || [];
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const selected = selectedDay && isSameDay(day, selectedDay);

          return (
            <button
              key={dateKey}
              onClick={() => setSelectedDay(selected ? null : day)}
              className={`relative min-h-[60px] p-1 rounded-lg text-left transition-colors
                ${inMonth ? '' : 'opacity-30'}
                ${today ? 'border border-primary/40' : 'border border-transparent'}
                ${selected ? 'bg-white/[0.08] border-primary/60' : 'hover:bg-white/[0.04]'}
              `}
            >
              <span className={`text-[11px] font-medium ${today ? 'text-primary' : 'text-muted-foreground'}`}>
                {format(day, 'd')}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {events.slice(0, 2).map(ev => {
                  const evType = (ev.data as Record<string, unknown>)?.event_type as string || ev.status;
                  const color = eventColors[evType] || '#3b82f6';
                  return (
                    <div key={ev.id} className="text-[8px] leading-tight truncate rounded px-1 py-px" style={{ backgroundColor: `${color}30`, color }}>
                      {ev.title}
                    </div>
                  );
                })}
                {events.length > 2 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {events.slice(2, 5).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    ))}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-white/[0.06] px-5 py-3"
        >
          <p className="text-xs font-orbitron uppercase tracking-wider text-muted-foreground mb-2">
            {format(selectedDay, 'EEEE, MMMM d')}
          </p>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground/60">No events</p>
          ) : (
            <div className="space-y-1.5">
              {selectedEvents.map(ev => {
                const d = ev.data as Record<string, unknown>;
                const evType = (d?.event_type as string) || ev.status;
                const color = eventColors[evType] || '#3b82f6';
                const time = d?.time as string;
                return (
                  <div key={ev.id} className="flex items-center gap-2 glass-strong rounded-lg px-3 py-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    {time && <span className="text-[10px] text-muted-foreground font-mono shrink-0">{time}</span>}
                    <span className="text-xs text-foreground truncate">{ev.title}</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Empty state */}
      {items.length === 0 && !selectedDay && (
        <div className="px-5 pb-4">
          <p className="text-xs text-muted-foreground/60 text-center">No events scheduled. Add publishing dates, filming days, and deadlines.</p>
        </div>
      )}
    </motion.div>
  );
};
