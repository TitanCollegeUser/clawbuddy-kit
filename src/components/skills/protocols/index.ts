import { RestConfig, type RestConnectionConfig } from './RestConfig';
import { SmtpConfig, type SmtpConnectionConfig } from './SmtpConfig';
import { GraphqlConfig, type GraphqlConnectionConfig } from './GraphqlConfig';
import { WebhookConfig, type WebhookConnectionConfig } from './WebhookConfig';
import { CustomConfig, type CustomConnectionConfig } from './CustomConfig';

export { RestConfig, SmtpConfig, GraphqlConfig, WebhookConfig, CustomConfig };
export type { RestConnectionConfig, SmtpConnectionConfig, GraphqlConnectionConfig, WebhookConnectionConfig, CustomConnectionConfig };

export type ProtocolType = 'rest' | 'smtp' | 'graphql' | 'webhook' | 'custom';

export type ConnectionConfig = 
  | { type: 'rest'; config: RestConnectionConfig }
  | { type: 'smtp'; config: SmtpConnectionConfig }
  | { type: 'graphql'; config: GraphqlConnectionConfig }
  | { type: 'webhook'; config: WebhookConnectionConfig }
  | { type: 'custom'; config: CustomConnectionConfig };

export const protocolLabels: Record<ProtocolType, { label: string; description: string }> = {
  rest: { label: 'REST API', description: 'Standard HTTP REST endpoints' },
  smtp: { label: 'SMTP', description: 'Email sending via SMTP' },
  graphql: { label: 'GraphQL', description: 'GraphQL query/mutation API' },
  webhook: { label: 'Webhook', description: 'Receive events via webhooks' },
  custom: { label: 'Custom', description: 'Any other protocol or integration' },
};

export const getDefaultConfig = (protocol: ProtocolType): ConnectionConfig => {
  switch (protocol) {
    case 'rest':
      return {
        type: 'rest',
        config: {
          base_url: '',
          auth: { type: 'bearer', header: 'Authorization', format: 'Bearer {KEY}' },
        },
      };
    case 'smtp':
      return {
        type: 'smtp',
        config: {
          host: '',
          port: 587,
          tls: false,
          starttls: true,
          username: '',
          auth_method: 'password',
        },
      };
    case 'graphql':
      return {
        type: 'graphql',
        config: {
          endpoint: '',
          auth: { type: 'bearer', header: 'Authorization', format: 'Bearer {KEY}' },
        },
      };
    case 'webhook':
      return {
        type: 'webhook',
        config: {
          event_types: [],
          signature_algorithm: 'hmac-sha256',
        },
      };
    case 'custom':
      return {
        type: 'custom',
        config: {
          config_json: '',
          description: '',
        },
      };
  }
};
