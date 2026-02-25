import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
import { RayStatusBadge } from '@/components/dashboard/RayStatusBadge';

export const Header = () => {
  const { user, signOut } = useAuth();

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.08] px-6 py-4 flex items-center justify-end sticky top-0 z-50 relative overflow-hidden"
    >
      {/* Subtle horizontal shimmer */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Bottom border glow pulse */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent)',
        }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Ray Status + User section */}
      <div className="flex items-center gap-6">
        {/* Ray Connection Status */}
        <RayStatusBadge />
        
        {/* Divider */}
        <div className="h-8 w-px bg-white/10 hidden sm:block" />
        
        {/* User */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/30">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/20 text-primary font-orbitron text-sm">
              {user?.email ? getInitials(user.email) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              {user?.user_metadata?.name || user?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={signOut}
          className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </motion.header>
  );
};
