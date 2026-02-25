import { useOpsData, useMoveOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import type { OpsDataItem } from '@/hooks/useOpsData';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GripVertical, AlertCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface ColumnConfig {
  id: string;
  title: string;
  color: string;
}

interface Props {
  block: OpsBlock;
  appId: string;
}

export const OpsKanbanBlock = ({ block, appId }: Props) => {
  const columns = (block.config.columns as ColumnConfig[]) || [];
  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });
  const moveData = useMoveOpsData();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const targetColId = over.id as string;
    if (columns.some(c => c.id === targetColId)) {
      moveData.mutate({ id: active.id as string, columnId: targetColId });
    }
  };

  if (isLoading) return <Skeleton className="h-60 w-full rounded-xl" />;

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
      <div className="p-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-custom">
            {columns.map((col, idx) => {
              const colItems = items?.filter(i => i.column_id === col.id) || [];
              return (
                <KanbanColumn key={col.id} col={col} items={colItems} index={idx} />
              );
            })}
          </div>
        </DndContext>
      </div>
    </motion.div>
  );
};

const KanbanColumn = ({ col, items, index }: { col: ColumnConfig; items: OpsDataItem[]; index: number }) => {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      className="min-w-[240px] flex-1"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
        <span className="font-orbitron text-sm font-medium uppercase tracking-wider text-foreground">{col.title}</span>
        <span className="text-sm text-muted-foreground bg-white/[0.08] rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
          {items.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[80px] rounded-xl glass p-2.5 transition-all duration-200 ${isOver ? 'ring-1 ring-primary/50' : ''}`}
        style={isOver ? { boxShadow: `0 0 20px ${col.color}30` } : undefined}
      >
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-16 border border-dashed border-white/[0.08] rounded-lg">
            <p className="text-sm text-muted-foreground">No items</p>
          </div>
        ) : (
          items.map((item, i) => (
            <DraggableKanbanCard key={item.id} item={item} colColor={col.color} index={i} />
          ))
        )}
      </div>
    </motion.div>
  );
};

const DraggableKanbanCard = ({ item, colColor, index }: { item: OpsDataItem; colColor: string; index: number }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;

  const priority = (item.metadata?.priority as string) || null;

  const priorityConfig: Record<string, { icon: React.ReactNode; className: string }> = {
    high: { icon: <ArrowUp className="h-3 w-3" />, className: 'bg-red-500/20 text-red-400 border-red-500/30' },
    medium: { icon: <Minus className="h-3 w-3" />, className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    low: { icon: <ArrowDown className="h-3 w-3" />, className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    urgent: { icon: <AlertCircle className="h-3 w-3" />, className: 'bg-red-500/30 text-red-300 border-red-500/40' },
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDragging ? 0.7 : 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
      className={`glass-strong rounded-lg p-3 cursor-grab active:cursor-grabbing group transition-all duration-200 hover:border-white/20`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-foreground line-clamp-2">{item.title}</p>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{item.description}</p>
          )}
          {priority && priorityConfig[priority] && (
            <Badge variant="outline" className={`mt-2 text-xs gap-1 ${priorityConfig[priority].className}`}>
              {priorityConfig[priority].icon}
              {priority}
            </Badge>
          )}
        </div>
      </div>
      <div
        className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: colColor }}
      />
    </motion.div>
  );
};
