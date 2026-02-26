import { useState, useMemo } from 'react';
import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  format?: string;
}

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj as unknown);
};

const formatValue = (val: unknown, format?: string): string => {
  if (val === null || val === undefined) return '—';
  if (format === 'number') return Number(val).toLocaleString();
  if (format === 'decimal') return Number(val).toFixed(1);
  if (format === 'percent') return `${Math.round(Number(val) * 100)}%`;
  if (format === 'date') return new Date(String(val)).toLocaleDateString();
  return String(val);
};

export const OpsTableBlock = ({ block, appId }: { block: OpsBlock; appId: string }) => {
  const columns = (block.config.columns as ColumnDef[]) || [];
  const defaultSort = block.config.default_sort as { key: string; direction: string } | undefined;
  const [sortKey, setSortKey] = useState(defaultSort?.key || '');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>((defaultSort?.direction as 'asc' | 'desc') || 'desc');

  const useAppData = block.config.use_app_data as boolean;
  const itemTypeFilter = block.config.item_type_filter as string | undefined;
  const { data: items, isLoading } = useOpsData({
    appId,
    blockId: useAppData ? undefined : block.id,
    itemType: useAppData ? itemTypeFilter : undefined,
  });

  const sorted = useMemo(() => {
    if (!items || !sortKey) return items || [];
    return [...items].sort((a, b) => {
      const av = getNestedValue(a as unknown as Record<string, unknown>, sortKey);
      const bv = getNestedValue(b as unknown as Record<string, unknown>, sortKey);
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.03]">
              {columns.map(col => (
                <th
                  key={col.key}
                  className="text-left px-4 py-3 font-orbitron text-sm font-medium uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  style={{ width: col.width }}
                  onClick={() => toggleSort(col.key)}
                >
                  <span className="flex items-center gap-1.5">
                    {col.label}
                    {sortKey === col.key && (
                      sortDir === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, i) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors"
              >
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-base text-foreground">
                    {formatValue(getNestedValue(item as unknown as Record<string, unknown>, col.key), col.format)}
                  </td>
                ))}
              </motion.tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center">
                  <div className="border border-dashed border-white/[0.08] rounded-lg py-6">
                    <p className="text-base text-muted-foreground">No data yet</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
