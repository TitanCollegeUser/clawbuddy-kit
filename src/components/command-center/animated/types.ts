export interface AgentVisual {
  species: 'cat' | 'fox' | 'owl' | 'robot';
  furColor: string;
  furHighlight: string;
  suitColor: string;
  neonColor: string;
  emoji: string;
  name: string;
}

export interface PipelinePhase {
  id: string;
  label: string;
  icon: string;
  stationDescription: string;
}

export interface CouncilMessage {
  id: string;
  fromAgent: string;
  fromEmoji: string;
  message: string;
  messageNumber: number;
}

export interface CouncilParticipant {
  name: string;
  emoji: string;
  messageLimit: number;
  messagesSent: number;
}

export interface CouncilSession {
  id: string;
  question: string;
  status: 'pending' | 'active' | 'completed';
  participants: CouncilParticipant[];
  messages: CouncilMessage[];
}

export interface PipelineState {
  currentPhaseIndex: number;
  isActive: boolean;
  status: 'idle' | 'active' | 'completed' | 'failed';
  percentComplete: number;
  agentName: string;
  dispatcherName?: string;
}
