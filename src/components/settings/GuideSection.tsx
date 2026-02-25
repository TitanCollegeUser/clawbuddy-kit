import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuideSectionProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  level?: number;
}

export const GuideSection = ({
  id,
  title,
  icon,
  children,
  defaultOpen = false,
  className,
  level = 1
}: GuideSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div id={id} className={cn('border-b border-border/50 last:border-b-0', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 py-4 text-left hover:bg-muted/30 transition-colors px-2 rounded-lg',
          level === 1 && 'font-semibold',
          level === 2 && 'pl-6 font-medium text-sm',
          level === 3 && 'pl-10 text-sm text-muted-foreground'
        )}
      >
        <motion.div
          initial={false}
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </motion.div>
        {icon && <span className="text-primary">{icon}</span>}
        <span className="flex-1">{title}</span>
        {isOpen && <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={cn('pb-4', level === 1 && 'px-2', level === 2 && 'pl-10 pr-2')}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
