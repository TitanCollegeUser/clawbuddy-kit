import { useState } from 'react';
import { Globe, Mail, Code, Webhook, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAgentNames } from '@/contexts/AgentNamesContext';
import { 
  RestConfig, 
  SmtpConfig, 
  GraphqlConfig, 
  WebhookConfig, 
  CustomConfig,
  getDefaultConfig,
  protocolLabels,
  type ProtocolType,
  type RestConnectionConfig,
  type SmtpConnectionConfig,
  type GraphqlConnectionConfig,
  type WebhookConnectionConfig,
  type CustomConnectionConfig,
} from './protocols';
import type { SkillFormData } from './SkillWizard';

interface SkillApiConfigStepProps {
  data: SkillFormData;
  onChange: (data: SkillFormData) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const protocolIcons: Record<ProtocolType, typeof Globe> = {
  rest: Globe,
  smtp: Mail,
  graphql: Code,
  webhook: Webhook,
  custom: Settings,
};

export const SkillApiConfigStep = ({
  data,
  onChange,
  onNext,
  onBack,
  onCancel,
}: SkillApiConfigStepProps) => {
  const { agentNames } = useAgentNames();
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolType>(data.protocolType || 'rest');

  const handleProtocolChange = (protocol: ProtocolType) => {
    setSelectedProtocol(protocol);
    const defaultConfig = getDefaultConfig(protocol);
    
    // Preserve API key when switching protocols
    onChange({
      ...data,
      protocolType: protocol,
      connectionConfig: defaultConfig.config,
      // For REST, sync the legacy fields
      ...(protocol === 'rest' ? {
        apiBaseUrl: (defaultConfig.config as RestConnectionConfig).base_url,
        authType: (defaultConfig.config as RestConnectionConfig).auth.type,
        authHeader: (defaultConfig.config as RestConnectionConfig).auth.header,
        authFormat: (defaultConfig.config as RestConnectionConfig).auth.format,
      } : {}),
    });
  };

  const handleConfigChange = (config: RestConnectionConfig | SmtpConnectionConfig | GraphqlConnectionConfig | WebhookConnectionConfig | CustomConnectionConfig) => {
    onChange({
      ...data,
      connectionConfig: config,
      // For REST, keep legacy fields in sync
      ...(selectedProtocol === 'rest' ? {
        apiBaseUrl: (config as RestConnectionConfig).base_url,
        authType: (config as RestConnectionConfig).auth.type,
        authHeader: (config as RestConnectionConfig).auth.header,
        authFormat: (config as RestConnectionConfig).auth.format,
      } : {}),
    });
  };

  const canProceed = () => {
    switch (selectedProtocol) {
      case 'rest': {
        const config = data.connectionConfig as RestConnectionConfig;
        try {
          new URL(config?.base_url || '');
          return true;
        } catch {
          return false;
        }
      }
      case 'smtp': {
        const config = data.connectionConfig as SmtpConnectionConfig;
        return !!(config?.host && config?.port);
      }
      case 'graphql': {
        const config = data.connectionConfig as GraphqlConnectionConfig;
        try {
          new URL(config?.endpoint || '');
          return true;
        } catch {
          return false;
        }
      }
      case 'webhook':
        return true; // Webhooks have minimal requirements
      case 'custom': {
        const config = data.connectionConfig as CustomConnectionConfig;
        return !!(config?.description);
      }
      default:
        return false;
    }
  };

  // Initialize config if switching to this protocol for the first time
  const currentConfig = data.connectionConfig || getDefaultConfig(selectedProtocol).config;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Connection Configuration</CardTitle>
        <CardDescription>
          {`Configure how ${agentNames.primaryName} should connect to this service`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Protocol Selector */}
        <div className="space-y-3">
          <Label>Protocol Type</Label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {(Object.keys(protocolLabels) as ProtocolType[]).map((protocol) => {
              const Icon = protocolIcons[protocol];
              const { label } = protocolLabels[protocol];
              return (
                <button
                  key={protocol}
                  type="button"
                  onClick={() => handleProtocolChange(protocol)}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                    selectedProtocol === protocol
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {protocolLabels[selectedProtocol].description}
          </p>
        </div>

        {/* Protocol-Specific Configuration */}
        <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-muted/30">
          {selectedProtocol === 'rest' && (
            <RestConfig
              config={currentConfig as RestConnectionConfig}
              apiKey={data.apiKey}
              onChange={handleConfigChange}
              onApiKeyChange={(key) => onChange({ ...data, apiKey: key })}
            />
          )}
          
          {selectedProtocol === 'smtp' && (
            <SmtpConfig
              config={currentConfig as SmtpConnectionConfig}
              apiKey={data.apiKey}
              onChange={handleConfigChange}
              onApiKeyChange={(key) => onChange({ ...data, apiKey: key })}
            />
          )}
          
          {selectedProtocol === 'graphql' && (
            <GraphqlConfig
              config={currentConfig as GraphqlConnectionConfig}
              apiKey={data.apiKey}
              onChange={handleConfigChange}
              onApiKeyChange={(key) => onChange({ ...data, apiKey: key })}
            />
          )}
          
          {selectedProtocol === 'webhook' && (
            <WebhookConfig
              config={currentConfig as WebhookConnectionConfig}
              apiKey={data.apiKey}
              onChange={handleConfigChange}
              onApiKeyChange={(key) => onChange({ ...data, apiKey: key })}
            />
          )}
          
          {selectedProtocol === 'custom' && (
            <CustomConfig
              config={currentConfig as CustomConnectionConfig}
              apiKey={data.apiKey}
              onChange={handleConfigChange}
              onApiKeyChange={(key) => onChange({ ...data, apiKey: key })}
            />
          )}
        </div>

        {/* Additional Notes for Agent */}
        <div className="space-y-2">
          <Label htmlFor="additionalNotes">{`Additional Notes for ${agentNames.primaryName}`}</Label>
          <Textarea
            id="additionalNotes"
            placeholder={`Add any important context for ${agentNames.primaryName}:\n- Rate limits (e.g., 100 requests/min)\n- API quirks or limitations\n- Required scopes or permissions\n- Testing vs production endpoints\n- Documentation links`}
            value={data.additionalNotes || ''}
            onChange={(e) => onChange({ ...data, additionalNotes: e.target.value })}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {`This information helps ${agentNames.primaryName} understand how to use this skill effectively`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onNext} disabled={!canProceed()}>
              Next: Operations →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
