import { motion } from 'framer-motion';
import { TrendingUp, Users, CheckCircle2, Clock, BarChart3, Activity } from 'lucide-react';
import type { AgentStatus, FreshnessLevel } from '@/types/command-center';
import { categoryColors } from '@/data/command-center-data';
import { useCommandCenterAgents } from '@/hooks/useCommandCenterAgents';
import { useCommandCenterLog } from '@/hooks/useCommandCenterLog';
import { useAlignmentScore } from '@/hooks/useAlignmentScore';
import { useCommandCenterStats } from '@/hooks/useCommandCenterStats';
import AlignmentGauge from './AlignmentGauge';
import { Badge } from '@/components/ui/badge';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const statusDotClass: Record<AgentStatus, string> = {
  online: 'status-dot-online cc-pulse-glow',
  thinking: 'status-dot-thinking cc-breathe',
  error: 'status-dot-error',
  offline: 'status-dot-offline',
};

const statusLabel: Record<AgentStatus, string> = {
  online: 'Online',
  thinking: 'Processing',
  error: 'Error',
  offline: 'Offline',
};

const freshnessLabel: Record<FreshnessLevel, string> = {
  fresh: '',
  stale: 'Stale',
  dead: 'No heartbeat',
};

const freshnessBadgeClass: Record<FreshnessLevel, string> = {
  fresh: '',
  stale: 'text-ops-amber border-ops-amber/30',
  dead: 'text-muted-foreground border-muted-foreground/30',
};

const CommandDeck = () => {
  const { agents } = useCommandCenterAgents();
  const { entries: activityFeed } = useCommandCenterLog();
  const { score: alignmentScore, checks: alignmentChecks } = useAlignmentScore();
  const { counts: taskCounts } = useCommandCenterStats();

  const onlineAgents = agents.filter((a) => a.status === 'online' || a.status === 'thinking');
  const isOperational = onlineAgents.length >= 1;
  const activeAgents = agents.filter((a) => a.status !== 'offline');
  const passedChecks = alignmentChecks.filter((c) => c.status === 'pass').length;
  const warnChecks = alignmentChecks.filter((c) => c.status === 'warn').length;
  const failChecks = alignmentChecks.filter((c) => c.status === 'fail').length;

  const kpiCards = [
    { label: 'Alignment Score', value: `${alignmentScore}%`, sub: 'B', trend: 'Live from ClawBuddy', icon: BarChart3, accent: 'accent-bar-emerald', glowColor: 'hsla(160, 84%, 39%, 0.2)' },
    { label: 'Active Employees', value: `${onlineAgents.length} / ${agents.length}`, sub: 'Online', trend: `${activeAgents.length} total registered`, icon: Users, accent: 'accent-bar-blue', glowColor: 'hsla(217, 91%, 60%, 0.2)' },
    { label: 'Tasks Completed (7d)', value: String(taskCounts.doneThisWeek), sub: 'tasks', trend: `${taskCounts.done} total done`, icon: CheckCircle2, accent: 'accent-bar-teal', glowColor: 'hsla(174, 84%, 40%, 0.2)' },
    { label: 'Tasks in Flight', value: String(taskCounts.inFlight), sub: 'active', trend: `${taskCounts.doing} doing, ${taskCounts.needs_input} blocked`, icon: Clock, accent: 'accent-bar-amber', glowColor: 'hsla(45, 93%, 47%, 0.2)' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* System Status Bar */}
      <motion.div variants={item} className="glass-card-futuristic px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={isOperational ? 'status-dot-online cc-pulse-glow' : 'status-dot-error'} />
          <span className="font-semibold text-sm uppercase tracking-widest">
            {isOperational ? 'System Operational' : 'System Degraded'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
          <span>Employees: <span className="text-foreground font-medium">{onlineAgents.length}/{agents.length}</span> Online</span>
          <span>Tasks in Flight: <span className="text-foreground font-medium">{taskCounts.inFlight}</span></span>
          <span>To Do: <span className="text-foreground font-medium">{taskCounts.todo}</span></span>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <motion.div
            key={kpi.label}
            variants={item}
            whileHover={{ y: -4, boxShadow: `0 12px 40px -8px ${kpi.glowColor}` }}
            className="glass-card-futuristic p-5 relative overflow-hidden group cursor-default"
          >
            <div className={`absolute top-0 left-0 right-0 h-1 ${kpi.accent}`} />
            <kpi.icon className="absolute top-4 right-4 w-5 h-5 text-muted-foreground/20 icon-hover-rotate" />
            <div className="text-3xl font-bold font-mono">{kpi.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{kpi.label}</div>
            <div className="flex items-center gap-1 mt-3 text-xs text-primary">
              <TrendingUp className="w-3 h-3" />
              <span>{kpi.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gauge + Agent Pulse Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="glass-card-futuristic p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">Operations Health</h3>
          <AlignmentGauge score={alignmentScore} />
          <div className="flex items-center justify-center gap-4 mt-6 text-xs">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-ops-emerald" />{passedChecks} passed</span>
            <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-ops-amber" />{warnChecks} warning</span>
            <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-ops-red" />{failChecks} failed</span>
          </div>
          <button className="w-full mt-4 py-2 text-sm font-medium text-primary border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors">
            Run Alignment Check
          </button>
        </motion.div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(activeAgents.length > 0 ? activeAgents : agents).map((agent) => (
            <motion.div
              key={agent.id}
              variants={item}
              whileHover={{ y: -3, scale: 1.01 }}
              className="glass-card-futuristic p-5 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{agent.emoji}</span>
                  <div>
                    <div className="font-semibold">{agent.name}</div>
                    <div className="text-xs text-muted-foreground">{agent.role || 'AI Employee'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{statusLabel[agent.status]}</span>
                  <div className={statusDotClass[agent.status]} />
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic mb-3">&quot;{agent.statusMessage || 'No status'}&quot;</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Active: {agent.lastActive}</span>
                {agent.freshness !== 'fresh' && (
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${freshnessBadgeClass[agent.freshness]}`}>
                    {freshnessLabel[agent.freshness]}
                  </Badge>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Live Activity Feed */}
      <motion.div variants={item} className="glass-card-futuristic p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Live Activity Feed</h3>
          <div className="flex items-center gap-1.5">
            <div className="status-dot-online" />
            <span className="text-xs text-muted-foreground">Real-time</span>
          </div>
        </div>
        <div className="space-y-0.5 max-h-80 overflow-y-auto pr-2">
          {activityFeed.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * Math.min(i, 10), duration: 0.3 }}
              className="feed-row flex items-start gap-3 py-2.5 rounded-md"
            >
              <span className="text-xs text-muted-foreground font-mono w-20 shrink-0 pt-0.5">{entry.time}</span>
              <span className="text-base">{entry.agentEmoji}</span>
              <span className="text-sm font-medium w-20 shrink-0">{entry.agentName}</span>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${categoryColors[entry.category] || ''}`}>
                {entry.category}
              </Badge>
              <span className="text-sm text-muted-foreground">{entry.message}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CommandDeck;
