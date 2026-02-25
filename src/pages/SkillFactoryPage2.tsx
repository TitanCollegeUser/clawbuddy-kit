import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AgentSkillCard } from '@/components/skills/AgentSkillCard';
import { SkillTypeModal } from '@/components/skills/SkillTypeModal';
import { RunSkillModal } from '@/components/skills/RunSkillModal';
import { useSkillsByAgent, useSkillCounts } from '@/hooks/useSkillsByAgent';
import { useSkillOperationsCounts } from '@/hooks/useSkillOperationsCounts';
import { useAiStatus } from '@/hooks/useAiStatus';
import { Plus, Play, Eye, FlaskConical, Search, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Skill } from '@/hooks/useSkills';

export const SkillFactoryPage2 = () => {
  const navigate = useNavigate();
  const { agents } = useAiStatus();
  const { data: skillCounts = {} } = useSkillCounts();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const { data: skills = [], isLoading } = useSkillsByAgent(selectedAgent);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [runSkill, setRunSkill] = useState<Skill | null>(null);

  const skillIds = skills.map(s => s.id);
  const { data: opsCounts = {} } = useSkillOperationsCounts(skillIds);

  const statusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'draft': return 'bg-muted/50 text-muted-foreground border-border/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'archived': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-muted/50 text-muted-foreground border-border/30';
    }
  };

  const agentTypeBadge = (agentType: string) => {
    if (agentType === 'claude-code') {
      return (
        <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30 gap-1">
          <Search className="h-2.5 w-2.5" /> Claude Code
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30 gap-1">
        <Code className="h-2.5 w-2.5" /> OpenClaw
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FlaskConical className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-['Orbitron'] font-bold text-foreground">Skill Factory</h1>
        </div>
        <Button onClick={() => setShowTypeModal(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Skill
        </Button>
      </div>

      {/* Agent Cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <AgentSkillCard
          name="All"
          emoji="📦"
          skillCount={Object.values(skillCounts).reduce((a, b) => a + b, 0)}
          selected={selectedAgent === null}
          onClick={() => setSelectedAgent(null)}
        />
        {agents.map((agent) => (
          <AgentSkillCard
            key={agent.agent_name}
            name={agent.agent_name}
            emoji={agent.agent_emoji}
            skillCount={skillCounts[agent.agent_name] || 0}
            selected={selectedAgent === agent.agent_name}
            onClick={() => setSelectedAgent(agent.agent_name)}
          />
        ))}
      </div>

      {/* Skills Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading skills...</div>
      ) : skills.length === 0 ? (
        <div className="text-center py-16">
          <FlaskConical className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No skills found{selectedAgent ? ` for ${selectedAgent}` : ''}.</p>
          <Button variant="link" className="text-primary mt-2" onClick={() => setShowTypeModal(true)}>Create one →</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill, i) => {
            const opsCount = opsCounts[skill.id] || 0;
            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-4 border border-border/30 hover:border-primary/30 transition-all cursor-pointer group"
                onClick={() => navigate(`/skills/factory/${skill.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{skill.title || skill.name}</h3>
                    {skill.agent_name && <p className="text-xs text-muted-foreground mt-0.5">{skill.agent_name}</p>}
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${statusColor(skill.status)}`}>
                    {skill.status}
                  </Badge>
                </div>
                {skill.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{skill.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/20">
                  <div className="flex items-center gap-1.5">
                    {agentTypeBadge((skill as any).agent_type || 'openclaw')}
                    {opsCount > 0 && (
                      <Badge variant="outline" className="text-[10px] bg-muted/30 text-muted-foreground border-border/30">
                        {opsCount} ops
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1 text-primary hover:text-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      if ((skill as any).agent_type === 'claude-code') {
                        setRunSkill(skill);
                      } else {
                        navigate(`/skills/factory/${skill.id}`);
                      }
                    }}
                  >
                    {(skill as any).agent_type === 'claude-code' ? <><Play className="h-3 w-3" /> Run</> : <><Eye className="h-3 w-3" /> View</>}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <SkillTypeModal
        open={showTypeModal}
        onOpenChange={setShowTypeModal}
        onSelectOpenClaw={() => { setShowTypeModal(false); navigate('/skills/new'); }}
        onSelectClaudeCode={() => { setShowTypeModal(false); navigate('/skills/factory/new'); }}
      />
      {runSkill && (
        <RunSkillModal open={!!runSkill} onOpenChange={(o) => !o && setRunSkill(null)} skill={runSkill} />
      )}
    </div>
  );
};