import { useState, useMemo } from 'react';
import { MessageCircle, Filter } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CommsThread } from '@/components/agent-comms/CommsThread';
import { useAgentComms, useUnreadCommsCount } from '@/hooks/useAgentComms';

export function AgentCommsTab() {
  const [agentFilter, setAgentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: threads, isLoading } = useAgentComms({ agent: agentFilter, status: statusFilter });
  const { data: unreadCount = 0 } = useUnreadCommsCount();

  const agentNames = useMemo(() => {
    if (!threads) return [];
    const names = new Set<string>();
    for (const t of threads) {
      names.add(t.from_agent);
      names.add(t.to_agent);
      t.replies?.forEach(r => { names.add(r.from_agent); names.add(r.to_agent); });
    }
    return Array.from(names).sort();
  }, [threads]);

  return (
    <div className="space-y-4">
      {/* Sub-header */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <MessageCircle className="h-5 w-5 text-primary icon-glow" />
        <h2 className="text-lg font-semibold text-foreground">Inter-Agent Messages</h2>
        {unreadCount > 0 && (
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 border">
            {unreadCount} unread
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs glass-card focus:ring-primary/40 focus:ring-1">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agentNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs glass-card focus:ring-primary/40 focus:ring-1">
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
          <span className="text-xs text-muted-foreground">{threads?.length ?? 0} threads</span>
        </div>
      </div>

      {/* Thread list */}
      <ScrollArea className="h-[600px] pr-2">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : !threads?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No messages yet</p>
            <p className="text-sm">Agent conversations will appear here in real time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {threads.map(thread => (
                <CommsThread key={thread.id} thread={thread} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
