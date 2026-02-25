import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { edgeFunctionRegistry } from '@/lib/edge-function-registry';
import { EdgeFunctionCard } from '@/components/settings/EdgeFunctionCard';

const categories = [
  { key: 'all', label: 'All' },
  { key: 'core', label: 'Core' },
  { key: 'webhook', label: 'Webhooks' },
  { key: 'ai', label: 'AI' },
  { key: 'office', label: 'Office' },
];

export const EdgeFunctionVisualizer = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const baseUrl = import.meta.env.VITE_SUPABASE_URL || '';

  const filtered = edgeFunctionRegistry.filter((fn) => {
    const matchesCategory = activeCategory === 'all' || fn.category === activeCategory;
    const matchesSearch = !search ||
      fn.name.toLowerCase().includes(search.toLowerCase()) ||
      fn.title.toLowerCase().includes(search.toLowerCase()) ||
      fn.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search functions..."
            className="pl-9 glass"
          />
        </div>
        <div className="flex gap-1">
          {categories.map((cat) => (
            <Badge
              key={cat.key}
              variant={activeCategory === cat.key ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/20 transition-colors"
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground">
        {filtered.length} function{filtered.length !== 1 ? 's' : ''} · Base URL: <code className="text-xs font-mono text-primary">{baseUrl}/functions/v1/</code>
      </p>

      {/* Function Cards */}
      <div className="space-y-2">
        {filtered.map((fn) => (
          <EdgeFunctionCard key={fn.name} fn={fn} baseUrl={baseUrl} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No functions match your search.
        </div>
      )}
    </div>
  );
};
