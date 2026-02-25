import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, RefreshCw, MapPin, Clock, Users, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useOpsData } from '@/hooks/useOpsData';
import { format, isToday, isTomorrow, parseISO, differenceInMinutes, isBefore, isAfter } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import type { OpsDataItem } from '@/hooks/useOpsData';

const TIMEZONE = 'America/Los_Angeles';
const CALENDAR_BLOCK_ID = 'a139869e-6e11-43a2-9ffa-0af736b7cfde';
const RESEARCH_HUB_APP_ID = '6149611f-1c3b-4906-9c5b-1fa58d0cd7ce';

interface Props {
  block: OpsBlock;
  appId: string;
}

const formatTime = (iso: string) => {
  try {
    const d = toZonedTime(parseISO(iso), TIMEZONE);
    return format(d, 'h:mm a');
  } catch {
    return '';
  }
};

const formatDuration = (startIso: string, endIso: string) => {
  try {
    const mins = differenceInMinutes(parseISO(endIso), parseISO(startIso));
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  } catch {
    return '';
  }
};

const getEventStatus = (startIso: string, endIso: string) => {
  const now = new Date();
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  if (isBefore(now, start)) {
    const minsUntil = differenceInMinutes(start, now);
    if (minsUntil < 60) return { label: `in ${minsUntil}m`, color: 'text-blue-400', pulse: false };
    const hrs = Math.floor(minsUntil / 60);
    return { label: `in ${hrs}h`, color: 'text-muted-foreground', pulse: false };
  }
  if (isAfter(now, end)) {
    return { label: 'Done', color: 'text-muted-foreground/60', pulse: false };
  }
  return { label: 'Now', color: 'text-emerald-400', pulse: true };
};

interface AttendeeObj {
  email?: string;
  displayName?: string;
  responseStatus?: string;
}

const resolveAttendeeName = (att: string | AttendeeObj): string => {
  if (typeof att === 'string') return att;
  if (att?.displayName) return att.displayName;
  if (att?.email) return att.email.split('@')[0];
  return '?';
};

