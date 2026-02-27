import { cn } from "@/lib/utils";
import React, { useRef, useCallback } from "react";
import { LucideIcon } from "lucide-react";

type GlowColor = "violet" | "cyan" | "green" | "orange" | "blue" | "danger";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  title?: string;
  icon?: LucideIcon;
  hover?: boolean;
  glow?: GlowColor;
}

const glowShadowMap: Record<GlowColor, string> = {
  violet: "shadow-[0_0_30px_rgba(139,92,246,0.08)]",
  cyan: "shadow-[0_0_30px_rgba(6,182,212,0.08)]",
  green: "shadow-[0_0_30px_rgba(34,197,94,0.08)]",
  orange: "shadow-[0_0_30px_rgba(249,115,22,0.08)]",
  blue: "shadow-[0_0_30px_rgba(59,130,246,0.08)]",
  danger: "shadow-[0_0_30px_rgba(239,68,68,0.08)]",
};

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, title, icon: Icon, hover = true, glow, onMouseMove, ...props }, ref) => {
    const innerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const el = innerRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          el.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
          el.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
        }
        onMouseMove?.(e);
      },
      [onMouseMove]
    );

    return (
      <div
        ref={(node) => {
          (innerRef as any).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as any).current = node;
        }}
        onMouseMove={hover ? handleMouseMove : undefined}
        className={cn(
          "rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-6",
          "transition-all duration-300",
          hover && "hover:border-violet-500/20 hover:shadow-[0_0_40px_rgba(139,92,246,0.06)]",
          glow && glowShadowMap[glow],
          className
        )}
        {...props}
      >
        {title && (
          <div className="flex items-center gap-2.5 mb-5">
            {Icon && <Icon size={18} className="text-violet-400" />}
            <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
          </div>
        )}
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
