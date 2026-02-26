import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Plus,
  ChevronDown,
  ChevronRight,
  Activity,
  Clock,
  Zap,
  ExternalLink,
  Cpu,
  Mail,
  Phone,
  Search,
  BarChart3,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAiEmployees, type AiEmployee } from '@/hooks/useAiEmployees';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' },
  idle: { label: 'Idle', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30' },
  on_assignment: { label: 'On Assignment', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30' },
  training: { label: 'Training', color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/30' },
  terminated: { label: 'Terminated', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
  coming_soon: { label: 'Coming Soon', color: 'text-gray-400', bg: 'bg-gray-500/20 border-gray-500/30' },
};

const platformIcons: Record<string, typeof Cpu> = {
  claude_code: Cpu,
  openclaw: Zap,
  codex: BarChart3,
  custom: Briefcase,
};

const departmentColors: Record<string, string> = {
  sales: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  research: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  operations: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  content: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  support: 'bg-green-500/20 text-green-400 border-green-500/30',
  general: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const EmployeeCard = ({ employee, onViewDashboard }: { employee: AiEmployee; onViewDashboard: (e: AiEmployee) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[employee.status] || statusConfig.idle;
  const PlatformIcon = platformIcons[employee.platform] || Cpu;
  const metrics = employee.metrics as Record<string, number>;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden hover:border-primary/30 transition-colors"
    >
      {/* Header */}
      <div
        className="p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{employee.emoji || '🤖'}</div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-foreground">{employee.name}</h3>
                <Badge variant="outline" className={`text-xs ${status.bg}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${status.color.replace('text-', 'bg-')} mr-1`} />
                  {status.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{employee.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${departmentColors[employee.department] || departmentColors.general}`}>
              {employee.department}
            </Badge>
            <div className="text-muted-foreground">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </div>
          </div>
        </div>

        {/* Platform & current task */}
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <PlatformIcon className="h-3 w-3" />
            {employee.platform_label || employee.platform}
          </span>
          {employee.current_task && (
            <span className="flex items-center gap-1 text-primary">
              <Activity className="h-3 w-3 animate-pulse" />
              {employee.current_task}
            </span>
          )}
          {!employee.current_task && employee.status === 'idle' && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Awaiting assignment
            </span>
          )}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-border/30 pt-4">
              {/* Description */}
              {employee.description && (
                <p className="text-sm text-muted-foreground">{employee.description}</p>
              )}

              {/* Metrics row */}
              {Object.keys(metrics).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(metrics).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="bg-background/50 rounded-lg p-3 text-center border border-border/30">
                      <div className="text-lg font-bold text-foreground">
                        {typeof value === 'number' && key.includes('rate')
                          ? `${(value * 100).toFixed(1)}%`
                          : typeof value === 'number' && (key.includes('cost') || key.includes('revenue'))
                          ? `$${value.toLocaleString()}`
                          : typeof value === 'number'
                          ? value.toLocaleString()
                          : String(value)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills */}
              {employee.skill_names.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {employee.skill_names.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {employee.ops_app_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDashboard(employee);
                    }}
                    className="gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Dashboard
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.info(`${employee.name}'s detail view — coming soon`);
                  }}
                >
                  Full Profile
                </Button>
              </div>

              {/* Hired date */}
              <div className="text-xs text-muted-foreground pt-1">
                Hired {new Date(employee.hired_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {employee.last_active && (
                  <> · Last active {new Date(employee.last_active).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const AiEmployeesPage = () => {
  const navigate = useNavigate();
  const { employees, isLoading, activeCount, totalCount } = useAiEmployees();
  const [filter, setFilter] = useState<string>('all');

  const filteredEmployees = filter === 'all'
    ? employees
    : employees.filter(e => e.department === filter || e.status === filter || e.platform === filter);

  const departments = [...new Set(employees.map(e => e.department))];

  const handleViewDashboard = (employee: AiEmployee) => {
    if (employee.ops_app_id) {
      // Navigate to OpsCenter app view
      const appName = `emp-${employee.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      navigate(`/ops-center/${appName}`);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Briefcase className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-orbitron">AI Employees</h1>
              <p className="text-sm text-muted-foreground">
                Your AI staffing roster — {activeCount} active, {totalCount} total
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            filter === 'all' ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-card/50 border-border/50 text-muted-foreground hover:border-primary/20'
          }`}
        >
          All ({totalCount})
        </button>
        {departments.map(dept => {
          const count = employees.filter(e => e.department === dept).length;
          return (
            <button
              key={dept}
              onClick={() => setFilter(dept === filter ? 'all' : dept)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors capitalize ${
                filter === dept ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-card/50 border-border/50 text-muted-foreground hover:border-primary/20'
              }`}
            >
              {dept} ({count})
            </button>
          );
        })}
      </motion.div>

      {/* Employee grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">No employees yet</h3>
          <p className="text-sm text-muted-foreground/70 mt-1 max-w-md">
            AI employees are hired through agent platforms like Claude Code or OpenClaw.
            Each employee gets their own OpsCenter dashboard automatically.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEmployees.map((employee, i) => (
            <motion.div
              key={employee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <EmployeeCard
                employee={employee}
                onViewDashboard={handleViewDashboard}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
