import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AuthType } from '@/hooks/useSkills';

export interface RestConnectionConfig {
  base_url: string;
  auth: {
    type: AuthType;
    header: string;
    format: string;
  };
  default_headers?: Record<string, string>;
  rate_limit?: string;
}

interface RestConfigProps {
  config: RestConnectionConfig;
  apiKey: string;
  onChange: (config: RestConnectionConfig) => void;
  onApiKeyChange: (key: string) => void;
}

const authTypeOptions: { value: AuthType; label: string; defaultFormat: string }[] = [
  { value: 'bearer', label: 'Bearer Token', defaultFormat: 'Bearer {KEY}' },
  { value: 'api_key', label: 'API Key', defaultFormat: '{KEY}' },
  { value: 'basic', label: 'Basic Auth', defaultFormat: 'Basic {KEY}' },
];

export const RestConfig = ({
  config,
  apiKey,
  onChange,
  onApiKeyChange,
}: RestConfigProps) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleAuthTypeChange = (authType: AuthType) => {
    const option = authTypeOptions.find((o) => o.value === authType);
    onChange({
      ...config,
      auth: {
        ...config.auth,
        type: authType,
        format: option?.defaultFormat || config.auth.format,
      },
    });
  };

  const handleTestConnection = async () => {
    if (!config.base_url) return;
    
    setConnectionStatus('testing');
    setConnectionError(null);
    
    try {
      const url = new URL(config.base_url);
      if (url.protocol === 'https:' || url.protocol === 'http:') {
        setConnectionStatus('success');
      } else {
        throw new Error('Invalid URL protocol');
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Connection failed');
    }
  };

  const isValidUrl = (() => {
    try {
      new URL(config.base_url);
      return true;
    } catch {
      return false;
    }
  })();

  return (
    <div className="space-y-4">
      {/* Base URL */}
      <div className="space-y-2">
        <Label htmlFor="baseUrl">
          Base URL <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="baseUrl"
            placeholder="https://api.resend.com"
            value={config.base_url}
            onChange={(e) => onChange({ ...config, base_url: e.target.value })}
            className={!isValidUrl && config.base_url ? 'border-destructive' : ''}
          />
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={!isValidUrl || connectionStatus === 'testing'}
          >
            {connectionStatus === 'testing' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Test'
            )}
          </Button>
        </div>
        {connectionStatus === 'success' && (
          <p className="text-xs text-primary flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            URL is valid
          </p>
        )}
        {connectionStatus === 'error' && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {connectionError || 'Invalid URL'}
          </p>
        )}
      </div>

      {/* Authentication */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="authType">Auth Type</Label>
          <Select value={config.auth.type} onValueChange={(v) => handleAuthTypeChange(v as AuthType)}>
            <SelectTrigger id="authType">
              <SelectValue placeholder="Select auth type" />
            </SelectTrigger>
            <SelectContent>
              {authTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="authHeader">Header Name</Label>
          <Input
            id="authHeader"
            placeholder="Authorization"
            value={config.auth.header}
            onChange={(e) => onChange({ ...config, auth: { ...config.auth, header: e.target.value } })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="authFormat">Header Format</Label>
        <Input
          id="authFormat"
          placeholder="Bearer {KEY}"
          value={config.auth.format}
          onChange={(e) => onChange({ ...config, auth: { ...config.auth, format: e.target.value } })}
        />
        <p className="text-xs text-muted-foreground">
          Use {'{KEY}'} as placeholder for the API key
        </p>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key / Secret</Label>
        <div className="relative">
          <Input
            id="apiKey"
            type={showApiKey ? 'text' : 'password'}
            placeholder="re_ABC123xyz..."
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Will be encrypted and stored securely
        </p>
      </div>

      {/* Rate Limit */}
      <div className="space-y-2">
        <Label htmlFor="rateLimit">Rate Limit (optional)</Label>
        <Input
          id="rateLimit"
          placeholder="100/min, 1000/hour, etc."
          value={config.rate_limit || ''}
          onChange={(e) => onChange({ ...config, rate_limit: e.target.value })}
        />
      </div>
    </div>
  );
};
