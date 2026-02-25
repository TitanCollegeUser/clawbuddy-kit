import { motion } from 'framer-motion';
import { ListTodo, Clock, TrendingUp, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ActionItem } from '@/hooks/useGoals';
import { cn } from '@/lib/utils';

interface ActionItemsListProps {
  items: ActionItem[];
  onToggleItem: (index: number) => void;
  onSendToAi: () => void;
  isSending: boolean;
}

const priorityColors = {
  Low: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
  Medium: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  High: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  Urgent: 'bg-red-500/10 text-red-500 border-red-500/30',
};

export const ActionItemsList = ({
  items,
  onToggleItem,
  onSendToAi,
  isSending,
}: ActionItemsListProps) => {
  const selectedCount = items.filter((item) => item.selected !== false).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-green-500" />
          <h4 className="font-semibold text-foreground">Action Items</h4>
          <Badge variant="outline" className="ml-2">
            {selectedCount} selected
          </Badge>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'p-4 rounded-lg border transition-all cursor-pointer',
              'hover:bg-muted/50',
              item.selected !== false
                ? 'bg-green-500/5 border-green-500/20'
                : 'bg-background/50 border-border/50 opacity-60'
            )}
            onClick={() => onToggleItem(index)}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={item.selected !== false}
                onCheckedChange={() => onToggleItem(index)}
                className="mt-1"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-foreground">{item.title}</span>
                  <Badge
                    variant="outline"
                    className={cn('text-xs', priorityColors[item.priority])}
                  >
                    {item.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground/70 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.estimated_time}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {item.metric_impact}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Tasks Button */}
      <Button
        size="lg"
        onClick={onSendToAi}
        disabled={selectedCount === 0 || isSending}
        className="w-full gap-2 bg-green-600 hover:bg-green-700"
      >
        {isSending ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <LayoutGrid className="h-5 w-5" />
            </motion.div>
            Creating Tasks...
          </>
        ) : (
          <>
            <LayoutGrid className="h-5 w-5" />
            Create {selectedCount} Task{selectedCount !== 1 ? 's' : ''} on Board
          </>
        )}
      </Button>
    </motion.div>
  );
};
