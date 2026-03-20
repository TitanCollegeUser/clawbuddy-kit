// Meetup Launch data types — matches OpsCenter ops_data record shapes
export interface VenueRecord {
  id: string;
  title: string;
  status: string;
  data: {
    contact_name: string;
    email: string;
    phone: string;
    address: string;
    capacity: number | null;
    cost: string;
    notes: string;
    last_contact: string | null;
  };
}

export interface SponsorRecord {
  id: string;
  title: string;
  status: string;
  data: {
    contact_name: string;
    channel: string;
    tier: string;
    ask_amount: number | null;
    reason: string;
    approach?: string;
    last_contact: string | null;
  };
}

export interface EventRecord {
  id: string;
  title: string;
  status: string;
  data: {
    event_type: string;
    date: string;
    time: string;
    venue: string;
    audience: string;
    target_attendees: number;
    actual_attendees: number | null;
    skool_signups: number | null;
    discovery_calls: number | null;
    content_pieces: number | null;
    notes: string;
  };
}

export interface OutreachRecord {
  id: string;
  title: string;
  status: string;
  data: {
    contact_name: string;
    channel: string;
    type: string;
    notes: string;
    sent_date?: string | null;
    days_since_contact?: number | null;
  };
}

export interface TimelineEvent {
  id: string;
  title: string;
  event_type: string;
  agent: string;
  timestamp: string;
  contact?: string;
  org?: string;
}

export interface OutreachLogEntry {
  id: string;
  title: string;
  type: string;
  contact: string;
  org: string;
  detail: string;
  agent: string;
  timestamp: string;
}

export interface DashboardMetrics {
  events_completed: number;
  venues_contacted: number;
  sponsors_contacted: number;
  sponsors_confirmed: number;
  skool_signups: number;
  pipeline_value: number;
}
