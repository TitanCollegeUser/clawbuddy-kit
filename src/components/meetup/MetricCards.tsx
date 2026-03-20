import { Calendar, MapPin, Handshake, CheckCircle, Users, DollarSign, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface MetricCard {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  format?: string;
}

const iconMap: Record<string, LucideIcon> = {
  "calendar-check": Calendar,
  "map-pin": MapPin,
  "handshake": Handshake,
  "check-circle": CheckCircle,
  "users": Users,
  "dollar-sign": DollarSign,
};

interface MetricCardsProps {
  cards: MetricCard[];
}

const MetricCards = ({ cards }: MetricCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, i) => {
        const Icon = iconMap[card.icon] || Calendar;
        const displayValue = card.format === "currency"
          ? `$${Number(card.value).toLocaleString()}`
          : card.value;

        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
            className="surface-card metric-glow p-5 flex items-center gap-4 group cursor-default relative overflow-hidden"
          >
            {/* Ambient corner glow */}
            <div
              className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ background: card.color }}
            />
            <div className="relative z-10 flex items-center gap-4 w-full">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 border"
                style={{
                  backgroundColor: `${card.color}12`,
                  borderColor: `${card.color}20`,
                }}
              >
                <Icon
                  className="w-5 h-5 transition-all duration-300"
                  style={{ color: card.color, filter: `drop-shadow(0 0 6px ${card.color}50)` }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground tracking-widest uppercase font-heading font-medium truncate">{card.label}</p>
                <p
                  className="text-2xl font-heading font-bold animate-count-up mt-0.5"
                  style={{ color: card.color, textShadow: `0 0 20px ${card.color}30` }}
                >
                  {displayValue}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default MetricCards;
