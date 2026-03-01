import { useState } from 'react';
import { motion } from 'framer-motion';
import { Hammer, Sparkles, ArrowRight, Wrench, LayoutDashboard, Zap, Loader2 } from 'lucide-react';
import { ForgeInputSection } from '@/components/forge/ForgeInputSection';
import { ForgeAnalysisCard } from '@/components/forge/ForgeAnalysisCard';
import { ForgeHistoryGrid } from '@/components/forge/ForgeHistoryGrid';
import { AddForgeItemForm } from '@/components/forge/AddForgeItemForm';
import { useAssignableEntities } from '@/hooks/useAssignableEntities';
import {
  useForgeAnalyses,
  useForgeAnalyze,
  useCreateTasksFromForge,
  type ForgeInputType,
  type ForgeAnalysis,
  type ForgeItem,
  type ForgeRecord,
} from '@/hooks/useForge';

type ViewMode = 'input' | 'analyzing' | 'results';

export const ForgePage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('input');
  const [analysis, setAnalysis] = useState<ForgeAnalysis | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [items, setItems] = useState<ForgeItem[]>([]);

  const { data: pastAnalyses } = useForgeAnalyses();
  const analyzeMutation = useForgeAnalyze();
  const createTasksMutation = useCreateTasksFromForge();
  const { entities } = useAssignableEntities();

  const availableAgents = entities
    .filter((e) => e.type === 'ai_agent' || e.type === 'sub_agent')
    .map((e) => ({ name: e.name, type: e.type, emoji: e.emoji }));

  const selectedItems = items.filter((i) => i.selected);

  const handleAnalyze = async (inputType: ForgeInputType, content?: string, urls?: string[]) => {
    setViewMode('analyzing');
    try {
      const result = await analyzeMutation.mutateAsync({ inputType, content, urls });
      setAnalysis(result.analysis);
      setAnalysisId(result.id);
      setItems(result.analysis.items.map((item) => ({ ...item, selected: true })));
      setViewMode('results');
    } catch {
      setViewMode('input');
    }
  };

  const handleToggleSelect = (index: number) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item)));
  };

  const handleUpdateNotes = (index: number, notes: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, notes } : item)));
  };

  const handleUpdateAgent = (index: number, agent: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, override_agent: agent } : item)));
  };

  const handleAddCustomItem = (newItem: ForgeItem) => {
    setItems((prev) => [...prev, { ...newItem, selected: true }]);
  };

  const handleAssign = async () => {
    if (!analysisId || selectedItems.length === 0) return;
    await createTasksMutation.mutateAsync({ analysisId, items: selectedItems });
    setViewMode('input');
    setAnalysis(null);
    setItems([]);
  };

  const handleNewAnalysis = () => {
    setViewMode('input');
    setAnalysis(null);
    setItems([]);
  };

  const handleSelectHistory = (record: ForgeRecord) => {
    if (record.analysis) {
      setAnalysis(record.analysis);
      setAnalysisId(record.id);
      setItems(record.analysis.items.map((item) => ({ ...item, selected: false })));
      setViewMode('results');
    }
  };

  return (
    <div className="forge-scope p-6 md:p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5">
            <Hammer className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="font-orbitron text-2xl font-bold text-foreground">Forge</h1>
            <p className="text-sm text-muted-foreground">Turn knowledge into buildable agent capabilities</p>
          </div>
        </div>
        {viewMode === 'results' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleNewAnalysis}
            className="forge-tab flex items-center gap-2 text-sm"
          >
            <Sparkles className="h-4 w-4" />
            New Analysis
          </motion.button>
        )}
      </motion.div>

      <div className="forge-divider" />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2">
          <div className="forge-glass-static p-5 border-t-2 border-primary/30">
            {viewMode === 'results' && analysis ? (
              /* Summary mode */
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Analysis Complete</h3>
                </div>
                <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                <span className="inline-block text-xs border border-white/[0.1] rounded-full px-3 py-1 text-muted-foreground">
                  {analysis.source_type}
                </span>
                {/* Key technologies */}
                <div className="flex flex-wrap gap-2">
                  {analysis.key_technologies.map((tech) => (
                    <span key={tech} className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-medium">
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="forge-divider" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.length} of {items.length} selected
                  </span>
                  <motion.button
                    onClick={handleAssign}
                    disabled={selectedItems.length === 0 || createTasksMutation.isPending}
                    className="forge-btn-primary flex items-center gap-2 text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {createTasksMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Assign to Board
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            ) : (
              /* Input mode */
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Hammer className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-semibold text-foreground">Feed the Forge</h3>
                </div>
                <ForgeInputSection onAnalyze={handleAnalyze} isAnalyzing={viewMode === 'analyzing'} />
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-3">
          {viewMode === 'input' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full min-h-[400px] text-center space-y-6"
            >
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Hammer className="h-16 w-16 text-foreground/10" />
              </motion.div>
              <div className="space-y-2">
                <p className="text-base text-muted-foreground">Paste content and hit Analyze</p>
                <p className="text-sm text-muted-foreground/60">Forge identifies skills, tools, and apps you can build</p>
              </div>
              <div className="flex flex-col gap-2 text-xs text-muted-foreground/40">
                <span className="flex items-center gap-2"><Wrench className="h-3.5 w-3.5" /> Skills & Tools</span>
                <span className="flex items-center gap-2"><LayoutDashboard className="h-3.5 w-3.5" /> OpsCenter Apps</span>
                <span className="flex items-center gap-2"><Zap className="h-3.5 w-3.5" /> Automations & Scenarios</span>
              </div>
            </motion.div>
          )}

          {viewMode === 'analyzing' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="forge-glass-static relative overflow-hidden p-8 flex flex-col items-center justify-center min-h-[400px] space-y-6"
            >
              <div className="absolute inset-0 forge-shimmer" />
              <div className="relative z-10 flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full glow-amber-strong blur-xl" />
                  <motion.div
                    animate={{ rotate: [-5, 5, -5] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <Hammer className="h-12 w-12 text-primary relative z-10" />
                  </motion.div>
                </div>
                <p className="text-base font-medium text-primary">Analyzing with AI...</p>
                <p className="text-xs text-muted-foreground">This takes 10-30 seconds</p>
              </div>
              <div className="relative z-10 w-full max-w-md space-y-3 mt-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.2 }}
                    className="h-20 rounded-lg forge-shimmer bg-white/[0.02]"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {viewMode === 'results' && items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-base font-semibold text-foreground">Buildable Items</h3>
                <span className="bg-primary/15 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                  {items.length}
                </span>
              </div>
              {items.map((item, index) => (
                <ForgeAnalysisCard
                  key={item.name}
                  item={item}
                  index={index}
                  onToggleSelect={handleToggleSelect}
                  onUpdateNotes={handleUpdateNotes}
                  onUpdateAgent={handleUpdateAgent}
                  availableAgents={availableAgents}
                />
              ))}
              <AddForgeItemForm onAdd={handleAddCustomItem} availableAgents={availableAgents} />
            </div>
          )}
        </div>
      </div>

      {/* Past analyses */}
      {pastAnalyses && pastAnalyses.length > 0 && (
        <>
          <div className="forge-divider" />
          <ForgeHistoryGrid analyses={pastAnalyses} onSelect={handleSelectHistory} />
        </>
      )}
    </div>
  );
};
