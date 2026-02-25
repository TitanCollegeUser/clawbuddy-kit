import { Card, CardContent } from '@/components/ui/card';
import { DailyMemoryLog } from '@/hooks/useIdentityFiles';
import { format, formatDistanceToNow } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

interface DailyLogCardProps {
  log: DailyMemoryLog;
  onClick: () => void;
  agentName?: string;
}

export const DailyLogCard = ({ log, onClick, agentName }: DailyLogCardProps) => {
  const preview = log.content.slice(0, 120).replace(/[#*_`]/g, '');
  const author = log.updated_by === 'ray' ? (agentName || 'AI') : 'You';

  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
      <Card
        className="cursor-pointer glass hover:border-primary/30 transition-all duration-200"
        onClick={onClick}
      >
        <CardContent className="p-3 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-orbitron font-semibold">
                {format(new Date(log.log_date + 'T00:00:00'), 'MMM d, yyyy')}
              </p>
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(log.updated_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{preview || 'Empty log'}</p>
            <p className="text-[10px] text-muted-foreground/70">Written by {author}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
