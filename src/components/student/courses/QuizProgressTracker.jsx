import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  HelpCircle,
  RotateCcw,
  Trophy,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { courseProgressService } from '../../../services/courseProgressService';

/**
 * Quiz Progress Tracker Component
 * Handles quiz taking with progress saving and resume functionality
 */
const QuizProgressTracker = ({ quiz, studentId, courseId, lessonId, onComplete, onClose }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [resumed, setResumed] = useState(false);

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Initialize or resume quiz attempt
  useEffect(() => {
    const initQuiz = async () => {
      if (!studentId || !quiz?.id) return;

      setIsLoading(true);
      try {
        const result = await courseProgressService.startQuizAttempt(
          studentId,
          courseId,
          lessonId,
          quiz.id,
          totalQuestions
        );

        if (result.success && result.data) {
          setAttemptId(result.data.id);
          setAttemptNumber(result.data.attempt_number);

          if (result.resumed && result.data.answers) {
            setAnswers(result.data.answers);
            setCurrentQuestionIndex(result.data.current_question_index || 0);
            setTimeSpent(result.data.time_spent_seconds || 0);
            setResumed(true);
          }
        }
      } catch (error) {
        console.error('Error initializing quiz:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initQuiz();
  }, [studentId, courseId, lessonId, quiz?.id, totalQuestions]);

  // Track time spent
  useEffect(() => {
    if (showResults || isLoading) return;

    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [showResults, isLoading]);

  // Handle answer selection
  const handleAnswer = useCallback(
    async (questionId, answer) => {
      const newAnswers = { ...answers, [questionId]: answer };
      setAnswers(newAnswers);

      // Save answer to database
      if (studentId && quiz?.id) {
        await courseProgressService.saveQuizAnswer(
          studentId,
          quiz.id,
          attemptNumber,
          questionId,
          answer
        );
      }
    },
    [answers, studentId, quiz?.id, attemptNumber]
  );

  // Navigate to next question
  const goToNext = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [currentQuestionIndex, totalQuestions]);

  // Navigate to previous question
  const goToPrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Submit quiz
  const handleSubmit = useCallback(async () => {
    if (answeredCount < totalQuestions) {
      const confirm = window.confirm(
        `You have ${totalQuestions - answeredCount} unanswered questions. Submit anyway?`
      );
      if (!confirm) return;
    }

    setIsSubmitting(true);
    try {
      // Calculate correct answers
      let correctCount = 0;
      questions.forEach((q) => {
        const userAnswer = answers[q.id];
        if (userAnswer === q.correctAnswer) {
          correctCount++;
        }
      });

      const result = await courseProgressService.submitQuiz(
        studentId,
        quiz.id,
        attemptNumber,
        correctCount,
        totalQuestions
      );

      if (result.success) {
        setResults({
          score: result.score,
          passed: result.passed,
          correctAnswers: correctCount,
          totalQuestions,
          timeSpent,
        });
        setShowResults(true);

        if (onComplete) {
          onComplete(result);
        }
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    answeredCount,
    totalQuestions,
    questions,
    answers,
    studentId,
    quiz?.id,
    attemptNumber,
    timeSpent,
    onComplete,
  ]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Results view
  if (showResults && results) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto text-center"
      >
        <div
          className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
            results.passed ? 'bg-emerald-100' : 'bg-amber-100'
          }`}
        >
          {results.passed ? (
            <Trophy className="w-10 h-10 text-emerald-600" />
          ) : (
            <AlertCircle className="w-10 h-10 text-amber-600" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {results.passed ? 'Congratulations!' : 'Keep Practicing!'}
        </h2>

        <p className="text-gray-600 mb-6">
          {results.passed ? 'You passed the quiz!' : 'You need 70% to pass. Try again!'}
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="text-4xl font-bold text-indigo-600 mb-2">
            {Math.round(results.score)}%
          </div>
          <div className="text-sm text-gray-600">
            {results.correctAnswers} of {results.totalQuestions} correct
          </div>
          <div className="text-xs text-gray-500 mt-2 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            Time: {formatTime(results.timeSpent)}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          {!results.passed && (
            <button
              onClick={() => {
                setShowResults(false);
                setAnswers({});
                setCurrentQuestionIndex(0);
                setTimeSpent(0);
              }}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Quiz taking view
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{quiz?.title || 'Quiz'}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span>
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(timeSpent)}
            </span>
          </div>
          {resumed && <span className="bg-white/20 px-2 py-1 rounded text-xs">Resumed</span>}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 bg-white/30 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-white rounded-full"
          />
        </div>
      </div>

      {/* Question */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentQuestion && (
              <>
                <div className="flex items-start gap-3 mb-6">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <HelpCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="text-lg text-gray-900 font-medium">{currentQuestion.question}</p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, index) => {
                    const isSelected = answers[currentQuestion.id] === option;
                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswer(currentQuestion.id, option)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                            }`}
                          >
                            {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                          </div>
                          <span className={isSelected ? 'text-indigo-900' : 'text-gray-700'}>
                            {option}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Question navigation dots */}
      <div className="px-6 pb-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {questions.map((q, index) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = index === currentQuestionIndex;
            return (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white'
                    : isAnswered
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <button
          onClick={goToPrevious}
          disabled={currentQuestionIndex === 0}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        <div className="text-sm text-gray-500">
          {answeredCount} of {totalQuestions} answered
        </div>

        {currentQuestionIndex === totalQuestions - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        ) : (
          <button
            onClick={goToNext}
            className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:text-indigo-700"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizProgressTracker;
