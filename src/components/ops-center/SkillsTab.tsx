import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Puzzle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export const SkillsTab = ({ agentName }: { agentName: string }) => {
  const { data: skills, isLoading } = useQuery({
    queryKey: ['ops-skills', agentName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skills')
        .select('id, title, description, status, protocol_type, agent_name')
        .eq('agent_name', agentName)
        .order('title');
      if (error) throw error;
      return data;
    },
    enabled: !!agentName,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  if (!skills?.length) {
    return (
      <div className="glass rounded-xl py-20 text-center">
        <Puzzle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-xl font-orbitron font-medium text-foreground mb-1 uppercase tracking-wider">No skills assigned</h3>
        <p className="text-base text-muted-foreground">
          Assign skills to {agentName} in the Skill Factory to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {skills.map((skill, i) => (
        <motion.div
          key={skill.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="glass-strong rounded-xl p-4 space-y-2 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-base text-foreground">{skill.title}</h4>
            <Badge variant="outline" className="text-xs bg-white/[0.06] border-white/[0.08]">{skill.protocol_type || 'custom'}</Badge>
          </div>
          {skill.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{skill.description}</p>
          )}
        </motion.div>
      ))}
    </div>
  );
};
