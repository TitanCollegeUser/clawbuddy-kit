import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Plus, History, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoalInputForm } from '@/components/goals/GoalInputForm';
import { GoalAnalysis } from '@/components/goals/GoalAnalysis';
import { ActionItemsList } from '@/components/goals/ActionItemsList';
import { PastGoalsGrid } from '@/components/goals/PastGoalsGrid';
import {
  useGoals,
  useAnalyzeGoal,
  useCreateGoal,
  useCreateGoalTasks,
  GoalAnalysis as GoalAnalysisType,
  ActionItem,
} from '@/hooks/useGoals';

export const GoalsLabPage = () => {
  const [showNewGoal, setShowNewGoal] = useState(true);
  const [currentAnalysis, setCurrentAnalysis] = useState<GoalAnalysisType | null>(null);
  const [currentGoalData, setCurrentGoalData] = useState<{
    goal: string;
    goal_type: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    user_notes?: string;
  } | null>(null);
  const [savedGoalId, setSavedGoalId] = useState<string | null>(null);

  const { data: goals = [], isLoading: goalsLoading } = useGoals();
  const analyzeGoal = useAnalyzeGoal();
  const createGoal = useCreateGoal();
  const createTasks = useCreateGoalTasks();

  const handleAnalyze = async (data: {
    goal: string;
    goal_type: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    user_notes?: string;
  }) => {
    setCurrentGoalData(data);
    setSavedGoalId(null);
    
    const analysis = await analyzeGoal.mutateAsync(data);
    setCurrentAnalysis(analysis);

    // Auto-save the goal
    const savedGoal = await createGoal.mutateAsync({
      title: analysis.title,
      description: data.goal,
      goal_type: data.goal_type,
      assumptions: analysis.assumptions,
      action_items: analysis.action_items,
      user_notes: data.user_notes,
    }) as unknown as { id: string };
    setSavedGoalId(savedGoal.id);
  };

  const handleToggleItem = (index: number) => {
    if (!currentAnalysis) return;
    
    const newItems = [...currentAnalysis.action_items];
    newItems[index] = {
      ...newItems[index],
      selected: newItems[index].selected === false ? true : false,
    };
    setCurrentAnalysis({
      ...currentAnalysis,
      action_items: newItems,
    });
  };

  const handleCreateTasks = async () => {
    if (!currentAnalysis || !currentGoalData || !savedGoalId) return;

    await createTasks.mutateAsync({
      goalId: savedGoalId,
      title: currentAnalysis.title,
      goalType: currentGoalData.goal_type,
      actionItems: currentAnalysis.action_items,
      userNotes: currentGoalData.user_notes,
    });

    // Reset for new goal
    setCurrentAnalysis(null);
    setCurrentGoalData(null);
    setSavedGoalId(null);
  };

  const handleNewGoal = () => {
    setCurrentAnalysis(null);
    setCurrentGoalData(null);
    setSavedGoalId(null);
    setShowNewGoal(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-orbitron font-bold text-foreground flex items-center gap-3">
            <Target className="h-8 w-8 text-primary" />
            Goals Lab
          </h1>
          <p className="text-muted-foreground mt-1">
            Reverse-engineer your goals into actionable tasks
          </p>
        </div>
        {currentAnalysis && (
          <Button onClick={handleNewGoal} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Input / Analysis */}
        <div className="space-y-6">
          {!currentAnalysis ? (
            <GoalInputForm
              onAnalyze={handleAnalyze}
              isAnalyzing={analyzeGoal.isPending}
            />
          ) : (
            <GoalAnalysis
              title={currentAnalysis.title}
              assumptions={currentAnalysis.assumptions}
              metrics={currentAnalysis.metrics}
            />
          )}
        </div>

        {/* Right Column: Action Items */}
        <div>
          {currentAnalysis && (
            <ActionItemsList
              items={currentAnalysis.action_items}
              onToggleItem={handleToggleItem}
              onSendToAi={handleCreateTasks}
              isSending={createTasks.isPending}
            />
          )}

          {!currentAnalysis && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex items-center justify-center p-8 rounded-xl border border-dashed border-border/50 bg-muted/20"
            >
              <div className="text-center text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">AI Analysis Results</p>
                <p className="text-sm">Enter a goal and click Analyze to see action items</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Past Goals Section */}
      <div className="pt-8 border-t border-border/50">
        <div className="flex items-center gap-2 mb-6">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Past Goals</h2>
        </div>
        {goalsLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : (
          <PastGoalsGrid goals={goals} />
        )}
      </div>
    </div>
  );
};
