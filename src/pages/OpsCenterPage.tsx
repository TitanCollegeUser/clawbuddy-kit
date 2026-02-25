import { Radar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOpsCenterApps } from '@/hooks/useOpsCenterApps';
import { OpCard } from '@/components/ops-center/OpCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const OpsCenterPage = () => {
  const { data: apps, isLoading } = useOpsCenterApps();

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Radar className="h-6 w-6 text-primary" style={{ filter: 'drop-shadow(0 0 6px hsl(0 72% 51% / 0.5))' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground font-orbitron text-glow uppercase tracking-wider">Ops Center</h1>
            <p className="text-base text-muted-foreground">AI-powered mini-apps built by your agents</p>
          </div>
        </div>
        <Button onClick={() => toast.info('Create Op wizard coming soon')} className="gap-2 pulse-glow">
          <Plus className="h-4 w-4" />
          Create Op
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : apps && apps.length > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {apps.map((app, i) => (
            <motion.div key={app.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <OpCard app={app} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="glass rounded-xl py-20 text-center">
          <div className="border border-dashed border-white/[0.08] rounded-lg mx-auto max-w-md py-10 px-6">
            <Radar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-orbitron font-medium text-foreground mb-1 uppercase tracking-wider">No operations yet</h3>
            <p className="text-base text-muted-foreground mb-4">
              Your AI agents can create specialized ops here, or create one manually.
            </p>
            <Button onClick={() => toast.info('Create Op wizard coming soon')} className="gap-2 pulse-glow">
              <Plus className="h-4 w-4" />
              Create Op
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
