import { useState } from 'react';
import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { motion } from 'framer-motion';
import { Mail, Eye, MousePointer, MessageSquare, DollarSign, Send, AlertTriangle, Star, BarChart3 } from 'lucide-react';
import DOMPurify from 'dompurify';

const emailStatusPill = (status: string) => {
  const colors: Record<string, string> = {
    draft: 'bg-white/[0.06] text-muted-foreground',
    queued: 'bg-amber-500/20 text-amber-400',
    sent: 'bg-blue-500/20 text-blue-400',
    delivered: 'bg-blue-500/20 text-blue-400',
    opened: 'bg-violet-500/20 text-violet-400',
    clicked: 'bg-emerald-500/20 text-emerald-400',
    replied: 'bg-emerald-500/20 text-emerald-400',
    bounced: 'bg-red-500/20 text-red-400',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${colors[status] || colors.draft}`}>{status}</span>;
};

const STATUS_BORDER: Record<string, string> = {
  replied: 'border-l-emerald-500/50',
  clicked: 'border-l-emerald-500/40',
  opened: 'border-l-violet-500/40',
  sent: 'border-l-blue-500/30',
  delivered: 'border-l-blue-500/30',
  bounced: 'border-l-red-500/40',
  queued: 'border-l-amber-500/30',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  opened: <Eye className="w-3 h-3 text-violet-400" />,
  clicked: <MousePointer className="w-3 h-3 text-emerald-400" />,
  replied: <MessageSquare className="w-3 h-3 text-emerald-400" />,
  bounced: <AlertTriangle className="w-3 h-3 text-red-400" />,
};

const TopStat = ({ icon, label, value, glow }: { icon: React.ReactNode; label: string; value: string | number; glow?: boolean }) => (
  <div className="text-center">
    <div className="flex items-center justify-center gap-1 mb-1 text-muted-foreground">{icon}</div>
    <p className="font-mono text-lg font-bold text-foreground" style={glow ? { textShadow: '0 0 8px currentColor' } : undefined}>{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

const FunnelBar = ({ label, value, max, colorFrom, colorTo }: { label: string; value: number; max: number; colorFrom: string; colorTo: string }) => (
  <div className="flex items-center gap-3 group/bar">
    <span className="text-xs text-muted-foreground w-20 text-right">{label}</span>
    <div className="flex-1 h-4 bg-white/[0.04] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: max > 0 ? `${Math.max(2, (value / max) * 100)}%` : '0%',
          background: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
        }}
      />
    </div>
    <span className="font-mono text-xs text-foreground w-14 text-right">{value.toLocaleString()}</span>
    <span className="text-xs text-muted-foreground w-10">{max > 0 ? ((value / max) * 100).toFixed(0) : 0}%</span>
  </div>
);

export const OpsOutreachEmailBlock = ({ block, appId }: { block: OpsBlock; appId: string }) => {
  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-96 w-full rounded-xl" />;

  const allItems = items || [];
  const analyticsRow = allItems.find(i => (i.data as Record<string, unknown>)?.type === 'email_analytics');
  const emails = allItems.filter(i => (i.data as Record<string, unknown>)?.type === 'email')
    .sort((a, b) => {
      const ta = (a.data as Record<string, unknown>)?.sent_at as string || a.created_at;
      const tb = (b.data as Record<string, unknown>)?.sent_at as string || b.created_at;
      return tb.localeCompare(ta);
    });

  const an = (analyticsRow?.data || {}) as Record<string, unknown>;
  const selEmail = emails.find(e => e.id === selectedEmail);
  const selData = selEmail ? (selEmail.data as Record<string, unknown>) : null;

  const totalSent = (an.total_sent as number) || 0;
  const totalDelivered = (an.total_delivered as number) || totalSent;
  const totalOpened = (an.total_opened as number) || 0;
  const totalClicked = (an.total_clicked as number) || 0;
  const totalReplied = (an.total_replied as number) || 0;
  const totalBounced = (an.total_bounced as number) || 0;
  const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
  const queueDepth = (an.queue_depth as number) || 0;

  // Top subject lines from individual emails
  const subjectStats = emails.reduce((acc, e) => {
    const ed = e.data as Record<string, unknown>;
    const subj = ed.subject as string;
    if (!subj) return acc;
    if (!acc[subj]) acc[subj] = { opens: 0, sends: 0 };
    acc[subj].sends++;
    if (ed.opened_at) acc[subj].opens++;
    return acc;
  }, {} as Record<string, { opens: number; sends: number }>);

  const topSubjects = Object.entries(subjectStats)
    .map(([subj, { opens, sends }]) => ({ subject: subj, rate: sends > 0 ? (opens / sends) * 100 : 0, sends }))
    .filter(s => s.sends >= 2)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  // Avg personalization fields
  const avgPersonalization = emails.length > 0
    ? (emails.reduce((sum, e) => {
        const pf = (e.data as Record<string, unknown>)?.personalization_fields;
        return sum + (pf ? Object.keys(pf as Record<string, unknown>).length : 0);
      }, 0) / emails.length).toFixed(1)
    : '0';

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {block.title && (
        <h3 className="font-orbitron text-xl font-semibold uppercase tracking-wider text-foreground mb-4">{block.title}</h3>
      )}

      {/* Top Stats with icons */}
      <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] border-t-white/[0.06] rounded-xl p-4 mb-4 shadow-[inset_0_1px_0_rgba(139,92,246,0.08)]">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          <TopStat icon={<Send className="w-3.5 h-3.5" />} label="Sent" value={totalSent.toLocaleString()} />
          <TopStat icon={<Eye className="w-3.5 h-3.5" />} label="Open Rate" value={`${an.open_rate || 0}%`} />
          <TopStat icon={<MousePointer className="w-3.5 h-3.5" />} label="Click Rate" value={`${an.click_rate || 0}%`} />
          <TopStat icon={<MessageSquare className="w-3.5 h-3.5" />} label="Reply Rate" value={`${an.reply_rate || 0}%`} />
          <TopStat icon={<Star className="w-3.5 h-3.5" />} label="Meetings" value={an.meetings_booked as number || 0} glow />
          <TopStat icon={<DollarSign className="w-3.5 h-3.5" />} label="Cost" value={`$${(an.total_cost as number || 0).toFixed(2)}`} />
        </div>
      </div>

      {/* Two Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-3">
        {/* Email Feed */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
          <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Mail className="w-3.5 h-3.5" /> Email Feed
          </h4>
          <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-custom">
            {emails.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No emails yet</p>
            ) : emails.slice(0, 30).map((email, i) => {
              const ed = email.data as Record<string, unknown>;
              const status = ed.status as string || 'draft';
              return (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedEmail(email.id)}
                  className={`group/email bg-white/[0.02] border border-white/[0.06] rounded-lg p-3 cursor-pointer hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-200 border-l-2 ${STATUS_BORDER[status] || 'border-l-white/[0.06]'}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <span className="text-sm font-semibold text-foreground group-hover/email:text-violet-400 transition-colors">{ed.lead_name as string}</span>
                      {ed.lead_email && <span className="text-xs text-muted-foreground ml-2">{ed.lead_email as string}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {STATUS_ICON[status]}
                      {emailStatusPill(status)}
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80 truncate">{ed.subject as string}</p>
                  {/* Personalization preview */}
                  {ed.preview && (
                    <p className="text-xs text-violet-300/70 mt-1 line-clamp-2 italic">{ed.preview as string}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {ed.opened_at && <span className="flex items-center gap-1 text-violet-400"><Eye className="w-3 h-3" /></span>}
                    {ed.clicked_at && <span className="flex items-center gap-1 text-emerald-400"><MousePointer className="w-3 h-3" /></span>}
                    {ed.replied_at && <span className="flex items-center gap-1 text-emerald-400"><MessageSquare className="w-3 h-3" /></span>}
                    {ed.sending_tool && <span className="px-1.5 py-0.5 rounded bg-white/[0.06]">{ed.sending_tool as string}</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Analytics Panel */}
        <div className="space-y-3">
          {/* Engagement Funnel */}
          <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] border-t-white/[0.06] rounded-xl p-4">
            <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-3 border-l-2 border-l-violet-500/40 pl-2">Engagement Funnel</h4>
            <div className="space-y-2">
              <FunnelBar label="Sent" value={totalSent} max={totalSent} colorFrom="#3B82F6" colorTo="#60A5FA" />
              <FunnelBar label="Delivered" value={totalDelivered} max={totalSent} colorFrom="#3B82F6" colorTo="#818CF8" />
              <FunnelBar label="Opened" value={totalOpened} max={totalSent} colorFrom="#8B5CF6" colorTo="#A78BFA" />
              <FunnelBar label="Clicked" value={totalClicked} max={totalSent} colorFrom="#8B5CF6" colorTo="#C4B5FD" />
              <FunnelBar label="Replied" value={totalReplied} max={totalSent} colorFrom="#22C55E" colorTo="#4ADE80" />
              <FunnelBar label="Meetings" value={an.meetings_booked as number || 0} max={totalSent} colorFrom="#22C55E" colorTo="#86EFAC" />
            </div>
          </div>

          {/* Top Subject Lines */}
          {topSubjects.length > 0 && (
            <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 hover:border-violet-500/20 transition-colors duration-300">
              <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" /> Top Subject Lines
              </h4>
              <div className="space-y-1.5">
                {topSubjects.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs hover:bg-white/[0.02] rounded p-1 -mx-1 transition-colors">
                    <span className="font-mono text-violet-400 w-10">{s.rate.toFixed(0)}%</span>
                    <span className="text-foreground truncate flex-1 italic">"{s.subject}"</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personalization Depth */}
          <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 hover:border-violet-500/20 transition-colors duration-300">
            <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-2">Personalization Depth</h4>
            <p className="font-mono text-2xl font-bold text-violet-400" style={{ textShadow: '0 0 10px rgba(139,92,246,0.3)' }}>{avgPersonalization}</p>
            <p className="text-xs text-muted-foreground">avg fields per email</p>
          </div>

          {an.best_segment && (
            <div className="backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 hover:border-violet-500/20 transition-colors duration-300">
              <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-2">Best Segment</h4>
              <p className="text-sm text-foreground">{(an.best_segment as string).replace(/_/g, ' ')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] border-t-violet-500/10 rounded-xl p-3 mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> {queueDepth > 0 ? `${queueDepth} queued` : `${totalSent.toLocaleString()} sent`}</span>
        <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> ${(an.total_cost as number || 0).toFixed(2)}</span>
        <span>Delivery: {totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : 0}%</span>
        {bounceRate > 2 && (
          <span className="flex items-center gap-1 text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" /> Bounce {bounceRate.toFixed(1)}%
          </span>
        )}
      </div>

      {/* Email Detail Sheet */}
      <Sheet open={!!selectedEmail} onOpenChange={() => setSelectedEmail(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg bg-background border-white/[0.08]">
          <SheetHeader>
            <SheetTitle>{selData?.subject as string || 'Email'}</SheetTitle>
            <SheetDescription>To: {selData?.lead_name as string} ({selData?.lead_email as string})</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {emailStatusPill(selData?.status as string || 'draft')}
              {selData?.sending_tool && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground">{selData.sending_tool as string}</span>
              )}
            </div>
            {selData?.personalization_fields && (
              <div>
                <h4 className="font-orbitron text-xs uppercase tracking-wider text-muted-foreground mb-2">Personalization</h4>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(selData.personalization_fields as Record<string, string>).map(([k, v]) => (
                    <span key={k} className="text-xs px-2 py-0.5 rounded bg-violet-500/10 text-violet-400">{k}: {String(v).slice(0, 30)}</span>
                  ))}
                </div>
              </div>
            )}
            {selData?.body_html && (
              <div className="mt-3 bg-white/[0.02] border border-white/[0.06] rounded-lg p-4 max-h-[50vh] overflow-y-auto scrollbar-custom">
                <div
                  className="prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selData.body_html as string) }}
                />
              </div>
            )}
            {selData?.reply_snippet && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-emerald-400 mb-1">Reply</h4>
                <p className="text-sm text-foreground">{selData.reply_snippet as string}</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};
