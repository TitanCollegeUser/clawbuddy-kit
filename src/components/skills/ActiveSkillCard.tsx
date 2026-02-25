import { motion } from 'framer-motion';
import { Edit, ExternalLink, MoreHorizontal, Globe, Mail, Code, Webhook, Settings, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Skill, ProtocolType } from '@/hooks/useSkills';
import { formatDistanceToNow } from 'date-fns';

interface ActiveSkillCardProps {
  skill: Skill;
  operationsCount?: number;
  onEdit: (skill: Skill) => void;
}

const protocolIcons: Record<ProtocolType, typeof Globe> = {
  rest: Globe,
  smtp: Mail,
  graphql: Code,
  webhook: Webhook,
  custom: Settings,
};

const protocolLabels: Record<ProtocolType, string> = {
  rest: 'REST API',
  smtp: 'Email/SMTP',
  graphql: 'GraphQL',
  webhook: 'Webhook',
  custom: 'Custom',
};

export const ActiveSkillCard = ({ skill, operationsCount = 0, onEdit }: ActiveSkillCardProps) => {
  const ProtocolIcon = protocolIcons[skill.protocol_type || 'rest'];
  const protocolLabel = protocolLabels[skill.protocol_type || 'rest'];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5 hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)] transition-all duration-300">
        {/* Green accent top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500" />
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Protocol Icon */}
              <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0 border border-green-500/30">
                <ProtocolIcon className="h-5 w-5 text-green-500" />
              </div>
              
              {/* Skill Info */}
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate">{skill.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground border-green-500/30">
                    {protocolLabel}
                  </Badge>
                  {operationsCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Layers className="h-3 w-3" />
                      {operationsCount} {operationsCount === 1 ? 'operation' : 'operations'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(skill)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Skill
                </DropdownMenuItem>
                {skill.api_base_url && (
                  <DropdownMenuItem asChild>
                    <a href={skill.api_base_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open API
                    </a>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Footer with timestamp */}
          {skill.reviewed_at && (
            <div className="mt-3 pt-2 border-t border-green-500/20 text-[10px] text-muted-foreground">
              Accepted {formatDistanceToNow(new Date(skill.reviewed_at), { addSuffix: true })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
