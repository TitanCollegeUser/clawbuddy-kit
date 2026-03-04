import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, GitBranch, ChevronDown, FileText, Lightbulb } from 'lucide-react';
import { autopilotPhases, evolutionTypeColors, phaseColorMap } from '@/data/command-center-data';
import { useBuildHistory } from '@/hooks/useBuildHistory';
import { useEvolutionLog } from '@/hooks/useEvolutionLog';
import { useRunLifecycle } from '@/hooks/useRunLifecycle';
import { useActiveAutopilot } from '@/hooks/useActiveAutopilot';
import { Badge } from '@/components/ui/badge';
import type { BuildEntry } from '@/types/command-center';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

/** Expanded run lifecycle panel shown under a build row */
const RunLifecyclePanel = ({ runId }: { runId: string }) => {
  const { timeline, isLoading, logCount, insightCount } = useRunLifecycle(runId);

  if (isLoading) {
    return (
      <div className="px-6 py-4 text-sm text-muted-foreground animate-pulse">
        Loading run lifecycle...
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="px-6 py-4 text-sm text-muted-foreground">
        No lifecycle entries found for this run.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="px-4 py-3 bg-muted/5 border-t border-border/10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-muted-foreground font-mono">
            Run: {runId.slice(0, 8)}...
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">
            {logCount} logs
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-ops-amber border-ops-amber/30">
            {insightCount} insights
          </Badge>
        </div>
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-2">
          {timeline.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 py-1.5 text-sm rounded px-2 hover:bg-muted/10 transition-colors"
            >
              {entry.type === 'log' ? (
                <FileText className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />
              ) : (
                <Lightbulb className="w-3.5 h-3.5 mt-0.5 text-ops-amber shrink-0" />
              )}
              {entry.phase && (
                <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0 text-muted-foreground border-muted-foreground/20">
                  {entry.phase}
                </Badge>
              )}
              <span className="text-xs font-mono text-muted-foreground shrink-0 w-16">
                {new Date(entry.timestamp).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
              <span className="text-sm text-muted-foreground">{entry.message}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

/** Build history row — clickable if it has a runId */
const BuildRow = ({ build }: { build: BuildEntry }) => {
  const [expanded, setExpanded] = useState(false);
  const hasRunId = !!build.runId;

  return (
    <>
      <tr
        onClick={hasRunId ? () => setExpanded((v) => !v) : undefined}
        className={`border-b border-border/20 last:border-0 ${
          hasRunId ? 'cursor-pointer hover:bg-muted/5 transition-colors' : 'cursor-default'
        }`}
      >
        <td className="py-3.5 px-4 pr-4 text-muted-foreground font-mono text-xs">
          <div className="flex items-center gap-2">
            {hasRunId && (
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  expanded ? 'rotate-0' : '-rotate-90'
                }`}
              />
            )}
            {build.date}
          </div>
        </td>
        <td className="py-3.5 px-4 pr-4 font-medium">
          <div className="flex items-center gap-2">
            {build.title}
            {!hasRunId && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 text-muted-foreground/50 border-muted-foreground/20">
                Legacy
              </Badge>
            )}
          </div>
        </td>
        <td className="py-3.5 px-4 pr-4">
          <div className="flex gap-1.5">
            {Array.from({ length: build.totalPhases }).map((_, i) => (
              <motion.div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i < build.phasesCompleted ? 'bg-primary' : 'bg-muted'
                }`}
                whileHover={{
                  scale: 1.6,
                  boxShadow: i < build.phasesCompleted ? '0 0 8px hsl(160,84%,39%)' : 'none',
                }}
              />
            ))}
          </div>
        </td>
        <td className="py-3.5 px-4 pr-4 font-mono text-xs">{build.duration || '—'}</td>
        <td className="py-3.5 px-4 pr-4">
          <span
            className={`font-bold ${
              build.healAttempts === 0
                ? 'text-ops-emerald score-glow-a'
                : build.healAttempts <= 2
                ? 'text-ops-amber score-glow-c'
                : 'text-ops-red score-glow-f'
            }`}
          >
            {build.healAttempts}
          </span>
        </td>
        <td className="py-3.5 px-4">
          {build.alignmentScore > 0 ? (
            <Badge
              variant="outline"
              className={`${
                build.alignmentScore >= 90
                  ? 'score-a border-current score-glow-a'
                  : build.alignmentScore >= 75
                  ? 'score-b border-current score-glow-b'
                  : build.alignmentScore >= 60
                  ? 'score-c border-current score-glow-c'
                  : 'score-f border-current score-glow-f'
              } text-xs font-bold`}
            >
              {build.alignmentScore}%
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>
      </tr>
      {hasRunId && expanded && (
        <tr>
          <td colSpan={6} className="p-0">
            <AnimatePresence>
              <RunLifecyclePanel runId={build.runId!} />
            </AnimatePresence>
          </td>
        </tr>
      )}
    </>
  );
};

/** Format elapsed ms as human-readable duration */
const formatElapsed = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

/** Get phase dot class based on autopilot state */
const getPhaseDotClass = (phaseIndex: number, currentPhaseIndex: number, isActive: boolean): string => {
  if (!isActive) return 'phase-dot phase-dot-hover phase-dot-pending';
  if (phaseIndex < currentPhaseIndex) return 'phase-dot phase-dot-hover phase-dot-complete';
  if (phaseIndex === currentPhaseIndex) return 'phase-dot phase-dot-hover phase-dot-active';
  return 'phase-dot phase-dot-hover phase-dot-pending';
};

const SessionIntel = () => {
  const { builds: buildHistory } = useBuildHistory();
  const { entries: evolutionLog } = useEvolutionLog();
  const autopilot = useActiveAutopilot();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Autopilot Status */}
      <motion.div variants={item} className="glass-card-futuristic p-6">
        <div className="flex items-center gap-3 mb-6">
          <Zap className={`w-5 h-5 ${autopilot.isActive ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Autonomous Assignment</h3>
          {autopilot.isActive ? (
            <Badge variant="outline" className="text-primary border-primary/30 text-[10px] animate-pulse">
              RUNNING
            </Badge>
          ) : autopilot.status === 'completed' ? (
            <Badge variant="outline" className="text-ops-emerald border-ops-emerald/30 text-[10px]">
              COMPLETED
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30 text-[10px]">
              IDLE
            </Badge>
          )}
          {autopilot.isActive && (
            <span className="text-xs text-muted-foreground font-mono ml-auto">
              {formatElapsed(autopilot.elapsedMs)}
            </span>
          )}
        </div>

        {/* Phase Legend */}
        <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2">
          {autopilotPhases.map((phase, i) => {
            const dotClass = getPhaseDotClass(i, autopilot.currentPhaseIndex, autopilot.isActive);
            const isCurrentPhase = autopilot.isActive && i === autopilot.currentPhaseIndex;
            const isCompletedPhase = autopilot.isActive && i < autopilot.currentPhaseIndex;
            const phaseColor = phaseColorMap[phase.color] || 'hsl(220, 15%, 30%)';

            return (
              <div key={phase.id} className="flex items-center">
                <motion.div
                  className={dotClass}
                  initial={{ scale: 0 }}
                  animate={{
                    scale: isCurrentPhase ? [1, 1.15, 1] : 1,
                    boxShadow: isCurrentPhase
                      ? `0 0 12px ${phaseColor}`
                      : isCompletedPhase
                      ? `0 0 6px ${phaseColor}`
                      : 'none',
                  }}
                  transition={
                    isCurrentPhase
                      ? { scale: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }, delay: 0.1 * i }
                      : { delay: 0.1 * i, type: 'spring' }
                  }
                  whileHover={{ scale: 1.3 }}
                  style={
                    isCompletedPhase
                      ? { background: phaseColor, borderColor: phaseColor }
                      : isCurrentPhase
                      ? { background: phaseColor, borderColor: phaseColor }
                      : undefined
                  }
                >
                  {phase.id.charAt(0)}
                </motion.div>
                {i < autopilotPhases.length - 1 && (
                  <div
                    className="w-6 sm:w-10 h-0.5 mx-1 transition-colors duration-500"
                    style={{
                      background:
                        autopilot.isActive && i < autopilot.currentPhaseIndex
                          ? phaseColor
                          : 'hsl(220, 15%, 18%)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mb-4 overflow-x-auto">
          {autopilotPhases.map((phase, i) => (
            <span
              key={phase.id}
              className={`text-center w-8 sm:w-10 shrink-0 transition-colors duration-300 ${
                autopilot.isActive && i === autopilot.currentPhaseIndex
                  ? 'text-foreground font-semibold'
                  : autopilot.isActive && i < autopilot.currentPhaseIndex
                  ? 'text-primary'
                  : ''
              }`}
            >
              {phase.id}
            </span>
          ))}
        </div>

        {(autopilot.isActive || autopilot.status === 'failed' || autopilot.status === 'completed') ? (
          <div className="py-3 space-y-3">
            {/* Phase + Message */}
            <div className="text-center space-y-1">
              <p className="text-sm text-foreground font-medium">
                Phase: <span className="font-mono text-primary">{autopilot.currentPhase}</span>
              </p>
              {autopilot.currentAction && (
                <p className="text-xs text-muted-foreground max-w-md mx-auto truncate">
                  {autopilot.currentAction}
                </p>
              )}
              {!autopilot.currentAction && autopilot.currentMessage && (
                <p className="text-xs text-muted-foreground max-w-md mx-auto truncate">
                  {autopilot.currentMessage}
                </p>
              )}
            </div>

            {/* Progress Bar (when percent_complete is available) */}
            {autopilot.percentComplete !== null && (
              <div className="px-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                  <span className="font-medium text-foreground">{autopilot.percentComplete}% complete</span>
                  {autopilot.etaMinutes !== null && (
                    <span>~{autopilot.etaMinutes}m remaining</span>
                  )}
                </div>
                <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                    initial={{ width: 0 }}
                    animate={{ width: `${autopilot.percentComplete}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            {/* Failed State */}
            {autopilot.status === 'failed' && (
              <div className="flex flex-col items-center gap-1.5">
                <Badge variant="outline" className="text-ops-red border-ops-red/30 text-[10px]">
                  ❌ FAILED — Session terminated
                </Badge>
                {autopilot.lastHeartbeatAt && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Last heartbeat: {new Date(autopilot.lastHeartbeatAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                )}
              </div>
            )}

            {/* Stale Warning (only when not yet failed) */}
            {autopilot.isStale && autopilot.status !== 'failed' && (
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="text-ops-red border-ops-red/30 text-[10px] animate-pulse">
                  ⚠️ STALE — No heartbeat
                </Badge>
                {autopilot.lastHeartbeatAt && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Last: {new Date(autopilot.lastHeartbeatAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </span>
                )}
              </div>
            )}

            {/* Blockers */}
            {autopilot.blockers.length > 0 && (
              <div className="px-4">
                <div className="bg-ops-red/5 border border-ops-red/20 rounded-lg p-2.5">
                  <p className="text-[10px] text-ops-red uppercase font-semibold tracking-wider mb-1">Blockers</p>
                  {autopilot.blockers.map((blocker, i) => (
                    <p key={i} className="text-xs text-muted-foreground">• {blocker}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Run ID */}
            {autopilot.runId && (
              <p className="text-[10px] text-muted-foreground/50 font-mono text-center">
                Run: {autopilot.runId.slice(0, 8)}...
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No autonomous assignment running. Use <span className="font-mono text-foreground">/autopilot</span> in Claude Code to launch one.
          </p>
        )}
      </motion.div>

      {/* Build History */}
      <motion.div variants={item} className="glass-card-futuristic p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Build History</h3>
        <div className="overflow-x-auto glow-table rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4 pr-4">Date</th>
                <th className="py-3 px-4 pr-4">Title</th>
                <th className="py-3 px-4 pr-4">Phases</th>
                <th className="py-3 px-4 pr-4">Duration</th>
                <th className="py-3 px-4 pr-4">Heal</th>
                <th className="py-3 px-4">Score</th>
              </tr>
            </thead>
            <tbody>
              {buildHistory.map((build) => (
                <BuildRow key={build.id} build={build} />
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Self-Evolution Log */}
      <motion.div variants={item} className="glass-card-futuristic p-6">
        <div className="flex items-center gap-3 mb-4">
          <GitBranch className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Self-Evolution Log</h3>
        </div>
        <div className="space-y-3">
          {evolutionLog.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * Math.min(i, 10) }}
              whileHover={{ x: 4 }}
              className="glass-card evolution-card p-4 rounded-lg"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs text-muted-foreground font-mono">{entry.date}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${evolutionTypeColors[entry.type] || 'bg-muted text-muted-foreground'}`}
                >
                  {entry.type}
                </Badge>
              </div>
              {entry.file && (
                <p className="text-sm font-medium">
                  File: <span className="font-mono text-muted-foreground">{entry.file}</span>
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-1">{entry.change}</p>
              {entry.trigger && <p className="text-xs text-muted-foreground/70 mt-1">Trigger: {entry.trigger}</p>}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SessionIntel;
