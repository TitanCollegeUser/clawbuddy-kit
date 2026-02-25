import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { WebhookFunction } from '@/hooks/useWebhookFunctions';
import type { WebhookEndpoint } from '@/hooks/useWebhookEndpoints';

interface CreateWebhookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; slug: string; function_id: string; auto_process?: boolean }) => void;
  isLoading?: boolean;
  functions: WebhookFunction[];
  editingEndpoint?: WebhookEndpoint | null;
}

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const CreateWebhookModal = ({ open, onOpenChange, onSubmit, isLoading, functions, editingEndpoint }: CreateWebhookModalProps) => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [functionId, setFunctionId] = useState('');
  const [autoProcess, setAutoProcess] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (editingEndpoint) {
      setName(editingEndpoint.name);
      setSlug(editingEndpoint.slug);
      setFunctionId(editingEndpoint.function_id);
      setAutoProcess(editingEndpoint.auto_process);
      setSlugManuallyEdited(true);
    } else {
      setName('');
      setSlug('');
      setFunctionId(functions[0]?.id || '');
      setAutoProcess(false);
      setSlugManuallyEdited(false);
    }
  }, [editingEndpoint, open, functions]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugManuallyEdited) setSlug(slugify(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, slug, function_id: functionId, auto_process: autoProcess });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingEndpoint ? 'Edit Webhook Endpoint' : 'Create Webhook Endpoint'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ep-name">Name</Label>
            <Input id="ep-name" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Stripe Events" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ep-slug">Slug (URL path)</Label>
            <Input
              id="ep-slug"
              value={slug}
              onChange={(e) => { setSlug(slugify(e.target.value)); setSlugManuallyEdited(true); }}
              placeholder="e.g. stripe-events"
              required
            />
            <p className="text-xs text-muted-foreground font-mono">
              …/report-webhook?endpoint=<span className="text-primary">{slug || '…'}</span>
            </p>
          </div>
          <div className="space-y-2">
            <Label>Linked Function</Label>
            <Select value={functionId} onValueChange={setFunctionId}>
              <SelectTrigger><SelectValue placeholder="Select a function" /></SelectTrigger>
              <SelectContent>
                {functions.map((fn) => (
                  <SelectItem key={fn.id} value={fn.id}>{fn.name} ({fn.report_type})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
            <div>
              <Label>Auto Process</Label>
              <p className="text-xs text-muted-foreground">Automatically send incoming payloads to Ray for processing</p>
            </div>
            <Switch checked={autoProcess} onCheckedChange={setAutoProcess} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !name.trim() || !slug.trim() || !functionId}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingEndpoint ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
