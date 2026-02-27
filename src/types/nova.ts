// Nova domain types — manual definitions matching DB schema

export interface NovaTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  variables: string[];
  category: string;
  tags: string[];
  usage_count: number;
  avg_open_rate: number;
  avg_reply_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NovaSequence {
  id: string;
  name: string;
  description: string | null;
  status: string;
  steps: NovaSequenceStep[];
  total_enrolled: number;
  active_count: number;
  completed_count: number;
  stopped_count: number;
  avg_completion_rate: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface NovaSequenceStep {
  step: number;
  template_id: string;
  delay_days: number;
  condition: "no_reply" | "no_open" | "no_click" | "always";
}

export interface NovaCampaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  sequence_id: string | null;
  template_id: string | null;
  from_address: string;
  total_leads: number;
  emails_sent: number;
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
  emails_replied: number;
  emails_bounced: number;
  meetings_booked: number;
  total_cost: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
  personalization_level: string;
  send_limit_per_day: number;
  send_window_start: string;
  send_window_end: string;
  timezone: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NovaEmail {
  id: string;
  resend_id: string | null;
  campaign_id: string | null;
  sequence_id: string | null;
  sequence_step: number | null;
  template_id: string | null;
  lead_id: string | null;
  from_address: string;
  to_address: string;
  to_name: string | null;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  personalization_fields: Record<string, string>;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  first_open_at: string | null;
  open_count: number;
  clicked_at: string | null;
  click_count: number;
  replied_at: string | null;
  reply_snippet: string | null;
  bounced_at: string | null;
  bounce_type: string | null;
  failed_at: string | null;
  error_message: string | null;
  meeting_booked: boolean;
  tags: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NovaDailyMetric {
  id: string;
  date: string;
  emails_sent: number;
  emails_delivered: number;
  emails_opened: number;
  emails_clicked: number;
  emails_replied: number;
  emails_bounced: number;
  meetings_booked: number;
  total_cost: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
  bounce_rate: number;
  avg_open_time_hours: number;
  top_subject: string | null;
  created_at: string;
}

export type EmailStatus = "queued" | "sending" | "delivered" | "opened" | "clicked" | "replied" | "bounced" | "failed";
export type TemplateCategory = "outreach" | "follow-up" | "nurture" | "re-engagement" | "meeting-request";
export type SequenceStatus = "draft" | "active" | "paused" | "completed";
export type CampaignStatus = "draft" | "scheduled" | "running" | "paused" | "completed";
