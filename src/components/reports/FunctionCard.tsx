import { useState } from 'react';
import { Zap, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { WebhookFunction } from '@/hooks/useWebhookFunctions';

interface FunctionCardProps {
  fn: WebhookFunction;
  onEdit: (fn: WebhookFunction) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, is_active: boolean) => void;
}

export const FunctionCard = ({ fn, onEdit, onDelete, onToggleActive }: FunctionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm',
        'border-border/50 hover:border-primary/50',
        'hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]',
        !fn.is_active && 'opacity-60'
      )}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{fn.name}</h3>
                <Badge variant="outline" className="text-[10px] mt-1">
                  {fn.report_type}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleActive(fn.id, !fn.is_active)}>
                {fn.is_active ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(fn)}>
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => onDelete(fn.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {fn.description && (
            <p className="text-sm text-muted-foreground mb-3">{fn.description}</p>
          )}

          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-xs font-mono text-muted-foreground line-clamp-3">
              {fn.prompt_template}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
