import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Target,
  Award,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../components/Students/components/ui/button';
import { Card, CardContent } from '../../components/Students/components/ui/card';
import { RadioGroup, RadioGroupItem } from '../../components/Students/components/ui/radio-group';
import { Label } from '../../components/Students/components/ui/label';
import { generateAssessment, getCachedAssessment, cacheAssessment } from '../../services/assessmentGenerationService';

/**
 * Dynamic Assessment Component
 * Generates course-specific assessments using AI
 */
const DynamicAssessment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get course info from navigation state
  const courseName = location.state?.courseName || 'General Skills';
  const courseLevel = location.state?.level || 'Intermediate';
  
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  // Load or generate assessment
  useEffect(() => {
    loadAssessment();
  }, [courseName]);

  // Debug: Log course info
  useEffect(() => {
    console.log('🎓 Assessment Page Loaded:', {
      courseName,
      courseLevel,
      locationState: location.state
    });
  }, [courseName, courseLevel, location.state]);

  // Timer
  useEffect(() => {
    if (!loading && !showResults) {
      const timer = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [loading, showResults]);

  const loadAssessment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to load from cache first
      const cached = getCachedAssessment(courseName);
      
      if (cached) {
        console.log('✅ Using cached assessment for:', courseName);
        console.log('📅 Cached on:', new Date(cached.cachedAt).toLocaleString());
        setAssessment(cached);
        setLoading(false);
        return;
      }

      // Generate new assessment
      console.log('🔄 No cache found. Generating new assessment for:', courseName);
      const generated = await generateAssessment(courseName, courseLevel, 15);
      
      console.log('✅ Assessment generated successfully');
      setAssessment(generated);
      cacheAssessment(courseName, generated);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error loading assessment:', err);
      setError(err.message || 'Failed to load assessment');
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = () => {
    // Calculate score
    let correctCount = 0;
    assessment.questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer && userAnswer === q.correct_answer) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / assessment.questions.length) * 100);
    setScore(percentage);
    setShowResults(true);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Generating Assessment</h2>
          <p className="text-gray-600 mb-4">Creating personalized questions for:</p>
          <div className="bg-white rounded-xl p-4 mb-4 border-2 border-blue-200">
            <p className="text-xl font-bold text-blue-600">{courseName}</p>
            <p className="text-sm text-gray-500">Level: {courseLevel}</p>
          </div>
          <p className="text-sm text-gray-400">This may take 10-20 seconds...</p>
          <p className="text-xs text-gray-400 mt-2">Questions will be cached for future use</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Assessment</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate(-1)}
                variant="outline"
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={loadAssessment}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    const passed = score >= 60;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden">
              <div className={`p-8 text-center ${passed ? 'bg-gradient-to-br from-green-50 to-emerald-50' : 'bg-gradient-to-br from-orange-50 to-amber-50'}`}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  {passed ? (
                    <Award className="w-24 h-24 text-green-600 mx-auto mb-4" />
                  ) : (
                    <Target className="w-24 h-24 text-orange-600 mx-auto mb-4" />
                  )}
                </motion.div>
                
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {passed ? 'Congratulations!' : 'Keep Learning!'}
                </h1>
                <p className="text-gray-600 mb-6">
                  {passed 
                    ? 'You have successfully completed the assessment' 
                    : 'You can retake the assessment to improve your score'}
                </p>

                <div className="bg-white rounded-2xl p-6 mb-6 inline-block">
                  <div className="text-6xl font-bold text-gray-900 mb-2">{score}%</div>
                  <div className="text-gray-600">Your Score</div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-2xl font-bold text-gray-900">{assessment.questions.length}</div>
                    <div className="text-sm text-gray-600">Total Questions</div>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((score / 100) * assessment.questions.length)}
                    </div>
                    <div className="text-sm text-gray-600">Correct</div>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="text-2xl font-bold text-gray-900">{formatTime(timeElapsed)}</div>
                    <div className="text-sm text-gray-600">Time Taken</div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => navigate('/student/my-learning')}
                    variant="outline"
                    className="px-8"
                  >
                    Back to Learning
                  </Button>
                  <Button
                    onClick={() => {
                      setShowResults(false);
                      setCurrentQuestionIndex(0);
                      setAnswers({});
                      setTimeElapsed(0);
                      setScore(0);
                    }}
                    className="px-8 bg-blue-600 hover:bg-blue-700"
                  >
                    Retake Assessment
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // Assessment questions
  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const isAnswered = answers[currentQuestion.id] !== undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) {
                navigate(-1);
              }
            }}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Exit Assessment</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span className="font-medium">{formatTime(timeElapsed)}</span>
            </div>
            
            {/* Debug: Regenerate button */}
            {import.meta.env.DEV && (
              <button
                onClick={() => {
                  if (window.confirm('Regenerate questions? Current progress will be lost.')) {
                    // Clear cache
                    const cacheKey = `assessment_${courseName.toLowerCase().replace(/\s+/g, '_')}`;
                    localStorage.removeItem(cacheKey);
                    // Reload
                    window.location.reload();
                  }
                }}
                className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                title="Clear cache and regenerate questions"
              >
                🔄 Regenerate
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {assessment.questions.length}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Course Info */}
        <div className="mb-6 bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{assessment.course}</h2>
              <p className="text-sm text-gray-600">Level: {assessment.level}</p>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-6">
              <CardContent className="p-8">
                {/* Question */}
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-sm">{currentQuestionIndex + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-medium text-gray-900 leading-relaxed">
                        {currentQuestion.question}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
                        <span className="text-xs font-medium text-gray-600">
                          {currentQuestion.skill_tag}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Options */}
                {currentQuestion.type === 'mcq' && (
                  <RadioGroup
                    value={answers[currentQuestion.id] || ''}
                    onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                  >
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, idx) => (
                        <div
                          key={idx}
                          className={`
                            relative flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer
                            ${answers[currentQuestion.id] === option
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                            }
                          `}
                        >
                          <RadioGroupItem
                            value={option}
                            id={`option-${idx}`}
                            className="mr-3"
                          />
                          <Label
                            htmlFor={`option-${idx}`}
                            className="flex-1 cursor-pointer text-gray-900"
                          >
                            {option}
                          </Label>
                          {answers[currentQuestion.id] === option && (
                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {/* Short Answer */}
                {currentQuestion.type === 'short_answer' && (
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                    rows={4}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="px-6"
          >
            Previous
          </Button>

          <div className="text-sm text-gray-600">
            {Object.keys(answers).length} of {assessment.questions.length} answered
          </div>

          <Button
            onClick={handleNext}
            disabled={!isAnswered}
            className="px-6 bg-blue-600 hover:bg-blue-700"
          >
            {currentQuestionIndex === assessment.questions.length - 1 ? 'Submit' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DynamicAssessment;
