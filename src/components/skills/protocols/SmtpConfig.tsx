import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SmtpConnectionConfig {
  host: string;
  port: number;
  tls: boolean;
  starttls: boolean;
  username: string;
  auth_method: 'password' | 'oauth';
}

interface SmtpConfigProps {
  config: SmtpConnectionConfig;
  apiKey: string;
  onChange: (config: SmtpConnectionConfig) => void;
  onApiKeyChange: (key: string) => void;
}

const portPresets = [
  { port: 587, label: '587 (STARTTLS - Recommended)', tls: false, starttls: true },
  { port: 465, label: '465 (TLS/SSL)', tls: true, starttls: false },
  { port: 25, label: '25 (Unencrypted - Not recommended)', tls: false, starttls: false },
  { port: 2525, label: '2525 (Alternative)', tls: false, starttls: true },
];

// Default SMTP config values
const defaultSmtpConfig: SmtpConnectionConfig = {
  host: '',
  port: 587,
  tls: false,
  starttls: true,
  username: '',
  auth_method: 'password',
};

export const SmtpConfig = ({
  config,
  apiKey,
  onChange,
  onApiKeyChange,
}: SmtpConfigProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Merge with defaults to handle undefined properties
  const safeConfig: SmtpConnectionConfig = {
    ...defaultSmtpConfig,
    ...config,
  };

  const handlePortChange = (portStr: string) => {
    const port = parseInt(portStr, 10);
    const preset = portPresets.find(p => p.port === port);
    if (preset) {
      onChange({
        ...safeConfig,
        port,
        tls: preset.tls,
        starttls: preset.starttls,
      });
    } else {
      onChange({ ...safeConfig, port });
    }
  };

  const handleTestConnection = async () => {
    if (!safeConfig.host) return;
    
    setConnectionStatus('testing');
    setConnectionError(null);
    
    // Basic validation - SMTP testing would need a backend
    try {
      if (safeConfig.host && safeConfig.port) {
        setConnectionStatus('success');
      } else {
        throw new Error('Host and port required');
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : 'Validation failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Host */}
      <div className="space-y-2">
        <Label htmlFor="smtpHost">
          SMTP Host <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="smtpHost"
            placeholder="smtp.resend.com"
            value={safeConfig.host}
            onChange={(e) => onChange({ ...safeConfig, host: e.target.value })}
          />
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={!safeConfig.host || connectionStatus === 'testing'}
          >
            {connectionStatus === 'testing' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Validate'
            )}
          </Button>
        </div>
        {connectionStatus === 'success' && (
          <p className="text-xs text-primary flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Configuration looks valid
          </p>
        )}
        {connectionStatus === 'error' && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {connectionError}
          </p>
        )}
      </div>

      {/* Port */}
      <div className="space-y-2">
        <Label htmlFor="smtpPort">Port <span className="text-destructive">*</span></Label>
        <Select value={safeConfig.port.toString()} onValueChange={handlePortChange}>
          <SelectTrigger id="smtpPort">
            <SelectValue placeholder="Select port" />
          </SelectTrigger>
          <SelectContent>
            {portPresets.map((preset) => (
              <SelectItem key={preset.port} value={preset.port.toString()}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Security Options */}
      <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-muted/30">
        <h4 className="text-sm font-medium">Security</h4>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="tls" className="text-sm">TLS/SSL</Label>
            <p className="text-xs text-muted-foreground">Direct TLS connection</p>
          </div>
          <Switch
            id="tls"
            checked={safeConfig.tls}
            onCheckedChange={(checked) => onChange({ ...safeConfig, tls: checked, starttls: checked ? false : safeConfig.starttls })}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="starttls" className="text-sm">STARTTLS</Label>
            <p className="text-xs text-muted-foreground">Upgrade to TLS after connecting</p>
          </div>
          <Switch
            id="starttls"
            checked={safeConfig.starttls}
            onCheckedChange={(checked) => onChange({ ...safeConfig, starttls: checked, tls: checked ? false : safeConfig.tls })}
          />
        </div>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <Label htmlFor="smtpUsername">Username</Label>
        <Input
          id="smtpUsername"
          placeholder="resend (or your email address)"
          value={safeConfig.username}
          onChange={(e) => onChange({ ...safeConfig, username: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          For Resend, use "resend" as username
        </p>
      </div>

      {/* Auth Method */}
      <div className="space-y-2">
        <Label htmlFor="authMethod">Authentication Method</Label>
        <Select 
          value={safeConfig.auth_method} 
          onValueChange={(v) => onChange({ ...safeConfig, auth_method: v as 'password' | 'oauth' })}
        >
          <SelectTrigger id="authMethod">
            <SelectValue placeholder="Select auth method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="password">Password / API Key</SelectItem>
            <SelectItem value="oauth">OAuth 2.0</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Password / API Key */}
      <div className="space-y-2">
        <Label htmlFor="smtpPassword">
          {safeConfig.auth_method === 'oauth' ? 'OAuth Token' : 'Password / API Key'}
        </Label>
        <div className="relative">
          <Input
            id="smtpPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder={safeConfig.auth_method === 'oauth' ? 'OAuth token...' : 're_ABC123xyz...'}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          For Resend SMTP, use your API key as the password
        </p>
      </div>
    </div>
  );
};
