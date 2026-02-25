import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Zap, Send, Truck, Monitor, MessageSquare, Mail, Bot, Mailbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Automation, AutomationChannel, useCreateAutomation, useUpdateAutomation, useDeleteAutomation, useAutomationChannels } from '@/hooks/useAutomations';
import { buildCron, parseCron, cronToHuman, getNextRuns, CronConfig, DEFAULT_CRON_CONFIG } from '@/lib/cron-utils';
import { useOpsCenterApps } from '@/hooks/useOpsCenterApps';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const TEMPLATES = [
  { id: 'morning_digest', name: '☀️ Morning Digest', cron: '0 8 * * *', prompt: 'Generate a morning digest summarizing: pending tasks, recent insights, upcoming meetings, and action items for today. Format as a clean summary with sections.' },
  { id: 'evening_wrap', name: '🌙 Evening Wrap-up', cron: '0 18 * * 1-5', prompt: 'Create an end-of-day recap: what got done today, what\'s still open, and tomorrow\'s priorities. Weekdays only.' },
  { id: 'weekly_report', name: '📊 Weekly Report', cron: '0 9 * * 1', prompt: 'Generate a comprehensive weekly report: tasks completed, meetings held, insights generated, pipeline progress, and key metrics.' },
  { id: 'content_monitor', name: '🔍 Content Monitor', cron: '0 */6 * * *', prompt: 'Check for trending topics, competitor content, and new content opportunities. Summarize findings.' },
  { id: 'goal_checkin', name: '🎯 Goal Check-in', cron: '0 9 * * 5', prompt: 'Review progress toward weekly/monthly goals. Identify blockers and suggest next steps.' },
  { id: 'system_health', name: '🛡️ System Health', cron: '0 */12 * * *', prompt: 'Verify API connections, check for failed jobs, monitor token budgets, and report any anomalies.' },
];

