import { useState } from 'react';
import { Download, Copy, Trash2, FileText, Image, Video, Code, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { OfficeDeliverable } from '@/hooks/useOfficeDeliverables';
import { toast } from 'sonner';

interface DeliverableRowProps {
  deliverable: OfficeDeliverable;
  onDelete: (id: string) => void;
}

const typeIcon: Record<string, React.ReactNode> = {
  image: <Image className="h-3.5 w-3.5 text-green-400" />,
  video: <Video className="h-3.5 w-3.5 text-purple-400" />,
  json: <Code className="h-3.5 w-3.5 text-yellow-400" />,
  markdown: <FileText className="h-3.5 w-3.5 text-blue-400" />,
  html: <Code className="h-3.5 w-3.5 text-orange-400" />,
  document: <File className="h-3.5 w-3.5 text-muted-foreground" />,
};

export const DeliverableRow = ({ deliverable, onDelete }: DeliverableRowProps) => {
  const [open, setOpen] = useState(false);

  const handleCopy = async () => {
    try {
      const resp = await fetch(deliverable.file_url);
      const text = await resp.text();
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const isTextBased = ['json', 'markdown', 'html', 'document'].includes(deliverable.file_type);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="glass rounded-lg border border-border/20 overflow-hidden">
        <CollapsibleTrigger className="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-secondary/30 transition-colors text-left">
          {typeIcon[deliverable.file_type] || typeIcon.document}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">{deliverable.file_name}</p>
            <p className="text-[10px] text-muted-foreground">
              by {deliverable.agent_name}
              {deliverable.description && ` — ${deliverable.description}`}
            </p>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2 border-t border-border/10 pt-2">
            {/* Inline preview */}
            {deliverable.file_type === 'image' && (
              <img
                src={deliverable.file_url}
                alt={deliverable.file_name}
                className="rounded-md max-h-64 w-auto"
                loading="lazy"
              />
            )}
            {deliverable.file_type === 'video' && (
              <video
                src={deliverable.file_url}
                controls
                className="rounded-md max-h-64 w-full"
              />
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2"
                asChild
              >
                <a href={deliverable.file_url} download={deliverable.file_name} target="_blank" rel="noopener noreferrer">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </a>
              </Button>

              {isTextBased && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] px-2"
                  onClick={handleCopy}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2 ml-auto text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete deliverable?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{deliverable.file_name}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(deliverable.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
