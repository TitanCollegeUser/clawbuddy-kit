import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useAiQuestions,
  useAnswerQuestion,
  useApproveQuestion,
  useDismissQuestion,
  AiQuestion,
} from '@/hooks/useAiQuestions';
import { AiAssistantAvatar } from '@/components/ai-assistant/AiAssistantAvatar';
import { format } from 'date-fns';
import { 
  MessageCircleQuestion, 
  Send, 
  X, 
  Link as LinkIcon, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Shield,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const priorityColors: Record<string, string> = {
  low: 'border-emerald-500/30 bg-emerald-500/10',
  normal: 'border-primary/30 bg-primary/10',
  high: 'border-amber-500/30 bg-amber-500/10',
  urgent: 'border-red-500/30 bg-red-500/10',
};

const priorityBadgeColors: Record<string, string> = {
  low: 'bg-emerald-500/20 text-emerald-400',
  normal: 'bg-primary/20 text-primary',
  high: 'bg-amber-500/20 text-amber-400',
  urgent: 'bg-red-500/20 text-red-400',
};

const QuestionCard = ({ question }: { question: AiQuestion }) => {
  const [answer, setAnswer] = useState('');
  const [note, setNote] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const answerQuestion = useAnswerQuestion();
  const approveQuestion = useApproveQuestion();
  const dismissQuestion = useDismissQuestion();

  const handleSubmitAnswer = () => {
    if (!answer.trim()) return;
    answerQuestion.mutate(
      { id: question.id, answer: answer.trim() },
      {
        onSuccess: () => {
          setAnswer('');
          setIsAnswering(false);
        },
      }
    );
  };

  const handleApproval = (approved: boolean) => {
    approveQuestion.mutate(
      { id: question.id, approved, note: note.trim() || undefined },
      {
        onSuccess: () => {
          setNote('');
          setShowNote(false);
        },
      }
    );
  };

  const isPending = question.status === 'pending';
  const isApproval = question.question_type === 'approval';

  // For answered approval questions, determine if approved or rejected
  const wasApproved = question.status === 'answered' && isApproval && question.approval_response === true;
  const wasRejected = question.status === 'answered' && isApproval && question.approval_response === false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border p-4 transition-all',
        isApproval && isPending ? 'border-amber-500/40 bg-amber-500/5' : priorityColors[question.priority]
      )}
    >
      <div className="flex items-start gap-3">
        <AiAssistantAvatar size="sm" isOnline />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">
              {question.agent_emoji || '⚡'} {question.agent_name || 'AI'}
            </span>
            <Badge className={priorityBadgeColors[question.priority]}>{question.priority}</Badge>
            {isApproval && (
              <Badge className="bg-amber-500/20 text-amber-400 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Approval
              </Badge>
            )}
            {question.status !== 'pending' && (
              <Badge variant="outline" className={cn(
                'capitalize',
                wasApproved && 'border-emerald-500/50 text-emerald-400',
                wasRejected && 'border-red-500/50 text-red-400'
              )}>
                {wasApproved ? 'Approved' : wasRejected ? 'Rejected' : question.status}
              </Badge>
            )}
          </div>
          <p className="text-foreground mt-2">{question.question}</p>
          {question.context && (
            <p className="text-sm text-muted-foreground mt-2 italic border-l-2 border-muted pl-3">
              {question.context}
            </p>
          )}
          {question.related_task && (
            <Link
              to="/board"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
            >
              <LinkIcon className="h-3 w-3" />
              {question.related_task.title}
            </Link>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {format(new Date(question.created_at), 'MMM d, yyyy h:mm a')}
          </p>

          {/* Answer section for answered questions */}
          {question.status === 'answered' && (
            <div className={cn(
              'mt-4 p-3 rounded-lg border',
              wasApproved && 'bg-emerald-500/10 border-emerald-500/30',
              wasRejected && 'bg-red-500/10 border-red-500/30',
              !isApproval && 'bg-muted/20 border-border/30'
            )}>
              <div className="flex items-center gap-2 mb-1">
                {wasApproved && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                {wasRejected && <XCircle className="h-4 w-4 text-red-400" />}
                <p className="text-sm text-muted-foreground">
                  {isApproval ? (wasApproved ? 'You approved:' : 'You rejected:') : 'Your answer:'}
                </p>
              </div>
              {question.answer && <p className="text-foreground">{question.answer}</p>}
              {isApproval && !question.answer && (
                <p className="text-foreground italic">No additional note</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                {question.answered_at && format(new Date(question.answered_at), 'MMM d, h:mm a')}
              </p>
            </div>
          )}

          {/* Pending question actions */}
          {isPending && (
            <div className="mt-4">
              {isApproval ? (
                // Approval UI with Yes/No buttons
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApproval(true)}
                      disabled={approveQuestion.isPending}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Yes, Approve
                    </Button>
                    <Button
                      onClick={() => handleApproval(false)}
                      disabled={approveQuestion.isPending}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      No, Reject
                    </Button>
                  </div>
                  
                  <Collapsible open={showNote} onOpenChange={setShowNote}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                        <ChevronDown className={cn(
                          'h-4 w-4 mr-1 transition-transform',
                          showNote && 'rotate-180'
                        )} />
                        Add a note (optional)
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Textarea
                        placeholder="Add a note to explain your decision..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="mt-2 glass min-h-[60px]"
                      />
                    </CollapsibleContent>
                  </Collapsible>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissQuestion.mutate(question.id)}
                    disabled={dismissQuestion.isPending}
                    className="text-muted-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                </div>
              ) : (
                // Regular question UI with text input
                <>
                  {isAnswering ? (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Type your answer..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        className="glass min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSubmitAnswer}
                          disabled={!answer.trim() || answerQuestion.isPending}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          {answerQuestion.isPending ? 'Sending...' : 'Send Answer'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsAnswering(false);
                            setAnswer('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setIsAnswering(true)}>
                        Answer
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissQuestion.mutate(question.id)}
                        disabled={dismissQuestion.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const QuestionsPage = () => {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const { data: questions = [], isLoading } = useAiQuestions(statusFilter);

  const pendingCount = questions.filter((q) => q.status === 'pending').length;
  const approvalCount = questions.filter((q) => q.status === 'pending' && q.question_type === 'approval').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MessageCircleQuestion className="h-8 w-8 text-primary" />
            <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full" />
          </div>
          <div>
            <h1 className="text-3xl font-orbitron font-bold text-foreground">Questions</h1>
            <p className="text-muted-foreground mt-1">Answer questions and approval requests from your AI agents</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-4 flex-wrap"
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] glass">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All questions</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="answered">Answered</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        {statusFilter === 'pending' && pendingCount > 0 && (
          <Badge className="bg-primary/20 text-primary">
            <AlertCircle className="h-3 w-3 mr-1" />
            {pendingCount} awaiting response
          </Badge>
        )}
        {statusFilter === 'pending' && approvalCount > 0 && (
          <Badge className="bg-amber-500/20 text-amber-400">
            <Shield className="h-3 w-3 mr-1" />
            {approvalCount} need approval
          </Badge>
        )}
      </motion.div>

      {/* Questions List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl bg-card/30" />
          ))}
        </div>
      ) : questions.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-12 text-center">
            <MessageCircleQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No questions found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {statusFilter === 'pending'
                ? `Your AI agents haven't asked any questions yet`
                : 'Try changing the filter to see more'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionCard key={question.id} question={question} />
          ))}
        </div>
      )}
    </div>
  );
};
