'use client';

import { createContext, useContext, useState } from 'react';
import { AIConfigState, AISettings } from '@/lib/types';

const defaultConfig: AIConfigState = {
  voiceMode: false,
  voiceSpeed: 1,
  voicePitch: 1,
  voiceVolume: 1
};

const AISettingsContext = createContext<AISettings | null>(null);

export function AISettingsProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AIConfigState>(defaultConfig);

  const updateConfig = (newConfig: Partial<AIConfigState>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  return (
    <AISettingsContext.Provider value={{ config, updateConfig }}>
      {children}
    </AISettingsContext.Provider>
  );
}

export function useAISettings() {
  const context = useContext(AISettingsContext);
  if (!context) {
    throw new Error('useAISettings must be used within an AISettingsProvider');
  }
  return context;
}
