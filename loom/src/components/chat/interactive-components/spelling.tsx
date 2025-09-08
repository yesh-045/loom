"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, BookOpen, FileText, CheckCircle, XCircle, RotateCcw, Trophy, Target } from "lucide-react";
import { textToSpeech } from '@/components/speech/TextToSpeech';

interface SpellingWord {
  word: string;
  definition: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  examples?: string[];
  phonetic?: string;
  category?: string;
}

interface SpellingProps {
  words: SpellingWord[];
}

interface QuizResult {
  word: string;
  userAnswer: string;
  correct: boolean;
  attempts: number;
}

const Spelling: React.FC<SpellingProps> = ({ words }) => {
  // Enhanced validation and default data
  const defaultWords: SpellingWord[] = [
    {
      word: "algorithm",
      definition: "A step-by-step procedure for calculations, data processing, and automated reasoning tasks",
      difficulty: "hard",
      examples: ["The sorting algorithm efficiently organized the data", "Machine learning algorithms can recognize patterns"],
      phonetic: "/ˈælɡəˌrɪðəm/",
      category: "Technology"
    },
    {
      word: "photosynthesis",
      definition: "The process by which plants convert light energy into chemical energy",
      difficulty: "medium",
      examples: ["Photosynthesis produces oxygen as a byproduct", "Plants rely on photosynthesis for energy"],
      phonetic: "/ˌfoʊtoʊˈsɪnθəsɪs/",
      category: "Biology"
    }
  ];

  const validWords = Array.isArray(words) && words.length > 0 ? words : defaultWords;
  
  // Enhanced state management
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [attempts, setAttempts] = useState(1);
  const [quizComplete, setQuizComplete] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showHint, setShowHint] = useState(false);
  const [timeStarted, setTimeStarted] = useState<number>(Date.now());

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize quiz
  useEffect(() => {
    setTimeStarted(Date.now());
  }, []);

  // Focus input when question changes
  useEffect(() => {
    if (inputRef.current && !quizComplete) {
      inputRef.current.focus();
    }
  }, [currentQuestion, quizComplete]);

  const currentWord = validWords[currentQuestion];
  
  // Enhanced audio functionality
  const speakText = useCallback(async (text: string) => {
    if (isSpeaking) return;
    
    setIsSpeaking(true);
    try {
      const audioMap = {};
      const setAudioMap = () => {};
      await textToSpeech(text, audioMap, setAudioMap, setIsSpeaking, currentAudioRef);
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  const speakWord = () => speakText(currentWord.word);
  const speakDefinition = () => speakText(currentWord.definition);
  const speakExample = (example: string) => speakText(example);

  // Enhanced answer checking with fuzzy matching
  const checkAnswer = useCallback(() => {
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = currentWord.word.toLowerCase();
    
    // Exact match
    const exactMatch = normalizedUserAnswer === normalizedCorrectAnswer;
    
    // Calculate similarity for partial credit
    const similarity = calculateSimilarity(normalizedUserAnswer, normalizedCorrectAnswer);
    const isAcceptable = similarity > 0.8; // 80% similarity threshold
    
    const correct = exactMatch || isAcceptable;
    
    setIsCorrect(correct);
    setShowResult(true);
    
    const result: QuizResult = {
      word: currentWord.word,
      userAnswer,
      correct,
      attempts
    };
    
    setResults(prev => [...prev, result]);
    
    // Auto-advance after showing result
    setTimeout(() => {
      if (currentQuestion + 1 < validWords.length) {
        nextQuestion();
      } else {
        setQuizComplete(true);
      }
    }, 2000);
  }, [userAnswer, currentWord, attempts, currentQuestion, validWords.length]);

  // String similarity calculation (Levenshtein distance)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
  };

  const nextQuestion = () => {
    setCurrentQuestion(prev => prev + 1);
    setUserAnswer("");
    setShowResult(false);
    setAttempts(1);
    setShowHint(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim() || showResult) return;
    checkAnswer();
  };

  const handleRetry = () => {
    setUserAnswer("");
    setShowResult(false);
    setAttempts(prev => prev + 1);
    setShowHint(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setUserAnswer("");
    setShowResult(false);
    setIsCorrect(false);
    setAttempts(1);
    setQuizComplete(false);
    setResults([]);
    setShowHint(false);
    setTimeStarted(Date.now());
  };

  // Calculate statistics
  const correctAnswers = results.filter(r => r.correct).length;
  const accuracy = results.length > 0 ? Math.round((correctAnswers / results.length) * 100) : 0;
  const totalTime = Math.round((Date.now() - timeStarted) / 1000);
  const averageAttempts = results.length > 0 ? 
    Math.round((results.reduce((sum, r) => sum + r.attempts, 0) / results.length) * 10) / 10 : 0;

  // Difficulty color coding
  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-orange-600 bg-orange-50';
      case 'expert': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (validWords.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Spelling Challenge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">No spelling words available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Advanced Spelling Challenge
          {currentWord.difficulty && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentWord.difficulty)}`}>
              {currentWord.difficulty.toUpperCase()}
            </span>
          )}
        </CardTitle>
        {currentWord.category && (
          <p className="text-sm text-muted-foreground">Category: {currentWord.category}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {quizComplete ? (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-green-600">
              <Trophy className="h-8 w-8" />
              Quiz Complete!
            </div>
            
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{correctAnswers}/{validWords.length}</div>
                <div className="text-sm text-blue-600">Correct</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{accuracy}%</div>
                <div className="text-sm text-green-600">Accuracy</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{totalTime}s</div>
                <div className="text-sm text-purple-600">Time</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{averageAttempts}</div>
                <div className="text-sm text-orange-600">Avg Attempts</div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Results:</h3>
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{result.word}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">&quot;{result.userAnswer}&quot;</span>
                    {result.correct ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={resetQuiz} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {showResult && (
              <div className={`p-4 rounded-lg text-center ${isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                  {isCorrect ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Correct!
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" />
                      Incorrect
                    </>
                  )}
                </div>
                {!isCorrect && (
                  <div className="mt-2">
                    <p>The correct spelling is: <strong>{currentWord.word}</strong></p>
                    {currentWord.phonetic && (
                      <p className="text-sm mt-1">Pronunciation: {currentWord.phonetic}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {!showResult && (
              <>
                <div className="text-center space-y-4">
                  <div className="flex justify-center items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={speakWord}
                      disabled={isSpeaking}
                      className="flex items-center gap-2"
                    >
                      <Volume2 className="h-4 w-4" />
                      Listen to Word
                    </Button>
                    {currentWord.phonetic && (
                      <span className="text-sm text-muted-foreground">{currentWord.phonetic}</span>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      ref={inputRef}
                      type="text"
                      placeholder="Type the word you heard..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="text-center text-lg"
                      autoComplete="off"
                      spellCheck={false}
                    />
                    
                    <Button type="submit" disabled={!userAnswer.trim() || isSpeaking} className="w-full">
                      Submit Answer
                    </Button>
                  </form>

                  {(showHint || attempts > 1) && (
                    <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Definition:</span>
                      </div>
                      <p className="text-blue-700">{currentWord.definition}</p>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={speakDefinition}
                        disabled={isSpeaking}
                        className="w-full"
                      >
                        <Volume2 className="h-3 w-3 mr-2" />
                        Listen to Definition
                      </Button>

                      {currentWord.examples && currentWord.examples.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800">Examples:</span>
                          </div>
                          {currentWord.examples.map((example, index) => (
                            <div key={index} className="space-y-1">
                              <p className="text-sm text-blue-700">&quot;{example}&quot;</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => speakExample(example)}
                                disabled={isSpeaking}
                                className="w-full text-xs"
                              >
                                <Volume2 className="h-3 w-3 mr-2" />
                                Listen to Example {index + 1}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>

      {!quizComplete && (
        <CardFooter className="flex flex-col space-y-2">
          <div className="flex justify-between items-center w-full text-sm text-muted-foreground">
            <span>Question {currentQuestion + 1} of {validWords.length}</span>
            <span>Attempt {attempts}</span>
          </div>
          
          {showResult && !isCorrect && (
            <Button variant="outline" onClick={handleRetry} className="w-full">
              Try Again
            </Button>
          )}
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestion + (showResult ? 1 : 0)) / validWords.length) * 100}%` }}
            />
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default Spelling;
