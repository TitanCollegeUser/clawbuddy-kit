import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { CCAgent, AgentStatus } from '@/types/command-center';
import { useCommandCenterAgents } from '@/hooks/useCommandCenterAgents';
import { useCommandCenterSkills } from '@/hooks/useCommandCenterSkills';
import { Badge } from '@/components/ui/badge';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const statusDotClass: Record<AgentStatus, string> = {
  online: 'status-dot-online cc-pulse-glow',
  thinking: 'status-dot-thinking cc-breathe',
  error: 'status-dot-error',
  offline: 'status-dot-offline',
};

const getScoreClass = (s: number) => {
  if (s >= 90) return 'score-a';
  if (s >= 75) return 'score-b';
  if (s >= 60) return 'score-c';
  return 'score-f';
};

const getGrade = (s: number) => {
  if (s >= 90) return 'A';
  if (s >= 75) return 'B';
  if (s >= 60) return 'C';
  return 'F';
};

const AgentProfiles = () => {
  const { agents } = useCommandCenterAgents();
  const { skills: agentSkills } = useCommandCenterSkills();

  const [selectedAgent, setSelectedAgent] = useState<CCAgent | null>(null);

  // Keep selected agent in sync
  useEffect(() => {
    if (agents.length > 0) {
      if (!selectedAgent) {
        setSelectedAgent(agents[0]);
      } else {
        const current = agents.find((a) => a.id === selectedAgent.id);
        if (current) setSelectedAgent(current);
        else setSelectedAgent(agents[0]);
      }
    }
  }, [agents]);

  const categories = [...new Set(agentSkills.map((s) => s.category))];
  const agent = selectedAgent ?? agents[0];

  if (!agent) {
    return (
      <div className="glass-card-futuristic p-8 text-center text-muted-foreground">
        No agents registered yet. Connect an AI agent to see profiles here.
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Agent Selector */}
      <motion.div variants={item} className="flex gap-3 overflow-x-auto pb-2">
        {agents.map((a) => (
          <motion.button
            key={a.id}
            onClick={() => setSelectedAgent(a)}
            whileHover={{ y: -3 }}
            className={`glass-card-futuristic px-4 py-3 flex items-center gap-3 shrink-0 cursor-pointer ${
              agent.id === a.id ? 'border-primary/40 shadow-[0_0_16px_hsl(160,84%,39%,0.2)]' : ''
            }`}
            style={agent.id === a.id ? { borderColor: 'hsl(160, 84%, 39%, 0.4)' } : {}}
          >
            <span className="text-xl">{a.emoji}</span>
            <div className="text-left">
              <div className="text-sm font-semibold">{a.name}</div>
              <div className="text-xs text-muted-foreground">{a.role}</div>
            </div>
            <div className={statusDotClass[a.status]} />
          </motion.button>
        ))}
      </motion.div>

      {/* Agent Identity Card */}
      <motion.div variants={item} className="glass-card-futuristic p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 accent-bar-emerald" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(160,84%,39%) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <motion.span className="text-6xl block" whileHover={{ scale: 1.1, rotate: 5 }} transition={{ type: 'spring' }}>
                {agent.emoji}
              </motion.span>
              <div className={`absolute -bottom-1 -right-1 ${statusDotClass[agent.status]}`} />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{agent.name}</h2>
              <p className="text-muted-foreground">{agent.role}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Model: <span className="text-foreground">{agent.model}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${getScoreClass(agent.alignmentScore)} border-current text-sm px-3 py-1`}>
              {agent.alignmentScore}% ({getGrade(agent.alignmentScore)})
            </Badge>
          </div>
        </div>

        <div className="relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-8 pt-6 border-t border-border/50">
          {[
            { label: 'Skills', value: agentSkills.length },
            { label: 'Status', value: agent.status },
            { label: 'Heartbeat', value: agent.freshness === 'fresh' ? '✓ Live' : agent.freshness === 'stale' ? '⚠ Stale' : '✕ Dead' },
            { label: 'Last Active', value: agent.lastActive },
            { label: 'Status Message', value: agent.statusMessage?.slice(0, 20) || 'N/A' },
            { label: 'Joined', value: agent.joinedDate || 'N/A' },
          ].map((stat) => (
            <div key={stat.label} className="text-center stat-hover cursor-default">
              <div className="text-lg font-bold font-mono stat-number transition-colors duration-300">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Skills Inventory */}
      <motion.div variants={item} className="glass-card-futuristic p-6">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
          Skills Inventory ({agentSkills.length} skills)
        </h3>
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">No skills registered yet.</p>
        )}
        {categories.map((category) => (
          <div key={category} className="mb-6 last:mb-0">
            <h4 className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-3">{category}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {agentSkills
                .filter((s) => s.category === category)
                .map((skill) => (
                  <motion.div
                    key={skill.id}
                    whileHover={{ y: -2 }}
                    className="glass-card-futuristic p-4 flex items-center gap-3 group cursor-default"
                  >
                    <span className="text-xl icon-hover-scale">{skill.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium font-mono truncate">{skill.name}</div>
                      <div className="text-xs text-muted-foreground">{skill.operations} operations</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-ops-emerald border-ops-emerald/30 shrink-0">
                      Ready
                    </Badge>
                  </motion.div>
                ))}
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default AgentProfiles;
