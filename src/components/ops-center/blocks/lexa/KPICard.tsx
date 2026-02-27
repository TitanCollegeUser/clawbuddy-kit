import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: number;
  format?: (n: number) => string;
  icon: LucideIcon;
  color: string;
}

export function KPICard({ label, value, format, icon: Icon, color }: KPICardProps) {
  const [display, setDisplay] = useState(0);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current) return;
    animated.current = true;
    const duration = 1200;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * value);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);

  const formatted = format ? format(display) : Math.round(display).toLocaleString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.08)] p-5 relative overflow-hidden group"
    >
      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, opacity: 0.4 }} />
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 0%, ${color}08, transparent 70%)` }} />
      <div className="flex items-start justify-between mb-4">
        <div>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div className="text-3xl font-extrabold tracking-tight text-foreground">
        {formatted}
      </div>
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-1.5">
        {label}
      </div>
    </motion.div>
  );
}
