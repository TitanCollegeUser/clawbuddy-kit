import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./nova/GlassCard";
import { StatusBadge } from "./nova/StatusBadge";
import { useEmails } from "@/hooks/useNova";
import { timeAgo } from "@/lib/nova-utils";
import {
  Mail, Search, Eye, MousePointer, MessageSquare, Calendar,
  ChevronLeft, ChevronRight, Star, Send, CheckCircle2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { NovaEmail, EmailStatus } from "@/types/nova";
import type { OpsBlock } from "@/hooks/useOpsBlocks";

interface Props { block: OpsBlock; appId: string; }

const PAGE_SIZE = 25;
const statusOptions: EmailStatus[] = ["queued", "sending", "delivered", "opened", "clicked", "replied", "bounced", "failed"];

const statusColors: Record<string, { border: string; bg: string; dot: string }> = {
  queued: { border: "border-l-zinc-400", bg: "bg-zinc-400/20", dot: "bg-zinc-400" },
  sending: { border: "border-l-violet-400", bg: "bg-violet-400/20", dot: "bg-violet-400" },
  delivered: { border: "border-l-blue-400", bg: "bg-blue-400/20", dot: "bg-blue-400" },
  opened: { border: "border-l-purple-400", bg: "bg-purple-400/20", dot: "bg-purple-400" },
  clicked: { border: "border-l-cyan-400", bg: "bg-cyan-400/20", dot: "bg-cyan-400" },
  replied: { border: "border-l-green-400", bg: "bg-green-400/20", dot: "bg-green-400" },
  bounced: { border: "border-l-orange-400", bg: "bg-orange-400/20", dot: "bg-orange-400" },
  failed: { border: "border-l-red-400", bg: "bg-red-400/20", dot: "bg-red-400" },
};

const avatarColors = [
  "from-violet-500 to-cyan-400",
  "from-violet-400 to-pink-400",
  "from-cyan-400 to-blue-400",
  "from-green-400 to-cyan-400",
  "from-orange-400 to-amber-400",
];

function getInitials(name: string | null, email: string) {
  if (name) return name.charAt(0).toUpperCase();
  return email.charAt(0).toUpperCase();
}

function getAvatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// ── Timeline Event ──
function TimelineEvent({ label, time, icon: Icon, color, isLast }: { label: string; time: string | null; icon: any; color: string; isLast?: boolean }) {
  if (!time) return null;
  return (
    <div className={cn("flex gap-3 pb-4 relative", !isLast && "border-l border-border ml-3")}>
      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 -ml-3", color)}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="pt-0.5">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground">{timeAgo(time)}</p>
      </div>
    </div>
  );
}

// ── Email Detail Sheet ──
function EmailDetail({ email, onClose }: { email: NovaEmail; onClose: () => void }) {
  const timelineEvents = [
    { label: "Created", time: email.created_at, icon: Clock, color: "bg-muted text-muted-foreground" },
    { label: "Sent", time: email.sent_at, icon: Send, color: "bg-violet-500/20 text-violet-400" },
    { label: "Delivered", time: email.delivered_at, icon: CheckCircle2, color: "bg-blue-500/20 text-blue-400" },
    { label: "Opened", time: email.opened_at, icon: Eye, color: "bg-purple-500/20 text-purple-400" },
    { label: "Clicked", time: email.clicked_at, icon: MousePointer, color: "bg-cyan-500/20 text-cyan-400" },
    { label: "Replied", time: email.replied_at, icon: MessageSquare, color: "bg-green-500/20 text-green-400" },
    { label: "Bounced", time: email.bounced_at, icon: Mail, color: "bg-orange-500/20 text-orange-400" },
  ].filter(e => e.time);

  return (
    <Sheet open onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto p-0">
        <div className="relative p-6 pb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/5 pointer-events-none" />
          <SheetHeader className="relative">
            <SheetTitle className="text-sm">{email.subject}</SheetTitle>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={email.status as any} />
              {email.meeting_booked && (
                <span className="text-amber-400 text-[10px] flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400" /> Meeting
                </span>
              )}
            </div>
          </SheetHeader>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Recipient */}
          <GlassCard glow="violet" className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-xs font-bold text-white", getAvatarColor(email.to_address))}>
                {getInitials(email.to_name, email.to_address)}
              </div>
              <div>
                <p className="text-sm font-medium">{email.to_name || "—"}</p>
                <p className="text-xs text-muted-foreground font-mono">{email.to_address}</p>
              </div>
            </div>
          </GlassCard>

          {/* Personalization */}
          {email.personalization_fields && Object.keys(email.personalization_fields).length > 0 && (
            <GlassCard glow="cyan" className="p-4">
              <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Personalization</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(email.personalization_fields).map(([k, v]) => (
                  <span key={k} className="rounded-lg bg-violet-500/10 px-2 py-1 text-[11px] transition-all hover:bg-violet-500/20">
                    <span className="text-muted-foreground">{k}:</span> <span className="text-violet-400">{v}</span>
                  </span>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Email body */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
              <span className="text-[10px] text-muted-foreground ml-2 font-mono truncate">{email.subject}</span>
            </div>
            <div className="p-4 prose prose-sm prose-invert max-w-none text-xs" dangerouslySetInnerHTML={{ __html: email.body_html || "<p>No body</p>" }} />
          </div>

          {/* Engagement */}
          <GlassCard glow="green" className="p-4">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Engagement</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-lg font-bold font-mono text-purple-400">{email.open_count}</p>
                <p className="text-[10px] text-muted-foreground">Opens</p>
              </div>
              <div>
                <p className="text-lg font-bold font-mono text-cyan-400">{email.click_count}</p>
                <p className="text-[10px] text-muted-foreground">Clicks</p>
              </div>
              <div>
                <p className="text-lg font-bold font-mono text-green-400">{email.replied_at ? "Yes" : "—"}</p>
                <p className="text-[10px] text-muted-foreground">Replied</p>
              </div>
            </div>
            {email.replied_at && email.reply_snippet && (
              <div className="mt-3 rounded-lg bg-green-500/10 p-2.5 border border-green-500/20">
                <p className="text-[10px] text-green-400 font-medium">Reply received {timeAgo(email.replied_at)}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{email.reply_snippet}</p>
              </div>
            )}
          </GlassCard>

          {/* Timeline */}
          <GlassCard className="p-4">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Timeline</h4>
            <div className="space-y-0 pl-3">
              {timelineEvents.map((e, i) => (
                <motion.div key={e.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <TimelineEvent {...e} isLast={i === timelineEvents.length - 1} />
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main Block ──
export const OpsNovaOutboxBlock = ({ block, appId }: Props) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<NovaEmail | null>(null);

  const { data, isLoading } = useEmails({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const emails = data?.emails || [];
  const total = data?.count || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const deliveredCount = useMemo(() => emails.filter(e => e.status !== "queued" && e.status !== "failed" && e.status !== "bounced").length, [emails]);
  const deliveryRate = emails.length > 0 ? Math.round((deliveredCount / emails.length) * 100) : 0;

  return (
    <TooltipProvider>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-violet-400" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Outbox</h1>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-violet-500/10 px-3 py-1.5 text-[11px] font-mono text-violet-400 flex items-center gap-1.5">
              <Mail className="h-3 w-3" /> {total} emails
            </span>
            <span className="rounded-full bg-green-500/10 px-3 py-1.5 text-[11px] font-mono text-green-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" /> {deliveryRate}% delivered
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Search by recipient, subject..." className="pl-9 bg-white/[0.03] border-white/[0.06]" />
          </div>
          <div className="flex gap-1 rounded-lg bg-white/[0.04] p-1">
            <button onClick={() => { setStatusFilter("all"); setPage(0); }} className={cn("rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all", statusFilter === "all" ? "bg-violet-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              All
            </button>
            {statusOptions.map(s => {
              const sc = statusColors[s];
              return (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(0); }} className={cn("rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all capitalize flex items-center gap-1.5", statusFilter === s ? "bg-violet-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                  <div className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <GlassCard className="p-0 overflow-hidden" glow="violet">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading emails...</div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Mail className="mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No emails found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.06] hover:bg-transparent">
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px]">Engagement</TableHead>
                    <TableHead className="w-[100px]">Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emails.map((email) => {
                    const sc = statusColors[email.status] || statusColors.queued;
                    const isPriority = email.meeting_booked || !!email.replied_at;
                    return (
                      <TableRow
                        key={email.id}
                        onClick={() => setSelected(email)}
                        className={cn("cursor-pointer border-white/[0.06] transition-all border-l-[3px] hover:bg-white/[0.03]", sc.border)}
                      >
                        <TableCell>
                          <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-[11px] font-bold text-white", getAvatarColor(email.to_address))}>
                            {getInitials(email.to_name, email.to_address)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isPriority && <Star className="h-3 w-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                            <div>
                              <div className="text-xs font-medium">{email.to_name || email.to_address}</div>
                              {email.to_name && <div className="text-[10px] text-muted-foreground font-mono">{email.to_address}</div>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <span className="text-xs truncate block">{email.subject}</span>
                          {email.body_text && <span className="text-[10px] text-muted-foreground truncate block">{email.body_text.slice(0, 50)}...</span>}
                        </TableCell>
                        <TableCell>
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", sc.bg)}>{email.status}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {email.open_count > 0 && (
                              <Tooltip>
                                <TooltipTrigger><Eye className="h-3.5 w-3.5 text-purple-400" /></TooltipTrigger>
                                <TooltipContent><p className="text-xs">{email.open_count} opens</p></TooltipContent>
                              </Tooltip>
                            )}
                            {email.click_count > 0 && (
                              <Tooltip>
                                <TooltipTrigger><MousePointer className="h-3.5 w-3.5 text-cyan-400" /></TooltipTrigger>
                                <TooltipContent><p className="text-xs">{email.click_count} clicks</p></TooltipContent>
                              </Tooltip>
                            )}
                            {email.replied_at && (
                              <Tooltip>
                                <TooltipTrigger><MessageSquare className="h-3.5 w-3.5 text-green-400" /></TooltipTrigger>
                                <TooltipContent><p className="text-xs">Replied</p></TooltipContent>
                              </Tooltip>
                            )}
                            {email.meeting_booked && (
                              <Tooltip>
                                <TooltipTrigger><Calendar className="h-3.5 w-3.5 text-amber-400" /></TooltipTrigger>
                                <TooltipContent><p className="text-xs">Meeting booked</p></TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">{timeAgo(email.sent_at || email.created_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
                <span className="text-[11px] text-muted-foreground">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="h-7">
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <span className="text-xs text-muted-foreground px-2 font-mono">Page {page + 1} / {totalPages}</span>
                  <Button size="sm" variant="ghost" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="h-7">
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </GlassCard>

        {selected && <EmailDetail email={selected} onClose={() => setSelected(null)} />}
      </motion.div>
    </TooltipProvider>
  );
};
