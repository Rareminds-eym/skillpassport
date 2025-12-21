import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Clock,
  HelpCircle,
  X,
  Mail,
  Phone,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { getQuestions } from "../../data/assessment/questions";
import { getCertificateConfig } from "../../data/assessment/certificateConfig";
import { Question } from "../../types";
import ReviewPage from "../../components/assessment/test/ReviewPage";
import InstructionsPage from "../../components/assessment/test/InstructionsPage";
import PermissionsModal from "../../components/assessment/test/PermissionsModal";
import WarningModal from "../../components/assessment/test/WarningModal";
import TimeWarningModal from "../../components/assessment/test/TimeWarningModal";
import { useAuth } from "../../context/AuthContext";
import { useTest } from "../../context/assessment/TestContext";

interface TestAttempt {
  nmId: string;
  courseId: string;
  timestamp: Date;
  questions: {
    questionId: number;
    question: string;
    attemptedAnswer: string | null;
    correctAnswer: string;
    isCorrect: boolean;
    timeTaken: number;
  }[];
  totalScore: number;
  totalQuestions: number;
}

const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const courseId = location.state?.courseId;
  const certificateName = location.state?.certificateName || location.state?.courseName || 'General Assessment';
  const certificateId = location.state?.certificateId;
  const videoRef = useRef<HTMLVideoElement>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Core state

  const { questions, setQuestions, selectedAnswers, setSelectedAnswers } =
    useTest();
  // const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showInstructions, setShowInstructions] = useState(true);
  const [showPermissions, setShowPermissions] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [isFromReview, setIsFromReview] = useState(false);

  // Test state
  // const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>([]);
  const [timeTakenPerQuestion, setTimeTakenPerQuestion] = useState<number[]>(
    []
  );
  const [totalTimeLeft, setTotalTimeLeft] = useState(900);
  const [submit, setSubmit] = useState<boolean>(false);

  // Warning and modal state
  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [showTimeWarning, setShowTimeWarning] = useState<
    "half-time" | "review-time" | null
  >(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactMessage, setContactMessage] = useState("");

  // Fetch questions when component mounts
  useEffect(() => {
    const loadQuestions = async () => {
      if (!courseId && !certificateName) {
        navigate("/student/my-learning");
        return;
      }

      try {
        setLoading(true);
        
        // Check if resuming an in-progress attempt
        const resumeAttempt = location.state?.resumeAttempt;
        
        if (resumeAttempt) {
          console.log('📝 Resuming assessment from question', resumeAttempt.current_question_index + 1);
          
          // Transform saved questions
          const transformedQuestions = resumeAttempt.questions.map((q: any) => ({
            id: q.id,
            text: q.question || q.text,
            question: q.question || q.text,
            options: q.options || [],
            correctAnswer: q.correct_answer || q.correctAnswer,
            type: q.type,
            difficulty: q.difficulty,
            skillTag: q.skill_tag || q.skillTag,
            estimatedTime: q.estimated_time || q.estimatedTime
          }));
          
          // Restore saved answers
          const restoredAnswers = resumeAttempt.student_answers.map((a: any) => a.selected_answer);
          
          setQuestions(transformedQuestions);
          setSelectedAnswers(restoredAnswers);
          setCurrentQuestion(resumeAttempt.current_question_index);
          setTimeTakenPerQuestion(new Array(transformedQuestions.length).fill(0));
          setTotalTimeLeft(resumeAttempt.time_remaining || 900);
          
          console.log('✅ Resumed at question', resumeAttempt.current_question_index + 1);
        }
        // Check if we have pre-generated questions
        else if (location.state?.preGeneratedQuestions && location.state.preGeneratedQuestions.length > 0) {
          const preGeneratedQuestions = location.state.preGeneratedQuestions;
          console.log('✅ Using pre-generated questions:', preGeneratedQuestions.length);
          
          // Transform API questions to match the expected format
          const transformedQuestions = preGeneratedQuestions.map((q: any) => ({
            id: q.id,
            text: q.question,  // Map 'question' to 'text' for UI
            question: q.question,  // Keep both for compatibility
            options: q.options || [],
            correctAnswer: q.correct_answer,
            type: q.type,
            difficulty: q.difficulty,
            skillTag: q.skill_tag,
            estimatedTime: q.estimated_time
          }));
          
          setQuestions(transformedQuestions);
          setSelectedAnswers(new Array(transformedQuestions.length).fill(null));
          setTimeTakenPerQuestion(new Array(transformedQuestions.length).fill(0));
          setTotalTimeLeft(900); // 15 minutes default
        } else {
          // Check if we should use dynamic generation
          const useDynamicGeneration = location.state?.useDynamicGeneration;
          const level = location.state?.level || 'Intermediate';
          
          if (useDynamicGeneration && certificateName) {
            console.log('🎯 Using dynamic question generation for:', certificateName);
            
            // Call backend API to generate questions
            const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const response = await fetch(`${backendUrl}/api/assessment/generate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                courseName: certificateName,
                level: level,
                questionCount: 15
              })
            });
            
            if (!response.ok) {
              throw new Error('Failed to generate assessment questions');
            }
            
            const assessment = await response.json();
            
            // Transform API questions to match the expected format
            const transformedQuestions = assessment.questions.map((q: any) => ({
              id: q.id,
              text: q.question,  // Map 'question' to 'text' for UI
              question: q.question,  // Keep both for compatibility
              options: q.options || [],
              correctAnswer: q.correct_answer,
              type: q.type,
              difficulty: q.difficulty,
              skillTag: q.skill_tag,
              estimatedTime: q.estimated_time
            }));
            
            console.log(`✅ Generated ${transformedQuestions.length} questions dynamically`);
            
            setQuestions(transformedQuestions);
            setSelectedAnswers(new Array(transformedQuestions.length).fill(null));
            setTimeTakenPerQuestion(new Array(transformedQuestions.length).fill(0));
            setTotalTimeLeft(900); // 15 minutes default
          } else {
            // Use original static question loading
            // Get certificate configuration
            const config = getCertificateConfig(certificateName || courseId);
            
            // Set time limit from config
            if (config.timeLimit) {
              setTotalTimeLeft(config.timeLimit);
            }
            
            // Try to fetch questions based on certificate name
            let fetchedQuestions = await getQuestions(courseId, certificateName);
            
            if (fetchedQuestions.length === 0) {
              throw new Error(`No questions found for ${certificateName}`);
            }
            
            console.log(`📝 Assessment Configuration:`);
            console.log(`   Certificate: ${certificateName}`);
            console.log(`   Questions: ${fetchedQuestions.length}`);
            console.log(`   Time Limit: ${config.timeLimit ? `${config.timeLimit / 60} minutes` : 'No limit'}`);
            console.log(`   Passing Score: ${config.passingScore}%`);
            console.log(`   Difficulty: ${config.difficulty}`);
            
            setQuestions(fetchedQuestions);
            setSelectedAnswers(new Array(fetchedQuestions.length).fill(null));
            setTimeTakenPerQuestion(new Array(fetchedQuestions.length).fill(0));
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load questions"
        );
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [courseId, certificateName, navigate]);

  // Handle tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (testStarted && !showInstructions && !showPermissions) {
        const isVisible = !document.hidden;
        setIsTabVisible(isVisible);

        if (!isVisible) {
          setWarningCount((prev) => {
            const newCount = prev + 1;
            if (newCount >= 3) {
              setSubmit(true);
              return prev;
            }
            setShowWarning(true);
            return newCount;
          });
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [testStarted, showInstructions, showPermissions]);

  // Initialize webcam
  // useEffect(() => {
  //   const initializeWebcam = async () => {
  //     try {
  //       const stream = await navigator.mediaDevices.getUserMedia({
  //         video: true,
  //       });
  //       if (videoRef.current) {
  //         videoRef.current.srcObject = stream;
  //       }
  //     } catch (error) {
  //       console.warn("Webcam not available:", error);
  //     }
  //   };

  //   initializeWebcam();

  //   return () => {
  //     if (videoRef.current && videoRef.current.srcObject) {
  //       const stream = videoRef.current.srcObject as MediaStream;
  //       const tracks = stream.getTracks();
  //       tracks.forEach((track) => track.stop());
  //     }
  //   };
  // }, []);

  // Timer effect
  useEffect(() => {
    if (showResults) {
      if (totalTimerRef.current) {
        clearInterval(totalTimerRef.current);
      }
      return;
    }

    if (testStarted) {
      totalTimerRef.current = setInterval(() => {
        setTotalTimeLeft((prev) => {
          // if (prev === 1800) {
          //   setShowTimeWarning("half-time");
          // } else
          if (prev === 300) {
            setShowTimeWarning("review-time");
            setShowReview(true);
          }
          if (prev <= 1) {
            setSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (totalTimerRef.current) {
        clearInterval(totalTimerRef.current);
      }
    };
  }, [showResults, testStarted]);

  // Question timer effect
  useEffect(() => {
    if (!testStarted || showReview) return;

    // Clear any existing timer
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
    }

    // Start a new timer that updates every second
    questionTimerRef.current = setInterval(() => {
      setTimeTakenPerQuestion((prev) => {
        const newTimes = [...prev];
        newTimes[currentQuestion] = (newTimes[currentQuestion] || 0) + 1;
        return newTimes;
      });
    }, 1000);

    // Cleanup function
    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
    };
  }, [currentQuestion, testStarted, showReview]);

  // Add cleanup for question timer when test ends
  useEffect(() => {
    return () => {
      if (questionTimerRef.current) {
        clearInterval(questionTimerRef.current);
      }
    };
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Message sent! Our support team will get back to you soon.");
    setContactMessage("");
    setShowContactForm(false);
    setShowHelp(false);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleQuestionSelect = (index: number) => {
    setCurrentQuestion(index);
    setShowReview(false);
    setIsFromReview(true);
  };

  const handleNext = () => {
    if (isFromReview) {
      setShowReview(true);
    } else if (currentQuestion === questions.length - 1) {
      setShowReview(true);
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handleStartTest = () => {
    setShowInstructions(false);
    setShowPermissions(true);
  };

  const handlePermissionsGranted = () => {
    setShowInstructions(false);
    setShowPermissions(false);
    setTestStarted(true);
    console.log("Assessment started for course:", courseId);
  };

  // Submit test attempt

  useEffect(() => {
    if (submit) {
      try {
        const handleFinish = async () => {
          console.log(selectedAnswers);
          const score = selectedAnswers.filter(
            (answer, index) =>
              answer !== null &&
              answer.toString() === questions[index].correctAnswer
          ).length;

          // Navigate to results page
          navigate("/student/assessment/results", {
            state: {
              score,
              totalQuestions: questions.length,
              courseId,
              questions: questions.map((q, index) => ({
                questionId: q.id,
                question: q.text,
                attemptedAnswer: selectedAnswers[index],
                correctAnswer: q.correctAnswer,
                isCorrect: selectedAnswers[index] === q.correctAnswer,
                timeTaken: timeTakenPerQuestion[index],
              })),
            },
          });
        };

        handleFinish();
      } catch (err) {
        console.log(err);
      } finally {
        setSubmit(false);
      }
    }
  }, [submit]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-pattern-chemistry flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading questions...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-pattern-chemistry flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-base font-bold text-gray-900 mb-4">
            Error Loading Test
          </h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/student/my-learning")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to My Learning
          </button>
        </div>
      </div>
    );
  }

  if (showInstructions) {
    return <InstructionsPage onContinue={handlePermissionsGranted} />;
  }

  if (showPermissions) {
    return <PermissionsModal onPermissionsGranted={handlePermissionsGranted} />;
  }

  if (showReview) {
    return (
      <ReviewPage
        questions={questions}
        answers={selectedAnswers}
        timeLeft={totalTimeLeft}
        timeTakenPerQuestion={timeTakenPerQuestion}
        formatTime={formatTime}
        onBack={() => {
          setShowReview(false);
          setCurrentQuestion(questions.length - 1);
        }}
        onSubmit={() => setSubmit(true)}
        onQuestionSelect={handleQuestionSelect}
      />
    );
  }

  return (
    <div className="min-h-screen bg-pattern-chemistry">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              {isFromReview && (
                <button
                  onClick={() => setShowReview(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Review
                </button>
              )}
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Question {currentQuestion + 1} of {questions.length}
                </h2>
                <p className="text-xs text-gray-500">
                  Time spent:{" "}
                  {formatTime(timeTakenPerQuestion[currentQuestion] || 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <span
                  className={`font-medium text-base ${
                    totalTimeLeft <= 300 ? "text-red-500" : ""
                  }`}
                >
                  {formatTime(totalTimeLeft)}
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowHelp(!showHelp)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
              >
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </motion.button>
            </div>
          </div>

          {/* Help Popup */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-20 right-6 w-96 bg-white rounded-lg shadow-xl p-6 z-50"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-base font-semibold text-gray-900">
                    Help & Support
                  </h3>
                  <button
                    onClick={() => {
                      setShowHelp(false);
                      setShowContactForm(false);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {!showContactForm ? (
                  <>
                    <div className="space-y-4 text-sm text-gray-600">
                      <p>• Total time limit is 15 minutes</p>
                      <p>
                        • You can navigate between questions using the number
                        buttons or Previous/Next
                      </p>
                      <p>• Your progress is saved when switching questions</p>
                      <p>
                        • Review all answers before submitting on the last
                        question
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-base font-medium text-gray-900 mb-4">
                        Need more help?
                      </h4>
                      <div className="space-y-3">
                        <a
                          href="mailto:info@rareminds.in"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                        >
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span>info@rareminds.in</span>
                        </a>
                        <a
                          href="tel:+1234567890"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                        >
                          <Phone className="w-4 h-4 text-blue-600" />
                          <span>+91 9902326951</span>
                        </a>
                        {/* <button
                          onClick={() => setShowContactForm(true)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-sm w-full"
                        >
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                          <span>Send us a message</span>
                        </button> */}
                      </div>
                    </div>
                  </>
                ) : (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleContactSubmit}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message
                      </label>
                      <textarea
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                        rows={4}
                        placeholder="How can we help you?"
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowContactForm(false)}
                        className="flex-1 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Send
                      </button>
                    </div>
                  </motion.form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question Navigation */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {questions.map((_, index) => {
                const status =
                  selectedAnswers[index] !== null ? "attempted" : "unattempted";
                const isActive = currentQuestion === index;

                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentQuestion(index)}
                    className={`relative w-8 h-8 rounded-md flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg"
                        : status === "attempted"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <span>{(index + 1).toString()}</span>
                    {status === "attempted" && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-white" />
                    )}
                    {isActive && (
                      <motion.div
                        layoutId="activeQuestion"
                        className="absolute inset-0 border-2 rounded-md"
                        style={{
                          borderColor:
                            status === "attempted" ? "#22c55e" : "#2563eb",
                        }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="flex justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-600">Attempted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-200 rounded-full" />
                <span className="text-gray-600">Unattempted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                <span className="text-gray-600">Current</span>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-8 min-h-[600px]"
          >
            <h2 className="text-base text-gray-900 mb-8 text-center">
              {questions[currentQuestion].text}
            </h2>

            <div className="space-y-6 max-w-3xl mx-auto">
              {questions[currentQuestion].options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    const newAnswers = [...selectedAnswers];
                    newAnswers[currentQuestion] = option;
                    setSelectedAnswers(newAnswers);
                  }}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedAnswers[currentQuestion] === option
                      ? "border-blue-600 bg-blue-50 text-gray-900"
                      : "border-gray-200 hover:border-blue-300 text-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm ${
                        selectedAnswers[currentQuestion] === option
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="text-sm">{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // Disable going back - students cannot change previous answers
                  // if (currentQuestion > 0) {
                  //   setCurrentQuestion((prev) => prev - 1);
                  // }
                }}
                disabled={true}
                className="bg-gray-100 text-gray-400 cursor-not-allowed flex items-center gap-3 px-6 py-2 rounded-lg text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="flex items-center gap-3 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
              >
                {isFromReview ? (
                  <>
                    Back to Review
                    <ArrowLeft className="w-4 h-4" />
                  </>
                ) : currentQuestion === questions.length - 1 ? (
                  <>
                    Review Answers
                    <ChevronRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Warning Modal */}
      <AnimatePresence>
        {showWarning && (
          <WarningModal
            warningCount={warningCount}
            onClose={() => setShowWarning(false)}
          />
        )}
      </AnimatePresence>

      {/* Time Warning Modal */}
      <AnimatePresence>
        {showTimeWarning && (
          <TimeWarningModal
            type={showTimeWarning}
            onClose={() => setShowTimeWarning(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestPage;
