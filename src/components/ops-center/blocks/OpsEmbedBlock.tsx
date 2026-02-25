import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { motion } from 'framer-motion';

export const OpsEmbedBlock = ({ block }: { block: OpsBlock; appId: string }) => {
  const url = (block.config.url as string) || '';
  const height = (block.config.height as string) || '400px';

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
      {url ? (
        <div className="p-3">
          <div className="glass-strong rounded-lg overflow-hidden">
            <iframe src={url} style={{ width: '100%', height, border: 'none' }} title={block.title || 'Embed'} sandbox="allow-scripts allow-same-origin" />
          </div>
        </div>
      ) : (
        <div className="px-5 pb-5">
          <div className="border border-dashed border-white/[0.08] rounded-lg py-10 text-center">
            <p className="text-base text-muted-foreground">No URL configured</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};
