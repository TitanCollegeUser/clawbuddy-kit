import { useEffect, useState } from "react";
import { GlassCard } from "./GlassCard";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type KPIColor = "violet" | "purple" | "success" | "cyan" | "warning" | "blue" | "orange" | "danger";

interface KPICardProps {
  title: string;
  value: number;
  format?: "number" | "percent" | "decimal";
  icon: LucideIcon;
  color: KPIColor;
  suffix?: string;
  className?: string;
}

const colorTextMap: Record<KPIColor, string> = {
  violet: "text-violet-400",
  purple: "text-purple-400",
  success: "text-green-400",
  cyan: "text-cyan-400",
  warning: "text-amber-400",
  blue: "text-blue-400",
  orange: "text-orange-400",
  danger: "text-red-400",
};

const glowCardMap: Record<KPIColor, "violet" | "cyan" | "green" | "orange" | "blue" | "danger"> = {
  violet: "violet",
  purple: "violet",
  success: "green",
  cyan: "cyan",
  warning: "orange",
  blue: "blue",
  orange: "orange",
  danger: "danger",
};

const bgGradientMap: Record<KPIColor, string> = {
  violet: "from-violet-500/10 to-transparent",
  purple: "from-purple-500/10 to-transparent",
  success: "from-green-500/10 to-transparent",
  cyan: "from-cyan-500/10 to-transparent",
  warning: "from-amber-500/10 to-transparent",
  blue: "from-blue-500/10 to-transparent",
  orange: "from-orange-500/10 to-transparent",
  danger: "from-red-500/10 to-transparent",
};

function useCountUp(target: number, duration = 1200) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased * 100) / 100);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return current;
}

export function KPICard({ title, value, format = "number", icon: Icon, color, suffix, className }: KPICardProps) {
  const animatedValue = useCountUp(value);

  const formatted =
    format === "percent"
      ? `${animatedValue.toFixed(1)}%`
      : format === "decimal"
        ? animatedValue.toFixed(1)
        : Math.round(animatedValue).toLocaleString();

  return (
    <GlassCard glow={glowCardMap[color]} className={cn("relative overflow-hidden p-5 group", className)}>
      {/* Background gradient on hover */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          bgGradientMap[color]
        )}
      />

      <div className="relative z-10">
        <div className={cn("mb-3 transition-transform duration-300 group-hover:scale-110", colorTextMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className={cn("text-[28px] font-bold leading-none tracking-tight", colorTextMap[color])}>
          {formatted}
          {suffix}
        </div>
        <div className="mt-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
      </div>
    </GlassCard>
  );
}
