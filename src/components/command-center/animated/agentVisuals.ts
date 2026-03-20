import { AgentVisual } from './types';

export const AGENT_VISUALS: Record<string, AgentVisual> = {
  Sherlock: {
    species: 'cat',
    furColor: '#6b7280',
    furHighlight: '#9ca3af',
    suitColor: '#1e293b',
    neonColor: '#10b981',
    emoji: '🔍',
    name: 'Sherlock',
  },
  Ray: {
    species: 'fox',
    furColor: '#ea580c',
    furHighlight: '#fb923c',
    suitColor: '#1e1b4b',
    neonColor: '#f59e0b',
    emoji: '☀️',
    name: 'Ray',
  },
  Watson: {
    species: 'owl',
    furColor: '#78350f',
    furHighlight: '#a16207',
    suitColor: '#1c1917',
    neonColor: '#06b6d4',
    emoji: '🦉',
    name: 'Watson',
  },
};

export function getAgentVisual(name: string): AgentVisual {
  return AGENT_VISUALS[name] || {
    species: 'robot',
    furColor: '#4b5563',
    furHighlight: '#6b7280',
    suitColor: '#1f2937',
    neonColor: '#10b981',
    emoji: '🤖',
    name,
  };
}

export const PIPELINE_PHASES = [
  { id: 'CTX', label: 'CTX', icon: '📋', stationDescription: 'Context' },
  { id: 'PLN', label: 'PLN', icon: '📝', stationDescription: 'Plan' },
  { id: 'TSK', label: 'TSK', icon: '📌', stationDescription: 'Tasks' },
  { id: 'BLD', label: 'BLD', icon: '💻', stationDescription: 'Build' },
  { id: 'VAL', label: 'VAL', icon: '✅', stationDescription: 'Validate' },
  { id: 'HEL', label: 'HEL', icon: '🔧', stationDescription: 'Heal' },
  { id: 'RPT', label: 'RPT', icon: '📊', stationDescription: 'Report' },
  { id: 'CLS', label: 'CLS', icon: '🏁', stationDescription: 'Close' },
];
