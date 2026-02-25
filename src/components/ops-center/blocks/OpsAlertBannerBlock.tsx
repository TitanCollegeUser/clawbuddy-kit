import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle, AlertTriangle, AlertOctagon, X } from 'lucide-react';
import type { OpsBlock } from '@/hooks/useOpsBlocks';

interface Props { block: OpsBlock; appId: string }

const severityConfig: Record<string, { icon: React.ElementType; bg: string; border: string; text: string; glow: string }> = {
  info:    { icon: Info,          bg: 'bg-blue-500/10',   border: 'border-blue-500/30',  text: 'text-blue-400',   glow: '0 0 20px rgba(59,130,246,0.15)' },
  success: { icon: CheckCircle,   bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', glow: '0 0 20px rgba(16,185,129,0.15)' },
  warning: { icon: AlertTriangle,  bg: 'bg-amber-500/10',  border: 'border-amber-500/30', text: 'text-amber-400',  glow: '0 0 20px rgba(245,158,11,0.15)' },
  urgent:  { icon: AlertOctagon,   bg: 'bg-red-500/10',    border: 'border-red-500/30',   text: 'text-red-400',    glow: '0 0 20px rgba(239,68,68,0.2)' },
};

export const OpsAlertBannerBlock = ({ block }: Props) => {
  const [dismissed, setDismissed] = useState(false);
  const config = block.config as Record<string, unknown>;
  const severity = (config.severity as string) || 'info';
  const message = config.message as string;
  const subtitle = config.subtitle as string | undefined;
  const actionLabel = config.action_label as string | undefined;
  const dismissible = config.dismissible !== false;
  const s = severityConfig[severity] || severityConfig.info;
  const Icon = s.icon;

  if (!message || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={`rounded-xl border ${s.bg} ${s.border} p-4 flex items-start gap-3 ${severity === 'urgent' ? 'animate-pulse' : ''}`}
        style={{ boxShadow: s.glow }}
      >
        <Icon className={`${s.text} mt-0.5 shrink-0`} size={20} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${s.text}`}>{message}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actionLabel && (
            <button className={`text-xs font-semibold px-3 py-1 rounded-lg ${s.bg} ${s.text} hover:brightness-125 transition`}>
              {actionLabel}
            </button>
          )}
          {dismissible && (
            <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground transition p-0.5">
              <X size={14} />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
