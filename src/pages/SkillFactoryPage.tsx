import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SkillWizard } from '@/components/skills/SkillWizard';
import { useSkill } from '@/hooks/useSkills';
import { useSkillOperations } from '@/hooks/useSkillOperations';
import { useAgentNames } from '@/contexts/AgentNamesContext';

export const SkillFactoryPage = () => {
  const { agentNames } = useAgentNames();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  
  const { data: existingSkill, isLoading: skillLoading } = useSkill(id);
  const { data: existingOperations = [], isLoading: operationsLoading } = useSkillOperations(id);

  const isLoading = isEditing && (skillLoading || operationsLoading);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/skills')}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
            <Puzzle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-orbitron font-bold tracking-tight">
              {isEditing ? 'Edit Skill' : 'Create Skill'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing 
                ? 'Update your API integration definition'
                : `Define a new API integration for ${agentNames.primaryName}`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Wizard */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SkillWizard 
            existingSkill={existingSkill || undefined}
            existingOperations={existingOperations}
            onComplete={() => navigate('/skills')}
            onCancel={() => navigate('/skills')}
          />
        </motion.div>
      )}
    </div>
  );
};
