import { formatDistanceToNow } from 'date-fns';
import { Brain, Clock, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMemoryInjections, useDeleteMemory, MemoryInjection } from '@/hooks/useMemoryInjection';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Loader2,
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    iconClassName: 'animate-spin',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
    iconClassName: '',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-500/20 text-red-400 border-red-500/30',
    iconClassName: '',
  },
};

const MemoryCard = ({ memory }: { memory: MemoryInjection }) => {
  const deleteMemory = useDeleteMemory();
  const config = statusConfig[memory.status];
  const StatusIcon = config.icon;
  
  const contentPreview = memory.content.length > 150 
    ? memory.content.substring(0, 150) + '...' 
    : memory.content;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="glass border-border/30 hover:border-primary/30 transition-all group">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-foreground/90 font-exo line-clamp-3">
              {contentPreview}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={() => deleteMemory.mutate(memory.id)}
              disabled={deleteMemory.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(memory.created_at), { addSuffix: true })}
              </span>
            </div>
            
            <Badge variant="outline" className={cn('text-xs gap-1', config.className)}>
              <StatusIcon className={cn('h-3 w-3', config.iconClassName)} />
              {config.label}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const PastInjectionsList = () => {
  const { data: memories = [], isLoading } = useMemoryInjections();

  if (isLoading) {
    return (
      <Card className="glass-strong border-border/50">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (memories.length === 0) {
    return (
      <Card className="glass-strong border-border/50">
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground font-exo">
            No memory injections yet. Submit your first context above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-strong border-border/50">
      <CardHeader>
        <CardTitle className="text-lg font-orbitron">Past Injections</CardTitle>
        <CardDescription className="font-exo">
          Previously submitted memory contexts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {memories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
