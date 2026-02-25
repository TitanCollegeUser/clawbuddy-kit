import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { icons } from 'lucide-react';
import type { OpsApp } from '@/hooks/useOpsCenterApps';
import { motion } from 'framer-motion';

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  setup: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  archived: 'bg-white/[0.06] text-muted-foreground border-white/[0.08]',
};

export const OpCard = ({ app }: { app: OpsApp }) => {
  const navigate = useNavigate();
  const IconComponent = (icons as Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>>)[
    app.icon.charAt(0).toUpperCase() + app.icon.slice(1).replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  ] || icons['Monitor'];

  const accent = (app.theme as Record<string, string>)?.accent;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="glass-strong rounded-xl cursor-pointer group relative overflow-hidden hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)] transition-shadow duration-300"
      onClick={() => navigate(`/ops-center/${app.name}`)}
    >
      {/* Holographic hover overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 holographic pointer-events-none" />

      <div className="p-5 space-y-3 relative z-10">
        <div className="flex items-start justify-between">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="p-2.5 rounded-xl bg-primary/10 transition-colors"
            style={accent ? { backgroundColor: `${accent}20`, boxShadow: `0 0 12px ${accent}30` } : undefined}
          >
            <IconComponent className="h-5 w-5 text-primary" style={accent ? { color: accent } : undefined} />
          </motion.div>
          <Badge className={`${statusColors[app.status] || statusColors.active} border`}>
            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
          </Badge>
        </div>
        <div>
          <h3 className="font-orbitron text-base font-semibold text-foreground uppercase tracking-wider">{app.title}</h3>
          {app.description && (
            <p className="text-base text-muted-foreground mt-1 line-clamp-2">{app.description}</p>
          )}
        </div>
        {app.agent_name && (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Powered by</span>
            <Badge variant="outline" className="text-xs px-2 py-0.5 bg-primary/10 border-primary/20 text-primary">
              {app.agent_name}
            </Badge>
          </div>
        )}
      </div>
    </motion.div>
  );
};
