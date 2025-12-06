import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronDown,
  RefreshCw,
  Play,
  Download,
  RotateCcw,
  Check,
  X,
  Shuffle,
  Zap,
  Trophy,
  Target,
  BookOpen,
  MessageSquare,
  FileText,
  Mic,
  List,
  Brain,
  Lightbulb,
  Pin,
  Tag,
  type LucideIcon
} from 'lucide-react';
import {
  VideoSummary,
  processVideo,
  getVideoSummaryByUrl,
  formatTimestamp,
  downloadSRT,
  downloadVTT,
  getSentimentEmoji
} from '../../services/videoSummarizerService';

interface VideoLearningPanelProps {
  videoUrl: string | null;
  lessonId?: string;
  courseId?: string;
  lessonTitle?: string;
  onSeekTo?: (time: number) => void;
}

type TabType = 'summary' | 'transcript' | 'chapters' | 'quiz' | 'flashcards';

// Processing steps
const PROCESSING_STEPS = [
  { label: 'Waking up AI...', progress: 10, emoji: '🤖' },
  { label: 'Listening to video...', progress: 25, emoji: '👂' },
  { label: 'Transcribing speech...', progress: 45, emoji: '✍️' },
  { label: 'Understanding content...', progress: 65, emoji: '🧠' },
  { label: 'Creating study materials...', progress: 85, emoji: '📚' },
  { label: 'Almost there...', progress: 95, emoji: '✨' },
];

// Error handler
const getUserFriendlyError = (error: string) => {
  if (error.includes('504') || error.includes('timeout')) {
    return { message: 'Video too long! 😅', tips: ['Try a shorter video (under 5 min)', 'Break long videos into parts'], emoji: '⏱️' };
  }
  if (error.includes('No speech')) {
    return { message: 'No talking detected! 🔇', tips: ['This video needs spoken content', 'Music-only videos won\'t work'], emoji: '🎵' };
  }
  if (error.includes('network') || error.includes('fetch')) {
    return { message: 'Connection lost! 📡', tips: ['Check your internet', 'Try again in a moment'], emoji: '🌐' };
  }
  return { message: 'Something went wrong 😕', tips: ['Try refreshing', 'Try a different video'], emoji: '🔧' };
};

// Tab configuration with icons
const TABS: { id: TabType; icon: LucideIcon; label: string }[] = [
  { id: 'summary', icon: FileText, label: 'Notes' },
  { id: 'transcript', icon: Mic, label: 'Transcript' },
  { id: 'chapters', icon: List, label: 'Chapters' },
  { id: 'quiz', icon: Brain, label: 'Quiz' },
  { id: 'flashcards', icon: Lightbulb, label: 'Cards' },
];

