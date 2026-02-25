import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Check, Info, Brain, Sparkles, Moon, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useOpsData } from '@/hooks/useOpsData';
import type { OpsBlock } from '@/hooks/useOpsBlocks';

interface ProviderConfig {
  name: string;
  model: string;
  api_key_env: string;
  base_url: string;
  api_format: string;
}

interface AIConfig {
  type: string;
  active_provider: string;
  providers: Record<string, ProviderConfig>;
}

const providerMeta: Record<string, { icon: typeof Brain; color: string; letter: string }> = {
  openai: { icon: Brain, color: '#10a37f', letter: 'O' },
  anthropic: { icon: Sparkles, color: '#d97706', letter: 'A' },
  kimi: { icon: Moon, color: '#3b82f6', letter: 'K' },
  groq: { icon: Zap, color: '#8b5cf6', letter: 'G' },
};

interface Props {
  block: OpsBlock;
  appId: string;
}

export const ResearchSettingsBlock = ({ block, appId }: Props) => {
  const { data: items, isLoading } = useOpsData({ appId, blockId: block.id });
  const queryClient = useQueryClient();
  const [switching, setSwitching] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const configItem = items?.find(
    i => i.item_type === 'config' && (i.data as Record<string, unknown>)?.type === 'ai_config'
  );

  if (!configItem) {
    return (
      <div className="glass rounded-xl p-8 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Settings size={24} className="text-blue-400" />
        </div>
        <p className="text-sm font-medium text-foreground">No AI configuration found</p>
        <p className="text-xs text-muted-foreground">Run the setup script to initialize providers.</p>
      </div>
    );
  }

  const config = configItem.data as unknown as AIConfig;
  const activeProvider = config.active_provider;
  const providers = config.providers || {};

  const handleSwitch = async (key: string) => {
    if (key === activeProvider || switching) return;
    setSwitching(key);
    try {
      const updatedData = { ...config, active_provider: key };
      const { error } = await supabase
        .from('ops_data')
        .update({ data: updatedData as unknown as Record<string, unknown> })
        .eq('id', configItem.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['ops-data', appId] });
      toast({
        title: 'Provider switched',
        description: `Now using ${providers[key]?.name || key}`,
      });
    } catch (err) {
      toast({
        title: 'Switch failed',
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings size={18} className="text-blue-400" />
          <h3 className="font-orbitron text-base font-semibold uppercase tracking-wider text-foreground">
            AI Provider Configuration
          </h3>
        </div>
        {activeProvider && providers[activeProvider] && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-muted-foreground">
              {providers[activeProvider].name} &middot; {providers[activeProvider].model}
            </span>
          </div>
        )}
      </div>

      {/* Provider cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(providers).map(([key, provider], i) => {
          const meta = providerMeta[key] || { icon: Brain, color: '#6b7280', letter: '?' };
          const Icon = meta.icon;
          const isActive = key === activeProvider;
          const isSwitching = switching === key;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`glass-strong rounded-xl p-5 border transition-all ${
                isActive
                  ? 'border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                  : 'border-white/[0.06] hover:border-white/[0.12]'
              }`}
            >
              {/* Provider header */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{provider.name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{provider.model}</p>
                </div>
                {isActive && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                    Active
                  </Badge>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Base URL</span>
                  <span className="text-[11px] font-mono text-muted-foreground/70 truncate flex-1">
                    {provider.base_url}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Format</span>
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${
                      provider.api_format === 'anthropic'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}
                  >
                    {provider.api_format === 'anthropic' ? 'Anthropic Format' : 'OpenAI Compatible'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">API Key</span>
                  {provider.api_key_env ? (
                    <span className="text-[11px] font-mono text-muted-foreground/70">
                      Env: {provider.api_key_env}
                    </span>
                  ) : (
                    <span className="text-[11px] text-red-400">Not configured</span>
                  )}
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => handleSwitch(key)}
                disabled={isActive || !!switching}
                className={`w-full py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-400 cursor-default'
                    : 'bg-white/[0.06] text-muted-foreground hover:bg-white/[0.1] hover:text-foreground disabled:opacity-50'
                }`}
              >
                {isActive ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Check size={14} /> Active
                  </span>
                ) : isSwitching ? (
                  'Switching...'
                ) : (
                  'Use This Provider'
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Info card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} className="text-blue-400" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">How it works</span>
        </div>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>&bull; The selected AI provider powers all web research summaries</li>
          <li>&bull; API keys are stored as Supabase secrets &mdash; never exposed to the frontend</li>
          <li>&bull; To add or change an API key, update via CLI: <code className="text-[11px] bg-white/[0.06] px-1.5 py-0.5 rounded">supabase secrets set KEY=value</code></li>
          <li>&bull; Supports any OpenAI-compatible API (OpenAI, Kimi, Groq, Together) plus Anthropic</li>
        </ul>
      </motion.div>
    </div>
  );
};
