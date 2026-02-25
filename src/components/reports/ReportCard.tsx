import { FileText, Eye, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import type { Report } from '@/hooks/useReports';

interface ReportCardProps {
  report: Report;
  onView: (report: Report) => void;
  onDelete: (reportId: string) => void;
}

export const ReportCard = ({ report, onView, onDelete }: ReportCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        'group relative overflow-hidden transition-all duration-300',
        'bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm',
        'border-border/50 hover:border-primary/50',
        'hover:shadow-[0_0_30px_hsl(var(--primary)/0.2)]',
        !report.is_read && 'ring-1 ring-primary/30'
      )}>
        {/* Unread indicator */}
        {!report.is_read && (
          <div className="absolute top-3 right-3">
            <Badge variant="default" className="bg-primary/80 text-[10px] px-1.5 py-0.5">
              New
            </Badge>
          </div>
        )}

        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={cn(
              'p-3 rounded-xl transition-all duration-300',
              'bg-gradient-to-br from-primary/20 to-primary/5',
              'group-hover:from-primary/30 group-hover:to-primary/10',
              'group-hover:shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
            )}>
              <FileText className="h-6 w-6 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate mb-1 pr-16">
                {report.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                Created {format(new Date(report.created_at), 'MMM d, yyyy • h:mm a')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(report.id)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onView(report)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
