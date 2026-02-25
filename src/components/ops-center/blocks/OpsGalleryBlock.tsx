import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, X, ArrowLeftRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { useOpsData, type OpsDataItem } from '@/hooks/useOpsData';

interface Props { block: OpsBlock; appId: string }

export const OpsGalleryBlock = ({ block, appId }: Props) => {
  const config = block.config as Record<string, unknown>;
  const columns = (config.columns as number) || 3;
  const enableComparison = config.enable_comparison !== false;
  const showStatusRibbon = config.show_status_ribbon !== false;
  const aspectRatio = (config.aspect_ratio as string) || '16:9';
  const [w, h] = aspectRatio.split(':').map(Number);
  const ratio = w / h;

  const { data: items = [], isLoading } = useOpsData({ appId, blockId: block.id, itemType: 'gallery_item' });

  const [lightbox, setLightbox] = useState<OpsDataItem | null>(null);
  const [compareItems, setCompareItems] = useState<OpsDataItem[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const toggleCompare = (item: OpsDataItem) => {
    setCompareItems(prev => {
      if (prev.find(p => p.id === item.id)) return prev.filter(p => p.id !== item.id);
      if (prev.length >= 2) return [prev[1], item];
      return [...prev, item];
    });
  };

  const ribbonColors: Record<string, string> = {
    winner: '#10b981', testing: '#f59e0b', draft: '#6b7280', rejected: '#ef4444', approved: '#3b82f6',
  };

  if (isLoading) {
    return (
      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {[...Array(columns * 2)].map((_, i) => (
          <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
            <AspectRatio ratio={ratio}><div className="w-full h-full bg-muted" /></AspectRatio>
            <div className="p-3 space-y-1.5"><div className="h-3 w-3/4 bg-muted rounded" /><div className="h-2.5 w-1/2 bg-muted rounded" /></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${Math.min(columns, 3)}, 1fr)` }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-dashed border-white/[0.08] flex flex-col items-center justify-center py-10 gap-2">
            <ImageIcon size={24} className="text-muted-foreground/30" />
          </div>
        ))}
        <p className="col-span-full text-xs text-muted-foreground/60 text-center">No visuals yet. Thumbnail concepts and mood boards will appear here.</p>
      </div>
    );
  }

  return (
    <>
      {/* Compare bar */}
      {enableComparison && compareItems.length > 0 && (
        <div className="glass rounded-lg px-4 py-2 mb-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{compareItems.length}/2 selected for comparison</span>
          <div className="flex gap-2">
            {compareItems.length === 2 && (
              <button onClick={() => setShowCompare(true)} className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
                <ArrowLeftRight size={12} /> Compare
              </button>
            )}
            <button onClick={() => setCompareItems([])} className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
          </div>
        </div>
      )}

      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {items.map((item, i) => {
          const d = item.data as Record<string, unknown>;
          const imageUrl = d?.image_url as string;
          const description = d?.description as string;
          const isSelected = compareItems.some(c => c.id === item.id);
          const ribbonColor = ribbonColors[item.status] || '#6b7280';

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`glass-strong rounded-xl overflow-hidden group cursor-pointer relative transition-all
                ${isSelected ? 'ring-2 ring-primary/60' : 'hover:ring-1 hover:ring-white/[0.1]'}`}
              onClick={() => enableComparison ? toggleCompare(item) : setLightbox(item)}
            >
              {/* Status ribbon */}
              {showStatusRibbon && item.status && (
                <div className="absolute top-2 right-2 z-10 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ backgroundColor: `${ribbonColor}30`, color: ribbonColor }}>
                  {item.status}
                </div>
              )}

              <AspectRatio ratio={ratio}>
                {imageUrl ? (
                  <img src={imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full bg-white/[0.03] flex items-center justify-center">
                    <ImageIcon size={32} className="text-muted-foreground/20" />
                  </div>
                )}
                {/* Hover overlay */}
                {description && (
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <p className="text-[11px] text-white/80 leading-relaxed line-clamp-3">{description}</p>
                  </div>
                )}
              </AspectRatio>

              <div className="p-3">
                <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={() => setLightbox(null)}>
        <DialogContent className="max-w-3xl glass border-white/[0.1]">
          {lightbox && (
            <div>
              <img src={(lightbox.data as Record<string, unknown>)?.image_url as string} alt={lightbox.title} className="w-full rounded-lg" />
              <p className="text-sm font-medium text-foreground mt-3">{lightbox.title}</p>
              {lightbox.description && <p className="text-xs text-muted-foreground mt-1">{lightbox.description}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comparison dialog */}
      <Dialog open={showCompare} onOpenChange={setShowCompare}>
        <DialogContent className="max-w-4xl glass border-white/[0.1]">
          <div className="grid grid-cols-2 gap-4">
            {compareItems.map(item => {
              const d = item.data as Record<string, unknown>;
              return (
                <div key={item.id} className="glass-strong rounded-xl overflow-hidden">
                  {(d?.image_url as string) && (
                    <img src={d.image_url as string} alt={item.title} className="w-full aspect-video object-cover" />
                  )}
                  <div className="p-3">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    {d?.description && <p className="text-xs text-muted-foreground mt-1">{d.description as string}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
