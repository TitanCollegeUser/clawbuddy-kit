import { Heart, Fingerprint, User, Brain, Settings, Wrench, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { FileDefinition, IdentityFile } from '@/hooks/useIdentityFiles';
import { formatDistanceToNow } from 'date-fns';

const iconMap: Record<string, React.ElementType> = {
  Heart, Fingerprint, User, Brain, Cog: Settings, Wrench, Activity,
};

interface FileCardProps {
  definition: FileDefinition;
  file?: IdentityFile;
  onClick: () => void;
  agentName?: string;
}

export const FileCard = ({ definition, file, onClick, agentName }: FileCardProps) => {
  const Icon = iconMap[definition.icon] || Brain;
  const hasContent = file && file.content.trim().length > 0;
  const lastEditor = file?.updated_by === 'ray' ? (agentName || 'AI') : 'You';

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="cursor-pointer glass hover:border-primary/40 hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] transition-all duration-300 h-full"
        onClick={onClick}
      >
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-orbitron font-semibold text-foreground">{definition.name}</p>
              </div>
            </div>
            <Badge
              variant={definition.editable === 'caution' ? 'destructive' : 'secondary'}
              className="text-[10px] px-1.5 py-0"
            >
              {definition.editable === 'caution' ? '⚠️ Caution' : 'Editable'}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">{definition.description}</p>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
            {hasContent ? (
              <>
                <span>Last edit by <span className="text-foreground font-medium">{lastEditor}</span></span>
                <span>{formatDistanceToNow(new Date(file.updated_at), { addSuffix: true })}</span>
              </>
            ) : (
              <span className="text-muted-foreground/60 italic">No content yet</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
