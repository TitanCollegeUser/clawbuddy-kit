export interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CostItem {
  type: string;
  provider: string;
  credit: number;
  prompt_tokens?: number;
  completion_tokens?: number;
}

export interface CallMetrics {
  utterance_latency: {
    avg: number;
    max: number;
    min: number;
  };
}

export interface CallRecord {
  id: string;
  session_id: string;
  agent_id: string;
  call_status: string;
  duration_seconds: number;
  transcript: TranscriptMessage[];
  cost_breakdown: CostItem[];
  total_cost: number;
  call_metrics: CallMetrics;
  caller_number: string;
  callee_number: string;
  recording_url?: string;
  sentiment: string;
  call_type: string;
  campaign_id?: string;
  summary: string;
  action_items?: string[];
  tags: string[];
  created_at: string;
}

export interface Campaign {
  id: string;
  millis_campaign_id?: string;
  name: string;
  status: string;
  total_records: number;
  calls_made: number;
  calls_answered: number;
  calls_voicemail: number;
  calls_failed: number;
  avg_duration_seconds: number;
  total_cost: number;
  caller_id?: string;
  ai_prompt?: string;
  prompt_variables?: string[];
  from_phone?: string;
  agent_id?: string;
  call_delay_seconds?: number;
  max_retries?: number;
  created_at: string;
}

export interface LexaLead {
  id: string;
  campaign_id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  custom_fields: Record<string, string>;
  status: 'pending' | 'calling' | 'completed' | 'failed' | 'skipped';
  call_session_id?: string;
  call_result?: string;
  call_duration_seconds: number;
  call_sentiment?: string;
  call_summary?: string;
  attempts: number;
  last_attempt_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DailyMetric {
  date: string;
  total_calls: number;
  inbound_calls: number;
  outbound_calls: number;
  campaign_calls: number;
  total_duration_seconds: number;
  avg_duration_seconds: number;
  total_cost: number;
  calls_answered: number;
  calls_voicemail: number;
  calls_failed: number;
  avg_latency_ms: number;
}
