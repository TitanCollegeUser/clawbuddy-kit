import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minimize2, Maximize2, RefreshCw, Expand } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useQueryClient } from '@tanstack/react-query';
import type { OpsBlock } from '@/hooks/useOpsBlocks';

interface Props {
  block: OpsBlock;
  appId: string;
  children: ReactNode;
}

export const OpsBlockWrapper = ({ block, appId, children }: Props) => {
  const [minimized, setMinimized] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['ops-data', appId, block.id] });
    queryClient.invalidateQueries({ queryKey: ['ops-data', appId] });
  };

  // Config-only blocks (alert_banner, countdown) don't need wrapper title since they handle it internally
  const isConfigOnly = ['alert_banner', 'countdown'].includes(block.block_type);
  const title = block.title;

  // Apply theme override
  const themeOverride = (block.config as Record<string, unknown>)?.theme_override as Record<string, string> | undefined;
  const accent = themeOverride?.accent;

  return (
    <div
      className="group/block relative"
      style={accent ? { '--block-accent': accent } as React.CSSProperties : undefined}
    >
      {/* Header bar */}
      {title && !isConfigOnly && (
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="font-orbitron text-sm font-semibold uppercase tracking-wider text-foreground">
            {title}
          </h3>
          <div className="flex items-center gap-0.5 opacity-0 group-hover/block:opacity-100 transition-opacity">
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition"
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={() => setMinimized(!minimized)}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition"
              title={minimized ? 'Expand' : 'Minimize'}
            >
              {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            </button>
            <button
              onClick={() => setFullscreen(true)}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition"
              title="Fullscreen"
            >
              <Expand size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <AnimatePresence initial={false}>
        {!minimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {minimized && (
        <div className="glass rounded-xl px-4 py-2 text-xs text-muted-foreground/60 italic">
          Block minimized — click expand to show
        </div>
      )}

      {/* Fullscreen dialog */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-auto glass border-white/[0.1]">
          <DialogTitle className="font-orbitron text-sm uppercase tracking-wider">{title || block.block_type}</DialogTitle>
          <div className="mt-2">{children}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