const getInitials = (name: string) => {
  if (!name || typeof name !== 'string') return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

const avatarColors = [
  'bg-blue-500/20 text-blue-400',
  'bg-purple-500/20 text-purple-400',
  'bg-cyan-500/20 text-cyan-400',
  'bg-amber-500/20 text-amber-400',
  'bg-pink-500/20 text-pink-400',
  'bg-emerald-500/20 text-emerald-400',
];

export const ResearchCalendarBlock = ({ block, appId }: Props) => {
  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);

  const groupedEvents = useMemo(() => {
    if (!items || items.length === 0) return { today: [], tomorrow: [], later: [] };

    const events = items
      .filter(i => i.item_type === 'event')
      .sort((a, b) => {
        const aStart = (a.data as Record<string, unknown>)?.start as string || a.created_at;
        const bStart = (b.data as Record<string, unknown>)?.start as string || b.created_at;
        return aStart.localeCompare(bStart);
      });

    const today: OpsDataItem[] = [];
    const tomorrow: OpsDataItem[] = [];
    const later: OpsDataItem[] = [];

    events.forEach(ev => {
      const d = ev.data as Record<string, unknown>;
      const startStr = d?.start as string;
      if (!startStr) return;
      try {
        const zonedDate = toZonedTime(parseISO(startStr), TIMEZONE);
        if (isToday(zonedDate)) today.push(ev);
        else if (isTomorrow(zonedDate)) tomorrow.push(ev);
        else later.push(ev);
      } catch {
        later.push(ev);
      }
    });

    return { today, tomorrow, later };
  }, [items]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calendar-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action: 'search' }),
        }
      );

      const result = await resp.json();
      if (!result.success) throw new Error(result.error || 'Sync failed');

      const events = result.events || [];

      // Clear existing events for this block, then insert new ones
      await supabase.from('ops_data').delete().eq('block_id', CALENDAR_BLOCK_ID).eq('item_type', 'event');

      if (events.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        const records = events.map((ev: Record<string, unknown>, idx: number) => ({
          app_id: RESEARCH_HUB_APP_ID,
          block_id: CALENDAR_BLOCK_ID,
          item_type: 'event',
          title: (ev.summary as string) || (ev.name as string) || 'Untitled Event',
          status: 'active',
          sort_order: idx,
          data: {
            type: 'calendar_event',
            start: ev.start as string,
            end: ev.end as string,
            location: ev.location as string || null,
            description: ev.description as string || null,
            attendees: (ev.attendees as string[]) || [],
            calendar: 'primary',
            event_id: ev.id as string || null,
            status: ev.status as string || 'confirmed',
          },
          metadata: { agent: 'Sherlock', synced_at: new Date().toISOString() },
          user_id: user?.id || '',
        }));

        const { error } = await supabase.from('ops_data').insert(records);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['ops-data', appId] });
      toast({
        title: 'Calendar synced',
        description: `${events.length} event${events.length !== 1 ? 's' : ''} loaded`,
      });
    } catch (err) {
      toast({
        title: 'Sync failed',
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const renderEventCard = (item: OpsDataItem, i: number) => {
    const d = item.data as Record<string, unknown>;
    const start = d?.start as string || '';
    const end = d?.end as string || '';
    const location = d?.location as string;
    const rawAttendees = (d?.attendees as (string | AttendeeObj)[]) || [];
    const attendees = rawAttendees.map(resolveAttendeeName);
    const status = start && end ? getEventStatus(start, end) : null;

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.05 }}
        className="glass-strong rounded-xl p-4 hover:border-white/[0.12] border border-transparent transition-all"
      >
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* Time */}
            <div className="flex items-center gap-2 mb-1">
              <Clock size={12} className="text-blue-400 shrink-0" />
              <span className="text-sm font-semibold text-blue-400">
                {formatTime(start)}{end ? ` – ${formatTime(end)}` : ''}
              </span>
            </div>
            {/* Title */}
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            {/* Location */}
            {location && (
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={11} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{location}</span>
              </div>
            )}
            {/* Attendees */}
            {attendees.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <Users size={11} className="text-muted-foreground shrink-0" />
                <div className="flex items-center gap-1">
                  {attendees.slice(0, 4).map((name, j) => (
                    <div
                      key={j}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold ${avatarColors[j % avatarColors.length]}`}
                      title={name}
                    >
                      {getInitials(name)}
                    </div>
                  ))}
                  {attendees.length > 4 && (
                    <span className="text-[10px] text-muted-foreground ml-0.5">
                      +{attendees.length - 4}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: duration + status */}
          <div className="text-right shrink-0">
            {start && end && (
              <span className="text-xs text-muted-foreground">{formatDuration(start, end)}</span>
            )}
            {status && (
              <div className={`flex items-center justify-end gap-1.5 mt-1 ${status.color}`}>
                {status.pulse && (
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
                <span className="text-[11px] font-semibold">{status.label}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSection = (title: string, events: OpsDataItem[]) => {
    if (events.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-orbitron uppercase tracking-wider text-muted-foreground">{title}</h4>
          <div className="flex-1 h-px bg-white/[0.06]" />
          <Badge variant="outline" className="text-[10px] px-2 py-0 bg-white/[0.04]">
            {events.length}
          </Badge>
        </div>
        <div className="space-y-2">
          {events.map((ev, i) => renderEventCard(ev, i))}
        </div>
      </div>
    );
  };

  const hasEvents = groupedEvents.today.length > 0 || groupedEvents.tomorrow.length > 0 || groupedEvents.later.length > 0;
  const todayLabel = `Today — ${format(new Date(), 'EEEE, MMM d')}`;
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowLabel = `Tomorrow — ${format(tomorrowDate, 'EEEE, MMM d')}`;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-blue-400" />
          <div>
            <h3 className="font-orbitron text-base font-semibold uppercase tracking-wider text-foreground">
              Upcoming Events
            </h3>
            <p className="text-xs text-muted-foreground">Synced from Google Calendar</p>
          </div>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] text-muted-foreground hover:bg-white/[0.1] hover:text-foreground transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* Events */}
      {hasEvents ? (
        <div className="space-y-5">
          {renderSection(todayLabel, groupedEvents.today)}
          {renderSection(tomorrowLabel, groupedEvents.tomorrow)}
          {groupedEvents.later.length > 0 && renderSection('Later', groupedEvents.later)}
        </div>
      ) : (
        <div className="glass rounded-xl p-8 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Calendar size={24} className="text-blue-400" />
          </div>
          <p className="text-sm font-medium text-foreground">No upcoming events</p>
          <p className="text-xs text-muted-foreground">Click &ldquo;Sync Now&rdquo; to fetch your Google Calendar.</p>
        </div>
      )}
    </div>
  );
};
