import { motion } from 'framer-motion';
import { Clock, Youtube, Globe, FileCode, Cpu, FileText } from 'lucide-react';
import type { ForgeRecord } from '@/hooks/useForge';

interface ForgeHistoryGridProps {
  analyses: ForgeRecord[];
  onSelect: (analysis: ForgeRecord) => void;
}

const typeIcons: Record<string, React.ElementType> = {
  transcript: Youtube,
  url: Globe,
  api_docs: FileCode,
  mcp_spec: Cpu,
  text: FileText,
};

const statusColors: Record<string, string> = {
  complete: 'bg-forge-simple',
  assigned: 'bg-forge-skill',
  analyzing: 'bg-primary forge-pulse',
  failed: 'bg-forge-complex',
  pending: 'bg-muted-foreground',
};

export const ForgeHistoryGrid = ({ analyses, onSelect }: ForgeHistoryGridProps) => {
  if (analyses.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Past Analyses</h3>
        </div>
        <span className="text-xs text-muted-foreground bg-muted/30 rounded-full px-2.5 py-1">
          {analyses.length}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {analyses.map((analysis, i) => {
          const Icon = typeIcons[analysis.input_type] || FileText;
          const totalItems = analysis.analysis?.total_items ?? 0;
          const tasksCreated = analysis.tasks_created?.length ?? 0;

          return (
            <motion.div
              key={analysis.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(analysis)}
              className="forge-glass cursor-pointer group p-4 space-y-3"
            >
              {/* Top row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs capitalize text-muted-foreground">{analysis.input_type.replace('_', ' ')}</span>
                </div>
                <span className={`h-2 w-2 rounded-full ${statusColors[analysis.status] || statusColors.pending}`} />
              </div>

              {/* Summary */}
              <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-foreground/90 transition-colors">
                {analysis.analysis?.summary || analysis.input_source || 'Analysis'}
              </p>

              {/* Bottom row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground/60">
                  {new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                {totalItems > 0 && (
                  <span className="text-[10px] bg-white/[0.04] rounded-full px-2 py-0.5 text-muted-foreground">
                    {totalItems} items
                  </span>
                )}
                {tasksCreated > 0 && (
                  <span className="text-[10px] bg-[hsl(217_91%_60%/0.1)] text-forge-skill rounded-full px-2 py-0.5">
                    {tasksCreated} tasks
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
