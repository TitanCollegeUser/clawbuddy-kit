import { ChevronDown, ChevronUp, Trash2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { OperationFormData } from './SkillWizard';
import type { HttpMethod } from '@/hooks/useSkillOperations';
import { validateOperationName } from '@/hooks/useSkillOperations';

interface OperationEditorProps {
  operation: OperationFormData;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (data: OperationFormData) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const httpMethods: { value: HttpMethod; label: string; color: string }[] = [
  { value: 'GET', label: 'GET', color: 'bg-green-500/20 text-green-500' },
  { value: 'POST', label: 'POST', color: 'bg-blue-500/20 text-blue-500' },
  { value: 'PATCH', label: 'PATCH', color: 'bg-yellow-500/20 text-yellow-500' },
  { value: 'PUT', label: 'PUT', color: 'bg-orange-500/20 text-orange-500' },
  { value: 'DELETE', label: 'DELETE', color: 'bg-red-500/20 text-red-500' },
];

export const OperationEditor = ({
  operation,
  index,
  isExpanded,
  onToggle,
  onChange,
  onDelete,
  onDuplicate,
}: OperationEditorProps) => {
  const method = httpMethods.find((m) => m.value === operation.httpMethod) || httpMethods[0];
  const isNameValid = !operation.name || validateOperationName(operation.name);

  const handleNameChange = (name: string) => {
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    onChange({ ...operation, name: normalizedName });
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <div className={cn(
        'border rounded-lg transition-all duration-200',
        isExpanded 
          ? 'border-primary/50 bg-card shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]' 
          : 'border-border/50 bg-card/50 hover:border-border'
      )}>
        {/* Header */}
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between p-4 cursor-pointer">
            <div className="flex items-center gap-3">
              <Badge className={cn('font-mono text-xs', method.color)}>
                {method.label}
              </Badge>
              <div className="flex flex-col">
                <span className="font-medium">
                  {operation.name || `Operation ${index + 1}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  {operation.endpointPath || '/'}
                  {operation.title && ` - ${operation.title}`}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Content */}
        <AnimatePresence>
          {isExpanded && (
            <CollapsibleContent forceMount>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-4 pb-4 space-y-4 border-t border-border/50 pt-4">
                  {/* Basic Info */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="send_email"
                        value={operation.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className={!isNameValid ? 'border-destructive' : ''}
                      />
                      <p className="text-xs text-muted-foreground">
                        Lowercase, numbers, underscores
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>
                        Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="Send Email"
                        value={operation.title}
                        onChange={(e) => onChange({ ...operation, title: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Method & Path */}
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Method</Label>
                      <Select 
                        value={operation.httpMethod} 
                        onValueChange={(v) => onChange({ ...operation, httpMethod: v as HttpMethod })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {httpMethods.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              <span className={cn('font-mono', m.color.replace('bg-', 'text-').split(' ')[0].replace('/20', ''))}>
                                {m.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 sm:col-span-2">
                      <Label>
                        Endpoint Path <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="/emails"
                        value={operation.endpointPath}
                        onChange={(e) => onChange({ ...operation, endpointPath: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Send a transactional email"
                      value={operation.description}
                      onChange={(e) => onChange({ ...operation, description: e.target.value })}
                      rows={2}
                    />
                  </div>

                  {/* Schemas */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Request Body Schema (JSON)</Label>
                      <Textarea
                        placeholder='{"to": "string", "subject": "string"}'
                        value={operation.requestBodySchema}
                        onChange={(e) => onChange({ ...operation, requestBodySchema: e.target.value })}
                        rows={4}
                        className="font-mono text-xs"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Response Schema (JSON)</Label>
                      <Textarea
                        placeholder='{"id": "string", "status": "string"}'
                        value={operation.responseSchema}
                        onChange={(e) => onChange({ ...operation, responseSchema: e.target.value })}
                        rows={4}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Examples */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Example Request</Label>
                      <Textarea
                        placeholder='{"to": "user@example.com", "subject": "Hello"}'
                        value={operation.exampleRequest}
                        onChange={(e) => onChange({ ...operation, exampleRequest: e.target.value })}
                        rows={4}
                        className="font-mono text-xs"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Example Response</Label>
                      <Textarea
                        placeholder='{"id": "abc123", "status": "sent"}'
                        value={operation.exampleResponse}
                        onChange={(e) => onChange({ ...operation, exampleResponse: e.target.value })}
                        rows={4}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </CollapsibleContent>
          )}
        </AnimatePresence>
      </div>
    </Collapsible>
  );
};
