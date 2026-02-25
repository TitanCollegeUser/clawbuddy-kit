export interface CronConfig {
  frequency: 'minutes' | 'hours' | 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number;
  time: { hour: number; minute: number };
  days: number[]; // 0=Sun..6=Sat for weekly; 1-31 for monthly
  customCron: string;
}

export const DEFAULT_CRON_CONFIG: CronConfig = {
  frequency: 'daily',
  interval: 1,
  time: { hour: 8, minute: 0 },
  days: [],
  customCron: '',
};

export function buildCron(config: CronConfig): string {
  const { frequency, interval, time, days, customCron } = config;
  switch (frequency) {
    case 'minutes':
      return `*/${interval} * * * *`;
    case 'hours':
      return `0 */${interval} * * *`;
    case 'daily':
      return `${time.minute} ${time.hour} * * *`;
    case 'weekly': {
      const d = days.length ? days.join(',') : '1';
      return `${time.minute} ${time.hour} * * ${d}`;
    }
    case 'monthly': {
      const d = days.length ? days.join(',') : '1';
      return `${time.minute} ${time.hour} ${d} * *`;
    }
    case 'custom':
      return customCron || '0 8 * * *';
    default:
      return '0 8 * * *';
  }
}

export function parseCron(cron: string): CronConfig {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return { ...DEFAULT_CRON_CONFIG, frequency: 'custom', customCron: cron };

  const [min, hour, dom, , dow] = parts;

  // Every N minutes
  if (min.startsWith('*/') && hour === '*') {
    return { ...DEFAULT_CRON_CONFIG, frequency: 'minutes', interval: parseInt(min.slice(2)) || 5 };
  }
  // Every N hours
  if (min === '0' && hour.startsWith('*/')) {
    return { ...DEFAULT_CRON_CONFIG, frequency: 'hours', interval: parseInt(hour.slice(2)) || 1 };
  }
  // Weekly
  if (dom === '*' && dow !== '*') {
    return {
      ...DEFAULT_CRON_CONFIG,
      frequency: 'weekly',
      time: { hour: parseInt(hour) || 0, minute: parseInt(min) || 0 },
      days: dow.split(',').map(Number),
    };
  }
  // Monthly
  if (dom !== '*' && dow === '*') {
    return {
      ...DEFAULT_CRON_CONFIG,
      frequency: 'monthly',
      time: { hour: parseInt(hour) || 0, minute: parseInt(min) || 0 },
      days: dom.split(',').map(Number),
    };
  }
  // Daily
  if (dom === '*' && dow === '*' && !hour.includes('/') && !min.includes('/')) {
    return {
      ...DEFAULT_CRON_CONFIG,
      frequency: 'daily',
      time: { hour: parseInt(hour) || 0, minute: parseInt(min) || 0 },
    };
  }

  return { ...DEFAULT_CRON_CONFIG, frequency: 'custom', customCron: cron };
}

export function cronToHuman(cron: string): string {
  const config = parseCron(cron);
  const fmtTime = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
  };
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  switch (config.frequency) {
    case 'minutes':
      return `Every ${config.interval} minute${config.interval > 1 ? 's' : ''}`;
    case 'hours':
      return `Every ${config.interval} hour${config.interval > 1 ? 's' : ''}`;
    case 'daily':
      return `Every day at ${fmtTime(config.time.hour, config.time.minute)}`;
    case 'weekly':
      return `Every ${config.days.map(d => dayNames[d] || d).join(', ')} at ${fmtTime(config.time.hour, config.time.minute)}`;
    case 'monthly':
      return `Monthly on day ${config.days.join(', ')} at ${fmtTime(config.time.hour, config.time.minute)}`;
    case 'custom':
      return cron;
    default:
      return cron;
  }
}

export function getNextRuns(cron: string, count: number, _timezone?: string): Date[] {
  const config = parseCron(cron);
  const runs: Date[] = [];
  const now = new Date();
  let cursor = new Date(now);
  cursor.setSeconds(0, 0);

  const maxIterations = 525600; // 1 year of minutes
  let iterations = 0;

  // Advance by 1 minute to start
  cursor = new Date(cursor.getTime() + 60000);

  while (runs.length < count && iterations < maxIterations) {
    iterations++;
    const m = cursor.getMinutes();
    const h = cursor.getHours();
    const dom = cursor.getDate();
    const dow = cursor.getDay();
    let match = false;

    switch (config.frequency) {
      case 'minutes':
        match = m % config.interval === 0;
        break;
      case 'hours':
        match = m === 0 && h % config.interval === 0;
        break;
      case 'daily':
        match = h === config.time.hour && m === config.time.minute;
        break;
      case 'weekly':
        match = config.days.includes(dow) && h === config.time.hour && m === config.time.minute;
        break;
      case 'monthly':
        match = config.days.includes(dom) && h === config.time.hour && m === config.time.minute;
        break;
      case 'custom':
        // For custom, just return daily at midnight as fallback
        match = h === 0 && m === 0;
        break;
    }

    if (match) runs.push(new Date(cursor));
    cursor = new Date(cursor.getTime() + 60000);
  }

  return runs;
}
