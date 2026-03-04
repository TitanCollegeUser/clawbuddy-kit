import { useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { autopilotPhases } from '@/data/command-center-data';

const PHASE_ORDER = autopilotPhases.map((p) => p.fullName);
const ACTIVE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes without heartbeat = stale
const FAILED_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes without heartbeat = failed

interface AutopilotLogRow {
  id: string;
  message: string;
  created_at: string;
  data: {
    run_id?: string;
    phase?: string;
    event_type?: string;
    percent_complete?: number;
    current_action?: string;
    blockers?: string[];
    eta_minutes?: number;
    outcome?: string;
    gap_minutes?: number;
  } | null;
}

export interface ActiveAutopilotState {
  isActive: boolean;
  runId: string | null;
  currentPhase: string | null;
  currentPhaseIndex: number;
  completedPhases: string[];
  currentMessage: string | null;
  startedAt: string | null;
  elapsedMs: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
  // Progress broadcasting fields
  percentComplete: number | null;
  currentAction: string | null;
  etaMinutes: number | null;
  blockers: string[];
  isStale: boolean;
  lastHeartbeatAt: string | null;
}

/**
 * Detects whether an /autopilot run is currently active by subscribing
 * to ai_log entries that have lifecycle events or a phase in their data JSONB.
 */
export function useActiveAutopilot(): ActiveAutopilotState {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['cc_active_autopilot', user?.id],
    queryFn: async (): Promise<AutopilotLogRow[]> => {
      const { data, error } = await supabase
        .from('ai_log')
        .select('id, message, created_at, data')
        .or('data->>phase.not.is.null,data->>event_type.in.(run_start,work_progress,run_end,stale_progress)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data as unknown as AutopilotLogRow[]) ?? [];
    },
    enabled: !!user,
    refetchInterval: 30_000, // 30s fallback poll
  });

  // Real-time subscription — invalidate on new ai_log inserts
  useEffect(() => {
    const channel = supabase
      .channel('autopilot_tracker')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ai_log',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['cc_active_autopilot'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const state = useMemo((): ActiveAutopilotState => {
    const idle: ActiveAutopilotState = {
      isActive: false,
      runId: null,
      currentPhase: null,
      currentPhaseIndex: -1,
      completedPhases: [],
      currentMessage: null,
      startedAt: null,
      elapsedMs: 0,
      status: 'idle',
      percentComplete: null,
      currentAction: null,
      etaMinutes: null,
      blockers: [],
      isStale: false,
      lastHeartbeatAt: null,
    };

    if (!query.data || query.data.length === 0) return idle;

    const now = Date.now();

    // --- Run lifecycle detection (definitive) ---
    // Find the most recent run_start that has no matching run_end
    const runStarts = query.data.filter((row) => row.data?.event_type === 'run_start' && row.data?.run_id);
    const runEnds = new Set(
      query.data
        .filter((row) => row.data?.event_type === 'run_end' && row.data?.run_id)
        .map((row) => row.data!.run_id!)
    );

    let activeRunId: string | null = null;
    let activeRunStart: AutopilotLogRow | null = null;

    for (const start of runStarts) {
      if (!runEnds.has(start.data!.run_id!)) {
        activeRunId = start.data!.run_id!;
        activeRunStart = start;
        break;
      }
    }

    // Fallback: legacy detection via phase-based entries (runs without run_start)
    if (!activeRunId) {
      const latestWithRun = query.data.find((row) => row.data?.run_id && row.data?.phase);
      if (latestWithRun) {
        const latestTimestamp = new Date(latestWithRun.created_at).getTime();
        if (now - latestTimestamp <= ACTIVE_THRESHOLD_MS) {
          activeRunId = latestWithRun.data!.run_id!;
        }
      }
    }

    if (!activeRunId) return idle;

    // Gather all entries for this run_id
    const runEntries = query.data.filter((row) => row.data?.run_id === activeRunId);

    // Check if run has an explicit run_end
    const hasRunEnd = runEntries.some((row) => row.data?.event_type === 'run_end');
    if (hasRunEnd) {
      // Run is completed — show completed state briefly
      const endEntry = runEntries.find((row) => row.data?.event_type === 'run_end');
      const endTimestamp = endEntry ? new Date(endEntry.created_at).getTime() : now;
      // Only show completed state for 10 minutes after run_end
      if (now - endTimestamp > ACTIVE_THRESHOLD_MS) return idle;
    }

    // Find the most recent entry with a phase (for phase dot display)
    const latestPhaseEntry = runEntries.find((row) => row.data?.phase);
    const latestAnyEntry = runEntries[0]; // already sorted desc

    // Check staleness
    const latestTimestamp = latestAnyEntry ? new Date(latestAnyEntry.created_at).getTime() : now;
    const timeSinceLastEntry = now - latestTimestamp;

    // If no activity for >ACTIVE_THRESHOLD and no run_start/run_end lifecycle, it's dead
    if (timeSinceLastEntry > ACTIVE_THRESHOLD_MS && !activeRunStart && !hasRunEnd) {
      return idle;
    }

    // Determine phases seen
    const seenPhases = new Set<string>();
    let earliestTimestamp = now;

    for (const entry of runEntries) {
      const phase = entry.data?.phase;
      if (phase) seenPhases.add(phase);
      const t = new Date(entry.created_at).getTime();
      if (t < earliestTimestamp) earliestTimestamp = t;
    }

    const currentPhase = latestPhaseEntry?.data?.phase || null;
    const currentPhaseIndex = currentPhase ? PHASE_ORDER.indexOf(currentPhase) : -1;

    const completedPhases = PHASE_ORDER.filter((_p, i) => {
      if (currentPhaseIndex >= 0 && i < currentPhaseIndex) return true;
      return false;
    });

    const isCompleted = hasRunEnd || currentPhase === 'CLOSE';

    // --- Progress data from most recent work_progress event ---
    const latestProgress = runEntries.find((row) => row.data?.event_type === 'work_progress');
    const percentComplete = latestProgress?.data?.percent_complete ?? null;
    const currentAction = latestProgress?.data?.current_action ?? null;
    const etaMinutes = latestProgress?.data?.eta_minutes ?? null;
    const blockers = latestProgress?.data?.blockers ?? [];

    // --- Stale detection ---
    // Find last heartbeat (work_progress or run_start or any phase entry)
    const heartbeatEntries = runEntries.filter(
      (row) =>
        row.data?.event_type === 'work_progress' ||
        row.data?.event_type === 'run_start' ||
        row.data?.phase
    );
    const lastHeartbeat = heartbeatEntries.length > 0 ? heartbeatEntries[0] : null;
    const lastHeartbeatAt = lastHeartbeat ? lastHeartbeat.created_at : null;
    const lastHeartbeatMs = lastHeartbeat ? new Date(lastHeartbeat.created_at).getTime() : earliestTimestamp;

    // Check if a stale_progress event exists newer than last heartbeat
    const staleAlert = runEntries.find((row) => row.data?.event_type === 'stale_progress');
    const hasStaleAlert =
      staleAlert && lastHeartbeat
        ? new Date(staleAlert.created_at).getTime() > new Date(lastHeartbeat.created_at).getTime()
        : false;

    const isStale = !isCompleted && (now - lastHeartbeatMs > STALE_THRESHOLD_MS || hasStaleAlert);
    const isFailed = !isCompleted && (now - lastHeartbeatMs > FAILED_THRESHOLD_MS);

    // Determine status
    let status: 'idle' | 'running' | 'completed' | 'failed';
    if (isCompleted) {
      // Check if the run_end outcome was a failure
      const endEntry = runEntries.find((row) => row.data?.event_type === 'run_end');
      const outcome = endEntry?.data?.outcome;
      status = (outcome === 'failed' || outcome === 'canceled') ? 'failed' : 'completed';
    } else if (isFailed) {
      status = 'failed';
    } else {
      status = 'running';
    }

    return {
      isActive: !isCompleted && !isFailed,
      runId: activeRunId,
      currentPhase,
      currentPhaseIndex,
      completedPhases,
      currentMessage: latestPhaseEntry?.message || latestAnyEntry?.message || null,
      startedAt: new Date(earliestTimestamp).toISOString(),
      elapsedMs: now - earliestTimestamp,
      status,
      percentComplete,
      currentAction,
      etaMinutes,
      blockers,
      isStale,
      lastHeartbeatAt,
    };
  }, [query.data]);

  return state;
}
