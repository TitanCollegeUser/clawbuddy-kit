import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PeriodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options?: { label: string; value: string }[];
  className?: string;
}

const defaultOptions = [
  { label: "Today", value: "today" },
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "All Time", value: "all" },
];

export function PeriodSelector({ value, onChange, options = defaultOptions, className }: PeriodSelectorProps) {
  return (
    <div className={cn("relative flex gap-1 rounded-lg bg-white/[0.04] p-1", className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "relative rounded-md px-3 py-1.5 text-xs font-medium transition-all z-10",
            value === opt.value
              ? "text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {value === opt.value && (
            <motion.div
              layoutId="nova-period-pill"
              className="absolute inset-0 rounded-md bg-violet-600 shadow-sm shadow-violet-500/30"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
