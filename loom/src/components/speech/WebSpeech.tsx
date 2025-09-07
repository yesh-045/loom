'use client';

import { useEffect, useRef } from 'react';
import { useAISettings } from '@/context/AISettingsContext';

interface TextToSpeechProps {
  text: string;
}

export function TextToSpeech({ text }: TextToSpeechProps) {
  const { config } = useAISettings();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (config.voiceMode && text) {
      utteranceRef.current = new SpeechSynthesisUtterance(text);
      utteranceRef.current.rate = config.voiceSpeed;
      utteranceRef.current.pitch = config.voicePitch;
      utteranceRef.current.volume = config.voiceVolume;
      
      window.speechSynthesis.speak(utteranceRef.current);
    }

    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text, config]);

  return null;
}
