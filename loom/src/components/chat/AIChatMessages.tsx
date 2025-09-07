'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { ScrollArea } from "../ui/scroll-area";
import { ChatMessage } from "@/lib/types";
import Quiz from "./interactive-components/quiz";
import PptSlides from "./interactive-components/PptSlides";
import Flashcards from "./interactive-components/flashcards";
import ImageUploader from "./interactive-components/ImageUploader";
import DrawingCanvas from "./interactive-components/DrawingCanvas";
import Spelling from "./interactive-components/spelling";
import PhysicsSimulator from "./interactive-components/PhysicsSimulator";
import ReactMarkdown from 'react-markdown';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import React from "react";
import { useAISettings } from "@/context/AISettingsContext";
import { TextToSpeech } from "@/components/speech/WebSpeech";

interface AIChatMessagesProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function AIChatMessages({ messages, setMessages }: AIChatMessagesProps) {
  const { config } = useAISettings();
  
  return (
    <ScrollArea className="flex-grow w-full p-0 md:p-2 space-y-4">
      {messages.map((message, index) => {
        return (
          <div
            key={index}
            className={`flex items-start space-x-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role !== 'user' && (
              <Avatar className="bg-muted flex-shrink-0 w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10">
                <AvatarFallback>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#A0AEC0" strokeWidth="2" />
                  </svg>
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={`rounded-lg mb-4 ${message.role === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted border-2 border-gray-300'
                }
              ${!message.componentMessageType && 'py-2 px-4'}
              `}
            >
              {message.content && (
                <>
                  {message.role === 'assistant' && config.voiceMode && typeof message.content === 'string' && (
                    <TextToSpeech text={message.content} />
                  )}
                  {(() => {
                    switch (message.componentMessageType) {
                      case 'quiz':
                        if (typeof message.content === 'string') {
                          const parsedContent = JSON.parse(message.content);
                          return <Quiz questions={parsedContent.questions} />;
                        }
                        break;
                      case 'ppt':
                        if (typeof message.content === 'string') {
                          const parsedContent = JSON.parse(message.content);
                          return <PptSlides slides={parsedContent.slides} />;
                        }
                        break;
                      case 'flashcards':
                        if (typeof message.content === 'string') {
                          const parsedContent = JSON.parse(message.content);
                          return <Flashcards flashcards={parsedContent.flashcards} />;
                        }
                        break;
                      case 'canvas':
                        return <DrawingCanvas messages={messages} setMessages={setMessages} />;
                      case 'image':
                        return <ImageUploader messages={messages} setMessages={setMessages} />;
                      case 'spelling':
                        if (typeof message.content === 'string') {
                          const parsedContent = JSON.parse(message.content);
                          return <Spelling spellings={parsedContent.spellings} />;
                        }
                        break;
                      case 'physics':
                        if (typeof message.content === 'string') {
                          const parsedContent = JSON.parse(message.content);
                          return <PhysicsSimulator objects={parsedContent.objects} />;
                        }
                        break;
                      default:
                        if (typeof message.content === 'string') {
                          return <ReactMarkdown>{message.content}</ReactMarkdown>;
                        } else if (Array.isArray(message.content)) {
                          return message.content.map((content, i) => {
                            if ('text' in content) {
                              return <ReactMarkdown key={i}>{content.text}</ReactMarkdown>;
                            }
                            return null;
                          });
                        }
                        return null;
                    }
                  })()}
                </>
              )}
            </div>
          </div>
        );
      })}
    </ScrollArea>
  );
}



