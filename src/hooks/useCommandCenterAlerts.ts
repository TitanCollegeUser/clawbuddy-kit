import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useCommandCenterAgents } from '@/hooks/useCommandCenterAgents';
import { useAlignmentScore } from '@/hooks/useAlignmentScore';
import type { FreshnessLevel } from '@/types/command-center';

const ALIGNMENT_THRESHOLD = 70;

/**
 * Side-effect hook that fires Sonner toasts when:
 * - An agent's freshness transitions (fresh→stale, stale→dead, dead→fresh)
 * - Alignment score drops below or recovers above the threshold
 *
 * Uses refs to track previous state — only fires on transitions, not on mount.
 */
export function useCommandCenterAlerts() {
  const { agents } = useCommandCenterAgents();
  const { score } = useAlignmentScore();

  const prevFreshness = useRef<Map<string, FreshnessLevel>>(new Map());
  const prevScore = useRef<number | null>(null);
  const initialized = useRef(false);

  // Agent freshness transitions
  useEffect(() => {
    if (!agents || agents.length === 0) return;

    // Skip first render — don't toast on page load
    if (!initialized.current) {
      for (const agent of agents) {
        prevFreshness.current.set(agent.id, agent.freshness);
      }
      initialized.current = true;
      return;
    }

    for (const agent of agents) {
      const prev = prevFreshness.current.get(agent.id);
      const curr = agent.freshness;

      if (prev && prev !== curr) {
        if (prev === 'fresh' && curr === 'stale') {
          toast.warning(`${agent.emoji} ${agent.name} went stale — no heartbeat for 2+ min`);
        } else if ((prev === 'fresh' || prev === 'stale') && curr === 'dead') {
          toast.error(`${agent.emoji} ${agent.name} is dead — no heartbeat for 10+ min`);
        } else if ((prev === 'stale' || prev === 'dead') && curr === 'fresh') {
          toast.success(`${agent.emoji} ${agent.name} is back online`);
        }
      }

      prevFreshness.current.set(agent.id, curr);
    }
  }, [agents]);

  // Alignment score transitions
  useEffect(() => {
    if (score === undefined || score === null) return;

    const prev = prevScore.current;
    prevScore.current = score;

    // Skip first render
    if (prev === null) return;

    if (prev >= ALIGNMENT_THRESHOLD && score < ALIGNMENT_THRESHOLD) {
      toast.warning(`Alignment dropped to ${score}% — below ${ALIGNMENT_THRESHOLD}% threshold`);
    } else if (prev < ALIGNMENT_THRESHOLD && score >= ALIGNMENT_THRESHOLD) {
      toast.success(`Alignment recovered to ${score}%`);
    }
  }, [score]);
}
