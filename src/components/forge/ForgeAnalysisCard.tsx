import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Clock, Wrench, LayoutDashboard, Zap, Code2, Puzzle, Workflow,
  ExternalLink,
} from 'lucide-react';
import type { ForgeItem } from '@/hooks/useForge';

interface ForgeAnalysisCardProps {
  item: ForgeItem;
  index: number;
  onToggleSelect: (index: number) => void;
  onUpdateNotes?: (index: number, notes: string) => void;
  onUpdateAgent?: (index: number, agent: string) => void;
  availableAgents?: { name: string; type: string; emoji?: string }[];
}

const typeConfig: Record<ForgeItem['type'], { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  skill: { label: 'Skill', icon: Wrench, color: 'text-forge-skill', bg: 'bg-[hsl(217_91%_60%/0.15)]', border: 'border-l-[hsl(217,91%,60%)]' },
  ops_app: { label: 'OpsCenter App', icon: LayoutDashboard, color: 'text-forge-ops-app', bg: 'bg-[hsl(271_81%_56%/0.15)]', border: 'border-l-[hsl(271,81%,56%)]' },
  automation: { label: 'Automation', icon: Zap, color: 'text-forge-automation', bg: 'bg-[hsl(48_96%_53%/0.15)]', border: 'border-l-[hsl(48,96%,53%)]' },
  edge_function: { label: 'Edge Function', icon: Code2, color: 'text-forge-edge-function', bg: 'bg-[hsl(142_71%_45%/0.15)]', border: 'border-l-[hsl(142,71%,45%)]' },
  tool: { label: 'Tool', icon: Puzzle, color: 'text-forge-tool', bg: 'bg-[hsl(25_95%_53%/0.15)]', border: 'border-l-[hsl(25,95%,53%)]' },
  make_scenario: { label: 'Make Scenario', icon: Workflow, color: 'text-forge-make-scenario', bg: 'bg-[hsl(330_81%_60%/0.15)]', border: 'border-l-[hsl(330,81%,60%)]' },
};

const complexityConfig: Record<ForgeItem['complexity'], { color: string; dot: string }> = {
  simple: { color: 'text-forge-simple', dot: 'bg-forge-simple' },
  moderate: { color: 'text-forge-moderate', dot: 'bg-forge-moderate' },
  complex: { color: 'text-forge-complex', dot: 'bg-forge-complex' },
};

const priorityConfig: Record<ForgeItem['priority'], { color: string; bg: string }> = {
  high: { color: 'text-[hsl(0,90%,71%)]', bg: 'bg-[hsl(0_90%_71%/0.15)]' },
  medium: { color: 'text-[hsl(45,93%,56%)]', bg: 'bg-[hsl(45_93%_56%/0.15)]' },
  low: { color: 'text-muted-foreground', bg: 'bg-muted/30' },
};

const typeBorderColors: Record<ForgeItem['type'], string> = {
  skill: 'rgba(59,130,246,0.7)',
  ops_app: 'rgba(168,85,247,0.7)',
  automation: 'rgba(234,179,8,0.7)',
  edge_function: 'rgba(34,197,94,0.7)',
  tool: 'rgba(249,115,22,0.7)',
  make_scenario: 'rgba(236,72,153,0.7)',
};

export const ForgeAnalysisCard = ({ item, index, onToggleSelect, onUpdateNotes, onUpdateAgent, availableAgents }: ForgeAnalysisCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const type = typeConfig[item.type];
  const complexity = complexityConfig[item.complexity];
  const priority = priorityConfig[item.priority];
  const TypeIcon = type.icon;

  const borderColor = item.selected ? typeBorderColors[item.type] : 'rgba(255,255,255,0.06)';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: 'easeOut' }}
      className="group rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background: item.selected ? 'rgba(255,255,255,0.04)' : 'rgba(17,24,39,0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${borderColor}`,
        boxShadow: item.selected ? `inset 3px 0 12px ${borderColor.replace('0.7', '0.1')}` : 'none',
      }}
      whileHover={{
        borderColor: 'rgba(255,255,255,0.1)',
        y: -1,
        transition: { duration: 0.2 },
      }}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect(index); }}
            className="mt-0.5 flex-shrink-0"
          >
            <div
              className="h-[18px] w-[18px] rounded border-2 flex items-center justify-center transition-all duration-200"
              style={{
                borderColor: item.selected ? typeBorderColors[item.type] : 'rgba(255,255,255,0.2)',
                background: item.selected ? typeBorderColors[item.type] : 'transparent',
              }}
            >
              {item.selected && (
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-3 w-3"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              )}
            </div>
          </button>

          {/* Content */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-jetbrains font-semibold text-base text-foreground truncate">
                {item.name}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${type.bg} ${type.color}`}>
                <TypeIcon className="h-3 w-3" />
                {type.label}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priority.bg} ${priority.color}`}>
                {item.priority}
              </span>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
              {item.description}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-3 flex-wrap text-xs">
              <span className={`flex items-center gap-1.5 font-medium ${complexity.color}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${complexity.dot}`} />
                {item.complexity}
              </span>
              <span className="text-muted-foreground/30">&middot;</span>
              {availableAgents && availableAgents.length > 0 && onUpdateAgent ? (
                <select
                  value={item.override_agent || item.recommended_agent}
                  onChange={(e) => { e.stopPropagation(); onUpdateAgent(index, e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  className="forge-input text-xs px-2 py-0.5 bg-transparent border border-white/[0.1] rounded-md cursor-pointer hover:border-white/[0.2] transition-colors"
                >
                  {availableAgents.map((a) => (
                    <option key={a.name} value={a.name}>
                      {a.emoji ? `${a.emoji} ` : ''}{a.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-muted-foreground">
                  Agent: <span className="text-foreground font-medium">{item.override_agent || item.recommended_agent}</span>
                </span>
              )}
              <span className="text-muted-foreground/30">&middot;</span>
              <span className="text-muted-foreground">
                Model: <span className="text-foreground font-jetbrains text-[11px]">{item.recommended_model}</span>
              </span>
              <span className="text-muted-foreground/30">&middot;</span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {item.estimated_effort}
              </span>
            </div>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-shrink-0 rounded-lg p-1.5 hover:bg-white/[0.06] transition-colors"
          >
            <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          </button>
        </div>

        {/* Expanded section */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-4 pl-8 space-y-4">
                {/* Build Steps */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
                    BUILD STEPS
                  </div>
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[9px] top-3 bottom-3 w-px bg-primary/10" />
                    <div className="space-y-2.5">
                      {item.build_steps.map((step, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-start gap-3"
                        >
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/[0.15] text-primary text-[11px] font-bold flex items-center justify-center relative z-10">
                            {i + 1}
                          </div>
                          <span className="text-sm text-muted-foreground pt-0.5">{step}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* APIs Needed */}
                {item.apis_needed.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
                      APIS NEEDED
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {item.apis_needed.map((api, i) => (
                        <span
                          key={i}
                          className="group/pill inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-muted-foreground font-jetbrains hover:border-white/[0.15] transition-colors cursor-default"
                        >
                          {api}
                          <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover/pill:opacity-50 transition-opacity" />
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {onUpdateNotes && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
                      NOTES
                    </div>
                    <textarea
                      value={item.notes || ''}
                      onChange={(e) => onUpdateNotes(index, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      placeholder="Add notes for this item..."
                      className="forge-input w-full text-sm px-3 py-2 min-h-[60px] resize-y bg-white/[0.02] border border-white/[0.08] rounded-lg placeholder:text-muted-foreground/40 focus:border-primary/30 focus:outline-none transition-colors"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
