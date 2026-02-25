import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, MessageSquare, Mail, Monitor, Plus, Trash2, Edit, Loader2, Mailbox } from 'lucide-react';
import { AutomationChannel, useAutomationChannels, useCreateChannel, useUpdateChannel, useDeleteChannel } from '@/hooks/useAutomations';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  telegram: <Send className="h-4 w-4 text-blue-400" />,
  discord: <MessageSquare className="h-4 w-4 text-indigo-400" />,
  email: <Mail className="h-4 w-4 text-emerald-400" />,
  dashboard: <Monitor className="h-4 w-4 text-primary" />,
  agentmail: <Mailbox className="h-4 w-4 text-purple-400" />,
};

export function ChannelManager({ open, onOpenChange }: Props) {
  const { data: channels = [], isLoading } = useAutomationChannels();
  const createChannel = useCreateChannel();
  const updateChannel = useUpdateChannel();
  const deleteChannel = useDeleteChannel();

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', type: 'telegram', config: {} as Record<string, string> });

  const resetForm = () => {
    setForm({ name: '', type: 'telegram', config: {} });
    setAdding(false);
    setEditingId(null);
  };

  const startEdit = (ch: AutomationChannel) => {
    setEditingId(ch.id);
    setForm({ name: ch.name, type: ch.type, config: ch.config as Record<string, string> });
    setAdding(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    try {
      if (editingId) {
        await updateChannel.mutateAsync({ id: editingId, name: form.name, type: form.type, config: form.config });
      } else {
        await createChannel.mutateAsync({ name: form.name, type: form.type, config: form.config });
      }
      toast({ title: editingId ? 'Channel updated' : 'Channel added' });
      resetForm();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChannel.mutateAsync(id);
      toast({ title: 'Channel deleted' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleTest = () => {
    toast({ title: 'Test delivery not yet connected', description: 'This feature will be available when the execution engine is built.' });
  };

  const setConfig = (key: string, value: string) => {
    setForm((f) => ({ ...f, config: { ...f.config, [key]: value } }));
  };

  const isFormActive = adding || editingId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Delivery Channels</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Built-in dashboard */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
            <Monitor className="h-4 w-4 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Dashboard</p>
              <p className="text-xs text-muted-foreground">Posts to ClawBuddy Insights</p>
            </div>
            <Badge variant="outline" className="text-[10px]">Built-in</Badge>
          </div>

          {channels.map((ch) => (
            <div key={ch.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
              {typeIcons[ch.type] || <Monitor className="h-4 w-4" />}
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{ch.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{ch.type}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(ch)}>
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(ch.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}

          {isLoading && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>}

          {/* Add/Edit Form */}
          {isFormActive && (
            <div className="space-y-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground">Name</label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="My Channel" className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground">Type</label>
                  <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v, config: {} }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="telegram">Telegram</SelectItem>
                      <SelectItem value="discord">Discord</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="agentmail">AgentMail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.type === 'telegram' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-foreground">Bot Token</label>
                    <Input type="password" value={form.config.bot_token || ''} onChange={(e) => setConfig('bot_token', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Chat ID</label>
                    <Input value={form.config.chat_id || ''} onChange={(e) => setConfig('chat_id', e.target.value)} className="mt-1" />
                  </div>
                </>
              )}

              {form.type === 'discord' && (
                <div>
                  <label className="text-xs font-medium text-foreground">Webhook URL</label>
                  <Input value={form.config.webhook_url || ''} onChange={(e) => setConfig('webhook_url', e.target.value)} className="mt-1" />
                </div>
              )}

              {form.type === 'email' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-foreground">API Key</label>
                    <Input type="password" value={form.config.api_key || ''} onChange={(e) => setConfig('api_key', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">From Email</label>
                    <Input value={form.config.from_email || ''} onChange={(e) => setConfig('from_email', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">To Email(s)</label>
                    <Input value={form.config.to_emails || ''} onChange={(e) => setConfig('to_emails', e.target.value)} placeholder="a@b.com, c@d.com" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Subject Template</label>
                    <Input value={form.config.subject_template || ''} onChange={(e) => setConfig('subject_template', e.target.value)} placeholder="{{automation_name}} — {{date}}" className="mt-1" />
                  </div>
                </>
              )}

              {form.type === 'agentmail' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-foreground">API Key</label>
                    <Input type="password" value={form.config.api_key || ''} onChange={(e) => setConfig('api_key', e.target.value)} placeholder="am_us_..." className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Inbox ID</label>
                    <Input value={form.config.inbox_id || ''} onChange={(e) => setConfig('inbox_id', e.target.value)} placeholder="sherlockbot@agentmail.to" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">To Email</label>
                    <Input value={form.config.to_email || ''} onChange={(e) => setConfig('to_email', e.target.value)} placeholder="you@example.com" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground">Subject Template</label>
                    <Input value={form.config.subject_template || ''} onChange={(e) => setConfig('subject_template', e.target.value)} placeholder="{{automation_name}} — {{date}}" className="mt-1" />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSave} disabled={createChannel.isPending || updateChannel.isPending}>
                  {(createChannel.isPending || updateChannel.isPending) ? 'Saving...' : 'Save'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleTest}>Send Test</Button>
                <Button size="sm" variant="ghost" onClick={resetForm}>Cancel</Button>
              </div>
            </div>
          )}

          {!isFormActive && (
            <Button variant="outline" className="w-full" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Channel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
