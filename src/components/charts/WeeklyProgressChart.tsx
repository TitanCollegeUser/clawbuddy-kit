import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';

interface WeeklyData {
  day: string;
  completed: number;
}

interface WeeklyProgressChartProps {
  data: WeeklyData[];
}

// Custom dot component with pulsing effect
const CustomDot = (props: any) => {
  const { cx, cy, payload, index } = props;
  if (cx === undefined || cy === undefined) return null;
  
  return (
    <g>
      {/* Outer glow */}
      <circle
        cx={cx}
        cy={cy}
        r={8}
        fill="hsl(var(--primary))"
        opacity={0.2}
        className="animate-pulse"
      />
      {/* Inner dot */}
      <circle
        cx={cx}
        cy={cy}
        r={4}
        fill="hsl(var(--primary))"
        stroke="hsl(var(--background))"
        strokeWidth={2}
        style={{
          filter: 'drop-shadow(0 0 4px hsl(var(--primary)))',
        }}
      />
    </g>
  );
};

export const WeeklyProgressChart = ({ data }: WeeklyProgressChartProps) => {
  const maxValue = Math.max(...data.map(d => d.completed), 1);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-44"
    >
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-10 rounded-lg overflow-hidden"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />
      
      {/* Horizontal scanlines */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
        }}
      />

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
          <defs>
            {/* Main gradient fill */}
            <linearGradient id="colorCompletedEnhanced" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            
            {/* Neon glow filter for the line */}
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Gradient for the stroke */}
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={1} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          
          {/* Reference lines for depth */}
          {[0.25, 0.5, 0.75].map((ratio, i) => (
            <ReferenceLine 
              key={i}
              y={maxValue * ratio} 
              stroke="hsl(var(--muted-foreground))" 
              strokeOpacity={0.1}
              strokeDasharray="3 3"
            />
          ))}
          
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              color: 'hsl(var(--foreground))',
              boxShadow: '0 0 20px hsl(var(--primary) / 0.3)',
            }}
            formatter={(value: number) => [`${value} completed`, 'Tasks']}
            labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
          />
          
          {/* Main area */}
          <Area
            type="monotone"
            dataKey="completed"
            stroke="url(#lineGradient)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorCompletedEnhanced)"
            dot={<CustomDot />}
            activeDot={{
              r: 6,
              fill: 'hsl(var(--primary))',
              stroke: 'hsl(var(--background))',
              strokeWidth: 2,
              style: { filter: 'drop-shadow(0 0 8px hsl(var(--primary)))' },
            }}
            style={{
              filter: 'url(#neonGlow)',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary/30 rounded-tl" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-primary/30 rounded-tr" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-primary/30 rounded-bl" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary/30 rounded-br" />
    </motion.div>
  );
};
