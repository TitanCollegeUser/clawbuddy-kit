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

export interface GraphqlConnectionConfig {
  endpoint: string;
  auth: {
    type: AuthType;
    header: string;
    format: string;
  };
  schema_url?: string;
  subscription_url?: string;
}

interface GraphqlConfigProps {
  config: GraphqlConnectionConfig;
  apiKey: string;
  onChange: (config: GraphqlConnectionConfig) => void;
  onApiKeyChange: (key: string) => void;
}

const authTypeOptions: { value: AuthType; label: string; defaultFormat: string }[] = [
  { value: 'bearer', label: 'Bearer Token', defaultFormat: 'Bearer {KEY}' },
  { value: 'api_key', label: 'API Key Header', defaultFormat: '{KEY}' },
  { value: 'basic', label: 'Basic Auth', defaultFormat: 'Basic {KEY}' },
];

export const GraphqlConfig = ({
  config,
  apiKey,
  onChange,
  onApiKeyChange,
}: GraphqlConfigProps) => {
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
    if (!config.endpoint) return;
    
    setConnectionStatus('testing');
    setConnectionError(null);
    
    try {
      const url = new URL(config.endpoint);
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

  const isValidUrl = (urlStr: string) => {
    if (!urlStr) return true; // Empty is ok for optional fields
    try {
      new URL(urlStr);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-4">
      {/* Endpoint */}
      <div className="space-y-2">
        <Label htmlFor="graphqlEndpoint">
          GraphQL Endpoint <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="graphqlEndpoint"
            placeholder="https://api.github.com/graphql"
            value={config.endpoint}
            onChange={(e) => onChange({ ...config, endpoint: e.target.value })}
            className={!isValidUrl(config.endpoint) ? 'border-destructive' : ''}
          />
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={!isValidUrl(config.endpoint) || !config.endpoint || connectionStatus === 'testing'}
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
            Endpoint URL is valid
          </p>
        )}
        {connectionStatus === 'error' && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {connectionError || 'Invalid URL'}
          </p>
        )}
      </div>

      {/* Schema URL (optional) */}
      <div className="space-y-2">
        <Label htmlFor="schemaUrl">Schema URL (optional)</Label>
        <Input
          id="schemaUrl"
          placeholder="https://api.example.com/schema.graphql"
          value={config.schema_url || ''}
          onChange={(e) => onChange({ ...config, schema_url: e.target.value })}
          className={!isValidUrl(config.schema_url || '') ? 'border-destructive' : ''}
        />
        <p className="text-xs text-muted-foreground">
          Link to the GraphQL schema definition
        </p>
      </div>

      {/* Subscription URL (optional) */}
      <div className="space-y-2">
        <Label htmlFor="subscriptionUrl">Subscription URL (optional)</Label>
        <Input
          id="subscriptionUrl"
          placeholder="wss://api.example.com/graphql"
          value={config.subscription_url || ''}
          onChange={(e) => onChange({ ...config, subscription_url: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          WebSocket URL for GraphQL subscriptions
        </p>
      </div>

      {/* Authentication */}
      <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-muted/30">
        <h4 className="text-sm font-medium">Authentication</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="gqlAuthType">Auth Type</Label>
            <Select value={config.auth.type} onValueChange={(v) => handleAuthTypeChange(v as AuthType)}>
              <SelectTrigger id="gqlAuthType">
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
            <Label htmlFor="gqlAuthHeader">Header Name</Label>
            <Input
              id="gqlAuthHeader"
              placeholder="Authorization"
              value={config.auth.header}
              onChange={(e) => onChange({ ...config, auth: { ...config.auth, header: e.target.value } })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gqlAuthFormat">Header Format</Label>
          <Input
            id="gqlAuthFormat"
            placeholder="Bearer {KEY}"
            value={config.auth.format}
            onChange={(e) => onChange({ ...config, auth: { ...config.auth, format: e.target.value } })}
          />
          <p className="text-xs text-muted-foreground">
            Use {'{KEY}'} as placeholder for the API key
          </p>
        </div>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="gqlApiKey">API Key / Token</Label>
        <div className="relative">
          <Input
            id="gqlApiKey"
            type={showApiKey ? 'text' : 'password'}
            placeholder="ghp_xxxx..."
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
    </div>
  );
};
