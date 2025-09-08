"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Play, Pause, RotateCcw, Volume2, Award, Target, BookOpen } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

// Type declarations for Web Speech API
declare global {
  interface Window {
    webkitSpeechRecognition: SpeechRecognitionConstructor;
    SpeechRecognition: SpeechRecognitionConstructor;
  }
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  speechTimeoutLength?: number;
  speechEndTimeoutLength?: number;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [key: number]: {
      isFinal: boolean;
      [key: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechTrainingProps {
  exercises?: SpeechExercise[];
  mode?: 'pronunciation' | 'fluency' | 'accent' | 'vocabulary';
}

interface SpeechExercise {
  id: string;
  text: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  targetWords?: string[];
  phonetics?: string;
}

interface RecognitionResult {
  transcript: string;
  confidence: number;
  accuracy: number;
  feedback: string[];
}

const SpeechTraining: React.FC<SpeechTrainingProps> = ({ exercises }) => {
  // Default exercises
  const defaultExercises: SpeechExercise[] = [
    {
      id: '1',
      text: 'The quick brown fox jumps over the lazy dog',
      difficulty: 'beginner',
      category: 'Pronunciation',
      targetWords: ['quick', 'brown', 'jumps'],
      phonetics: '/ðə kwɪk braʊn fɒks dʒʌmps ˈoʊvər ðə ˈleɪzi dɒg/'
    },
    {
      id: '2',
      text: 'She sells seashells by the seashore',
      difficulty: 'intermediate',
      category: 'Alliteration',
      targetWords: ['sells', 'seashells', 'seashore'],
      phonetics: '/ʃi sɛlz ˈsiʃɛlz baɪ ðə ˈsiʃɔr/'
    },
    {
      id: '3',
      text: 'Artificial intelligence revolutionizes technological advancement',
      difficulty: 'advanced',
      category: 'Technical Terms',
      targetWords: ['artificial', 'intelligence', 'revolutionizes', 'technological'],
      phonetics: '/ˌɑrtəˈfɪʃəl ɪnˈtɛlədʒəns rɛvəˈluʃəˌnaɪzəz ˌtɛknəˈlɑdʒɪkəl ədˈvænsmənt/'
    }
  ];

  // Safely parse exercises with fallback
  let currentExercises: SpeechExercise[];
  try {
    currentExercises = exercises || defaultExercises;
    // Validate exercises structure
    if (!Array.isArray(currentExercises) || currentExercises.length === 0) {
      console.warn('Invalid exercises provided, using defaults');
      currentExercises = defaultExercises;
    }
  } catch (error) {
    console.error('Error parsing exercises:', error);
    currentExercises = defaultExercises;
  }
  
  // State management
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [results, setResults] = useState<RecognitionResult | null>(null);
  const [score, setScore] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    totalAttempts: 0,
    correctPronunciations: 0,
    averageAccuracy: 0
  });
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [componentError, setComponentError] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentExercise = currentExercises[currentExerciseIndex];

  // Analyze performance with improved algorithm
  const analyzePerformance = useCallback((transcript: string, confidence: number) => {
    const targetText = currentExercise.text.toLowerCase();
    const spokenText = transcript.toLowerCase();

    console.log('Analyzing:', { targetText, spokenText, confidence });

    // Normalize text by removing punctuation and extra spaces
    const normalizeText = (text: string) =>
      text.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();

    const normalizedTarget = normalizeText(targetText);
    const normalizedSpoken = normalizeText(spokenText);

    // Calculate word-level accuracy
    const targetWords = normalizedTarget.split(' ');
    const spokenWords = normalizedSpoken.split(' ');

    let exactMatches = 0;
    let partialMatches = 0;

    // Check for exact word matches
    targetWords.forEach(targetWord => {
      if (spokenWords.includes(targetWord)) {
        exactMatches++;
      } else {
        // Check for partial matches (similarity)
        const bestMatch = spokenWords.find(spokenWord => {
          const similarity = calculateSimilarity(targetWord, spokenWord);
          return similarity > 0.7; // 70% similarity threshold
        });
        if (bestMatch) {
          partialMatches++;
        }
      }
    });

    // Calculate accuracy score
    const wordAccuracy = Math.round(((exactMatches * 1.0 + partialMatches * 0.7) / targetWords.length) * 100);

    // Overall score considering both accuracy and confidence
    const confidenceScore = Math.round(confidence * 100);
    const finalScore = Math.round((wordAccuracy * 0.7 + confidenceScore * 0.3));

    // Generate detailed feedback
    const feedback: string[] = [];

    // Performance feedback
    if (finalScore >= 90) {
      feedback.push('Excellent! Perfect pronunciation and clarity.');
    } else if (finalScore >= 80) {
      feedback.push('Great job! Very good pronunciation.');
    } else if (finalScore >= 70) {
      feedback.push('Good attempt! Keep practicing for better clarity.');
    } else if (finalScore >= 50) {
      feedback.push(' Keep practicing! Focus on speaking more clearly.');
    } else {
      feedback.push("Don't give up! Try speaking slower and more clearly.");
    }

    // Confidence feedback
    if (confidenceScore < 60) {
      feedback.push('🎤 Try speaking louder and more clearly.');
    } else if (confidenceScore < 80) {
      feedback.push('🗣️ Good clarity, try to speak with more confidence.');
    }

    // Word-specific feedback
    if (currentExercise.targetWords) {
      const missedTargetWords = currentExercise.targetWords.filter(word =>
        !normalizedSpoken.includes(word.toLowerCase())
      );

      if (missedTargetWords.length > 0) {
        feedback.push(`Focus on these words: ${missedTargetWords.join(', ')}`);
      } else if (currentExercise.targetWords.length > 0) {
        feedback.push('Great job pronouncing all target words!');
      }
    }

    // Length comparison feedback
    const lengthRatio = spokenWords.length / targetWords.length;
    if (lengthRatio < 0.7) {
      feedback.push(' Try to speak all the words in the sentence.');
    } else if (lengthRatio > 1.3) {
      feedback.push(' Try to be more concise, stick to the given text.');
    }

    setResults({
      transcript,
      confidence: confidenceScore,
      accuracy: wordAccuracy,
      feedback
    });

    setScore(finalScore);

    // Update session stats
    setSessionStats(prev => {
      const newTotal = prev.totalAttempts + 1;
      const newCorrect = prev.correctPronunciations + (finalScore >= 80 ? 1 : 0);
      return {
        totalAttempts: newTotal,
        correctPronunciations: newCorrect,
        averageAccuracy: Math.round((prev.averageAccuracy * prev.totalAttempts + finalScore) / newTotal)
      };
    });
  }, [currentExercise]);

  // Initialize speech recognition
  useEffect(() => {
    try {
      setComponentError(null); // Clear any previous errors

      if (typeof window !== 'undefined') {
        const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;

        if (SpeechRecognition) {
          recognitionRef.current = new SpeechRecognition();
          // Configure for better listening experience
          recognitionRef.current.continuous = true; // Keep listening
          recognitionRef.current.interimResults = true; // Show interim results
          recognitionRef.current.lang = 'en-US';
          recognitionRef.current.maxAlternatives = 1;

          // Increase timeout values for better user experience
          if ('speechTimeoutLength' in recognitionRef.current) {
            recognitionRef.current.speechTimeoutLength = 10000; // 10 seconds
          }
          if ('speechEndTimeoutLength' in recognitionRef.current) {
            recognitionRef.current.speechEndTimeoutLength = 3000; // 3 seconds after speech ends
          }

          recognitionRef.current.onstart = () => {
            console.log('Speech recognition started - listening...');
            setTranscription('Listening... Start speaking now.');
            setComponentError(null); // Clear errors when successfully starting
          };

          recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
            try {
              let interimTranscript = '';
              let finalTranscript = '';

              for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                  finalTranscript += transcript;
                } else {
                  interimTranscript += transcript;
                }
              }

              // Show interim results to user
              if (interimTranscript) {
                setTranscription(`Speaking: ${interimTranscript}`);
              }

              // Process final results
              if (finalTranscript) {
                const confidence = event.results[event.results.length - 1][0].confidence;
                console.log('Final recognition result:', finalTranscript, 'Confidence:', confidence);
                setTranscription(finalTranscript);
                analyzePerformance(finalTranscript, confidence);
                // Stop recognition after getting final result
                if (recognitionRef.current) {
                  recognitionRef.current.stop();
                }
              }
            } catch (error) {
              console.error('Error processing speech recognition results:', error);
              setComponentError('Error processing speech results. Please try again.');
              setIsRecording(false);
            }
          };

          recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            let errorMessage = 'Speech recognition failed. ';

            switch (event.error) {
              case 'no-speech':
                errorMessage += 'No speech detected. Please try speaking more clearly and closer to the microphone.';
                break;
              case 'audio-capture':
                errorMessage += 'Audio capture failed. Please check your microphone connection.';
                break;
              case 'not-allowed':
                errorMessage += 'Microphone permission denied. Please allow microphone access and try again.';
                setComponentError('Microphone access required. Please refresh the page and allow microphone access.');
                break;
              case 'network':
                errorMessage += 'Network error. Please check your internet connection.';
                break;
              case 'aborted':
                // Don't show error for user-initiated stops
                if (isRecording) {
                  errorMessage += 'Recording was stopped.';
                } else {
                  return; // Don't show error if user stopped intentionally
                }
                break;
              default:
                errorMessage += `Unexpected error (${event.error}). Please try again.`;
            }

            setResults({
              transcript: '',
              confidence: 0,
              accuracy: 0,
              feedback: [errorMessage]
            });
            setIsRecording(false);
          };

          recognitionRef.current.onend = () => {
            console.log('Speech recognition ended');

            // Clear timeout if it exists
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }

            setIsRecording(false);

            // Only update transcription if we're still in a waiting/processing state
            if (transcription === 'Listening... Start speaking now.' ||
                transcription.startsWith('Speaking:') ||
                transcription === 'Getting ready...' ||
                transcription === 'Processing your speech...') {
              setTranscription('Click "Start Recording" to try again');
            }
          };
        } else {
          console.error('Speech recognition not supported');
          setComponentError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
          setResults({
            transcript: '',
            confidence: 0,
            accuracy: 0,
            feedback: ['Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.']
          });
        }
      }
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setComponentError('Failed to initialize speech recognition. Please refresh the page.');
    }
  }, [analyzePerformance, isRecording, transcription]);

  // Generate audio using ElevenLabs API
  const generateAudio = useCallback(async (text: string) => {
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          voice: 'pNInz6obpgDQGcFmaJgB', // Professional voice for education
          stability: 0.7,
          similarity_boost: 0.8,
          model: 'eleven_monolingual_v1'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error) {
      console.error('Error generating audio:', error);
    }
  }, []);

  // Play reference audio
  const playReferenceAudio = async () => {
    if (!audioUrl) {
      await generateAudio(currentExercise.text);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.playbackRate = playbackSpeed;
    
    setIsPlaying(true);
    
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    
    try {
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  // Stop audio playback
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      // Reset previous results
      setTranscription('Getting ready...');
      setResults(null);
      
      // Check if speech recognition is available
      if (!recognitionRef.current) {
        setResults({
          transcript: '',
          confidence: 0,
          accuracy: 0,
          feedback: ['Speech recognition is not available. Please use a supported browser like Chrome, Edge, or Safari.']
        });
        return;
      }

      // Request microphone permission first
      console.log('Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      console.log('Microphone access granted');
      
      // Initialize media recorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('MediaRecorder stopped');
        stream.getTracks().forEach(track => track.stop());
        
        // Create audio blob for playback if needed
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Recording stopped, audio blob size:', audioBlob.size);
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setResults({
          transcript: '',
          confidence: 0,
          accuracy: 0,
          feedback: ['Recording failed. Please check your microphone and try again.']
        });
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      // Start recording first
      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      
      // Give a small delay before starting speech recognition
      setTimeout(() => {
        try {
          if (recognitionRef.current && isRecording) {
            console.log('Starting speech recognition...');
            recognitionRef.current.start();
            
            // Set a safety timeout to prevent indefinite listening
            timeoutRef.current = setTimeout(() => {
              console.log('Speech recognition timeout - stopping...');
              if (isRecording) {
                setTranscription('Listening timeout. Click "Stop" and try again.');
                stopRecording();
              }
            }, 15000); // 15 second timeout
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Speech recognition start error:', errorMessage);
          if (errorMessage.includes('already started')) {
            // Recognition is already running, that's okay
            console.log('Speech recognition was already running');
            return;
          }
          
          setResults({
            transcript: '',
            confidence: 0,
            accuracy: 0,
            feedback: ['Speech recognition failed to start. Please try again.']
          });
          setIsRecording(false);
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
          }
          stream.getTracks().forEach(track => track.stop());
        }
      }, 500); // 500ms delay to ensure everything is ready
      
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };
      console.error('Error starting recording:', error);
      
      let errorMessage = 'Failed to start recording. ';
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow microphone access in your browser settings and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No microphone found. Please connect a microphone and try again.';
      } else if (err.name === 'AbortError') {
        errorMessage += 'Microphone access was interrupted. Please try again.';
      } else {
        errorMessage += `Please check your microphone and browser settings. Error: ${err.message || 'Unknown error'}`;
      }
      
      setResults({
        transcript: '',
        confidence: 0,
        accuracy: 0,
        feedback: [errorMessage]
      });
      setIsRecording(false);
      setTranscription('Click "Start Recording" to try again');
    }
  };

  // Stop recording with better cleanup
  const stopRecording = () => {
    console.log('Stopping recording...');
    setTranscription('Processing your speech...');
    
    // Clear any timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error('Error stopping media recorder:', error);
      }
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
        // If stopping recognition fails, immediately reset state
        forceStopRecording();
        return;
      }
    }
    
    // Set a backup timeout to ensure we don't get stuck in "processing" state
    const processingTimeout = setTimeout(() => {
      console.log('Processing timeout reached, resetting state');
      forceStopRecording();
    }, 3000); // 3 second timeout
    
    // Store the timeout so we can clear it if recognition ends normally
    timeoutRef.current = processingTimeout;
  };

  // Force stop recording - immediate state reset
  const forceStopRecording = () => {
    console.log('Force stopping recording...');
    setIsRecording(false);
    if (transcription === 'Processing your speech...' || transcription === 'Listening... Start speaking now.' || transcription.startsWith('Speaking:')) {
      setTranscription('Recording stopped. Click "Start Recording" to try again.');
    }
    
    // Clear any timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Retry recording function
  const retryRecording = () => {
    resetExercise();
    setTimeout(() => {
      startRecording();
    }, 500); // Small delay to ensure cleanup is complete
  };

  
  
  // Calculate text similarity using Levenshtein distance
  const calculateSimilarity = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
  };

  // Navigate exercises
  const nextExercise = () => {
    setCurrentExerciseIndex((prev) => (prev + 1) % currentExercises.length);
    resetExercise();
  };

  const previousExercise = () => {
    setCurrentExerciseIndex((prev) => (prev - 1 + currentExercises.length) % currentExercises.length);
    resetExercise();
  };

  const resetExercise = () => {
    // Clear any timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Clear any component errors
    setComponentError(null);
    
    // Stop any ongoing recording or playback
    if (isRecording) {
      forceStopRecording();
    }
    stopAudio();
    
    // Reset all states
    setTranscription('Click "Start Recording" to begin');
    setResults(null);
    setScore(0);
    setAudioUrl('');
    setIsRecording(false);
    setIsPlaying(false);
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Generate audio on exercise change
  useEffect(() => {
    generateAudio(currentExercise.text);
  }, [currentExerciseIndex, playbackSpeed, currentExercise.text, generateAudio]);

  // Initialize transcription state
  useEffect(() => {
    if (!transcription) {
      setTranscription('Click "Start Recording" to begin');
    }
  }, [currentExerciseIndex, transcription]);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-purple-600" />
              Speech Training Studio
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Practice pronunciation with AI-powered feedback
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{score}%</div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{currentExerciseIndex + 1}/{currentExercises.length}</div>
              <div className="text-xs text-muted-foreground">Exercise</div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Component Error Display */}
        {componentError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="text-red-600 font-medium">⚠️ Component Error</div>
            </div>
            <p className="text-red-600 text-sm mt-1">{componentError}</p>
            <Button 
              onClick={() => {
                setComponentError(null);
                window.location.reload();
              }}
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Refresh Component
            </Button>
          </div>
        )}
        {/* Exercise Info */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-600" />
              <span className="font-medium">{currentExercise.category}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentExercise.difficulty)}`}>
                {currentExercise.difficulty}
              </span>
            </div>
            <Target className="h-4 w-4 text-purple-600" />
          </div>
          
          <div className="text-lg font-mono bg-white p-3 rounded border">
            {currentExercise.text}
          </div>
          
          {currentExercise.phonetics && (
            <div className="text-sm text-muted-foreground mt-2 font-mono">
              Phonetics: {currentExercise.phonetics}
            </div>
          )}
          
          {currentExercise.targetWords && (
            <div className="mt-2">
              <span className="text-sm font-medium">Focus words: </span>
              <span className="text-sm text-purple-600">
                {currentExercise.targetWords.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Audio Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Listen & Learn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={isPlaying ? stopAudio : playReferenceAudio}
                className="w-full"
                disabled={!audioUrl && !isPlaying}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play Reference
                  </>
                )}
              </Button>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Speed: {playbackSpeed.toFixed(1)}x
                </label>
                <Slider
                  value={[playbackSpeed]}
                  onValueChange={(value) => setPlaybackSpeed(value[0])}
                  max={2}
                  min={0.5}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Record & Practice</CardTitle>
              <p className="text-sm text-muted-foreground">
                Click record, read the text aloud, then stop to get feedback
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={isRecording ? stopRecording : startRecording}
                  onDoubleClick={isRecording ? forceStopRecording : undefined}
                  className="flex-1"
                  variant={isRecording ? "destructive" : "default"}
                  disabled={!recognitionRef.current}
                  title={isRecording ? "Click to stop recording (double-click to force stop)" : "Click to start recording"}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>
                
                {results && (
                  <Button 
                    onClick={retryRecording}
                    variant="outline"
                    className="px-3"
                    title="Try again"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Force stop button when stuck processing */}
              {transcription === 'Processing your speech...' && !isRecording && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                  <p className="text-orange-600 text-sm mb-2">Processing is taking longer than expected.</p>
                  <Button 
                    onClick={forceStopRecording}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <MicOff className="h-4 w-4 mr-2" />
                    Force Stop & Reset
                  </Button>
                </div>
              )}
              
              {!recognitionRef.current && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  ⚠️ Speech recognition not supported. Please use Chrome or Edge browser.
                </div>
              )}
              
              {isRecording && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center">
                    <div className="animate-pulse flex space-x-1">
                      <div className="w-2 h-8 bg-red-500 rounded"></div>
                      <div className="w-2 h-6 bg-red-400 rounded"></div>
                      <div className="w-2 h-10 bg-red-500 rounded"></div>
                      <div className="w-2 h-4 bg-red-400 rounded"></div>
                      <div className="w-2 h-12 bg-red-500 rounded"></div>
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    🎤 Listening... Speak clearly and at normal pace
                  </p>
                </div>
              )}
              
              {transcription && !results && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">Processing: &ldquo;{transcription}&rdquo;</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {results && (
          <Card className={`border-2 ${results.accuracy >= 80 ? 'border-green-200 bg-green-50/50' : results.accuracy >= 60 ? 'border-yellow-200 bg-yellow-50/50' : 'border-red-200 bg-red-50/50'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Performance Analysis
                {results.accuracy >= 80 && <span className="text-lg">🎉</span>}
                {results.accuracy >= 60 && results.accuracy < 80 && <span className="text-lg">👍</span>}
                {results.accuracy < 60 && <span className="text-lg">💪</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`text-center p-3 rounded ${results.accuracy >= 80 ? 'bg-green-100' : results.accuracy >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                  <div className={`text-2xl font-bold ${results.accuracy >= 80 ? 'text-green-600' : results.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {results.accuracy}%
                  </div>
                  <div className="text-sm text-muted-foreground">Word Accuracy</div>
                </div>
                <div className={`text-center p-3 rounded ${results.confidence >= 80 ? 'bg-green-100' : results.confidence >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                  <div className={`text-2xl font-bold ${results.confidence >= 80 ? 'text-green-600' : results.confidence >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {results.confidence}%
                  </div>
                  <div className="text-sm text-muted-foreground">Speech Clarity</div>
                </div>
                <div className={`text-center p-3 rounded ${score >= 80 ? 'bg-purple-100' : score >= 60 ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <div className={`text-2xl font-bold ${score >= 80 ? 'text-purple-600' : score >= 60 ? 'text-blue-600' : 'text-gray-600'}`}>
                    {score}%
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <span>What you said:</span>
                  {results.transcript.length === 0 && <span className="text-red-500 text-sm">(No speech detected)</span>}
                </h4>
                <div className="p-3 bg-gray-50 rounded font-mono text-sm border">
                  {results.transcript || "No speech was detected. Please try again."}
                </div>
                <div className="text-xs text-muted-foreground">
                  Expected: &quot;{currentExercise.text}&quot;
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Feedback & Tips:</h4>
                <div className="space-y-2">
                  {results.feedback.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm p-2 bg-white rounded border">
                      <span className="text-purple-600 mt-0.5">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={retryRecording}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={nextExercise}
                  className="flex-1"
                  disabled={currentExerciseIndex === currentExercises.length - 1}
                >
                  Next Exercise
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={previousExercise}>
            Previous
          </Button>
          
          <Button variant="outline" onClick={resetExercise}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          
          <Button variant="outline" onClick={nextExercise}>
            Next
          </Button>
        </div>

        {/* Session Stats */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Session Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xl font-bold">{sessionStats.totalAttempts}</div>
                <div className="text-sm text-muted-foreground">Attempts</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-600">{sessionStats.correctPronunciations}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div>
                <div className="text-xl font-bold text-blue-600">{sessionStats.averageAccuracy}%</div>
                <div className="text-sm text-muted-foreground">Avg Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default SpeechTraining;
