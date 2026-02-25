import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Puzzle, Search, Filter, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SkillCard } from '@/components/skills/SkillCard';
import { ActiveSkillsSection } from '@/components/skills/ActiveSkillsSection';
import { useSkills, useDeleteSkill, type Skill, type SkillStatus } from '@/hooks/useSkills';
import { useActiveSkillsWithOperations } from '@/hooks/useActiveSkillsWithOperations';
import { useNavigate } from 'react-router-dom';

export const SkillsPage = () => {
  const navigate = useNavigate();
  const { data: skills = [], isLoading } = useSkills();
  const { data: activeData } = useActiveSkillsWithOperations();
  const deleteSkill = useDeleteSkill();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SkillStatus | 'all'>('all');
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);

  // Separate active (accepted) skills from factory (in-progress) skills
  const activeSkills = activeData?.skills || [];
  const activeSkillIds = new Set(activeSkills.map(s => s.id));
  
  // Factory skills = all skills except accepted ones, with search/filter applied
  const factorySkills = skills.filter((skill) => {
    // Exclude accepted skills (they're shown in Active section)
    if (activeSkillIds.has(skill.id)) return false;
    
    const matchesSearch = 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || skill.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (skill: Skill) => {
    navigate(`/skills/edit/${skill.id}`);
  };

  const handleDelete = (skill: Skill) => {
    setSkillToDelete(skill);
  };

  const confirmDelete = async () => {
    if (skillToDelete) {
      await deleteSkill.mutateAsync(skillToDelete.id);
      setSkillToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/30">
            <Puzzle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-orbitron font-bold tracking-tight">Skills</h1>
            <p className="text-sm text-muted-foreground">
              API integrations for your AI agents to interact with external services
            </p>
          </div>
        </div>
        
        <Button 
          onClick={() => navigate('/skills/new')}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Skill
        </Button>
      </div>

      {/* Active Skills Section */}
      <ActiveSkillsSection
        skills={activeSkills}
        operationsCounts={activeData?.operationsCounts || {}}
        onEditSkill={handleEdit}
      />

      {/* Skill Factory Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
            <Wrench className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Skill Factory</h2>
            <p className="text-xs text-muted-foreground">
              Skills in progress
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SkillStatus | 'all')}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Factory Skills Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-lg bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : factorySkills.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Puzzle className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-1">No skills in progress</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'All skills have been reviewed'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <Button onClick={() => navigate('/skills/new')} className="gap-2" size="sm">
                <Plus className="h-4 w-4" />
                Create New Skill
              </Button>
            )}
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {factorySkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  aiName="AI"
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!skillToDelete} onOpenChange={() => setSkillToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Skill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{skillToDelete?.title}"? This will also delete all operations associated with this skill. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