// ============ ERROR DISPLAY COMPONENT ============
const ErrorDisplay: React.FC<{
  error: string;
  onRetry: () => void;
  onClose: () => void;
}> = ({ error, onRetry, onClose }) => {
  const [showDetails, setShowDetails] = useState(false);
  const err = getUserFriendlyError(error);

  return (
    <div className="p-8 text-center">
      <div className="w-20 h-20 mx-auto mb-4 bg-rose-100 rounded-3xl flex items-center justify-center text-4xl">
        {err.emoji}
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{err.message}</h3>
      <div className="max-w-xs mx-auto mb-4">
        {err.tips.map((tip, i) => (
          <p key={i} className="text-slate-500 text-sm">• {tip}</p>
        ))}
      </div>
      
      {/* Collapsible Technical Details */}
      <div className="max-w-md mx-auto mb-6">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
          {showDetails ? 'Hide' : 'Show'} technical details
        </button>
        
        {showDetails && (
          <div className="mt-3 p-4 bg-slate-900 rounded-xl text-left overflow-x-auto">
            <p className="text-slate-400 text-xs mb-1">Error Message:</p>
            <pre className="text-rose-400 text-xs font-mono whitespace-pre-wrap break-words">
              {error}
            </pre>
          </div>
        )}
      </div>
      
      <div className="flex gap-3 justify-center">
        <button
          onClick={onRetry}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" /> Try Again
        </button>
        <button
          onClick={onClose}
          className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// ============ QUIZ COMPONENT (Gamified) ============
const QuizTab: React.FC<{
  questions: VideoSummary['quizQuestions'];
  onSeekTo?: (time: number) => void;
}> = ({ questions, onSeekTo }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0, xp: 0 });
  const [showConfetti, setShowConfetti] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-3xl flex items-center justify-center mb-4">
          <Target className="w-10 h-10 text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Quiz Yet</h3>
        <p className="text-slate-500 text-sm text-center max-w-xs">
          Quiz questions are generated for videos with educational content. Try a longer video!
        </p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isCorrect = selectedAnswer === currentQ.correctAnswer;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowResult(true);
    
    const correct = index === currentQ.correctAnswer;
    if (correct) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1500);
    }
    
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
      xp: prev.xp + (correct ? 10 : 2)
    }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore({ correct: 0, total: 0, xp: 0 });
  };

  return (
    <div className="p-5">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
                backgroundColor: ['#6366f1', '#8b5cf6', '#34d399', '#fbbf24'][i % 4],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Header with XP */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full text-white text-sm font-bold shadow-lg shadow-amber-400/30">
            <Zap className="w-4 h-4" />
            {score.xp} XP
          </div>
          <span className="text-slate-500 text-sm">
            {score.correct}/{score.total} correct
          </span>
        </div>
        <button 
          onClick={resetQuiz}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-slate-700">Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-indigo-600 font-semibold">+10 XP</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-gradient-to-br from-slate-50 to-indigo-50/50 rounded-2xl p-6 mb-6 border border-slate-100">
        <p className="text-lg font-medium text-slate-800 leading-relaxed">
          {currentQ.question}
        </p>
        {currentQ.timestamp && (
          <button 
            onClick={() => onSeekTo?.(currentQ.timestamp!)}
            className="mt-3 text-sm text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
          >
            <Play className="w-3.5 h-3.5" /> Watch at {formatTimestamp(currentQ.timestamp)}
          </button>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {currentQ.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const isSelected = selectedAnswer === index;
          const isCorrectOption = index === currentQ.correctAnswer;
          
          let styles = 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md hover:shadow-indigo-500/10';
          if (showResult) {
            if (isCorrectOption) {
              styles = 'border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-500/20';
            } else if (isSelected) {
              styles = 'border-rose-400 bg-rose-50 shadow-lg shadow-rose-500/20';
            } else {
              styles = 'border-slate-100 opacity-50';
            }
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={showResult}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 ${styles}`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                  showResult && isCorrectOption ? 'bg-emerald-500 text-white' :
                  showResult && isSelected ? 'bg-rose-500 text-white' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {showResult && isCorrectOption ? <Check className="w-5 h-5" /> :
                   showResult && isSelected ? <X className="w-5 h-5" /> : letter}
                </span>
                <span className="text-slate-700 flex-1">{option}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {showResult && (
        <div className={`p-4 rounded-2xl mb-6 ${isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="flex items-start gap-3">
            {isCorrect ? <Trophy className="w-6 h-6 text-emerald-500" /> : <Lightbulb className="w-6 h-6 text-amber-500" />}
            <div>
              <p className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isCorrect ? 'Awesome! +10 XP' : 'Good try! +2 XP'}
              </p>
              <p className="text-sm text-slate-600 mt-1">{currentQ.explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => { setCurrentIndex(prev => Math.max(0, prev - 1)); setSelectedAnswer(null); setShowResult(false); }}
          disabled={currentIndex === 0}
          className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-40 transition-all"
        >
          ← Back
        </button>
        {currentIndex < questions.length - 1 ? (
          <button
            onClick={nextQuestion}
            disabled={!showResult}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-40 disabled:shadow-none transition-all hover:scale-105 active:scale-95"
          >
            Next →
          </button>
        ) : showResult && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl text-white font-medium">
            <Trophy className="w-5 h-5" />
            Complete! {score.xp} XP earned
          </div>
        )}
      </div>
    </div>
  );
};


// ============ FLASHCARDS COMPONENT (Modern Stack) ============
const FlashcardsTab: React.FC<{
  flashcards: VideoSummary['flashcards'];
}> = ({ flashcards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastered, setMastered] = useState<Set<number>>(new Set());

  if (!flashcards || flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 rounded-3xl flex items-center justify-center mb-4">
          <BookOpen className="w-10 h-10 text-violet-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Flashcards Yet</h3>
        <p className="text-slate-500 text-sm text-center max-w-xs">
          Flashcards are created from key concepts in the video. Try educational content!
        </p>
      </div>
    );
  }

  const card = flashcards[currentIndex];
  const progress = (mastered.size / flashcards.length) * 100;

  const handleMastered = () => {
    setMastered(prev => new Set([...prev, currentIndex]));
    nextCard();
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(prev => (prev + 1) % flashcards.length), 200);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length), 200);
  };

  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">
            Card {currentIndex + 1} of {flashcards.length}
          </span>
          {mastered.has(currentIndex) && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs font-medium rounded-full">
              ✓ Mastered
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentIndex(Math.floor(Math.random() * flashcards.length))} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Shuffle">
            <Shuffle className="w-4 h-4" />
          </button>
          <button onClick={() => { setMastered(new Set()); setCurrentIndex(0); }} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all" title="Reset">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-500">Mastered: {mastered.size}/{flashcards.length}</span>
          <span className="text-emerald-600 font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className="relative cursor-pointer mb-6 perspective-1000"
        style={{ perspective: '1000px' }}
      >
        <div 
          className="relative w-full min-h-[220px] transition-transform duration-500"
          style={{ 
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
        >
          {/* Front */}
          <div 
            className="absolute inset-0 w-full h-full rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl"
            style={{ 
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)'
            }}
          >
            <p className="text-xl font-semibold text-white leading-relaxed">{card.front}</p>
            <div className="mt-6 flex items-center gap-2 text-white/70 text-sm">
              <span>👆</span> Tap to flip
            </div>
          </div>
          
          {/* Back */}
          <div 
            className="absolute inset-0 w-full h-full bg-white rounded-3xl p-8 flex flex-col items-center justify-center text-center border-2 border-indigo-100 shadow-2xl"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-lg text-slate-700 leading-relaxed">{card.back}</p>
            {card.topic && (
              <span className="mt-6 px-4 py-1.5 bg-indigo-50 text-indigo-600 text-sm font-medium rounded-full">
                {card.topic}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <button onClick={prevCard} className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
          ← Prev
        </button>
        
        <div className="flex gap-2">
          <button
            onClick={nextCard}
            className="px-5 py-2.5 bg-amber-100 text-amber-700 rounded-xl font-medium hover:bg-amber-200 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Again
          </button>
          <button
            onClick={handleMastered}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-white rounded-xl font-medium shadow-lg shadow-emerald-400/30 hover:shadow-emerald-400/50 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <Check className="w-4 h-4" /> Got it!
          </button>
        </div>
        
        <button onClick={nextCard} className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
          Next →
        </button>
      </div>
    </div>
  );
};


// ============ MAIN COMPONENT ============
const VideoLearningPanel: React.FC<VideoLearningPanelProps> = ({
  videoUrl,
  lessonId,
  courseId,
  lessonTitle = 'Lesson',
  onSeekTo
}) => {
  const [summary, setSummary] = useState<VideoSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState(PROCESSING_STEPS[0]);
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [showDownloads, setShowDownloads] = useState(false);

  useEffect(() => {
    if (videoUrl && isExpanded) loadOrProcessVideo();
  }, [videoUrl, isExpanded]);

  useEffect(() => {
    if (!isProcessing) return;
    let stepIndex = 0;
    const interval = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, PROCESSING_STEPS.length - 1);
      setCurrentStep(PROCESSING_STEPS[stepIndex]);
    }, 6000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const loadOrProcessVideo = async () => {
    if (!videoUrl) return;
    setIsProcessing(true);
    setError(null);
    setCurrentStep(PROCESSING_STEPS[0]);
    setProcessingStartTime(Date.now());

    try {
      const existing = await getVideoSummaryByUrl(videoUrl);
      
      // If completed, show the summary
      if (existing?.processingStatus === 'completed') {
        setSummary(existing);
        setIsProcessing(false);
        return;
      }
      
      // If failed, show the database error_message
      if (existing?.processingStatus === 'failed') {
        const dbErrorMsg = existing.errorMessage || 'Unknown error';
        setError(`Previous processing failed\n\nDatabase error_message:\n${dbErrorMsg}`);
        setIsProcessing(false);
        return;
      }

      const result = await processVideo(
        { videoUrl, lessonId, courseId, language: 'en' },
        (step, progress) => setCurrentStep({ label: step, progress, emoji: '🔄' })
      );
      setSummary(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsProcessing(false);
      setProcessingStartTime(null);
    }
  };

  const handleSeekTo = (time: number) => {
    if (onSeekTo) onSeekTo(time);
    else {
      const video = document.querySelector('video');
      if (video) { video.currentTime = time; video.play(); }
    }
  };

  const getElapsedTime = () => {
    if (!processingStartTime) return '';
    const elapsed = Math.floor((Date.now() - processingStartTime) / 1000);
    return elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
  };

  if (!videoUrl) return null;

  // Collapsed/Minimized State - show compact button to expand
  if (!isExpanded && !isProcessing) {
    return (
      <div className="mt-4">
        <button
          onClick={() => setIsExpanded(true)}
          className="group relative flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 text-white rounded-2xl hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="font-bold text-lg block">✨ AI Study Buddy</span>
              <span className="text-indigo-100 text-sm">
                {summary ? 'Click to expand • Summary ready' : 'Notes • Quiz • Flashcards • Transcript'}
              </span>
            </div>
          </div>
          
          <div className="relative ml-auto flex items-center gap-2 px-3 py-1.5 bg-white/20 rounded-full text-sm font-medium">
            {summary ? (
              <>✓ Ready</>
            ) : (
              <><Zap className="w-4 h-4" /> Start Learning</>
            )}
          </div>
        </button>
      </div>
    );
  }


  // Get badge counts
  const quizCount = summary?.quizQuestions?.length || 0;
  const cardCount = summary?.flashcards?.length || 0;

  return (
    <div className="mt-6 bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 overflow-hidden">
      {/* ===== HEADER ===== */}
      <div className="relative bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 px-5 py-4">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-20 w-20 h-20 bg-white/5 rounded-full translate-y-1/2" />
        
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* AI Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-xl">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
              <span className="font-bold text-white">AI Study Buddy</span>
            </div>
            
            {/* Status badges */}
            {summary && (
              <>
                <span className="px-2.5 py-1 bg-emerald-400/90 text-white text-xs font-bold rounded-full shadow-lg">
                  ✓ Ready
                </span>
                {summary.sentimentData?.overall && (
                  <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                    {getSentimentEmoji(summary.sentimentData.overall)} {summary.sentimentData.overall}
                  </span>
                )}
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Downloads dropdown */}
            {summary?.srtContent && (
              <div className="relative">
                <button
                  onClick={() => setShowDownloads(!showDownloads)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white text-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  Subtitles
                  <ChevronDown className={`w-3 h-3 transition-transform ${showDownloads ? 'rotate-180' : ''}`} />
                </button>
                
                {showDownloads && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-10">
                    <button
                      onClick={() => { downloadSRT(summary.srtContent!, `${lessonTitle}.srt`); setShowDownloads(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-indigo-50 flex items-center gap-2"
                    >
                      📄 Download SRT
                    </button>
                    {summary.vttContent && (
                      <button
                        onClick={() => { downloadVTT(summary.vttContent!, `${lessonTitle}.vtt`); setShowDownloads(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-indigo-50 flex items-center gap-2 border-t border-slate-100"
                      >
                        📄 Download VTT
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={() => setIsExpanded(false)}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white text-sm transition-all"
            >
              Minimize
            </button>
          </div>
        </div>
      </div>

      {/* ===== TAB BAR (Pill Style) ===== */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const count = tab.id === 'quiz' ? quizCount : tab.id === 'flashcards' ? cardCount : 0;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-indigo-600 shadow-md shadow-slate-200/50' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                    isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>


      {/* ===== CONTENT AREA ===== */}
      <div className="max-h-[500px] overflow-y-auto">
        {/* Error State */}
        {error ? (
          <ErrorDisplay 
            error={error} 
            onRetry={() => { setError(null); loadOrProcessVideo(); }}
            onClose={() => setIsExpanded(false)}
          />
        ) : isProcessing ? (
          /* Processing State */
          <div className="p-8 text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              {/* Spinning ring */}
              <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
              <div 
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"
                style={{ animationDuration: '1s' }}
              />
              {/* Center emoji */}
              <div className="absolute inset-0 flex items-center justify-center text-3xl">
                {currentStep.emoji}
              </div>
            </div>
            
            <p className="text-lg font-semibold text-slate-800 mb-2">{currentStep.label}</p>
            
            {/* Progress bar */}
            <div className="w-64 mx-auto mb-4">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                  style={{ width: `${currentStep.progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-400">
                <span>{currentStep.progress}%</span>
                {processingStartTime && <span>{getElapsedTime()}</span>}
              </div>
            </div>
            
            <p className="text-slate-400 text-sm">This usually takes 1-2 minutes ☕</p>
            
            <button
              onClick={() => { setIsProcessing(false); setIsExpanded(false); }}
              className="mt-4 text-sm text-slate-400 hover:text-slate-600 underline"
            >
              Cancel
            </button>
          </div>
        ) : summary ? (
          <>
            {/* ===== SUMMARY TAB ===== */}
            {activeTab === 'summary' && (
              <div className="p-5 space-y-6">
                {/* Key Points */}
                {summary.keyPoints?.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 font-semibold text-slate-700 mb-3">
                      <Pin className="w-5 h-5 text-slate-500" /> Key Points
                    </h4>
                    <div className="space-y-2">
                      {summary.keyPoints.map((point, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                          <span className="w-7 h-7 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-slate-600 text-sm leading-relaxed pt-0.5">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Summary Card */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-slate-500" />
                    <h4 className="font-semibold text-slate-700">AI Summary</h4>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {summary.summary || 'No summary available.'}
                  </p>
                </div>

                {/* Topics */}
                {summary.topics?.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 font-semibold text-slate-700 mb-3">
                      <Tag className="w-5 h-5 text-slate-500" /> Topics
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {summary.topics.map((topic, i) => (
                        <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-sm font-medium rounded-full">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notable Quotes */}
                {summary.notableQuotes && summary.notableQuotes.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 font-semibold text-slate-700 mb-3">
                      <MessageSquare className="w-5 h-5 text-slate-500" /> Notable Quotes
                    </h4>
                    <div className="space-y-3">
                      {summary.notableQuotes.map((quote, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-xl border-l-4 border-slate-300">
                          <p className="text-slate-600 italic">"{quote.text}"</p>
                          {quote.timestamp !== undefined && (
                            <button
                              onClick={() => handleSeekTo(quote.timestamp)}
                              className="mt-2 text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" /> {formatTimestamp(quote.timestamp)}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== TRANSCRIPT TAB ===== */}
            {activeTab === 'transcript' && (
              <div className="p-5">
                {summary.transcriptSegments?.length > 0 ? (
                  <div className="space-y-2">
                    {summary.transcriptSegments.map((seg, i) => (
                      <button
                        key={i}
                        onClick={() => handleSeekTo(seg.start)}
                        className="w-full text-left p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 hover:shadow-md hover:shadow-indigo-500/10 transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <span className="px-2.5 py-1 bg-indigo-100 text-indigo-600 font-mono text-xs font-bold rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                              {formatTimestamp(seg.start)}
                            </span>
                            {seg.speaker !== undefined && (
                              <span className="mt-1 text-xs text-slate-400">🎤 {seg.speaker + 1}</span>
                            )}
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed flex-1">{seg.text}</p>
                          <Play className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500">No transcript available</p>
                  </div>
                )}
              </div>
            )}

            {/* ===== CHAPTERS TAB ===== */}
            {activeTab === 'chapters' && (
              <div className="p-5">
                {summary.chapters?.length > 0 ? (
                  <div className="space-y-3">
                    {summary.chapters.map((chapter, i) => (
                      <button
                        key={i}
                        onClick={() => handleSeekTo(chapter.timestamp)}
                        className="w-full text-left p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-violet-50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-indigo-500 font-mono font-bold">
                                {formatTimestamp(chapter.timestamp)}
                              </span>
                            </div>
                            <h5 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {chapter.title}
                            </h5>
                            <p className="text-slate-500 text-sm mt-1">{chapter.summary}</p>
                          </div>
                          <Play className="w-5 h-5 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
                      <List className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500">No chapters detected</p>
                    <p className="text-slate-400 text-sm mt-1">Chapters work best with longer videos</p>
                  </div>
                )}
              </div>
            )}

            {/* ===== QUIZ TAB ===== */}
            {activeTab === 'quiz' && <QuizTab questions={summary.quizQuestions} onSeekTo={handleSeekTo} />}

            {/* ===== FLASHCARDS TAB ===== */}
            {activeTab === 'flashcards' && <FlashcardsTab flashcards={summary.flashcards} />}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default VideoLearningPanel;
