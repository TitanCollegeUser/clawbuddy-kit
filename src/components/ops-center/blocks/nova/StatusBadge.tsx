import { cn } from "@/lib/utils";

export type StatusType =
  | "queued" | "sending" | "delivered" | "opened"
  | "clicked" | "replied" | "bounced" | "failed"
  | "draft" | "active" | "paused" | "completed"
  | "scheduled" | "running"
  | "cold" | "warm" | "hot" | "engaged" | "converted";

const statusConfig: Record<StatusType, { bg: string; dot: string; label: string; pulse?: boolean }> = {
  queued:    { bg: "bg-zinc-500/20",   dot: "bg-zinc-400",   label: "Queued" },
  sending:   { bg: "bg-violet-500/20", dot: "bg-violet-400", label: "Sending", pulse: true },
  delivered: { bg: "bg-blue-500/20",   dot: "bg-blue-400",   label: "Delivered" },
  opened:    { bg: "bg-purple-500/20", dot: "bg-purple-400", label: "Opened" },
  clicked:   { bg: "bg-cyan-500/20",   dot: "bg-cyan-400",   label: "Clicked" },
  replied:   { bg: "bg-green-500/20",  dot: "bg-green-400",  label: "Replied" },
  bounced:   { bg: "bg-orange-500/20", dot: "bg-orange-400", label: "Bounced" },
  failed:    { bg: "bg-red-500/20",    dot: "bg-red-400",    label: "Failed" },
  draft:     { bg: "bg-zinc-500/20",   dot: "bg-zinc-400",   label: "Draft" },
  active:    { bg: "bg-violet-500/20", dot: "bg-violet-400", label: "Active", pulse: true },
  paused:    { bg: "bg-amber-500/20",  dot: "bg-amber-400",  label: "Paused" },
  completed: { bg: "bg-green-500/20",  dot: "bg-green-400",  label: "Completed" },
  scheduled: { bg: "bg-blue-500/20",   dot: "bg-blue-400",   label: "Scheduled" },
  running:   { bg: "bg-violet-500/20", dot: "bg-violet-400", label: "Running", pulse: true },
  cold:      { bg: "bg-zinc-500/20",   dot: "bg-zinc-400",   label: "Cold" },
  warm:      { bg: "bg-amber-500/20",  dot: "bg-amber-400",  label: "Warm" },
  hot:       { bg: "bg-orange-500/20", dot: "bg-orange-400", label: "Hot" },
  engaged:   { bg: "bg-green-500/20",  dot: "bg-green-400",  label: "Engaged" },
  converted: { bg: "bg-violet-500/20", dot: "bg-violet-400", label: "Converted" },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const config = statusConfig[status] || { bg: "bg-zinc-500/20", dot: "bg-zinc-400", label: status };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200 hover:scale-105",
        config.bg,
        "text-foreground",
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            config.dot,
            config.pulse && "animate-pulse"
          )}
        />
      )}
      {config.label}
    </span>
  );
}

export function StatusDot({ status, className }: { status: StatusType; className?: string }) {
  const config = statusConfig[status] || { bg: "bg-zinc-500/20", dot: "bg-zinc-400", label: status };
  return (
    <span
      className={cn(
        "h-2 w-2 rounded-full inline-block",
        config.dot,
        config.pulse && "animate-pulse",
        className
      )}
    />
  );
}
