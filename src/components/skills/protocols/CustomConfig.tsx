import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAgentNames } from '@/contexts/AgentNamesContext';

export interface CustomConnectionConfig {
  config_json: string;
  description: string;
}

interface CustomConfigProps {
  config: CustomConnectionConfig;
  apiKey: string;
  onChange: (config: CustomConnectionConfig) => void;
  onApiKeyChange: (key: string) => void;
}

export const CustomConfig = ({
  config,
  apiKey,
  onChange,
  onApiKeyChange,
}: CustomConfigProps) => {
  const { agentNames } = useAgentNames();
  const [showApiKey, setShowApiKey] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonChange = (value: string) => {
    onChange({ ...config, config_json: value });
    
    // Validate JSON
    if (value.trim()) {
      try {
        JSON.parse(value);
        setJsonError(null);
      } catch (e) {
        setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
      }
    } else {
      setJsonError(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="flex gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
        <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-primary">Custom Configuration</p>
          <p className="text-muted-foreground mt-1">
            Use this for APIs that don't fit the standard REST, SMTP, or GraphQL patterns. 
            {`Provide any connection details ${agentNames.primaryName} needs in JSON format or as a description.`}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="customDescription">
          Connection Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="customDescription"
          placeholder="Describe how to connect to this service. For example:&#10;&#10;This service uses WebSocket connections at wss://api.example.com/ws&#10;Authentication is done by sending a 'login' message with the API key."
          value={config.description}
          onChange={(e) => onChange({ ...config, description: e.target.value })}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">
          Describe the connection method, authentication flow, and any special requirements
        </p>
      </div>

      {/* JSON Configuration */}
      <div className="space-y-2">
        <Label htmlFor="configJson">Configuration (JSON, optional)</Label>
        <Textarea
          id="configJson"
          placeholder={`{
  "endpoint": "wss://api.example.com/ws",
  "protocol": "websocket",
  "message_format": "json",
  "auth_message": {
    "type": "auth",
    "token": "{KEY}"
  }
}`}
          value={config.config_json}
          onChange={(e) => handleJsonChange(e.target.value)}
          rows={8}
          className={`font-mono text-sm ${jsonError ? 'border-destructive' : ''}`}
        />
        {jsonError && (
          <p className="text-xs text-destructive">
            {jsonError}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Provide structured configuration if applicable. Use {'{KEY}'} as placeholder for secrets.
        </p>
      </div>

      {/* API Key / Secret */}
      <div className="space-y-2">
        <Label htmlFor="customApiKey">API Key / Secret (if needed)</Label>
        <div className="relative">
          <Input
            id="customApiKey"
            type={showApiKey ? 'text' : 'password'}
            placeholder="Your API key or secret..."
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
