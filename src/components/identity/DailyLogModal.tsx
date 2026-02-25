import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DailyMemoryLog, useUpdateDailyLog } from '@/hooks/useIdentityFiles';
import { format } from 'date-fns';
import { Pencil, Eye, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DailyLogModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: DailyMemoryLog | null;
  agentName?: string;
  agentId?: string;
}

export const DailyLogModal = ({ open, onOpenChange, log, agentName, agentId }: DailyLogModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const updateLog = useUpdateDailyLog();

  useEffect(() => {
    if (open && log) {
      setContent(log.content);
      setIsEditing(false);
    }
  }, [open, log]);

  if (!log) return null;

  const author = log.updated_by === 'ray' ? (agentName || 'AI') : 'You';
  const hasChanges = content !== log.content;

  const handleSave = async () => {
    try {
      await updateLog.mutateAsync({
        logDate: log.log_date,
        content,
        agentId,
      });
      toast.success('Daily log saved');
      setIsEditing(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v && hasChanges && isEditing) {
        if (!confirm('You have unsaved changes. Discard?')) return;
      }
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col glass-strong">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="font-orbitron text-lg">
              {format(new Date(log.log_date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
            <Badge
              variant={isEditing ? 'default' : 'secondary'}
              className="text-[10px] cursor-pointer"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <><Pencil className="h-3 w-3 mr-1" />Editing</> : <><Eye className="h-3 w-3 mr-1" />Viewing</>}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Written by {author}</p>
        </DialogHeader>

        {isEditing ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-h-[300px] font-mono text-sm bg-background/50 border-border/30 resize-y"
          />
        ) : (
          <ScrollArea className="flex-1 min-h-[300px] rounded-md border border-border/30 bg-background/50 p-4">
            <pre className="font-mono text-sm whitespace-pre-wrap text-foreground/90">
              {content}
            </pre>
          </ScrollArea>
        )}

        <DialogFooter className="gap-2">
          {isEditing && (
            <Button onClick={handleSave} disabled={!hasChanges || updateLog.isPending} className="gap-2">
              {updateLog.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {isEditing && hasChanges ? 'Discard' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
