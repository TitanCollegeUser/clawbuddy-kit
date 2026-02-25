import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Plus, Radio, Loader2, Bot, User, Webhook, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAutomations, useAutomationExecutions, Automation } from '@/hooks/useAutomations';
import { useRawReports, usePendingRawReportsCount, useDeleteRawReport, useSubmitForProcessing, useUpdateRawReportFunction, type RawReportStatus } from '@/hooks/useRawReports';
import { useActiveWebhookFunctions } from '@/hooks/useWebhookFunctions';
import { AutomationCard } from '@/components/automations/AutomationCard';
import { AutomationEditor } from '@/components/automations/AutomationEditor';
import { ExecutionHistory } from '@/components/automations/ExecutionHistory';
import { ChannelManager } from '@/components/automations/ChannelManager';
import { FunctionsWebhooksTab } from '@/components/reports/FunctionsWebhooksTab';
import { RawReportCard } from '@/components/reports/RawReportCard';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

type Filter = 'all' | 'active' | 'failed';
type CreatorFilter = 'all' | 'user' | 'agent';

export function AutomationsPage() {
  const { data: automations = [], isLoading } = useAutomations();
  const [filter, setFilter] = useState<Filter>('all');
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [historyAutomation, setHistoryAutomation] = useState<Automation | null>(null);
  const [showChannels, setShowChannels] = useState(false);
  const [creatorFilter, setCreatorFilter] = useState<CreatorFilter>('all');
  const [activeTab, setActiveTab] = useState<'jobs' | 'webhook' | 'functions'>('jobs');

  // Webhook queue state & hooks
  const [webhookStatusFilter, setWebhookStatusFilter] = useState<RawReportStatus | 'all'>('all');
  const { data: rawReports = [], isLoading: loadingRawReports } = useRawReports(webhookStatusFilter);
  const { data: pendingCount = 0 } = usePendingRawReportsCount();
  const { data: activeFunctions = [] } = useActiveWebhookFunctions();
  const deleteRawReport = useDeleteRawReport();
  const submitForProcessing = useSubmitForProcessing();
  const updateRawFn = useUpdateRawReportFunction();

  const filtered = useMemo(() => {
    let result = automations;
    switch (filter) {
      case 'active': result = result.filter((a) => a.enabled); break;
      case 'failed': result = result.filter((a) => a.last_status === 'failed'); break;
    }
    switch (creatorFilter) {
      case 'user': result = result.filter((a) => a.created_by !== 'agent'); break;
      case 'agent': result = result.filter((a) => a.created_by === 'agent'); break;
    }
    return result;
  }, [automations, filter, creatorFilter]);

  // KPIs
  const activeCount = automations.filter((a) => a.enabled).length;
  const totalRuns = automations.reduce((s, a) => s + a.run_count, 0);
  const totalFails = automations.reduce((s, a) => s + a.fail_count, 0);
  const successRate = totalRuns > 0 ? Math.round(((totalRuns - totalFails) / totalRuns) * 100) : 100;
  const nextRun = automations
    .filter((a) => a.enabled && a.next_run_at)
    .sort((a, b) => new Date(a.next_run_at!).getTime() - new Date(b.next_run_at!).getTime())[0];

  const openCreate = () => { setEditingAutomation(null); setShowEditor(true); };
  const openEdit = (a: Automation) => { setEditingAutomation(a); setShowEditor(true); };
  const closeEditor = () => { setShowEditor(false); setEditingAutomation(null); };

  // Webhook handlers
  const handleDeleteRawReport = (reportId: string) => {
    deleteRawReport.mutate(reportId, {
      onSuccess: () => toast.success('Webhook entry deleted'),
      onError: () => toast.error('Failed to delete webhook entry'),
    });
  };

  const handleSubmitForProcessing = (reportId: string, functionId?: string) => {
    submitForProcessing.mutate({ reportId, functionId }, {
      onSuccess: () => toast.success('Submitted for AI processing'),
      onError: () => toast.error('Failed to submit for AI processing'),
    });
  };

  const handleAssignFunction = (reportId: string, functionId: string) => {
    updateRawFn.mutate({ reportId, functionId }, {
      onSuccess: () => toast.success('Function assigned'),
      onError: () => toast.error('Failed to assign function'),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <CalendarClock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Automations</h1>
            <p className="text-sm text-muted-foreground">Scheduled AI jobs, webhooks & delivery pipelines</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowChannels(true)}>
            <Radio className="h-4 w-4 mr-1" /> Channels
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> New Automation
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="bg-card/50 border border-border/50 p-1">
          <TabsTrigger value="jobs" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <CalendarClock className="h-4 w-4" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="webhook" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Webhook className="h-4 w-4" />
            Webhook Queue
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500 text-white">{pendingCount}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="functions" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Settings2 className="h-4 w-4" />
            Functions & Webhooks
          </TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="mt-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Active Jobs', value: activeCount, accent: 'text-emerald-400' },
              { label: 'Total Runs', value: totalRuns, accent: 'text-primary' },
              { label: 'Success Rate', value: `${successRate}%`, accent: 'text-purple-400' },
              { label: 'Next Run', value: nextRun?.next_run_at ? formatDistanceToNow(new Date(nextRun.next_run_at), { addSuffix: true }) : '—', accent: 'text-amber-400' },
            ].map((kpi) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border/30 bg-card/70 backdrop-blur-xl p-4"
              >
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`text-2xl font-bold mt-1 ${kpi.accent}`}>{kpi.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'active', 'failed'] as Filter[]).map((f) => (
              <Badge
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                onClick={() => setFilter(f)}
              >
                {f}
              </Badge>
            ))}
            <div className="w-px bg-border/30 mx-1" />
            <Badge
              variant={creatorFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setCreatorFilter('all')}
            >All creators</Badge>
            <Badge
              variant={creatorFilter === 'user' ? 'default' : 'outline'}
              className="cursor-pointer gap-1"
              onClick={() => setCreatorFilter('user')}
            ><User className="h-3 w-3" />By me</Badge>
            <Badge
              variant={creatorFilter === 'agent' ? 'default' : 'outline'}
              className="cursor-pointer gap-1"
              onClick={() => setCreatorFilter('agent')}
            ><Bot className="h-3 w-3" />By agents</Badge>
          </div>

          {/* Job List */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <CalendarClock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No automations yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first automation to start scheduling AI work.
              </p>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Create Automation</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => (
                <AutomationCard
                  key={a.id}
                  automation={a}
                  onEdit={openEdit}
                  onHistory={(a) => setHistoryAutomation(a)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Webhook Queue Tab */}
        <TabsContent value="webhook" className="mt-6">
          <div className="mb-4">
            <Select value={webhookStatusFilter} onValueChange={(v) => setWebhookStatusFilter(v as RawReportStatus | 'all')}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <WebhookQueueGrid
            reports={rawReports}
            isLoading={loadingRawReports}
            onDelete={handleDeleteRawReport}
            onSubmitForProcessing={handleSubmitForProcessing}
            onAssignFunction={handleAssignFunction}
            submittingId={submitForProcessing.isPending ? submitForProcessing.variables?.reportId ?? null : null}
            functions={activeFunctions}
          />
        </TabsContent>

        {/* Functions & Webhooks Tab */}
        <TabsContent value="functions" className="mt-6">
          <FunctionsWebhooksTab />
        </TabsContent>
      </Tabs>

      {/* Editor Slide-over */}
      {showEditor && (
        <AutomationEditor
          automation={editingAutomation}
          onClose={closeEditor}
          onOpenChannels={() => setShowChannels(true)}
        />
      )}

      {/* History Slide-over */}
      {historyAutomation && (
        <ExecutionHistory
          automation={historyAutomation}
          onClose={() => setHistoryAutomation(null)}
        />
      )}

      {/* Channel Manager Modal */}
      <ChannelManager open={showChannels} onOpenChange={setShowChannels} />
    </div>
  );
}

// --- Webhook Queue Grid ---

interface WebhookQueueGridProps {
  reports: import('@/hooks/useRawReports').RawReport[];
  isLoading: boolean;
  onDelete: (reportId: string) => void;
  onSubmitForProcessing: (reportId: string, functionId?: string) => void;
  onAssignFunction: (reportId: string, functionId: string) => void;
  submittingId: string | null;
  functions: import('@/hooks/useWebhookFunctions').WebhookFunction[];
}

const WebhookQueueGrid = ({ reports, isLoading, onDelete, onSubmitForProcessing, onAssignFunction, submittingId, functions }: WebhookQueueGridProps) => {
  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (reports.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="p-4 rounded-full bg-muted/50 mb-4"><Webhook className="h-12 w-12 text-muted-foreground" /></div>
      <p className="text-muted-foreground">No webhooks received yet.</p>
    </div>
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {reports.map((report) => (
          <RawReportCard
            key={report.id}
            report={report}
            onDelete={onDelete}
            onSubmitToAi={(id, fnId) => onSubmitForProcessing(id, fnId)}
            onAssignFunction={onAssignFunction}
            isSubmitting={submittingId === report.id}
            functions={functions}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
