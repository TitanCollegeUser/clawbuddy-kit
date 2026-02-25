import { MemoryInjectionForm } from '@/components/memory/MemoryInjectionForm';
import { PastInjectionsList } from '@/components/memory/PastInjectionsList';
import { motion } from 'framer-motion';

export const MemoryPage = () => {
  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-orbitron font-bold text-glow mb-1">
          Memory Injection
        </h1>
        <p className="text-muted-foreground font-exo">
          Add important context for your AI agents to remember and use in future interactions
        </p>
      </motion.div>

      <div className="space-y-6">
        <MemoryInjectionForm />
        <PastInjectionsList />
      </div>
    </div>
  );
};
