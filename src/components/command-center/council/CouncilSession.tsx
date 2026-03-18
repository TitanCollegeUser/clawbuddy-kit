import { useState } from 'react';
import { ChevronDown, ChevronRight, HelpCircle, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { CouncilParticipantChip } from './CouncilParticipantChip';
import { CouncilMessage } from './CouncilMessage';
import { AnimatedCouncilTheater } from '../animated/AnimatedCouncilTheater';
import { useCouncilSession } from '@/hooks/useCouncil';
import type { CouncilSessionWithDetails } from '@/hooks/useCouncil';

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-amber-400', label: 'Pending' },
  active: { icon: Loader2, color: 'text-cyan-400', label: 'Live' },
  completed: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Completed' },
  archived: { icon: CheckCircle2, color: 'text-muted-foreground', label: 'Archived' },
};

interface Props {
  session: CouncilSessionWithDetails;
}

export function CouncilSessionCard({ session }: Props) {
  const [expanded, setExpanded] = useState(session.status === 'active');
  const { data: detail } = useCouncilSession(expanded ? session.id : null);
  const config = statusConfig[session.status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const totalMessages = session.participants?.reduce((sum, p) => sum + p.messages_sent, 0) || 0;
  const totalLimit = session.participants?.reduce((sum, p) => sum + p.message_limit, 0) || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'glass-card transition-all duration-300',
        session.status === 'active' && 'border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      )}
    >
      {/* Session header — clickable to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-start gap-3 text-left hover:bg-white/[0.02] transition-colors rounded-lg"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 mt-1 text-muted-foreground shrink-0" />
        )}

        <HelpCircle className="h-5 w-5 mt-0.5 text-primary icon-glow shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm leading-snug mb-1">
            {session.question}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {session.participants?.map(p => (
              <CouncilParticipantChip key={p.id} participant={p} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <Badge className={cn(
            'text-xs border',
            session.status === 'active' && 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse',
            session.status === 'completed' && 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            session.status === 'pending' && 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            session.status === 'archived' && 'bg-muted/20 text-muted-foreground border-border/30',
          )}>
            <StatusIcon className={cn('h-3 w-3 mr-1', config.color, session.status === 'active' && 'animate-spin')} />
            {config.label}
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">{totalMessages}/{totalLimit}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
          </span>
        </div>
      </button>

      {/* Expanded message feed */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/20 pt-3">
              {detail?.messages && detail.messages.length > 0 ? (
                <>
                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-2">
                      {detail.messages.map((msg, idx) => (
                        <CouncilMessage
                          key={msg.id}
                          message={msg}
                          isLatest={idx === detail.messages.length - 1 && session.status === 'active'}
                        />
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Animated Council Theater */}
                  <AnimatedCouncilTheater
                    question={session.question}
                    status={session.status}
                    participants={session.participants || []}
                    messages={detail.messages}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {session.status === 'pending' ? 'Council not started yet. Waiting for "Begin".' : 'No messages yet.'}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
