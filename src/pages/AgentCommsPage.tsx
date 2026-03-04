import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAgentComms, useUnreadCommsCount } from '@/hooks/useAgentComms';
import { CommsThread } from '@/components/agent-comms/CommsThread';

export const AgentCommsPage = () => {
  const [agentFilter, setAgentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: threads, isLoading } = useAgentComms({
    agent: agentFilter,
    status: statusFilter,
  });
  const { data: unreadCount = 0 } = useUnreadCommsCount();

  // Extract unique agent names from data for the filter dropdown
  const agentNames = new Set<string>();
  if (threads) {
    for (const t of threads) {
      agentNames.add(t.from_agent);
      agentNames.add(t.to_agent);
      if (t.replies) {
        for (const r of t.replies) {
          agentNames.add(r.from_agent);
          agentNames.add(r.to_agent);
        }
      }
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <MessageCircle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Comms</h1>
          <p className="text-sm text-muted-foreground">
            Inter-agent messages and conversations
          </p>
        </div>
        {unreadCount > 0 && (
          <Badge className="ml-2 bg-primary/20 text-primary border border-primary/30">
            {unreadCount} unread
          </Badge>
        )}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3"
      >
        <Filter className="h-4 w-4 text-muted-foreground" />

        <Select value={agentFilter} onValueChange={setAgentFilter}>
          <SelectTrigger className="w-[160px] h-9 bg-card/60 border-border/40">
            <SelectValue placeholder="All Agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {Array.from(agentNames)
              .sort()
              .map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 bg-card/60 border-border/40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground ml-auto">
          {threads?.length ?? 0} thread{(threads?.length ?? 0) !== 1 ? 's' : ''}
        </span>
      </motion.div>

      {/* Message List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : !threads || threads.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            No messages yet
          </h3>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Agent conversations will appear here in real time.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {threads.map((thread) => (
              <CommsThread key={thread.id} thread={thread} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
