"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen, Trophy, Target, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Flashcard {
  front: string;
  back: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  mastered?: boolean;
}

interface FlashcardProps {
  flashcards: Flashcard[];
}



const Flashcards: React.FC<FlashcardProps> = ({ flashcards }) => {
  // Enhanced default data
  const defaultFlashcards: Flashcard[] = [
    {
      front: "Algorithm Complexity",
      back: "A measure of the computational resources (time and space) required by an algorithm as a function of input size, typically expressed using Big O notation",
      category: "Computer Science",
      difficulty: "hard"
    },
    {
      front: "Quantum Entanglement", 
      back: "A quantum mechanical phenomenon where particles become interconnected and instantaneously affect each other's state regardless of distance",
      category: "Physics",
      difficulty: "hard"
    },
    {
      front: "CRISPR-Cas9",
      back: "A revolutionary gene-editing technology that allows precise modification of DNA sequences in living cells",
      category: "Biology",
      difficulty: "medium"
    },
    {
      front: "Machine Learning",
      back: "A subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed",
      category: "Technology",
      difficulty: "medium"
    }
  ];

  const validFlashcards = Array.isArray(flashcards) && flashcards.length > 0 ? flashcards : defaultFlashcards;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode] = useState<'sequential' | 'shuffle' | 'review'>('sequential');
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  // TODO: Implement study session tracking
  // const [session, setSession] = useState<StudySession>({
  //   totalCards: validFlashcards.length,
  //   currentCard: 0,
  //   masteredCards: 0,
  //   reviewedCards: new Set(),
  //   startTime: Date.now()
  // });
  const [showProgress, setShowProgress] = useState(true);
  const [autoFlip, setAutoFlip] = useState(false);
  const [cardMastery, setCardMastery] = useState<Map<number, boolean>>(new Map());

  // Initialize shuffled indices
  useEffect(() => {
    const indices = Array.from({ length: validFlashcards.length }, (_, i) => i);
    setShuffledIndices([...indices].sort(() => Math.random() - 0.5));
  }, [validFlashcards.length]);

  // Auto-flip functionality
  useEffect(() => {
    if (autoFlip && !isFlipped) {
      const timer = setTimeout(() => {
        setIsFlipped(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [autoFlip, isFlipped, currentIndex]);

  const getCurrentCardIndex = useCallback(() => {
    switch (studyMode) {
      case 'shuffle':
        return shuffledIndices[currentIndex] || 0;
      case 'review':
        const unmastered = Array.from({ length: validFlashcards.length }, (_, i) => i)
          .filter(i => !cardMastery.get(i));
        return unmastered[currentIndex] || 0;
      default:
        return currentIndex;
    }
  }, [studyMode, currentIndex, shuffledIndices, cardMastery, validFlashcards.length]);

  const currentCard = validFlashcards[getCurrentCardIndex()];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    
    // TODO: Update session when card is reviewed
    // if (!isFlipped) {
    //   setSession(prev => ({
    //     ...prev,
    //     reviewedCards: new Set(prev.reviewedCards).add(getCurrentCardIndex())
    //   }));
    // }
  };

  const navigateCard = (direction: 'prev' | 'next') => {
    const maxIndex = studyMode === 'review' 
      ? Array.from({ length: validFlashcards.length }, (_, i) => i).filter(i => !cardMastery.get(i)).length - 1
      : validFlashcards.length - 1;

    if (direction === 'next') {
      setCurrentIndex(prev => prev < maxIndex ? prev + 1 : 0);
    } else {
      setCurrentIndex(prev => prev > 0 ? prev - 1 : maxIndex);
    }
    setIsFlipped(false);
  };

  const handlePrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateCard('prev');
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateCard('next');
  };

  const toggleMastery = () => {
    const cardIndex = getCurrentCardIndex();
    const newMastery = new Map(cardMastery);
    const wasMastered = newMastery.get(cardIndex) || false;
    newMastery.set(cardIndex, !wasMastered);
    setCardMastery(newMastery);

    // TODO: Update session mastered cards count
    // setSession(prev => ({
    //   ...prev,
    //   masteredCards: prev.masteredCards + (wasMastered ? -1 : 1)
    // }));
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCardMastery(new Map());
    // TODO: Reset session state
    // setSession({
    //   totalCards: validFlashcards.length,
    //   currentCard: 0,
    //   masteredCards: 0,
    //   reviewedCards: new Set(),
    //   startTime: Date.now()
    // });
    // Re-shuffle if in shuffle mode
    if (studyMode === 'shuffle') {
      const indices = Array.from({ length: validFlashcards.length }, (_, i) => i);
      setShuffledIndices([...indices].sort(() => Math.random() - 0.5));
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // TODO: Implement study mode statistics display
  // const getStudyModeStats = () => {
  //   const reviewedCount = session.reviewedCards.size;
  //   const progressPercentage = (reviewedCount / validFlashcards.length) * 100;
  //   const studyTime = Math.round((Date.now() - session.startTime) / 1000 / 60); // minutes
  //   
  //   return { reviewedCount, progressPercentage, studyTime };
  // };

  // const { reviewedCount, progressPercentage, studyTime } = getStudyModeStats();

  if (validFlashcards.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Interactive Flashcards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500">No flashcards available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      

      

      {/* Main flashcard */}
      <div className="flex justify-center">
        <div className="relative">
          <div
            className={`relative w-[320px] h-[240px] md:w-[480px] md:h-[320px] bg-white rounded-xl shadow-lg cursor-pointer transition-all duration-500 transform-gpu perspective-1000 ${
              isFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}
            onClick={handleFlip}
          >
            {/* Front of card */}
            <div
              className={`absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-8 rounded-xl border-2 border-gray-200 ${
                isFlipped ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-4">
                {currentCard.difficulty && (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentCard.difficulty)}`}>
                    {currentCard.difficulty.toUpperCase()}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Click to reveal</span>
                </div>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <h2 className="text-xl md:text-2xl font-bold text-center text-gray-800 leading-relaxed">
                  {currentCard.front}
                </h2>
              </div>
            </div>

            {/* Back of card */}
            <div
              className={`absolute inset-0 w-full h-full backface-hidden flex flex-col items-center justify-center p-8 rounded-xl border-2 border-blue-200 bg-blue-50 ${
                isFlipped ? '[transform:rotateY(180deg)] opacity-100' : 'opacity-0'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMastery();
                  }}
                  className={cardMastery.get(getCurrentCardIndex()) ? 'bg-green-100 text-green-700' : ''}
                >
                  <Trophy className="h-3 w-3 mr-1" />
                  {cardMastery.get(getCurrentCardIndex()) ? 'Mastered' : 'Master'}
                </Button>
                <span className="text-sm text-blue-600">Definition</span>
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm md:text-base text-center text-gray-700 leading-relaxed">
                  {currentCard.back}
                </p>
              </div>
            </div>

            {/* Navigation buttons */}
            <button
              type="button"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100 bg-white rounded-full p-2 shadow-md transition-all"
              onClick={handlePrevious}
              aria-label="Previous card"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-70 hover:opacity-100 bg-white rounded-full p-2 shadow-md transition-all"
              onClick={handleNext}
              aria-label="Next card"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Card counter */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-3 py-1 shadow-md">
              <span className="text-sm font-medium text-gray-600">
                {currentIndex + 1} of {validFlashcards.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={resetSession}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Session
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowProgress(!showProgress)}
        >
          {showProgress ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide Progress
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show Progress
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => setAutoFlip(!autoFlip)}
          className={autoFlip ? 'bg-blue-50 text-blue-700' : ''}
        >
          Auto-flip: {autoFlip ? 'ON' : 'OFF'}
        </Button>
      </div>

      
    </div>
  );
};

export default Flashcards;
