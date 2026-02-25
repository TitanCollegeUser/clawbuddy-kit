import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, History, Play, MessageSquare, Mail, Monitor, Send, Bot, Mailbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cronToHuman } from '@/lib/cron-utils';
import { Automation, useToggleAutomation } from '@/hooks/useAutomations';
import { cn } from '@/lib/utils';

const channelIcon: Record<string, React.ReactNode> = {
  telegram: <Send className="h-3.5 w-3.5" />,
  discord: <MessageSquare className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  dashboard: <Monitor className="h-3.5 w-3.5" />,
  agentmail: <Mailbox className="h-3.5 w-3.5" />,
};

interface Props {
  automation: Automation;
  onEdit: (a: Automation) => void;
  onHistory: (a: Automation) => void;
}

export function AutomationCard({ automation: a, onEdit, onHistory }: Props) {
  const toggle = useToggleAutomation();
  const successRate = a.run_count > 0 ? ((a.run_count - a.fail_count) / a.run_count) * 100 : 0;
  const channelTypes = (a.channels || []).map((c: any) => c.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border p-4 transition-all',
        'bg-card/70 backdrop-blur-xl border-border/30 hover:border-border/60',
        !a.enabled && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-4">
        <Switch
          checked={a.enabled}
          onCheckedChange={(enabled) => toggle.mutate({ id: a.id, enabled })}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{a.name}</h3>
              {a.created_by === 'agent' && a.agent_name && (
                <Badge variant="secondary" className="text-[10px] shrink-0 bg-blue-500/15 text-blue-400 border-blue-500/30">
                  <Bot className="h-3 w-3 mr-1" />{a.agent_name}
                </Badge>
              )}
            </div>
            <Badge variant="outline" className="text-xs shrink-0 font-mono">
              {cronToHuman(a.cron_expression)}
            </Badge>
          </div>
          {a.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{a.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {a.last_run_at && (
              <span className="text-xs text-muted-foreground">
                <span className={cn(
                  'inline-block w-1.5 h-1.5 rounded-full mr-1',
                  a.last_status === 'success' ? 'bg-emerald-400' :
                  a.last_status === 'failed' ? 'bg-destructive' :
                  a.last_status === 'running' ? 'bg-primary animate-pulse' : 'bg-muted-foreground'
                )} />
                Last: {formatDistanceToNow(new Date(a.last_run_at), { addSuffix: true })}
              </span>
            )}
            {a.enabled && a.next_run_at && (
              <span className="text-xs text-amber-400">
                Next: {formatDistanceToNow(new Date(a.next_run_at), { addSuffix: true })}
              </span>
            )}
            {a.tags?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px] h-5">{tag}</Badge>
            ))}
            {channelTypes.map((type: string) => (
              <span key={type} className="text-muted-foreground" title={type}>
                {channelIcon[type] || type}
              </span>
            ))}
            {a.run_count > 0 && (
              <span className="text-xs text-muted-foreground ml-auto">
                ✅ {a.run_count - a.fail_count}/{a.run_count} runs
                <div className="w-16 h-1 bg-muted rounded-full mt-0.5 inline-block ml-1 align-middle">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${successRate}%` }} />
                </div>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(a)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onHistory(a)}>
            <History className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Manual run (placeholder)">
            <Play className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
