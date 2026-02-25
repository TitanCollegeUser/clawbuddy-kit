import { useState } from 'react';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

interface FieldDef {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
}

export const OpsFormBlock = ({ block, appId }: { block: OpsBlock; appId: string }) => {
  const fields = (block.config.fields as FieldDef[]) || [];
  const submitItemType = (block.config.submit_item_type as string) || 'item';
  const submitStatus = (block.config.submit_status as string) || 'active';
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    const title = values.title || values[fields[0]?.name] || 'Untitled';
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Not authenticated'); return; }
      const dataPayload: Record<string, string> = {};
      for (const f of fields) {
        if (f.name !== 'title' && values[f.name]) dataPayload[f.name] = values[f.name];
      }
      const { error } = await supabase.from('ops_data').insert({
        app_id: appId,
        block_id: block.id,
        item_type: submitItemType,
        title,
        status: submitStatus,
        data: dataPayload,
        user_id: user.id,
      });
      if (error) throw error;
      toast.success('Item added');
      setValues({});
      queryClient.invalidateQueries({ queryKey: ['ops-data'] });
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-xl overflow-hidden"
    >
      {block.title && (
        <div className="px-5 pt-4 pb-2">
          <h3 className="font-orbitron text-base font-semibold uppercase tracking-wider text-foreground">{block.title}</h3>
        </div>
      )}
      <div className="px-5 pb-5 space-y-4">
        {fields.map(field => (
          <div key={field.name} className="space-y-1.5">
            <Label className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground">
              {field.label}{field.required && ' *'}
            </Label>
            {field.type === 'select' && field.options ? (
              <Select value={values[field.name] || ''} onValueChange={v => setValues(p => ({ ...p, [field.name]: v }))}>
                <SelectTrigger className="h-10 glass border-white/[0.08] focus:ring-primary/50">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input
                className="h-10 glass border-white/[0.08] focus:ring-primary/50 focus:border-primary/30"
                value={values[field.name] || ''}
                onChange={e => setValues(p => ({ ...p, [field.name]: e.target.value }))}
                placeholder={field.label}
              />
            )}
          </div>
        ))}
        <Button className="w-full hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Adding...' : 'Add'}
        </Button>
      </div>
    </motion.div>
  );
};
