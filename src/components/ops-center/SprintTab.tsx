import { Timer } from 'lucide-react';

export const SprintTab = () => (
  <div className="glass rounded-xl py-20 text-center">
    <Timer className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
    <h3 className="text-xl font-orbitron font-medium text-foreground mb-1 uppercase tracking-wider">Sprint Dashboard coming soon</h3>
    <p className="text-base text-muted-foreground">
      45-day sprint progress, KPIs, and burndown charts will appear here once sprint tracking is configured.
    </p>
  </div>
);
