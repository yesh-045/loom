export interface AIResponse {
  content: string;
  contentType?: 'text' | 'quiz' | 'ppt' | 'flashcards' | 'physics' | 'spelling' | 'canvas' | 'image';
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: 'text', text: string } | { type: 'image', imageUrl: string }>;
  componentMessageType?: 'quiz' | 'ppt' | 'flashcards' | 'physics' | 'spelling' | 'canvas' | 'image' | 'speech' | 'speech-training';
}

export interface AIConfigState {
  voiceMode: boolean;
  voiceSpeed: number;
  voicePitch: number;
  voiceVolume: number;
}

export interface AISettings {
  config: AIConfigState;
  updateConfig: (config: Partial<AIConfigState>) => void;
}
