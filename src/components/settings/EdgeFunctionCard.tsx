import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CodeBlock } from '@/components/settings/CodeBlock';
import { cn } from '@/lib/utils';
import type { EdgeFunction } from '@/lib/edge-function-registry';
import { toast } from 'sonner';

const categoryColors: Record<string, string> = {
  core: 'border-l-primary',
  webhook: 'border-l-amber-500',
  ai: 'border-l-violet-500',
  office: 'border-l-emerald-500',
};

const categoryBadgeColors: Record<string, string> = {
  core: 'bg-primary/20 text-primary',
  webhook: 'bg-amber-500/20 text-amber-400',
  ai: 'bg-violet-500/20 text-violet-400',
  office: 'bg-emerald-500/20 text-emerald-400',
};

interface EdgeFunctionCardProps {
  fn: EdgeFunction;
  baseUrl: string;
}

export const EdgeFunctionCard = ({ fn, baseUrl }: EdgeFunctionCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const endpointUrl = `${baseUrl}/functions/v1/${fn.name}`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(null), 2000);
  };

  const curlExample = fn.exampleRequest
    ? `curl -X POST "${endpointUrl}" \\\n  -H "Content-Type: application/json" \\\n  -H "x-webhook-secret: YOUR_SECRET" \\\n  -d '${JSON.stringify(fn.exampleRequest, null, 2)}'`
    : fn.requestTypes?.[0]?.actions?.[0]?.exampleRequest
      ? `curl -X POST "${endpointUrl}" \\\n  -H "Content-Type: application/json" \\\n  -H "x-webhook-secret: YOUR_SECRET" \\\n  -d '${JSON.stringify(fn.requestTypes[0].actions[0].exampleRequest, null, 2)}'`
      : '';

  return (
    <div className={cn('rounded-lg border border-border/50 glass overflow-hidden border-l-4', categoryColors[fn.category])}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Badge variant="outline" className="font-mono text-xs shrink-0">
            {fn.method}
          </Badge>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{fn.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{fn.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <Badge className={cn('text-xs', categoryBadgeColors[fn.category])}>
            {fn.category}
          </Badge>
          {fn.requestTypes && (
            <Badge variant="secondary" className="text-xs">
              {fn.requestTypes.length} types
            </Badge>
          )}
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border/30">
              {/* Endpoint */}
              <div className="pt-4">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Endpoint</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="flex-1 p-2 bg-muted/30 rounded text-sm font-mono truncate">{endpointUrl}</code>
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => handleCopy(endpointUrl, 'URL')}>
                    {copied === 'URL' ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>

              {/* Auth */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Authentication</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {fn.authMethods.map((method) => (
                    <Badge key={method} variant="outline" className="text-xs font-mono">
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Request Types (for ai-tasks) */}
              {fn.requestTypes && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Request Types</label>
                  <div className="mt-2 space-y-1">
                    {fn.requestTypes.map((rt) => (
                      <div key={rt.name} className="rounded border border-border/30 overflow-hidden">
                        <button
                          onClick={() => setExpandedType(expandedType === rt.name ? null : rt.name)}
                          className="w-full flex items-center justify-between p-3 hover:bg-muted/20 transition-colors text-left"
                        >
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-primary">{rt.name}</code>
                            <span className="text-xs text-muted-foreground">— {rt.description}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{rt.actions.length} actions</Badge>
                            <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', expandedType === rt.name && 'rotate-180')} />
                          </div>
                        </button>
                        <AnimatePresence>
                          {expandedType === rt.name && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-3 pb-3 space-y-2">
                                {rt.actions.map((action) => (
                                  <div key={action.name} className="p-2 rounded bg-muted/20 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <code className="text-xs font-mono font-bold text-foreground">{action.name}</code>
                                      <span className="text-xs text-muted-foreground">{action.description}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {action.requiredFields.map((f) => (
                                        <Badge key={f} variant="default" className="text-[10px] h-5">{f}</Badge>
                                      ))}
                                      {action.optionalFields?.map((f) => (
                                        <Badge key={f} variant="outline" className="text-[10px] h-5 opacity-60">{f}?</Badge>
                                      ))}
                                    </div>
                                    <CodeBlock code={JSON.stringify(action.exampleRequest, null, 2)} language="json" className="mt-1" />
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Request Body (for non-ai-tasks) */}
              {fn.requestBody && fn.requestBody.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Request Body</label>
                  <div className="mt-1 rounded border border-border/30 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/30 bg-muted/20">
                          <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground">Field</th>
                          <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground">Type</th>
                          <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground">Required</th>
                          <th className="text-left px-3 py-1.5 text-xs font-medium text-muted-foreground">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fn.requestBody.map((field) => (
                          <tr key={field.field} className="border-b border-border/20 last:border-0">
                            <td className="px-3 py-1.5 font-mono text-xs text-primary">{field.field}</td>
                            <td className="px-3 py-1.5 font-mono text-xs text-muted-foreground">{field.type}</td>
                            <td className="px-3 py-1.5">{field.required ? <Badge className="text-[10px] h-4">required</Badge> : <span className="text-xs text-muted-foreground">optional</span>}</td>
                            <td className="px-3 py-1.5 text-xs text-muted-foreground">{field.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Example cURL */}
              {curlExample && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Example cURL</label>
                  <CodeBlock code={curlExample} language="bash" className="mt-1" />
                </div>
              )}

              {/* Example Response */}
              {fn.exampleResponse && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Example Response</label>
                  <CodeBlock code={JSON.stringify(fn.exampleResponse, null, 2)} language="json" className="mt-1" />
                </div>
              )}

              {/* Notes */}
              {fn.notes && fn.notes.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</label>
                  <ul className="mt-1 space-y-0.5">
                    {fn.notes.map((note, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-primary mt-0.5">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
