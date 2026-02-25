import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export interface WebhookConnectionConfig {
  callback_url?: string;
  event_types: string[];
  signing_secret_header?: string;
  signature_algorithm?: 'hmac-sha256' | 'hmac-sha1' | 'none';
}

interface WebhookConfigProps {
  config: WebhookConnectionConfig;
  apiKey: string;
  onChange: (config: WebhookConnectionConfig) => void;
  onApiKeyChange: (key: string) => void;
}

export const WebhookConfig = ({
  config,
  apiKey,
  onChange,
  onApiKeyChange,
}: WebhookConfigProps) => {
  const [showSecret, setShowSecret] = useState(false);
  const [newEventType, setNewEventType] = useState('');

  const addEventType = () => {
    if (newEventType.trim() && !config.event_types.includes(newEventType.trim())) {
      onChange({
        ...config,
        event_types: [...config.event_types, newEventType.trim()],
      });
      setNewEventType('');
    }
  };

  const removeEventType = (event: string) => {
    onChange({
      ...config,
      event_types: config.event_types.filter((e) => e !== event),
    });
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="flex gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p>
            Configure webhook settings for receiving events from external services. 
            The callback URL will be generated when you save the skill.
          </p>
        </div>
      </div>

      {/* Callback URL (display only - generated) */}
      <div className="space-y-2">
        <Label htmlFor="callbackUrl">Callback URL (Optional)</Label>
        <Input
          id="callbackUrl"
          placeholder="Will be generated, or enter a custom URL"
          value={config.callback_url || ''}
          onChange={(e) => onChange({ ...config, callback_url: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to auto-generate, or specify your own webhook receiver URL
        </p>
      </div>

      {/* Event Types */}
      <div className="space-y-2">
        <Label>Event Types</Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., payment.completed, order.created"
            value={newEventType}
            onChange={(e) => setNewEventType(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEventType())}
          />
          <Button variant="outline" onClick={addEventType} disabled={!newEventType.trim()}>
            Add
          </Button>
        </div>
        {config.event_types.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {config.event_types.map((event) => (
              <Badge
                key={event}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => removeEventType(event)}
              >
                {event}
                <span className="ml-1 text-xs">×</span>
              </Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Specify which event types this webhook will handle
        </p>
      </div>

      {/* Signature Verification */}
      <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-muted/30">
        <h4 className="text-sm font-medium">Signature Verification</h4>
        
        <div className="space-y-2">
          <Label htmlFor="sigHeader">Signature Header Name</Label>
          <Input
            id="sigHeader"
            placeholder="X-Signature, X-Hub-Signature-256, etc."
            value={config.signing_secret_header || ''}
            onChange={(e) => onChange({ ...config, signing_secret_header: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sigAlgo">Signature Algorithm</Label>
          <div className="flex gap-2">
            {(['hmac-sha256', 'hmac-sha1', 'none'] as const).map((algo) => (
              <Button
                key={algo}
                type="button"
                variant={config.signature_algorithm === algo ? 'default' : 'outline'}
                size="sm"
                onClick={() => onChange({ ...config, signature_algorithm: algo })}
              >
                {algo === 'none' ? 'None' : algo.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Signing Secret */}
      <div className="space-y-2">
        <Label htmlFor="signingSecret">Signing Secret</Label>
        <div className="relative">
          <Input
            id="signingSecret"
            type={showSecret ? 'text' : 'password'}
            placeholder="whsec_xxxxx..."
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowSecret(!showSecret)}
          >
            {showSecret ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Used to verify webhook payloads. Will be encrypted and stored securely.
        </p>
      </div>
    </div>
  );
};
