import { cn } from "@/lib/utils";

interface StatusDotProps {
  color: string;
  pulse?: boolean;
  className?: string;
}

export function StatusDot({ color, pulse, className }: StatusDotProps) {
  return (
    <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", className)}>
      {pulse && (
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping"
          style={{ backgroundColor: color }}
        />
      )}
      <span
        className="relative inline-flex h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}
