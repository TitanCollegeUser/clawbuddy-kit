import { Clock, CheckCircle, HelpCircle, XCircle, Loader2, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AgentReviewStatus } from '@/hooks/useSkills';

interface AgentFeedbackPanelProps {
  status: AgentReviewStatus;
  feedback: string | null;
  onResubmit?: () => void;
  isSubmitting?: boolean;
  className?: string;
  aiName: string;
}

const getStatusConfig = (aiName: string): Record<AgentReviewStatus, {
  icon: typeof Clock;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> => ({
  pending: {
    icon: Clock,
    label: 'Pending Review',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
  processing: {
    icon: Loader2,
    label: `${aiName} Processing`,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  accepted: {
    icon: CheckCircle,
    label: 'Ready to Use',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  needs_info: {
    icon: HelpCircle,
    label: 'Needs More Info',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
});

export const AgentFeedbackPanel = ({
  status,
  feedback,
  onResubmit,
  isSubmitting,
  className,
  aiName,
}: AgentFeedbackPanelProps) => {
  const statusConfig = getStatusConfig(aiName);
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className={cn(
      'rounded-lg border p-4 space-y-3',
      config.bgColor,
      config.borderColor,
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('h-5 w-5', config.color, status === 'processing' && 'animate-spin')} />
          <span className={cn('font-medium', config.color)}>{config.label}</span>
        </div>
        <Badge variant="outline" className={cn('border-current', config.color)}>
          {aiName} Review
        </Badge>
      </div>

      {/* Feedback Content */}
      {feedback && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-foreground whitespace-pre-wrap">{feedback}</p>
          </div>
        </div>
      )}

      {/* No feedback message */}
      {!feedback && status === 'pending' && (
        <p className="text-sm text-muted-foreground">
          Waiting for {aiName} to review this skill configuration...
        </p>
      )}

      {!feedback && status === 'processing' && (
        <p className="text-sm text-muted-foreground">
          {aiName} is analyzing the configuration and testing connectivity...
        </p>
      )}

      {/* Actions */}
      {(status === 'needs_info' || status === 'rejected') && onResubmit && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onResubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              `Update & Resubmit to ${aiName}`
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export const AgentStatusBadge = ({ status, aiName }: { status: AgentReviewStatus; aiName: string }) => {
  const statusConfig = getStatusConfig(aiName);
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn('gap-1', config.color, config.borderColor)}
    >
      <StatusIcon className={cn('h-3 w-3', status === 'processing' && 'animate-spin')} />
      {config.label}
    </Badge>
  );
};
