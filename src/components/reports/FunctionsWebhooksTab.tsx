import { useState } from 'react';
import { Plus, Zap, Link2, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { FunctionCard } from './FunctionCard';
import { WebhookEndpointCard } from './WebhookEndpointCard';
import { CreateFunctionModal } from './CreateFunctionModal';
import { CreateWebhookModal } from './CreateWebhookModal';
import {
  useWebhookFunctions,
  useCreateWebhookFunction,
  useUpdateWebhookFunction,
  useDeleteWebhookFunction,
  type WebhookFunction,
} from '@/hooks/useWebhookFunctions';
import {
  useWebhookEndpoints,
  useCreateWebhookEndpoint,
  useUpdateWebhookEndpoint,
  useDeleteWebhookEndpoint,
  type WebhookEndpoint,
} from '@/hooks/useWebhookEndpoints';
import { toast } from 'sonner';

export const FunctionsWebhooksTab = () => {
  const { data: functions = [], isLoading: loadingFns } = useWebhookFunctions();
  const { data: endpoints = [], isLoading: loadingEndpoints } = useWebhookEndpoints();

  const createFn = useCreateWebhookFunction();
  const updateFn = useUpdateWebhookFunction();
  const deleteFn = useDeleteWebhookFunction();

  const createEp = useCreateWebhookEndpoint();
  const updateEp = useUpdateWebhookEndpoint();
  const deleteEp = useDeleteWebhookEndpoint();

  const [fnModalOpen, setFnModalOpen] = useState(false);
  const [editingFn, setEditingFn] = useState<WebhookFunction | null>(null);
  const [epModalOpen, setEpModalOpen] = useState(false);
  const [editingEp, setEditingEp] = useState<WebhookEndpoint | null>(null);

  // Functions handlers
  const handleCreateFn = (data: { name: string; description?: string; prompt_template: string; report_type: string }) => {
    if (editingFn) {
      updateFn.mutate({ id: editingFn.id, ...data }, {
        onSuccess: () => { toast.success('Function updated'); setFnModalOpen(false); setEditingFn(null); },
        onError: () => toast.error('Failed to update function'),
      });
    } else {
      createFn.mutate(data, {
        onSuccess: () => { toast.success('Function created'); setFnModalOpen(false); },
        onError: () => toast.error('Failed to create function'),
      });
    }
  };

  const handleDeleteFn = (id: string) => {
    deleteFn.mutate(id, {
      onSuccess: () => toast.success('Function deleted'),
      onError: () => toast.error('Cannot delete — function may be linked to webhooks'),
    });
  };

  const handleToggleFn = (id: string, is_active: boolean) => {
    updateFn.mutate({ id, is_active }, {
      onSuccess: () => toast.success(is_active ? 'Function enabled' : 'Function disabled'),
    });
  };

  // Endpoints handlers
  const handleCreateEp = (data: { name: string; slug: string; function_id: string; auto_process?: boolean }) => {
    if (editingEp) {
      updateEp.mutate({ id: editingEp.id, ...data }, {
        onSuccess: () => { toast.success('Webhook updated'); setEpModalOpen(false); setEditingEp(null); },
        onError: () => toast.error('Failed to update webhook'),
      });
    } else {
      createEp.mutate(data, {
        onSuccess: () => { toast.success('Webhook created'); setEpModalOpen(false); },
        onError: (err) => toast.error(err.message.includes('unique') ? 'Slug already exists' : 'Failed to create webhook'),
      });
    }
  };

  const handleDeleteEp = (id: string) => {
    deleteEp.mutate(id, {
      onSuccess: () => toast.success('Webhook deleted'),
      onError: () => toast.error('Failed to delete webhook'),
    });
  };

  const handleToggleEp = (id: string, is_active: boolean) => {
    updateEp.mutate({ id, is_active }, {
      onSuccess: () => toast.success(is_active ? 'Webhook enabled' : 'Webhook disabled'),
    });
  };

  const isLoading = loadingFns || loadingEndpoints;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Processing Functions */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Processing Functions</h2>
            <span className="text-sm text-muted-foreground">({functions.length})</span>
          </div>
          <Button onClick={() => { setEditingFn(null); setFnModalOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> New Function
          </Button>
        </div>

        {functions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border/50 rounded-xl">
            <Zap className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No functions yet. Create one to define how webhook data gets processed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {functions.map((fn) => (
                <FunctionCard
                  key={fn.id}
                  fn={fn}
                  onEdit={(f) => { setEditingFn(f); setFnModalOpen(true); }}
                  onDelete={handleDeleteFn}
                  onToggleActive={handleToggleFn}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Webhook Endpoints */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Webhook Endpoints</h2>
            <span className="text-sm text-muted-foreground">({endpoints.length})</span>
          </div>
          <Button
            onClick={() => { setEditingEp(null); setEpModalOpen(true); }}
            className="gap-2"
            disabled={functions.length === 0}
          >
            <Plus className="h-4 w-4" /> New Webhook
          </Button>
        </div>

        {functions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border/50 rounded-xl">
            <Link2 className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Create a processing function first, then link it to a webhook.</p>
          </div>
        ) : endpoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border/50 rounded-xl">
            <Link2 className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No webhooks yet. Create one to receive external data.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {endpoints.map((ep) => (
                <WebhookEndpointCard
                  key={ep.id}
                  endpoint={ep}
                  onEdit={(e) => { setEditingEp(e); setEpModalOpen(true); }}
                  onDelete={handleDeleteEp}
                  onToggleActive={handleToggleEp}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Modals */}
      <CreateFunctionModal
        open={fnModalOpen}
        onOpenChange={(open) => { setFnModalOpen(open); if (!open) setEditingFn(null); }}
        onSubmit={handleCreateFn}
        isLoading={createFn.isPending || updateFn.isPending}
        editingFunction={editingFn}
      />
      <CreateWebhookModal
        open={epModalOpen}
        onOpenChange={(open) => { setEpModalOpen(open); if (!open) setEditingEp(null); }}
        onSubmit={handleCreateEp}
        isLoading={createEp.isPending || updateEp.isPending}
        functions={functions.filter(f => f.is_active)}
        editingEndpoint={editingEp}
      />
    </div>
  );
};
