import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Column {
  key: string;
  label: string;
  width?: string;
  bold?: boolean;
  mono?: boolean;
  type?: string;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: Array<Record<string, any>>;
  statusColors?: Record<string, string>;
  tierColors?: Record<string, string>;
}

const getNestedValue = (obj: any, path: string): any => {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
};

const DataTable = ({ title, columns, data, statusColors = {}, tierColors = {} }: DataTableProps) => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const va = getNestedValue(a, sortKey) ?? "";
        const vb = getNestedValue(b, sortKey) ?? "";
        const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : data;

  const renderCell = (row: any, col: Column) => {
    const value = getNestedValue(row, col.key);
    if (value === null || value === undefined) return <span className="text-muted-foreground/30">—</span>;

    if (col.type === "badge") {
      const colors = col.key === "data.tier" ? tierColors : statusColors;
      const color = colors[value] || "#6b7280";
      return (
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-heading font-semibold px-2.5 py-1 rounded-full whitespace-nowrap border"
          style={{
            backgroundColor: `${color}12`,
            color,
            borderColor: `${color}20`,
            textShadow: `0 0 12px ${color}35`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }} />
          {String(value).replace(/_/g, " ")}
        </span>
      );
    }
    if (col.type === "currency") {
      return (
        <span className="font-mono-data text-sm font-medium" style={{ color: '#fbbf24', textShadow: '0 0 8px #fbbf2425' }}>
          ${Number(value).toLocaleString()}
        </span>
      );
    }
    if (col.type === "date") {
      const d = new Date(value);
      const formatted = !isNaN(d.getTime())
        ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : value;
      return <span className="font-mono-data text-xs text-muted-foreground">{formatted}</span>;
    }
    if (col.type === "number") {
      return <span className="font-mono-data text-sm text-foreground font-medium">{value}</span>;
    }
    if (col.bold) {
      return (
        <div className="flex items-center gap-2">
          <span className="w-0.5 h-4 rounded-full bg-primary/30 shrink-0" />
          <span className="font-heading font-bold text-foreground">{value}</span>
        </div>
      );
    }
    if (col.mono) return <span className="font-mono-data text-xs text-foreground/60">{value}</span>;

    return <span className="text-sm text-foreground/70 leading-relaxed">{String(value).length > 55 ? String(value).slice(0, 55) + "…" : value}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="surface-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-3 relative">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="w-1.5 h-5 rounded-full bg-primary shadow-[0_0_10px_hsl(25_95%_53%/0.6)]" />
        <h3 className="text-sm font-heading font-bold text-foreground uppercase tracking-widest">{title}</h3>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[10px] font-mono-data px-2 py-0.5 rounded-md text-muted-foreground border border-border">
            {data.length} records
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-muted-foreground cursor-pointer select-none group transition-colors hover:text-foreground/80 border-b border-border bg-secondary/20"
                  style={{ minWidth: col.width }}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortKey === col.key ? (
                        sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronUp className="w-3 h-3 text-muted-foreground/30" />
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <motion.tr
                key={row.id || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                onMouseEnter={() => setHoveredRow(i)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`border-b border-border/30 last:border-0 transition-all duration-200 ${
                  hoveredRow === i
                    ? "bg-primary/[0.04] shadow-[inset_3px_0_0_hsl(25_95%_53%/0.7)]"
                    : i % 2 === 0
                    ? "bg-transparent"
                    : "bg-secondary/[0.06]"
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5 text-sm">
                    {renderCell(row, col)}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          {Object.entries(statusColors).slice(0, 5).map(([status, color]) => {
            const count = data.filter(r => getNestedValue(r, "status") === status).length;
            if (count === 0) return null;
            return (
              <div key={status} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}60` }} />
                <span className="text-[10px] text-muted-foreground font-heading capitalize">{status.replace(/_/g, " ")}</span>
                <span className="text-[10px] font-mono-data text-muted-foreground/50">{count}</span>
              </div>
            );
          })}
        </div>
        <span className="text-[10px] font-mono-data text-muted-foreground/40">
          {sortKey ? `Sorted by ${columns.find(c => c.key === sortKey)?.label || sortKey}` : "Click header to sort"}
        </span>
      </div>
    </motion.div>
  );
};

export default DataTable;
