import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const STORAGE_KEY = 'clawbuddy_agent_names';

interface AgentNames {
  primaryName: string;
  intelligenceName: string;
}

interface AgentNamesContextType {
  agentNames: AgentNames;
  updateAgentNames: (names: Partial<AgentNames>) => void;
}

const defaults: AgentNames = {
  primaryName: 'AI',
  intelligenceName: 'Sherlock',
};

function loadFromStorage(): AgentNames {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        primaryName: parsed.primaryName || defaults.primaryName,
        intelligenceName: parsed.intelligenceName || defaults.intelligenceName,
      };
    }
  } catch {
    // ignore parse errors
  }
  return defaults;
}

const AgentNamesContext = createContext<AgentNamesContextType | undefined>(undefined);

export const AgentNamesProvider = ({ children }: { children: ReactNode }) => {
  const [agentNames, setAgentNames] = useState<AgentNames>(loadFromStorage);

  const updateAgentNames = useCallback((names: Partial<AgentNames>) => {
    setAgentNames((prev) => {
      const next = { ...prev, ...names };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <AgentNamesContext.Provider value={{ agentNames, updateAgentNames }}>
      {children}
    </AgentNamesContext.Provider>
  );
};

export const useAgentNames = () => {
  const context = useContext(AgentNamesContext);
  if (context === undefined) {
    throw new Error('useAgentNames must be used within an AgentNamesProvider');
  }
  return context;
};
