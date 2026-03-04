import { motion } from 'framer-motion';
import { Shield, CheckCircle2, AlertTriangle, XCircle, Lock } from 'lucide-react';
import { hooks, deploymentRules } from '@/data/command-center-data';
import { useAlignmentScore } from '@/hooks/useAlignmentScore';
import { usePendingQuestionsCount } from '@/hooks/useAiQuestions';
import { useHookTelemetry } from '@/hooks/useHookTelemetry';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const checkIcon = (status: string) => {
  if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-ops-emerald shrink-0" />;
  if (status === 'warn') return <AlertTriangle className="w-4 h-4 text-ops-amber shrink-0" />;
  return <XCircle className="w-4 h-4 text-ops-red shrink-0" />;
};

const statusBorderColor = (status: string) => {
  if (status === 'pass') return 'hover:border-l-ops-emerald';
  if (status === 'warn') return 'hover:border-l-ops-amber';
  return 'hover:border-l-ops-red';
};

/** Map hook config IDs to telemetry hook_name keys */
const HOOK_ID_TO_NAME: Record<string, string> = {
  '1': 'command-guard',
  '2': 'pre-compact-save',
  '3': 'session-start',
  '4': 'typecheck',
};

/** Get status dot class based on telemetry recency */
const getHookStatusDot = (lastFiredAt: Date | null): { label: string; dotClass: string } => {
  if (!lastFiredAt) return { label: 'Never fired', dotClass: 'w-2 h-2 rounded-full bg-muted-foreground/30' };
  const hoursSince = (Date.now() - lastFiredAt.getTime()) / (1000 * 60 * 60);
  if (hoursSince < 1) return { label: 'Active', dotClass: 'status-dot-online' };
  if (hoursSince < 24) return { label: 'Idle', dotClass: 'w-2 h-2 rounded-full bg-ops-amber animate-pulse' };
  return { label: 'Dormant', dotClass: 'w-2 h-2 rounded-full bg-muted-foreground/40' };
};

const Guardrails = () => {
  const { score, checks: alignmentChecks, lastRun } = useAlignmentScore();
  const { data: pendingCount = 0 } = usePendingQuestionsCount();
  const { telemetryMap } = useHookTelemetry();

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Hook Status Grid */}
      <motion.div variants={item}>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Employee Policy Hooks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {hooks.map((hook) => {
            const hookName = HOOK_ID_TO_NAME[hook.id];
            const telemetry = hookName ? telemetryMap.get(hookName) : undefined;
            const lastFired = telemetry?.lastFired || hook.lastFired;
            const activityCount = telemetry?.executionCount ?? hook.activityCount;
            const { label: statusLabel, dotClass } = getHookStatusDot(telemetry?.lastFiredAt || null);

            return (
              <motion.div
                key={hook.id}
                variants={item}
                whileHover={{ y: -3, scale: 1.01 }}
                className="glass-card-futuristic neon-border p-5 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl icon-hover-pulse">{hook.icon}</span>
                    <div>
                      <div className="font-semibold text-sm">{hook.name}</div>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1">
                        {hook.eventType}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{statusLabel}</span>
                    <div className={dotClass} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{hook.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {hook.details.map((d) => (
                    <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {d}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                  <span>
                    Last fired: <span className="text-foreground">{lastFired}</span>
                  </span>
                  <span>
                    Activity: <span className="text-foreground">{activityCount}</span>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Blocked Commands Log */}
      <motion.div variants={item} className="glass-card-futuristic p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Blocked Commands</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: 'spring' }}>
            <Shield className="w-10 h-10 text-ops-emerald mb-3" />
          </motion.div>
          <p className="text-sm text-muted-foreground">All clear. No threats detected by your employee policies.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Guardrails are active and monitoring all agent activity.</p>
        </div>
      </motion.div>

      {/* Alignment Check Detail */}
      <motion.div variants={item} className="glass-card-futuristic p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Performance Checks — Score: {score}%
          </h3>
          <span className="text-xs text-muted-foreground">Last run: {lastRun || 'Never'}</span>
        </div>
        <div className="space-y-1">
          {alignmentChecks.map((check) => (
            <Tooltip key={check.id}>
              <TooltipTrigger asChild>
                <div
                  className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all cursor-default border-l-2 border-transparent hover:bg-muted/30 ${statusBorderColor(
                    check.status
                  )}`}
                >
                  {checkIcon(check.status)}
                  <span className="text-sm font-medium flex-1">{check.name}</span>
                  <span className="text-sm text-muted-foreground">{check.detail}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p>{check.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <button className="w-full mt-4 py-2.5 text-sm font-medium text-primary border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors">
          Run Performance Check
        </button>
      </motion.div>

      {/* Deployment Safety */}
      <motion.div variants={item} className="glass-card-futuristic p-6">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Deployment Safety Rules</h3>
        </div>
        <div className="space-y-2">
          {deploymentRules.map((rule) => (
            <div key={rule} className="rule-scan flex items-center gap-3 py-2 px-3 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-ops-emerald shrink-0" />
              <span className="text-sm">{rule}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-border/30 text-sm text-muted-foreground">
          Pending Approvals: <span className="text-foreground font-medium">{pendingCount}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Guardrails;
