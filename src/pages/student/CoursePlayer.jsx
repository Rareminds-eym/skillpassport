import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/Students/components/ui/card';
import { Button } from '../../components/Students/components/ui/button';
import { Badge } from '../../components/Students/components/ui/badge';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  Home,
  Clock,
  Award,
  Menu,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { courseEnrollmentService } from '../../services/courseEnrollmentService';
import { useAuth } from '../../context/AuthContext';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [enrollment, setEnrollment] = useState(null);

  // Enroll student and load existing progress
  useEffect(() => {
    if (user?.email && courseId) {
      enrollAndLoadProgress();
    }
  }, [user, courseId]);

  const enrollAndLoadProgress = async () => {
    if (!user?.email) return;

    try {
      console.log('Enrolling student:', user.email, 'in course:', courseId);

      // Enroll student (or get existing enrollment)
      const enrollResult = await courseEnrollmentService.enrollStudent(user.email, courseId);

      console.log('Enrollment result:', enrollResult);

      if (enrollResult.success && enrollResult.data) {
        setEnrollment(enrollResult.data);

        // Load previously completed lessons
        if (enrollResult.data.completed_lessons && enrollResult.data.completed_lessons.length > 0) {
          setCompletedLessons(new Set(enrollResult.data.completed_lessons));
        }
      } else if (!enrollResult.success) {
        console.error('Failed to enroll:', enrollResult.error);
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
    }
  };

  // Save progress whenever completed lessons change
  useEffect(() => {
    if (user?.email && courseId && completedLessons.size > 0) {
      saveProgress();
    }
  }, [completedLessons]);

  const saveProgress = async () => {
    if (!user?.email) return;

    try {
      const lessonsArray = Array.from(completedLessons);
      await courseEnrollmentService.updateProgress(user.email, courseId, lessonsArray);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Fetch course data
  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('course_id', courseId)
        .single();

      if (error) throw error;

      if (!data) {
        navigate('/student/courses');
        return;
      }

      setCourse(data);

      // Update total_lessons in enrollment if needed
      if (data.modules && enrollment) {
        const totalLessons = data.modules.reduce(
          (acc, module) => acc + (module.lessons?.length || 0),
          0
        );

        // Update enrollment with total lessons count
        if (enrollment.total_lessons === 0 && totalLessons > 0) {
          await courseEnrollmentService.updateProgress(
            user.email,
            courseId,
            Array.from(completedLessons)
          );
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      navigate('/student/courses');
    } finally {
      setLoading(false);
    }
  };

  // Get current lesson
  const getCurrentLesson = () => {
    if (!course?.modules || !course.modules[currentModuleIndex]) return null;
    const currentModule = course.modules[currentModuleIndex];
    if (!currentModule.lessons || !currentModule.lessons[currentLessonIndex]) return null;
    return currentModule.lessons[currentLessonIndex];
  };

  // Navigation handlers
  const goToNextLesson = () => {
    const currentModule = course.modules[currentModuleIndex];

    // Mark current lesson as completed
    const lessonKey = `${currentModuleIndex}-${currentLessonIndex}`;
    setCompletedLessons(prev => new Set([...prev, lessonKey]));

    // Check if there's a next lesson in current module
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      setCurrentLessonIndex(prev => prev + 1);
    }
    // Move to next module
    else if (currentModuleIndex < course.modules.length - 1) {
      setCurrentModuleIndex(prev => prev + 1);
      setCurrentLessonIndex(0);
    }
  };

  const goToPreviousLesson = () => {
    // Check if there's a previous lesson in current module
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(prev => prev - 1);
    }
    // Move to previous module's last lesson
    else if (currentModuleIndex > 0) {
      setCurrentModuleIndex(prev => prev - 1);
      const previousModule = course.modules[currentModuleIndex - 1];
      setCurrentLessonIndex(previousModule.lessons.length - 1);
    }
  };

  const goToLesson = (moduleIndex, lessonIndex) => {
    setCurrentModuleIndex(moduleIndex);
    setCurrentLessonIndex(lessonIndex);
  };

  // Check if lesson is completed
  const isLessonCompleted = (moduleIndex, lessonIndex) => {
    return completedLessons.has(`${moduleIndex}-${lessonIndex}`);
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!course?.modules) return 0;
    const totalLessons = course.modules.reduce((acc, module) => acc + (module.lessons?.length || 0), 0);
    if (totalLessons === 0) return 0;
    return Math.round((completedLessons.size / totalLessons) * 100);
  };

  const canGoNext = () => {
    if (!course?.modules) return false;
    const currentModule = course.modules[currentModuleIndex];
    return currentLessonIndex < currentModule.lessons.length - 1 ||
           currentModuleIndex < course.modules.length - 1;
  };

  const canGoPrevious = () => {
    return currentLessonIndex > 0 || currentModuleIndex > 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const currentLesson = getCurrentLesson();
  const currentModule = course.modules?.[currentModuleIndex];
  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/student/courses')}
                variant="ghost"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Courses</span>
              </Button>
              <div className="border-l border-gray-300 h-8"></div>
              <h1 className="text-lg font-semibold text-gray-900 truncate max-w-xs sm:max-w-md">
                {course.title}
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">
                  {progress}% Complete
                </span>
              </div>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg md:hidden"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          />
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar - Course Content */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-white border-r border-gray-200 overflow-y-auto z-30"
            >
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h2>

                {/* Modules and Lessons */}
                <div className="space-y-2">
                  {course.modules?.map((module, moduleIndex) => (
                    <div key={moduleIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 p-3">
                        <h3 className="font-medium text-gray-900 text-sm">
                          Module {moduleIndex + 1}: {module.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {module.lessons?.length || 0} lessons
                        </p>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {module.lessons?.map((lesson, lessonIndex) => {
                          const isActive = moduleIndex === currentModuleIndex && lessonIndex === currentLessonIndex;
                          const isCompleted = isLessonCompleted(moduleIndex, lessonIndex);

                          return (
                            <button
                              key={lessonIndex}
                              onClick={() => goToLesson(moduleIndex, lessonIndex)}
                              className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                                isActive ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5">
                                  {isCompleted ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-gray-300" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className={`text-sm ${isActive ? 'font-medium text-indigo-900' : 'text-gray-700'}`}>
                                    {lesson.title || lesson}
                                  </p>
                                  {lesson.duration && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      <span className="text-xs text-gray-500">{lesson.duration}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            {currentLesson ? (
              <motion.div
                key={`${currentModuleIndex}-${currentLessonIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="shadow-xl border-0">
                  <CardContent className="p-6 sm:p-8">
                    {/* Lesson Header */}
                    <div className="mb-6">
                      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 mb-3">
                        Module {currentModuleIndex + 1} - Lesson {currentLessonIndex + 1}
                      </Badge>
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        {currentLesson.title || currentLesson}
                      </h2>
                      {currentModule && (
                        <p className="text-gray-600">{currentModule.title}</p>
                      )}
                    </div>

                    {/* Lesson Content */}
                    <div className="prose prose-lg max-w-none mb-8">
                      {currentLesson.content ? (
                        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {currentLesson.content}
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">
                            This lesson content will be available soon.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Video/Media Placeholder */}
                    {currentLesson.video_url && (
                      <div className="mb-8 aspect-video bg-gray-900 rounded-lg overflow-hidden">
                        <iframe
                          src={currentLesson.video_url}
                          className="w-full h-full"
                          allowFullScreen
                          title={currentLesson.title}
                        />
                      </div>
                    )}

                    {/* Resources */}
                    {currentLesson.resources && currentLesson.resources.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Resources</h3>
                        <div className="space-y-2">
                          {currentLesson.resources.map((resource, index) => (
                            <a
                              key={index}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <BookOpen className="w-4 h-4 text-indigo-600" />
                              <span className="text-sm text-gray-700">{resource.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                      <Button
                        onClick={goToPreviousLesson}
                        disabled={!canGoPrevious()}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>

                      <div className="text-sm text-gray-600">
                        {currentLessonIndex + 1} of {currentModule?.lessons?.length || 0} lessons
                      </div>

                      <Button
                        onClick={goToNextLesson}
                        disabled={!canGoNext()}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {canGoNext() ? 'Next' : 'Complete'}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="shadow-xl border-0">
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Lessons Available</h3>
                  <p className="text-gray-600 mb-6">
                    This course doesn't have any lessons yet.
                  </p>
                  <Button
                    onClick={() => navigate('/student/courses')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Back to Courses
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
