import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { WebhookFunction } from '@/hooks/useWebhookFunctions';

interface CreateFunctionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; description?: string; prompt_template: string; report_type: string }) => void;
  isLoading?: boolean;
  editingFunction?: WebhookFunction | null;
}

export const CreateFunctionModal = ({ open, onOpenChange, onSubmit, isLoading, editingFunction }: CreateFunctionModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('Process the following data and generate a detailed HTML report:\n\n{{raw_data}}');
  const [reportType, setReportType] = useState('insight');

  useEffect(() => {
    if (editingFunction) {
      setName(editingFunction.name);
      setDescription(editingFunction.description || '');
      setPromptTemplate(editingFunction.prompt_template);
      setReportType(editingFunction.report_type);
    } else {
      setName('');
      setDescription('');
      setPromptTemplate('Process the following data and generate a detailed HTML report:\n\n{{raw_data}}');
      setReportType('insight');
    }
  }, [editingFunction, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description: description || undefined, prompt_template: promptTemplate, report_type: reportType });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingFunction ? 'Edit Function' : 'Create Processing Function'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fn-name">Name</Label>
            <Input id="fn-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Employee Report" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fn-desc">Description (optional)</Label>
            <Input id="fn-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this function does" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fn-type">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee Report</SelectItem>
                <SelectItem value="insight">Insight</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fn-prompt">Prompt Template</Label>
            <p className="text-xs text-muted-foreground">Use <code className="bg-muted px-1 rounded">{'{{raw_data}}'}</code> to reference the incoming JSON payload.</p>
            <Textarea
              id="fn-prompt"
              value={promptTemplate}
              onChange={(e) => setPromptTemplate(e.target.value)}
              className="min-h-[160px] font-mono text-sm"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !name.trim() || !promptTemplate.trim()}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingFunction ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
