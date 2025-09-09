'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import { ScrollArea } from "../ui/scroll-area";
import { ChatMessage } from "@/lib/types";
import { Quiz, PptSlides, Flashcards, ImageUploader, DrawingCanvas, Spelling, PhysicsSimulator, SpeechTraining } from './interactive-components';
import ReactMarkdown from 'react-markdown';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import React from "react";
import { useAISettings } from "@/context/AISettingsContext";
import { TextToSpeech } from "@/components/speech/WebSpeech";

// Error Boundary Component
class ComponentErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Component Error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component Error Details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

interface AIChatMessagesProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export default function AIChatMessages({ messages, setMessages }: AIChatMessagesProps) {
  const { config } = useAISettings();
  
  return (
  <ScrollArea className="flex-grow w-full p-0 md:p-2 space-y-4 font-sans">
      {messages.map((message, index) => {
        return (
          <div
            key={index}
            className={`flex items-start space-x-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role !== 'user' && (
              <Avatar className="bg-secondary flex-shrink-0 w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10">
                <AvatarFallback>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="#A0AEC0" strokeWidth="2" />
                  </svg>
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={`rounded-2xl shadow-sm mb-4 ${message.role === 'user'
                ? 'bg-melon-500 text-white'
                : 'bg-silver-600 text-taupe-500 border border-border'
                }
              ${!message.componentMessageType && 'py-2 px-4'}
              `}
            >
              {message.content && (
                <>
                  {message.role === 'assistant' && config.voiceMode && typeof message.content === 'string' && !message.componentMessageType && (
                    <TextToSpeech text={message.content} />
                  )}
                  {(() => {
                    switch (message.componentMessageType) {
                      case 'quiz':
                        if (typeof message.content === 'string') {
                          try {
                            const parsedContent = JSON.parse(message.content);
                            return (
                              <ComponentErrorBoundary fallback={
                                <div className="p-4 bg-red-50 border border-red-200 rounded">
                                  <p className="text-red-600">Quiz component error. Please try refreshing.</p>
                                </div>
                              }>
                                <Quiz questions={parsedContent.questions} />
                              </ComponentErrorBoundary>
                            );
                          } catch (error) {
                            return (
                              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-yellow-600">Invalid quiz data. Raw content:</p>
                                <pre className="text-xs mt-2 overflow-auto">{message.content}</pre>
                              </div>
                            );
                          }
                        }
                        break;
                      case 'ppt':
                        if (typeof message.content === 'string') {
                          try {
                            const parsedContent = JSON.parse(message.content);
                            return (
                              <ComponentErrorBoundary fallback={
                                <div className="p-4 bg-red-50 border border-red-200 rounded">
                                  <p className="text-red-600">Presentation component error. Please try refreshing.</p>
                                </div>
                              }>
                                <PptSlides slides={parsedContent.slides} />
                              </ComponentErrorBoundary>
                            );
                          } catch (error) {
                            return (
                              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-yellow-600">Invalid presentation data. Raw content:</p>
                                <pre className="text-xs mt-2 overflow-auto">{message.content}</pre>
                              </div>
                            );
                          }
                        }
                        break;
                      case 'flashcards':
                        if (typeof message.content === 'string') {
                          try {
                            const parsedContent = JSON.parse(message.content);
                            return (
                              <ComponentErrorBoundary fallback={
                                <div className="p-4 bg-red-50 border border-red-200 rounded">
                                  <p className="text-red-600">Flashcards component error. Please try refreshing.</p>
                                </div>
                              }>
                                <Flashcards flashcards={parsedContent.flashcards} />
                              </ComponentErrorBoundary>
                            );
                          } catch (error) {
                            return (
                              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-yellow-600">Invalid flashcards data. Raw content:</p>
                                <pre className="text-xs mt-2 overflow-auto">{message.content}</pre>
                              </div>
                            );
                          }
                        }
                        break;
                      case 'canvas':
                        return (
                          <ComponentErrorBoundary fallback={
                            <div className="p-4 bg-red-50 border border-red-200 rounded">
                              <p className="text-red-600">Drawing canvas error. Please try refreshing.</p>
                            </div>
                          }>
                            <DrawingCanvas messages={messages} setMessages={setMessages} />
                          </ComponentErrorBoundary>
                        );
                      case 'image':
                        return (
                          <ComponentErrorBoundary fallback={
                            <div className="p-4 bg-red-50 border border-red-200 rounded">
                              <p className="text-red-600">Image uploader error. Please try refreshing.</p>
                            </div>
                          }>
                            <ImageUploader messages={messages} setMessages={setMessages} />
                          </ComponentErrorBoundary>
                        );
                      case 'spelling':
                        if (typeof message.content === 'string') {
                          try {
                            const parsedContent = JSON.parse(message.content);
                            return (
                              <ComponentErrorBoundary fallback={
                                <div className="p-4 bg-red-50 border border-red-200 rounded">
                                  <p className="text-red-600">Spelling component error. Please try refreshing.</p>
                                </div>
                              }>
                                <Spelling words={parsedContent.words} />
                              </ComponentErrorBoundary>
                            );
                          } catch (error) {
                            return (
                              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-yellow-600">Invalid spelling data. Raw content:</p>
                                <pre className="text-xs mt-2 overflow-auto">{message.content}</pre>
                              </div>
                            );
                          }
                        }
                        break;
                      case 'physics':
                        if (typeof message.content === 'string') {
                          try {
                            const parsedContent = JSON.parse(message.content);
                            return (
                              <ComponentErrorBoundary fallback={
                                <div className="p-4 bg-red-50 border border-red-200 rounded">
                                  <p className="text-red-600">Physics simulator error. Please try refreshing.</p>
                                </div>
                              }>
                                <PhysicsSimulator simulation={parsedContent.simulation} />
                              </ComponentErrorBoundary>
                            );
                          } catch (error) {
                            return (
                              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-yellow-600">Invalid physics data. Raw content:</p>
                                <pre className="text-xs mt-2 overflow-auto">{message.content}</pre>
                              </div>
                            );
                          }
                        }
                        break;
                      case 'speech-training':
                        if (typeof message.content === 'string') {
                          try {
                            const parsedContent = JSON.parse(message.content);
                            return (
                              <ComponentErrorBoundary fallback={
                                <div className="p-4 bg-red-50 border border-red-200 rounded">
                                  <p className="text-red-600">Speech training component encountered an error.</p>
                                  <p className="text-sm text-red-500 mt-2">This usually happens with microphone permissions. Please refresh and allow microphone access.</p>
                                </div>
                              }>
                                <SpeechTraining exercises={parsedContent.exercises} mode={parsedContent.mode} />
                              </ComponentErrorBoundary>
                            );
                          } catch (error) {
                            return (
                              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-yellow-600">Invalid speech training data. Raw content:</p>
                                <pre className="text-xs mt-2 overflow-auto">{message.content}</pre>
                              </div>
                            );
                          }
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



