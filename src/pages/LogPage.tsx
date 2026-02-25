import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAiLog,
  useMarkLogRead,
  useMarkAllLogRead,
  useDeleteLogEntry,
  AiLogEntry,
} from '@/hooks/useAiLog';

import { AiAssistantAvatar } from '@/components/ai-assistant/AiAssistantAvatar';
import { format } from 'date-fns';
import { 
  ScrollText, 
  Eye, 
  Lightbulb, 
  Bell, 
  Megaphone, 
  Check, 
  CheckCheck, 
  Trash2,
  Info
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const categoryConfig: Record<string, { icon: typeof Info; color: string; label: string }> = {
  general: { icon: Info, color: 'text-blue-400', label: 'General' },
  observation: { icon: Eye, color: 'text-purple-400', label: 'Observation' },
  reminder: { icon: Bell, color: 'text-amber-400', label: 'Reminder' },
  fyi: { icon: Megaphone, color: 'text-emerald-400', label: 'FYI' },
};

const LogEntryCard = ({ entry, onMarkRead, onDelete }: { 
  entry: AiLogEntry;
  onMarkRead: () => void;
  onDelete: () => void;
}) => {
  const config = categoryConfig[entry.category] || categoryConfig.general;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'flex gap-4 p-4 rounded-xl border transition-all',
        entry.is_read 
          ? 'bg-card/30 border-border/30' 
          : 'bg-card/60 border-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
      )}
    >
      {/* Timeline indicator */}
      <div className="flex flex-col items-center gap-2">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          entry.is_read ? 'bg-muted/50' : 'bg-primary/20'
        )}>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        <div className="flex-1 w-px bg-border/30" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <AiAssistantAvatar size="xs" isOnline />
            <span className="text-sm font-medium text-foreground">{entry.agent_emoji || '⚡'} {entry.agent_name || 'Ray'}</span>
            <Badge variant="outline" className={cn('text-xs', config.color)}>
              {config.label}
            </Badge>
            {!entry.is_read && (
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {format(new Date(entry.created_at), 'MMM d, h:mm a')}
          </span>
        </div>

        <p className={cn(
          'mt-2 text-foreground whitespace-pre-wrap',
          entry.is_read && 'text-muted-foreground'
        )}>
          {entry.message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          {!entry.is_read && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onMarkRead}
              className="h-7 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark Read
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export const LogPage = () => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { data: logs = [], isLoading } = useAiLog(categoryFilter);
  const markRead = useMarkLogRead();
  const markAllRead = useMarkAllLogRead();
  const deleteEntry = useDeleteLogEntry();
  

  const unreadCount = logs.filter((l) => !l.is_read).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <ScrollText className="h-8 w-8 text-primary" />
            <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full" />
          </div>
          <div>
            <h1 className="text-3xl font-orbitron font-bold text-foreground">AI Log</h1>
            <p className="text-muted-foreground mt-1">Notes, observations, and updates from your AI agents</p>
          </div>
        </div>
      </motion.div>

      {/* Filters and Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] glass">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entries</SelectItem>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="observation">Observations</SelectItem>
              <SelectItem value="reminder">Reminders</SelectItem>
              <SelectItem value="fyi">FYI</SelectItem>
            </SelectContent>
          </Select>

          {unreadCount > 0 && (
            <Badge className="bg-primary/20 text-primary">
              <Lightbulb className="h-3 w-3 mr-1" />
              {unreadCount} unread
            </Badge>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </motion.div>

      {/* Log Entries */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl bg-card/30" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-12 text-center">
            <ScrollText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No log entries found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your AI agents will log observations and updates here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {logs.map((entry) => (
              <LogEntryCard
                key={entry.id}
                entry={entry}
                onMarkRead={() => markRead.mutate(entry.id)}
                onDelete={() => deleteEntry.mutate(entry.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
