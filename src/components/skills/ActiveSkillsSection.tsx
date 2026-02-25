import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ActiveSkillCard } from './ActiveSkillCard';
import { useAgentNames } from '@/contexts/AgentNamesContext';
import type { Skill } from '@/hooks/useSkills';

interface OperationsCountMap {
  [skillId: string]: number;
}

interface ActiveSkillsSectionProps {
  skills: Skill[];
  operationsCounts?: OperationsCountMap;
  onEditSkill: (skill: Skill) => void;
}

export const ActiveSkillsSection = ({ skills, operationsCounts = {}, onEditSkill }: ActiveSkillsSectionProps) => {
  const { agentNames } = useAgentNames();

  if (skills.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-green-500/20 bg-gradient-to-r from-green-500/10 to-emerald-500/5 p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-green-500/20 flex items-center justify-center border border-green-500/30">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Active Skills</h2>
              <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
                {skills.length}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {`What ${agentNames.primaryName} can use`}
            </p>
          </div>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {skills.map((skill, index) => (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ActiveSkillCard
                skill={skill}
                operationsCount={operationsCounts[skill.id] || 0}
                onEdit={onEditSkill}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
