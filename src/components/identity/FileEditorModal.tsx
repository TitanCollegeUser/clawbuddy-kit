import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileDefinition, IdentityFile, useUpdateIdentityFile } from '@/hooks/useIdentityFiles';
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Eye, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FileEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definition: FileDefinition | null;
  file?: IdentityFile;
  agentName?: string;
  agentId?: string;
}

export const FileEditorModal = ({ open, onOpenChange, definition, file, agentName, agentId }: FileEditorModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const updateFile = useUpdateIdentityFile();

  useEffect(() => {
    if (open) {
      setContent(file?.content || '');
      setIsEditing(false);
    }
  }, [open, file]);

  if (!definition) return null;

  const lastEditor = file?.updated_by === 'ray' ? (agentName || 'AI') : 'You';
  const hasChanges = content !== (file?.content || '');

  const handleSave = async () => {
    try {
      await updateFile.mutateAsync({
        fileKey: definition.key,
        content,
        agentId,
      });
      toast.success(`${definition.name} saved`);
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
            <DialogTitle className="font-orbitron text-lg">{definition.name}</DialogTitle>
            <Badge
              variant={isEditing ? 'default' : 'secondary'}
              className="text-[10px] cursor-pointer"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <><Pencil className="h-3 w-3 mr-1" />Editing</> : <><Eye className="h-3 w-3 mr-1" />Viewing</>}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{definition.description}</p>
          {file && (
            <p className="text-[10px] text-muted-foreground">
              Last edited by <span className="text-foreground">{lastEditor}</span>{' '}
              {formatDistanceToNow(new Date(file.updated_at), { addSuffix: true })}
            </p>
          )}
        </DialogHeader>

        {isEditing ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-h-[300px] font-mono text-sm bg-background/50 border-border/30 resize-y"
            placeholder={`Write content for ${definition.name}...`}
          />
        ) : (
          <ScrollArea className="flex-1 min-h-[300px] rounded-md border border-border/30 bg-background/50 p-4">
            <pre className="font-mono text-sm whitespace-pre-wrap text-foreground/90">
              {content || <span className="text-muted-foreground italic">No content yet — click "Viewing" badge to edit.</span>}
            </pre>
          </ScrollArea>
        )}

        <DialogFooter className="gap-2">
          {isEditing && (
            <Button onClick={handleSave} disabled={!hasChanges || updateFile.isPending} className="gap-2">
              {updateFile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
