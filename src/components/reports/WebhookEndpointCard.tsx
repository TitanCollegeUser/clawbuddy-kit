import { Copy, Pencil, Trash2, ToggleLeft, ToggleRight, Zap, Link2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { WebhookEndpoint } from '@/hooks/useWebhookEndpoints';

interface WebhookEndpointCardProps {
  endpoint: WebhookEndpoint;
  onEdit: (endpoint: WebhookEndpoint) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, is_active: boolean) => void;
}

export const WebhookEndpointCard = ({ endpoint, onEdit, onDelete, onToggleActive }: WebhookEndpointCardProps) => {
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/report-webhook?endpoint=${endpoint.slug}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied');
  };

  const copySecret = () => {
    navigator.clipboard.writeText(endpoint.secret);
    toast.success('Secret copied');
  };

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
        !endpoint.is_active && 'opacity-60'
      )}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{endpoint.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {endpoint.auto_process && (
                    <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Auto</Badge>
                  )}
                  {endpoint.webhook_functions && (
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Zap className="h-3 w-3" />
                      {endpoint.webhook_functions.name}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onToggleActive(endpoint.id, !endpoint.is_active)}>
                {endpoint.is_active ? <ToggleRight className="h-4 w-4 text-emerald-400" /> : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(endpoint)}>
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => onDelete(endpoint.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2 rounded-lg bg-muted/30 border border-border/30 overflow-hidden">
                <p className="text-xs font-mono text-muted-foreground truncate">{webhookUrl}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={copyUrl}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Secret:</span>
              <code className="text-xs font-mono text-muted-foreground">{endpoint.secret.slice(0, 8)}…</code>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copySecret}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
