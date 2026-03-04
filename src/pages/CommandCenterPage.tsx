import { Monitor, Shield, Users, BarChart3, MessageCircle, GitMerge } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CommandDeck from '@/components/command-center/CommandDeck';
import AgentProfiles from '@/components/command-center/AgentProfiles';
import SessionIntel from '@/components/command-center/SessionIntel';
import Guardrails from '@/components/command-center/Guardrails';
import { AgentCommsTab } from '@/components/command-center/AgentCommsTab';
import { OrchestrationTab } from '@/components/command-center/OrchestrationTab';
import { useCommandCenterAlerts } from '@/hooks/useCommandCenterAlerts';
import { useUnreadCommsCount } from '@/hooks/useAgentComms';
import { motion } from 'framer-motion';

export const CommandCenterPage = () => {
  useCommandCenterAlerts(); // Side-effect: fires toasts on freshness/alignment transitions
  const { data: unreadCommsCount = 0 } = useUnreadCommsCount();

  return (
    <div className="command-center-scope max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <Monitor className="w-7 h-7 text-primary icon-glow" />
          <h1 className="text-3xl font-bold">Command Center</h1>
        </div>
        <p className="text-muted-foreground ml-10">AI Employee Command &amp; Control</p>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="command" className="w-full">
        <TabsList className="glass-card p-1 mb-6 w-full sm:w-auto inline-flex">
          <TabsTrigger value="command" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_10px_hsl(var(--glow-primary))] transition-all duration-300">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Command Deck</span>
            <span className="sm:hidden">Command</span>
          </TabsTrigger>
          <TabsTrigger value="profiles" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_10px_hsl(var(--glow-primary))] transition-all duration-300">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Employee Profiles</span>
            <span className="sm:hidden">Profiles</span>
          </TabsTrigger>
          <TabsTrigger value="comms" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_10px_hsl(var(--glow-primary))] transition-all duration-300 relative">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Agent Comms</span>
            <span className="sm:hidden">Comms</span>
            {unreadCommsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-cyan-500 text-[10px] font-bold flex items-center justify-center text-white">
                {unreadCommsCount > 9 ? '9+' : unreadCommsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="orchestration" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_10px_hsl(var(--glow-primary))] transition-all duration-300">
            <GitMerge className="w-4 h-4" />
            <span className="hidden sm:inline">Orchestration</span>
            <span className="sm:hidden">Orch</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_10px_hsl(var(--glow-primary))] transition-all duration-300">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Work History</span>
            <span className="sm:hidden">History</span>
          </TabsTrigger>
          <TabsTrigger value="guardrails" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_10px_hsl(var(--glow-primary))] transition-all duration-300">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Compliance &amp; Safety</span>
            <span className="sm:hidden">Safety</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="command">
          <CommandDeck />
        </TabsContent>
        <TabsContent value="profiles">
          <AgentProfiles />
        </TabsContent>
        <TabsContent value="comms">
          <AgentCommsTab />
        </TabsContent>
        <TabsContent value="orchestration">
          <OrchestrationTab />
        </TabsContent>
        <TabsContent value="sessions">
          <SessionIntel />
        </TabsContent>
        <TabsContent value="guardrails">
          <Guardrails />
        </TabsContent>
      </Tabs>
    </div>
  );
};
