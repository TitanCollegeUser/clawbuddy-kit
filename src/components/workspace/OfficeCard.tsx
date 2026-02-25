import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Building2, Users, Briefcase, Swords, Flame, Radio } from 'lucide-react';
import { Office, useOfficeAgentCount } from '@/hooks/useOffices';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const SPECIES_EMOJI: Record<string, string> = {
  fox: '🦊',
  wolf: '🐺',
  owl: '🦉',
  bear: '🐻',
};

const SITE_TYPE_CONFIG: Record<string, { icon: typeof Building2; label: string; color: string }> = {
  office: { icon: Building2, label: 'Office', color: 'text-primary' },
  arena: { icon: Swords, label: 'Arena', color: 'text-red-400' },
  boiler_room: { icon: Flame, label: 'Boiler Room', color: 'text-orange-400' },
  intelligence: { icon: Radio, label: 'Intelligence Hub', color: 'text-cyan-400' },
};

interface OfficeCardProps {
  office: Office;
}

export const OfficeCard = ({ office }: OfficeCardProps) => {
  const navigate = useNavigate();
  const { data: agentCount = 0 } = useOfficeAgentCount(office.id);
  const siteType = office.site_type || 'office';
  const config = SITE_TYPE_CONFIG[siteType] || SITE_TYPE_CONFIG.office;
  const SiteIcon = config.icon;

  const getRoute = () => {
    if (siteType === 'arena') return `/workspace/arena/${office.id}`;
    if (siteType === 'boiler_room') return `/workspace/boiler-room/${office.id}`;
    // Intelligence route available via Meeting Intelligence Engine module
    return `/workspace/office/${office.id}`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        onClick={() => navigate(getRoute())}
        className="cursor-pointer p-5 bg-card/80 border-border/30 hover:border-primary/40 transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)] group relative"
      >
        {/* Work shortcut */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
          title="View Office Work"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/workspace/office/${office.id}/work`);
          }}
        >
          <Briefcase className="h-4 w-4" />
        </Button>

        <div className="flex items-start gap-4">
          {/* Director avatar */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 shadow-lg"
            style={{
              background: `radial-gradient(circle, ${office.director_color}44, ${office.director_color}22)`,
              border: `2px solid ${office.director_color}`,
              boxShadow: `0 0 12px ${office.director_color}40`,
            }}
          >
            {SPECIES_EMOJI[office.director_species] || '🦊'}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {office.name}
            </h3>
            {office.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{office.description}</p>
            )}

            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className={`flex items-center gap-1 ${config.color}`}>
                <SiteIcon className="h-3 w-3" />
                {config.label}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {agentCount} agents
              </span>
              <span>{format(new Date(office.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
