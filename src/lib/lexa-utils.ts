export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export const statusColors: Record<string, string> = {
  'user-ended': 'hsl(160, 60%, 52%)',
  'agent-ended': 'hsl(187, 82%, 53%)',
  'voicemail-message': 'hsl(43, 96%, 56%)',
  'voicemail-hangup': 'hsl(27, 97%, 62%)',
  'timeout': 'hsl(0, 91%, 71%)',
  'error': 'hsl(0, 84%, 60%)',
  'api-ended': 'hsl(217, 91%, 69%)',
};

export const statusLabels: Record<string, string> = {
  'user-ended': 'Completed',
  'agent-ended': 'Agent Ended',
  'voicemail-message': 'Voicemail',
  'voicemail-hangup': 'VM Hangup',
  'timeout': 'Timeout',
  'error': 'Error',
  'api-ended': 'API Ended',
};

export const sentimentColors: Record<string, string> = {
  positive: 'hsl(160, 60%, 52%)',
  neutral: 'hsl(217, 91%, 69%)',
  negative: 'hsl(0, 91%, 71%)',
};
