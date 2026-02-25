import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Sparkles, Calendar, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface GoalInputFormProps {
  onAnalyze: (data: {
    goal: string;
    goal_type: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    user_notes?: string;
  }) => void;
  isAnalyzing: boolean;
}

const timeframes = [
  { value: 'weekly', label: 'Weekly', icon: '📅' },
  { value: 'monthly', label: 'Monthly', icon: '🗓️' },
  { value: 'quarterly', label: 'Quarterly', icon: '📊' },
  { value: 'yearly', label: 'Yearly', icon: '🎯' },
] as const;

export const GoalInputForm = ({ onAnalyze, isAnalyzing }: GoalInputFormProps) => {
  const [goal, setGoal] = useState('');
  const [goalType, setGoalType] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [userNotes, setUserNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;
    
    onAnalyze({
      goal: goal.trim(),
      goal_type: goalType,
      user_notes: userNotes.trim() || undefined,
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm"
      onSubmit={handleSubmit}
    >
      {/* Goal Input */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-foreground">
          <Target className="h-4 w-4 text-primary" />
          My goal is to...
        </Label>
        <Textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Grow my agency to $10K per month"
          className="min-h-[100px] bg-background/50 border-border/50 focus:border-primary/50 resize-none text-lg"
          disabled={isAnalyzing}
        />
      </div>

      {/* Timeframe Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          Goal Timeframe
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() => setGoalType(tf.value)}
              disabled={isAnalyzing}
              className={cn(
                'p-3 rounded-lg border transition-all text-sm font-medium',
                'hover:border-primary/50 hover:bg-primary/5',
                goalType === tf.value
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-background/50 border-border/50 text-muted-foreground'
              )}
            >
              <span className="mr-2">{tf.icon}</span>
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* User Notes */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-muted-foreground">
          <StickyNote className="h-4 w-4" />
          Notes for AI (optional)
        </Label>
        <Textarea
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
          placeholder="I currently have 2 clients paying $1.5K each, focusing on web design services..."
          className="min-h-[80px] bg-background/50 border-border/50 focus:border-primary/50 resize-none"
          disabled={isAnalyzing}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        disabled={!goal.trim() || isAnalyzing}
        className="w-full gap-2"
      >
        {isAnalyzing ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="h-5 w-5" />
            </motion.div>
            Analyzing Goal...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Analyze Goal
          </>
        )}
      </Button>
    </motion.form>
  );
};
