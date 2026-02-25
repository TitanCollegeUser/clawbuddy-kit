import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export const WelcomeSection = () => {
  const { user } = useAuth();
  
  const userName = user?.user_metadata?.name?.split(' ')[0] || 'there';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-2"
    >
      <h1 className="text-2xl sm:text-3xl font-bold font-exo text-foreground">
        Welcome back, <span className="text-foreground text-glow-white">{userName}</span>!
      </h1>
      <p className="text-sm text-muted-foreground mt-1">
        Here's what's happening with your tasks today
      </p>
    </motion.div>
  );
};
