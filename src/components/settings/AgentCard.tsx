import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Trash2, Star, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { AiAgent } from '@/hooks/useAgents';
import { cn } from '@/lib/utils';

interface AgentCardProps {
  agent: AiAgent;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  isDeleting?: boolean;
}

export const AgentCard = ({ agent, onDelete, onSetDefault, isDeleting }: AgentCardProps) => {
  const [copied, setCopied] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(agent.webhook_secret);
    setCopied(true);
    toast.success('Webhook secret copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass border-border/50 hover:border-primary/30 transition-colors">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: agent.avatar_color }}
              >
                {agent.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-foreground">{agent.name}</p>
                {agent.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{agent.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {agent.is_default && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Star className="h-3 w-3" /> Default
                </Badge>
              )}
            </div>
          </div>

          {/* Webhook secret */}
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-muted/30 rounded text-xs font-mono truncate">
              {showSecret ? agent.webhook_secret : '••••••••••••••••••••'}
            </code>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowSecret(!showSecret)}>
              {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopy}>
              {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            {!agent.is_default && (
              <>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onSetDefault(agent.id)}>
                  Set Default
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn('text-xs h-7 text-destructive hover:text-destructive')}
                  onClick={() => onDelete(agent.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
