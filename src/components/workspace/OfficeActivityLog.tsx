import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { OfficeActivityLogEntry } from '@/hooks/useOfficeActivityLog';
import { formatDistanceToNow } from 'date-fns';

interface OfficeActivityLogProps {
  entries: OfficeActivityLogEntry[];
}

const logTypeColor: Record<string, string> = {
  info: 'text-muted-foreground',
  task: 'text-primary',
  delegation: 'text-blue-400',
  completion: 'text-green-400',
  error: 'text-destructive',
  movement: 'text-yellow-400',
};

export const OfficeActivityLog = ({ entries }: OfficeActivityLogProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="text-xs text-muted-foreground font-mono text-center py-3">
        No activity yet
      </div>
    );
  }

  return (
    <ScrollArea className="h-[180px]">
      <div className="space-y-0.5 pr-2 font-mono text-[10px]">
        {entries.slice(0, 50).reverse().map(entry => (
          <div key={entry.id} className="flex gap-1.5 leading-relaxed">
            <span className="text-muted-foreground/60 shrink-0">
              {formatDistanceToNow(new Date(entry.created_at), { addSuffix: false }).replace('about ', '~')}
            </span>
            <span className={`font-semibold shrink-0 ${logTypeColor[entry.log_type] || logTypeColor.info}`}>
              {entry.agent_name}
            </span>
            <span className="text-foreground/80 break-all">{entry.action}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};
