import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Globe, FileCode, Cpu, FileText, Info, Loader2, Hammer, Plus, X } from 'lucide-react';
import type { ForgeInputType } from '@/hooks/useForge';

interface ForgeInputSectionProps {
  onAnalyze: (inputType: ForgeInputType, content?: string, urls?: string[]) => void;
  isAnalyzing: boolean;
}

const MAX_URLS = 5;

const inputTypes: { type: ForgeInputType; label: string; icon: React.ElementType }[] = [
  { type: 'transcript', label: 'YouTube', icon: Youtube },
  { type: 'url', label: 'URL', icon: Globe },
  { type: 'api_docs', label: 'API Docs', icon: FileCode },
  { type: 'mcp_spec', label: 'MCP Spec', icon: Cpu },
  { type: 'text', label: 'Text', icon: FileText },
];

const placeholders: Record<ForgeInputType, string> = {
  transcript: 'https://www.youtube.com/watch?v=...',
  url: 'https://example.com/docs',
  api_docs: 'Paste API documentation, OpenAPI spec, or endpoint descriptions...',
  mcp_spec: 'Paste an MCP tool specification (JSON or YAML)...',
  text: 'Paste any text content — meeting notes, feature specs, ideas...',
};

export const ForgeInputSection = ({ onAnalyze, isAnalyzing }: ForgeInputSectionProps) => {
  const [activeType, setActiveType] = useState<ForgeInputType>('text');
  const [content, setContent] = useState('');
  const [urls, setUrls] = useState<string[]>(['']);

  const isUrlType = activeType === 'transcript' || activeType === 'url';
  const filledUrls = urls.filter(u => u.trim().length > 0);
  const canAnalyze = isUrlType
    ? filledUrls.length > 0 && !isAnalyzing
    : content.trim().length > 0 && !isAnalyzing;

  const handleAddUrl = () => {
    if (urls.length < MAX_URLS) {
      setUrls(prev => [...prev, '']);
    }
  };

  const handleRemoveUrl = (index: number) => {
    setUrls(prev => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? [''] : next;
    });
  };

  const handleUrlChange = (index: number, value: string) => {
    setUrls(prev => prev.map((u, i) => i === index ? value : u));
  };

  const handleAnalyze = () => {
    if (!canAnalyze) return;
    if (isUrlType) {
      onAnalyze(activeType, undefined, filledUrls);
    } else {
      onAnalyze(activeType, content);
    }
  };

  // Reset URLs when switching between types
  const handleTypeChange = (type: ForgeInputType) => {
    setActiveType(type);
    setUrls(['']);
  };

  return (
    <div className="space-y-5">
      {/* Type selector tabs */}
      <div className="flex flex-wrap gap-2">
        {inputTypes.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`forge-tab ${activeType === type ? 'forge-tab-active' : ''}`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
            {activeType === type && (
              <motion.div
                layoutId="forge-tab-indicator"
                className="absolute -bottom-0.5 left-1/2 h-0.5 rounded-full bg-primary"
                initial={{ width: 0, x: '-50%' }}
                animate={{ width: 16, x: '-50%' }}
                transition={{ duration: 0.2 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Input area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeType}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {isUrlType ? (
            <div className="space-y-3">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                <Info className="h-3 w-3" />
                {activeType === 'transcript' ? 'YouTube Video URLs' : 'URLs to analyze'}
                <span className="text-muted-foreground/40 ml-1">(up to {MAX_URLS})</span>
              </label>

              {/* URL list */}
              <div className="space-y-2">
                {urls.map((url, index) => (
                  <motion.div
                    key={index}
                    initial={index > 0 ? { opacity: 0, height: 0 } : false}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleUrlChange(index, e.target.value)}
                      placeholder={index === 0 ? placeholders[activeType] : `URL ${index + 1}...`}
                      className="forge-input flex-1 px-4 py-2.5 text-sm"
                      disabled={isAnalyzing}
                    />
                    {urls.length > 1 && (
                      <button
                        onClick={() => handleRemoveUrl(index)}
                        className="flex-shrink-0 p-2 rounded-lg hover:bg-white/[0.06] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                        disabled={isAnalyzing}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Add URL button */}
              {urls.length < MAX_URLS && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleAddUrl}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors py-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add another {activeType === 'transcript' ? 'YouTube URL' : 'URL'}
                </motion.button>
              )}

              {/* URL count */}
              {filledUrls.length > 1 && (
                <span className="text-xs text-muted-foreground/50 font-jetbrains">
                  {filledUrls.length} URLs queued
                </span>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                <Info className="h-3 w-3" />
                Paste your content
              </label>
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={placeholders[activeType]}
                  className="forge-input w-full px-4 py-3 text-sm font-jetbrains min-h-[220px] md:min-h-[220px] max-sm:min-h-[160px] resize-y"
                  disabled={isAnalyzing}
                />
                {/* Subtle grid pattern overlay */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-xl opacity-[0.02]"
                  style={{
                    backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div>
          {!isUrlType && (
            <span className="text-xs text-muted-foreground/50 font-jetbrains">
              {content.length.toLocaleString()} chars
            </span>
          )}
        </div>
        <motion.button
          onClick={handleAnalyze}
          disabled={!canAnalyze}
          className="forge-btn-primary flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing{filledUrls.length > 1 ? ` ${filledUrls.length} sources` : ''}...
            </>
          ) : (
            <>
              <Hammer className="h-4 w-4" />
              Analyze{filledUrls.length > 1 ? ` (${filledUrls.length})` : ''}
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};
