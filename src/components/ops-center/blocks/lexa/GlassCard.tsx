import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  title?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export function GlassCard({ title, icon: Icon, children, className = "", glow = false }: GlassCardProps) {
  return (
    <div className={cn(
      "rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6",
      glow && "shadow-[0_0_30px_rgba(6,182,212,0.08)]",
      className
    )}>
      {title && (
        <div className="flex items-center gap-2.5 mb-5">
          {Icon && <Icon size={18} className="text-cyan-400" />}
          <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}
