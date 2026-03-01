import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import type { ForgeItem } from '@/hooks/useForge';

interface AddForgeItemFormProps {
  onAdd: (item: ForgeItem) => void;
  availableAgents: { name: string; type: string; emoji?: string }[];
}

export const AddForgeItemForm = ({ onAdd, availableAgents }: AddForgeItemFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ForgeItem['type']>('tool');
  const [description, setDescription] = useState('');
  const [complexity, setComplexity] = useState<ForgeItem['complexity']>('moderate');
  const [agent, setAgent] = useState(availableAgents[0]?.name || 'Sherlock');

  const handleSubmit = () => {
    if (!name.trim() || !description.trim()) return;
    onAdd({
      name: name.trim().toLowerCase().replace(/\s+/g, '-'),
      type,
      description: description.trim(),
      complexity,
      recommended_agent: agent,
      recommended_model: complexity === 'complex' ? 'claude-opus-4' : 'claude-sonnet-4',
      build_steps: [],
      apis_needed: [],
      estimated_effort:
        complexity === 'simple' ? '1-2 hours' : complexity === 'moderate' ? '3-5 hours' : '1-2 days',
      priority: 'medium',
    });
    setName('');
    setDescription('');
    setType('tool');
    setComplexity('moderate');
    setIsOpen(false);
  };

  return (
    <div className="mt-4">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground border border-dashed border-white/[0.1] rounded-xl px-4 py-3 hover:border-primary/30 hover:text-primary transition-colors"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Plus className="h-4 w-4" />
            Add Custom Item
          </motion.button>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="forge-glass-static p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Add Custom Build Item</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/[0.06] rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Item name (e.g., slack-notifier)"
              className="forge-input w-full text-sm px-3 py-2"
            />

            <div className="flex gap-3">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ForgeItem['type'])}
                className="forge-input flex-1 text-sm px-3 py-2"
              >
                <option value="skill">Skill</option>
                <option value="ops_app">OpsCenter App</option>
                <option value="automation">Automation</option>
                <option value="edge_function">Edge Function</option>
                <option value="tool">Tool</option>
                <option value="make_scenario">Make Scenario</option>
              </select>
              <select
                value={complexity}
                onChange={(e) => setComplexity(e.target.value as ForgeItem['complexity'])}
                className="forge-input flex-1 text-sm px-3 py-2"
              >
                <option value="simple">Simple</option>
                <option value="moderate">Moderate</option>
                <option value="complex">Complex</option>
              </select>
            </div>

            <select
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="forge-input w-full text-sm px-3 py-2"
            >
              {availableAgents.map((a) => (
                <option key={a.name} value={a.name}>
                  {a.emoji ? `${a.emoji} ` : ''}
                  {a.name}
                </option>
              ))}
            </select>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should this item do?"
              className="forge-input w-full text-sm px-3 py-2 min-h-[60px] resize-y"
            />

            <motion.button
              onClick={handleSubmit}
              disabled={!name.trim() || !description.trim()}
              className="forge-btn-primary w-full text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Add to Build List
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