const PRESETS = [
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Every 6h', cron: '0 */6 * * *' },
  { label: 'Daily 8am', cron: '0 8 * * *' },
  { label: 'Daily 6pm', cron: '0 18 * * *' },
  { label: 'Weekday AM', cron: '0 8 * * 1-5' },
  { label: 'Mon 9am', cron: '0 9 * * 1' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMEZONES = ['America/Vancouver', 'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York', 'America/Toronto', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney', 'UTC'];

interface Props {
  automation?: Automation | null;
  onClose: () => void;
  onOpenChannels: () => void;
}

export function AutomationEditor({ automation, onClose, onOpenChannels }: Props) {
  const isEditing = !!automation;
  const create = useCreateAutomation();
  const update = useUpdateAutomation();
  const del = useDeleteAutomation();
  const { data: channels = [] } = useAutomationChannels();
  const { data: opsApps = [] } = useOpsCenterApps();

  const [name, setName] = useState(automation?.name || '');
  const [description, setDescription] = useState(automation?.description || '');
  const [tags, setTags] = useState(automation?.tags?.join(', ') || '');
  const [opsAppId, setOpsAppId] = useState(automation?.ops_app_id || '');
  const [cronConfig, setCronConfig] = useState<CronConfig>(
    automation ? parseCron(automation.cron_expression) : DEFAULT_CRON_CONFIG
  );
  const [timezone, setTimezone] = useState(automation?.timezone || 'America/Vancouver');
  const [prompt, setPrompt] = useState(automation?.prompt || '');
  const [model, setModel] = useState(automation?.model || 'claude-sonnet');
  const [maxTurns, setMaxTurns] = useState(automation?.max_turns || 10);
  const [timeout, setTimeout_] = useState(automation?.timeout_seconds || 120);
  const [templateId, setTemplateId] = useState(automation?.template_id || '');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(
    (automation?.channels || []).map((c: any) => c.type)
  );
  const [dashboardEnabled, setDashboardEnabled] = useState(
    (automation?.channels || []).some((c: any) => c.type === 'dashboard')
  );

  const cronString = useMemo(() => buildCron(cronConfig), [cronConfig]);
  const humanCron = useMemo(() => cronToHuman(cronString), [cronString]);
  const nextRuns = useMemo(() => getNextRuns(cronString, 3, timezone), [cronString, timezone]);

  const handleTemplateSelect = (tid: string) => {
    setTemplateId(tid);
    if (tid) {
      const t = TEMPLATES.find((t) => t.id === tid);
      if (t) {
        setPrompt(t.prompt);
        setCronConfig(parseCron(t.cron));
      }
    }
  };

  const handleSave = async (enableAfterSave = false) => {
    if (!name.trim() || !prompt.trim()) {
      toast({ title: 'Name and prompt are required', variant: 'destructive' });
      return;
    }
    const channelsPayload = [
      ...(dashboardEnabled ? [{ type: 'dashboard', config: {} }] : []),
      ...selectedChannels
        .filter((t) => t !== 'dashboard')
        .map((type) => {
          const ch = channels.find((c) => c.type === type);
          return { type, config: ch?.config || {} };
        }),
    ];
    const payload: any = {
      name: name.trim(),
      description: description.trim() || null,
      cron_expression: cronString,
      timezone,
      prompt: prompt.trim(),
      model,
      max_turns: maxTurns,
      timeout_seconds: timeout,
      channels: channelsPayload,
      template_id: templateId || null,
      ops_app_id: opsAppId || null,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      ...(enableAfterSave ? { enabled: true } : {}),
    };
    try {
      if (isEditing) {
        await update.mutateAsync({ id: automation.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      toast({ title: isEditing ? 'Automation updated' : 'Automation created' });
      onClose();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!automation) return;
    try {
      await del.mutateAsync(automation.id);
      toast({ title: 'Automation deleted' });
      onClose();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const isSaving = create.isPending || update.isPending;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[600px] z-50 bg-card/95 backdrop-blur-xl border-l border-border/30 flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/30">
          <h2 className="text-lg font-semibold text-foreground">
            {isEditing ? 'Edit Automation' : 'New Automation'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Agent-created info banner */}
        {isEditing && automation?.created_by === 'agent' && automation?.agent_name && (
          <div className="mx-4 mt-4 p-3 rounded-lg border-l-[3px] border-blue-400 bg-blue-500/10">
            <p className="text-sm text-blue-300">
              <Bot className="h-4 w-4 inline mr-1" />
              This automation was created by <strong>{automation.agent_name}</strong>. You can edit or disable it.
            </p>
          </div>
        )}

        {/* Function info (read-only when set) */}
        {isEditing && automation?.function_name && (
          <div className="mx-4 mt-2 p-3 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-xs text-muted-foreground">Linked Function</p>
            <p className="text-sm font-mono text-foreground">{automation.function_name}</p>
          </div>
        )}

        {/* Body */}
        <ScrollArea className="flex-1">
          <div className="p-4">
            <Tabs defaultValue="basics">
              <TabsList className="w-full grid grid-cols-4 mb-4">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="schedule"><Clock className="h-3.5 w-3.5 mr-1" />Schedule</TabsTrigger>
                <TabsTrigger value="prompt"><Zap className="h-3.5 w-3.5 mr-1" />Prompt</TabsTrigger>
                <TabsTrigger value="delivery"><Truck className="h-3.5 w-3.5 mr-1" />Delivery</TabsTrigger>
              </TabsList>

              <TabsContent value="basics" className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Name *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Morning Digest" className="mt-1" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Description</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this automation do?" className="mt-1" rows={3} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Tags</label>
                  <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="digest, daily, reports" className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">Comma-separated</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Linked Ops App</label>
                  <Select value={opsAppId} onValueChange={setOpsAppId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {opsApps.map((app: any) => (
                        <SelectItem key={app.id} value={app.id}>{app.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Quick Presets</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                      <Badge
                        key={p.cron}
                        variant={cronString === p.cron ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setCronConfig(parseCron(p.cron))}
                      >
                        {p.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Frequency</label>
                  <Select value={cronConfig.frequency} onValueChange={(v: any) => setCronConfig({ ...cronConfig, frequency: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minutes">Every N minutes</SelectItem>
                      <SelectItem value="hours">Every N hours</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Specific days of week</SelectItem>
                      <SelectItem value="monthly">Specific days of month</SelectItem>
                      <SelectItem value="custom">Custom cron</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(cronConfig.frequency === 'minutes' || cronConfig.frequency === 'hours') && (
                  <div>
                    <label className="text-sm font-medium text-foreground">Every</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input type="number" min={1} max={cronConfig.frequency === 'minutes' ? 59 : 23} value={cronConfig.interval} onChange={(e) => setCronConfig({ ...cronConfig, interval: parseInt(e.target.value) || 1 })} className="w-20" />
                      <span className="text-sm text-muted-foreground">{cronConfig.frequency}</span>
                    </div>
                  </div>
                )}

                {['daily', 'weekly', 'monthly'].includes(cronConfig.frequency) && (
                  <div>
                    <label className="text-sm font-medium text-foreground">Time</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Select value={String(cronConfig.time.hour)} onValueChange={(v) => setCronConfig({ ...cronConfig, time: { ...cronConfig.time, hour: parseInt(v) } })}>
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>{Array.from({ length: 24 }, (_, i) => (<SelectItem key={i} value={String(i)}>{i.toString().padStart(2, '0')}</SelectItem>))}</SelectContent>
                      </Select>
                      <span className="text-foreground">:</span>
                      <Select value={String(cronConfig.time.minute)} onValueChange={(v) => setCronConfig({ ...cronConfig, time: { ...cronConfig.time, minute: parseInt(v) } })}>
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>{[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (<SelectItem key={m} value={String(m)}>{m.toString().padStart(2, '0')}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {cronConfig.frequency === 'weekly' && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Days</label>
                    <div className="flex gap-2 flex-wrap">
                      {DAY_NAMES.map((d, i) => (
                        <label key={i} className="flex items-center gap-1.5 text-sm">
                          <Checkbox
                            checked={cronConfig.days.includes(i)}
                            onCheckedChange={(checked) => {
                              const days = checked ? [...cronConfig.days, i] : cronConfig.days.filter((x) => x !== i);
                              setCronConfig({ ...cronConfig, days: days.sort() });
                            }}
                          />
                          {d}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {cronConfig.frequency === 'monthly' && (
                  <div>
                    <label className="text-sm font-medium text-foreground">Day(s) of month</label>
                    <Input
                      value={cronConfig.days.join(', ')}
                      onChange={(e) => setCronConfig({ ...cronConfig, days: e.target.value.split(',').map((x) => parseInt(x.trim())).filter((x) => !isNaN(x) && x >= 1 && x <= 31) })}
                      placeholder="1, 15"
                      className="mt-1"
                    />
                  </div>
                )}

                {cronConfig.frequency === 'custom' && (
                  <div>
                    <label className="text-sm font-medium text-foreground">Cron Expression</label>
                    <Input
                      value={cronConfig.customCron}
                      onChange={(e) => setCronConfig({ ...cronConfig, customCron: e.target.value })}
                      placeholder="0 8 * * *"
                      className="mt-1 font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground">Timezone</label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{TIMEZONES.map((tz) => (<SelectItem key={tz} value={tz}>{tz}</SelectItem>))}</SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg bg-muted/30 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">{cronString}</span>
                  </div>
                  <p className="text-sm text-foreground">{humanCron}</p>
                  {nextRuns.length > 0 && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p className="font-medium">Next runs:</p>
                      {nextRuns.map((d, i) => (<p key={i}>{format(d, 'EEE, MMM d, yyyy h:mm a')}</p>))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="prompt" className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Template</label>
                  <Select value={templateId} onValueChange={handleTemplateSelect}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Custom prompt" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">✨ Custom prompt</SelectItem>
                      {TEMPLATES.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Prompt *</label>
                  <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter the AI prompt..." className="mt-1 font-mono text-sm min-h-[200px]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Model</label>
                  <Select value={model} onValueChange={setModel}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claude-sonnet">Claude Sonnet</SelectItem>
                      <SelectItem value="claude-haiku">Claude Haiku (fast)</SelectItem>
                      <SelectItem value="claude-opus">Claude Opus (heavy)</SelectItem>
                      <SelectItem value="gemini-flash">Gemini Flash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Max Turns</label>
                    <Input type="number" value={maxTurns} onChange={(e) => setMaxTurns(parseInt(e.target.value) || 10)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Timeout (sec)</label>
                    <Input type="number" value={timeout} onChange={(e) => setTimeout_(parseInt(e.target.value) || 120)} className="mt-1" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="delivery" className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Dashboard</span>
                    <Badge variant="outline" className="text-[10px]">Built-in</Badge>
                  </div>
                  <Switch checked={dashboardEnabled} onCheckedChange={setDashboardEnabled} />
                </div>

                {channels.map((ch) => (
                  <div key={ch.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-2">
                    {channelIconEl(ch.type)}
                      <span className="text-sm font-medium text-foreground">{ch.name}</span>
                      <Badge variant="outline" className="text-[10px]">{ch.type}</Badge>
                    </div>
                    <Switch
                      checked={selectedChannels.includes(ch.type)}
                      onCheckedChange={(checked) => {
                        setSelectedChannels(checked
                          ? [...selectedChannels, ch.type]
                          : selectedChannels.filter((t) => t !== ch.type)
                        );
                      }}
                    />
                  </div>
                ))}

                {channels.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No delivery channels configured.{' '}
                    <button onClick={onOpenChannels} className="text-primary hover:underline">Add one</button>
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-border/30 p-4 flex items-center gap-2">
          {isEditing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">Delete</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{automation.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete the automation and all {automation.run_count} execution records. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          {!isEditing && (
            <Button onClick={() => handleSave(true)} disabled={isSaving}>Save & Enable</Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function channelIconEl(type: string) {
  switch (type) {
    case 'telegram': return <Send className="h-4 w-4" />;
    case 'discord': return <MessageSquare className="h-4 w-4" />;
    case 'email': return <Mail className="h-4 w-4" />;
    case 'agentmail': return <Mailbox className="h-4 w-4" />;
    default: return <Monitor className="h-4 w-4 text-primary" />;
  }
}
