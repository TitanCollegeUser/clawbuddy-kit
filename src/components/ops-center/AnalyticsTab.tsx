import { BarChart3 } from 'lucide-react';

export const AnalyticsTab = () => (
  <div className="glass rounded-xl py-20 text-center">
    <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
    <h3 className="text-xl font-orbitron font-medium text-foreground mb-1 uppercase tracking-wider">Analytics coming soon</h3>
    <p className="text-base text-muted-foreground">
      Performance data for published videos will appear here once post-mortem data sources are connected.
    </p>
  </div>
);
