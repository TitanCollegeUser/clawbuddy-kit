import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { motion } from 'framer-motion';

export const OpsTextBlock = ({ block }: { block: OpsBlock; appId: string }) => {
  const content = (block.config.content as string) || '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-xl overflow-hidden"
    >
      {block.title && (
        <div className="px-5 pt-4 pb-2">
          <h3 className="font-orbitron text-base font-semibold uppercase tracking-wider text-foreground">{block.title}</h3>
        </div>
      )}
      <div className="px-5 pb-5">
        <div className="border-l-2 border-primary/20 pl-4 prose prose-sm prose-invert max-w-none text-foreground text-sm leading-relaxed whitespace-pre-wrap">
          {content || <span className="text-muted-foreground">No content</span>}
        </div>
      </div>
    </motion.div>
  );
};
