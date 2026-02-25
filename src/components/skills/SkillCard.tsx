import { motion } from 'framer-motion';
import { MoreHorizontal, Edit, Trash2, ExternalLink, Clock, CheckCircle, Archive, HelpCircle, Loader2, XCircle, Globe, Mail, Code, Webhook, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Skill, AgentReviewStatus, ProtocolType } from '@/hooks/useSkills';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SkillCardProps {
  skill: Skill;
  onEdit: (skill: Skill) => void;
  onDelete: (skill: Skill) => void;
  aiName: string;
}

const statusConfig = {
  draft: {
    label: 'Draft',
    icon: Clock,
    className: 'bg-muted text-muted-foreground',
  },
  ready: {
    label: 'Ready',
    icon: CheckCircle,
    className: 'bg-primary/20 text-primary',
  },
  archived: {
    label: 'Archived',
    icon: Archive,
    className: 'bg-destructive/20 text-destructive',
  },
};

const agentStatusConfig: Record<AgentReviewStatus, { label: string; icon: typeof Clock; className: string }> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    className: 'bg-yellow-500/20 text-yellow-500',
  },
  processing: {
    label: 'Processing',
    icon: Loader2,
    className: 'bg-blue-500/20 text-blue-500',
  },
  accepted: {
    label: 'Active',
    icon: CheckCircle,
    className: 'bg-green-500/20 text-green-500',
  },
  needs_info: {
    label: 'Needs Info',
    icon: HelpCircle,
    className: 'bg-orange-500/20 text-orange-500',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'bg-red-500/20 text-red-500',
  },
};

const protocolIcons: Record<ProtocolType, typeof Globe> = {
  rest: Globe,
  smtp: Mail,
  graphql: Code,
  webhook: Webhook,
  custom: Settings,
};

export const SkillCard = ({ skill, onEdit, onDelete, aiName }: SkillCardProps) => {
  const status = statusConfig[skill.status];
  const StatusIcon = status.icon;
  const agentStatus = agentStatusConfig[skill.bujji_status || 'pending'];
  const AgentStatusIcon = agentStatus.icon;
  const ProtocolIcon = protocolIcons[skill.protocol_type || 'rest'];

  // Get display URL based on protocol type
  const getDisplayUrl = () => {
    try {
      if (skill.protocol_type === 'smtp') {
        const config = skill.connection_config as { host?: string } | null;
        return config?.host || 'SMTP Server';
      }
      if (skill.api_base_url) {
        return new URL(skill.api_base_url).hostname;
      }
      return 'Not configured';
    } catch {
      return skill.api_base_url || 'Not configured';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/50 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] transition-all duration-300">
        {/* Gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg font-semibold truncate">
                  {skill.title}
                </CardTitle>
                <Badge className={status.className}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {status.label}
                </Badge>
                {skill.bujji_status && skill.bujji_status !== 'pending' && (
                  <Badge className={agentStatus.className}>
                    <AgentStatusIcon className={cn("h-3 w-3 mr-1", skill.bujji_status === 'processing' && 'animate-spin')} />
                    {aiName}: {agentStatus.label}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded">
                  {skill.name}
                </code>
                <Badge variant="outline" className="text-xs gap-1">
                  <ProtocolIcon className="h-3 w-3" />
                  {(skill.protocol_type || 'rest').toUpperCase()}
                </Badge>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(skill)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {skill.api_base_url && (
                  <DropdownMenuItem asChild>
                    <a href={skill.api_base_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open API
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(skill)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {skill.description && (
            <CardDescription className="line-clamp-2">
              {skill.description}
            </CardDescription>
          )}

          {/* Feedback Preview */}
          {skill.bujji_feedback && (skill.bujji_status === 'needs_info' || skill.bujji_status === 'rejected') && (
            <div className="p-2 rounded-md bg-orange-500/10 border border-orange-500/20 text-xs text-orange-500">
              <span className="font-medium">{aiName} says:</span> {skill.bujji_feedback.slice(0, 100)}
              {skill.bujji_feedback.length > 100 && '...'}
            </div>
          )}

          {skill.use_cases && skill.use_cases.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {skill.use_cases.slice(0, 3).map((useCase, index) => (
                <Badge key={index} variant="outline" className="text-xs font-normal">
                  {useCase}
                </Badge>
              ))}
              {skill.use_cases.length > 3 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{skill.use_cases.length - 3} more
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
            <span className="flex items-center gap-1">
              <ProtocolIcon className="h-3 w-3" />
              {getDisplayUrl()}
            </span>
            <span>
              {formatDistanceToNow(new Date(skill.created_at), { addSuffix: true })}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
