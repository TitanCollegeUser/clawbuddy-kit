import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj as unknown);
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-sm">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-foreground font-semibold">{payload[0].value}</p>
    </div>
  );
};

export const OpsChartBlock = ({ block, appId }: { block: OpsBlock; appId: string }) => {
  const chartType = (block.config.chart_type as string) || 'line';
  const xAxis = (block.config.x_axis as string) || 'created_at';
  const yAxis = (block.config.y_axis as string) || 'sort_order';
  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });

  if (isLoading) return <Skeleton className="h-60 w-full rounded-xl" />;

  const chartData = (items || []).map(item => ({
    x: String(getNestedValue(item as unknown as Record<string, unknown>, xAxis) ?? ''),
    y: Number(getNestedValue(item as unknown as Record<string, unknown>, yAxis) ?? 0),
  })).reverse();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-xl overflow-hidden"
    >
      {block.title && (
        <div className="px-5 pt-4 pb-2">
          <h3 className="font-orbitron text-base font-semibold uppercase tracking-wider text-foreground">{block.title}</h3>
        </div>
      )}
      <div className="px-5 pb-5">
        {chartData.length === 0 ? (
          <div className="border border-dashed border-white/[0.08] rounded-lg py-10 text-center">
            <p className="text-base text-muted-foreground">No data for chart</p>
          </div>
        ) : (
          <div className="chart-glow">
            <ResponsiveContainer width="100%" height={220}>
              {chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.05)" />
                  <XAxis dataKey="x" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="y" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 100% / 0.05)" />
                  <XAxis dataKey="x" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="y" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
};
