import { useState } from "react";
import { Search, FileText, Loader2 } from "lucide-react";
import { GlassCard } from "./lexa/GlassCard";
import { StatusDot } from "./lexa/StatusDot";
import { formatDuration, formatPhone, timeAgo, statusColors, sentimentColors } from "@/lib/lexa-utils";
import { motion } from "framer-motion";
import { useCalls } from "@/hooks/useLexa";
import type { OpsBlock } from "@/hooks/useOpsBlocks";

interface Props { block: OpsBlock; appId: string; }

export const OpsLexaTranscriptsBlock = ({ block, appId }: Props) => {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useCalls({
    limit: 50,
    search: search || undefined,
    sortBy: "created_at",
    sortDir: "desc",
  });

  const calls = (data?.calls || []).filter(c => c.transcript && Array.isArray(c.transcript) && c.transcript.length > 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <FileText size={22} className="text-cyan-400" />
        <h2 className="text-xl font-bold text-foreground">Transcripts</h2>
      </div>

      <div className="relative max-w-xl">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search across all call transcripts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/40 transition-all"
        />
      </div>

      {isLoading ? (
        <div className="py-20 flex items-center justify-center"><Loader2 className="animate-spin text-cyan-400" size={24} /></div>
      ) : calls.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground text-sm">
          {search ? "No transcripts match your search" : "No transcripts yet"}
        </div>
      ) : (
        <div className="space-y-5">
          {calls.slice(0, 15).map(call => {
            const transcript = Array.isArray(call.transcript) ? call.transcript : [];
            const isExpanded = expanded === call.id;
            const preview = transcript.slice(0, isExpanded ? undefined : 4);
            return (
              <motion.div key={call.id} layout>
                <GlassCard glow>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <StatusDot color={statusColors[call.call_status] || '#666'} />
                    <span className="text-sm font-mono font-medium text-foreground">{formatPhone(call.caller_number || 'Unknown')}</span>
                    <span className="text-sm text-muted-foreground">{timeAgo(call.created_at)}</span>
                    <span className="text-sm text-muted-foreground">{formatDuration(call.duration_seconds)}</span>
                    <span className="text-xs capitalize font-semibold px-2 py-0.5 rounded-full" style={{ color: sentimentColors[call.sentiment], backgroundColor: `${sentimentColors[call.sentiment]}15` }}>{call.sentiment}</span>
                  </div>
                  {call.summary && (
                    <p className="text-sm text-muted-foreground mb-4 italic leading-relaxed">{call.summary}</p>
                  )}
                  <div className="space-y-2.5">
                    {preview.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-cyan-500/10 border border-cyan-500/20 text-foreground' : 'bg-white/[0.05] border border-white/[0.08] text-foreground'}`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1.5">{msg.role === 'user' ? 'Caller:' : 'Lexa:'}</span>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                  {transcript.length > 4 && (
                    <button onClick={() => setExpanded(isExpanded ? null : call.id)}
                      className="mt-4 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                      {isExpanded ? 'Show less' : `Show full transcript (${transcript.length} messages)`}
                    </button>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
