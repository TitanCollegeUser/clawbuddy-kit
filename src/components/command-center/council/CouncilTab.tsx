import { useState } from 'react';
import { Scale, Filter } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CouncilSessionCard } from './CouncilSession';
import { useCouncilSessions, useActiveCouncilCount } from '@/hooks/useCouncil';

export function CouncilTab() {
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: sessions, isLoading } = useCouncilSessions(statusFilter);
  const { data: activeCount = 0 } = useActiveCouncilCount();

  return (
    <div className="space-y-4">
      {/* Sub-header */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <Scale className="h-5 w-5 text-primary icon-glow" />
        <h2 className="text-lg font-semibold text-foreground">Agent Council</h2>
        {activeCount > 0 && (
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 border animate-pulse">
            {activeCount} live
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs glass-card focus:ring-primary/40 focus:ring-1">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              <SelectItem value="active">Live</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{sessions?.length ?? 0} sessions</span>
        </div>
      </div>

      {/* How it works hint */}
      <div className="glass-card p-3 border-l-2 border-l-primary/40">
        <p className="text-xs text-muted-foreground">
          <span className="text-primary font-medium">How it works:</span> Ask Sherlock or Ray to start a council via the API.
          Set a question, assign agents with message limits, and say "begin." Each agent contributes within their limit.
          The session auto-completes when all agents have spoken.
        </p>
      </div>

      {/* Session list */}
      <ScrollArea className="h-[600px] pr-2">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : !sessions?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Scale className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No council sessions yet</p>
            <p className="text-sm">Start a council to get structured opinions from your AI agents.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {sessions.map(session => (
                <CouncilSessionCard key={session.id} session={session} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
