import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface PriorityData {
  name: string;
  value: number;
  color: string;
}

interface PriorityChartProps {
  data: PriorityData[];
}

export const PriorityChart = ({ data }: PriorityChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No tasks yet
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative w-full h-40"
    >
      {/* Outer glow ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          className="w-28 h-28 rounded-full"
          style={{
            background: 'radial-gradient(circle, transparent 40%, hsl(var(--primary) / 0.1) 60%, transparent 70%)',
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Inner decorative ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 rounded-full border border-primary/20" />
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            {data.map((entry, index) => (
              <filter key={`glow-${index}`} id={`glow-${index}`}>
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            ))}
            {/* Gradient for depth effect */}
            {data.map((entry, index) => (
              <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                <stop offset="100%" stopColor={entry.color} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>
          
          {/* Background ring for depth */}
          <Pie
            data={[{ value: 1 }]}
            cx="50%"
            cy="50%"
            outerRadius={58}
            innerRadius={52}
            dataKey="value"
            strokeWidth={0}
            fill="hsl(var(--muted) / 0.3)"
          />
          
          {/* Main pie chart */}
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={55}
            innerRadius={28}
            paddingAngle={4}
            dataKey="value"
            strokeWidth={0}
            cornerRadius={3}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={`url(#gradient-${index})`}
                style={{
                  filter: `drop-shadow(0 0 6px ${entry.color}80)`,
                }}
              />
            ))}
          </Pie>
          
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))',
              boxShadow: '0 0 20px hsl(var(--primary) / 0.2)',
            }}
            formatter={(value: number, name: string) => [`${value} tasks`, name]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-xl font-orbitron font-bold text-foreground">{total}</span>
          <p className="text-[10px] text-muted-foreground">tasks</p>
        </motion.div>
      </div>
    </motion.div>
  );
};
