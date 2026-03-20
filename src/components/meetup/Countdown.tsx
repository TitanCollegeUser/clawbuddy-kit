import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface CountdownProps {
  targetDate: string;
  label: string;
  accent?: string;
}

const Countdown = ({ targetDate, label, accent = "#f97316" }: CountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const units = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="surface-card p-6 glow-orange relative overflow-hidden"
    >
      {/* Ambient glows */}
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}20, transparent)` }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle, #60a5fa10, transparent)` }}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center border"
            style={{ backgroundColor: `${accent}15`, borderColor: `${accent}25` }}
          >
            <Zap className="w-4 h-4" style={{ color: accent, filter: `drop-shadow(0 0 6px ${accent})` }} />
          </div>
          <span className="text-sm font-heading font-bold text-gradient-orange tracking-wider">{label}</span>
        </div>
        <div className="flex gap-3 sm:gap-5">
          {units.map((u, i) => (
            <motion.div
              key={u.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="text-center flex-1"
            >
              <div className="surface-card-static p-3 sm:p-4 rounded-xl border border-primary/10">
                <div
                  className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold font-mono-data tabular-nums"
                  style={{ color: accent, textShadow: `0 0 40px ${accent}40, 0 0 80px ${accent}15` }}
                >
                  {String(u.value).padStart(2, "0")}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground mt-2 uppercase tracking-[0.2em] font-heading font-medium">{u.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default Countdown;
