import { LayoutDashboard, Kanban, MessageCircleQuestion, ScrollText, ChevronLeft, ChevronRight, Puzzle, Target, Brain, Users, FileText, Settings, Building2, FlaskConical, Radar, CalendarClock, Briefcase } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { usePendingQuestionsCount } from '@/hooks/useAiQuestions';
import { useUnreadLogCount } from '@/hooks/useAiLog';

import { useUnreadReportsCount } from '@/hooks/useReports';
import { useFailedAutomationsCount } from '@/hooks/useAutomations';
import { useNeedsInputCount } from '@/hooks/useNeedsInputCount';
import { useAiSettings } from '@/contexts/AiSettingsContext';
import { ClawBuddyLogo } from '@/components/branding/ClawBuddyLogo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { motion } from 'framer-motion';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Board', url: '/board', icon: Kanban, showNeedsInputBadge: true },
  { title: 'Ops Center', url: '/ops-center', icon: Radar },
  { title: 'AI Employees', url: '/ai-employees', icon: Briefcase },
  { title: 'Automations', url: '/automations', icon: CalendarClock, showAutomationBadge: true },
  { title: 'Goals Lab', url: '/goals', icon: Target },
  { title: 'Identity', url: '/identity', icon: Brain },
  
  { title: 'AI Log', url: '/log', icon: ScrollText, showLogBadge: true },
  { title: 'Questions', url: '/questions', icon: MessageCircleQuestion, showBadge: true },
  { title: 'Skill Factory', url: '/skills/factory', icon: FlaskConical },
  { title: 'Agent Teams', url: '/agent-teams', icon: Users },
  { title: 'Workspace', url: '/workspace', icon: Building2 },
  { title: 'Reports', url: '/reports', icon: FileText, showReportBadge: true },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { data: pendingCount = 0 } = usePendingQuestionsCount();
  const { data: unreadLogCount = 0 } = useUnreadLogCount();

  const { data: unreadReportsCount = 0 } = useUnreadReportsCount();
  const { data: failedAutomationsCount = 0 } = useFailedAutomationsCount();
  const { data: needsInputCount = 0 } = useNeedsInputCount();
  const { settings } = useAiSettings();

  return (
    <aside
      className={cn(
        'h-screen flex flex-col transition-all duration-300 relative border-r border-border/30',
        'bg-gradient-to-b from-card/80 to-background/90 backdrop-blur-xl',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      
      {/* Holographic accent border with shimmer */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/50 to-transparent overflow-hidden">
        <motion.div 
          className="absolute inset-0 w-full"
          style={{
            background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.4), transparent)',
          }}
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full bg-card border border-border/50 hover:bg-primary/20 hover:border-primary/50 transition-all hover:shadow-[0_0_10px_hsl(var(--primary)/0.4)]"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>

      {/* Logo / Title */}
      <div className={cn('p-4 border-b border-border/30', collapsed && 'flex justify-center')}>
        <ClawBuddyLogo size={collapsed ? 'sm' : 'md'} showText={!collapsed} animated={true} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground transition-all duration-300',
              'hover:bg-primary/10 hover:text-foreground hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)]',
              'group relative overflow-hidden',
              collapsed && 'justify-center px-2'
            )}
            activeClassName="bg-primary/20 text-primary border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
          >
            {/* Active indicator line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-primary rounded-r opacity-0 group-[.bg-primary\/20]:opacity-100 transition-opacity" />
            
            <div className="relative">
              <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
              {item.showBadge && pendingCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]"
                >
                  {pendingCount > 9 ? '9+' : pendingCount}
                </motion.span>
              )}
              {item.showLogBadge && unreadLogCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-amber-500 text-[10px] font-bold flex items-center justify-center text-white shadow-lg"
                >
                  {unreadLogCount > 9 ? '9+' : unreadLogCount}
                </motion.span>
              )}
              {item.showReportBadge && unreadReportsCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-emerald-500 text-[10px] font-bold flex items-center justify-center text-white shadow-lg"
                >
                  {unreadReportsCount > 9 ? '9+' : unreadReportsCount}
                </motion.span>
              )}
              {item.showAutomationBadge && failedAutomationsCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold flex items-center justify-center text-destructive-foreground shadow-lg"
                >
                  {failedAutomationsCount > 9 ? '9+' : failedAutomationsCount}
                </motion.span>
              )}
              {item.showNeedsInputBadge && needsInputCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-purple-500 text-[10px] font-bold flex items-center justify-center text-white shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                >
                  {needsInputCount > 9 ? '9+' : needsInputCount}
                </motion.span>
              )}
            </div>
            {!collapsed && (
              <span className="font-medium text-sm">{item.title}</span>
            )}
            
            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border rounded-md text-sm font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {item.title}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
};
