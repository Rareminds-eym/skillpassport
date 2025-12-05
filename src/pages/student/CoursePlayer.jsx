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
  Clock,
  Award,
  Menu,
  X,
  FileText,
  Video,
  Image,
  Link as LinkIcon,
  Youtube
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { courseEnrollmentService } from '../../services/courseEnrollmentService';
import { useAuth } from '../../context/AuthContext';
import { fileService } from '../../services/fileService';
import { AITutorPanel, VideoLearningPanel } from '../../components/ai-tutor';

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
  const [lessonVideoUrl, setLessonVideoUrl] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [lessonResources, setLessonResources] = useState([]);
  const [lessonStartTime, setLessonStartTime] = useState(null);
  const [accumulatedTime, setAccumulatedTime] = useState(0);

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

  // Get current lesson
  const getCurrentLesson = () => {
    if (!course?.modules || !course.modules[currentModuleIndex]) return null;
    const currentModule = course.modules[currentModuleIndex];
    if (!currentModule.lessons || !currentModule.lessons[currentLessonIndex]) return null;
    return currentModule.lessons[currentLessonIndex];
  };

  // Save time spent on lesson
  const saveTimeSpent = async (additionalSeconds) => {
    if (!user?.id || !courseId) return;

    const currentLesson = getCurrentLesson();
    if (!currentLesson) return;

    try {
      // Get current accumulated time from state
      const totalTime = accumulatedTime + additionalSeconds;

      console.log('Saving time:', { additionalSeconds, accumulatedTime, totalTime });

      const { error } = await supabase
        .from('student_course_progress')
        .upsert({
          student_id: user.id,
          course_id: courseId,
          lesson_id: currentLesson.id,
          time_spent_seconds: totalTime,
          last_accessed: new Date().toISOString()
        }, {
          onConflict: 'student_id,course_id,lesson_id'
        });

      if (error) {
        console.error('Error saving time spent:', error);
      } else {
        // Update accumulated time after successful save
        setAccumulatedTime(totalTime);
      }
    } catch (error) {
      console.error('Error in saveTimeSpent:', error);
    }
  };

  // Mark lesson as completed
  const markLessonCompleted = async (lessonId) => {
    if (!user?.id || !courseId) return;

    try {
      const { error } = await supabase
        .from('student_course_progress')
        .upsert({
          student_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          last_accessed: new Date().toISOString()
        }, {
          onConflict: 'student_id,course_id,lesson_id'
        });

      if (error) {
        console.error('Error marking lesson complete:', error);
      }
    } catch (error) {
      console.error('Error in markLessonCompleted:', error);
    }
  };

  // Initialize lesson progress tracking
  const initializeLessonProgress = async () => {
    if (!user?.id || !courseId) return;

    const currentLesson = getCurrentLesson();
    if (!currentLesson) return;

    try {
      // Check if progress record exists
      const { data: existing, error: fetchError } = await supabase
        .from('student_course_progress')
        .select('*')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .eq('lesson_id', currentLesson.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching lesson progress:', fetchError);
        return;
      }

      // If record exists, load accumulated time
      if (existing) {
        setAccumulatedTime(existing.time_spent_seconds || 0);

        // Update last_accessed
        await supabase
          .from('student_course_progress')
          .update({
            last_accessed: new Date().toISOString(),
            status: existing.status === 'completed' ? 'completed' : 'in_progress'
          })
          .eq('id', existing.id);
      } else {
        // Create new progress record
        await supabase
          .from('student_course_progress')
          .insert({
            student_id: user.id,
            course_id: courseId,
            lesson_id: currentLesson.id,
            status: 'in_progress',
            time_spent_seconds: 0,
            last_accessed: new Date().toISOString()
          });
      }
    } catch (error) {
      console.error('Error initializing lesson progress:', error);
    }
  };

  // Fetch course data
  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  // Fetch video and resources when lesson changes
  useEffect(() => {
    if (course && currentModuleIndex !== null && currentLessonIndex !== null) {
      fetchLessonMedia();
      initializeLessonProgress();
    }
  }, [course, currentModuleIndex, currentLessonIndex]);

  // Track time spent on current lesson
  useEffect(() => {
    // Start timer when lesson loads
    setLessonStartTime(Date.now());

    // Don't reset accumulatedTime here - it's loaded in initializeLessonProgress

    // Save progress before unmounting or changing lesson
    return () => {
      const currentTime = lessonStartTime ? Math.floor((Date.now() - lessonStartTime) / 1000) : 0;
      if (currentTime > 0) {
        // Use the latest accumulated time by accessing it directly
        saveTimeSpent(currentTime).catch(err => console.error('Error saving on unmount:', err));
      }
    };
  }, [currentModuleIndex, currentLessonIndex]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (lessonStartTime) {
        const currentTime = Math.floor((Date.now() - lessonStartTime) / 1000);
        if (currentTime > 0) {
          saveTimeSpent(currentTime);
          setLessonStartTime(Date.now()); // Reset timer after save
        }
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [lessonStartTime, accumulatedTime, currentModuleIndex, currentLessonIndex]);

  const fetchLessonMedia = async () => {
    const currentLesson = getCurrentLesson();
    if (!currentLesson) return;

    // Reset states
    setLessonVideoUrl(null);
    setLessonResources([]);
    setVideoLoading(true);

    try {
      // Check if lesson has resources from educator upload
      if (currentLesson.resources && currentLesson.resources.length > 0) {
        console.log('Lesson resources:', currentLesson.resources);

        // Find video resources (uploaded by educator)
        const videoResource = currentLesson.resources.find(
          r => r.type === 'video' || r.type === 'youtube'
        );

        if (videoResource) {
          // Check if URL is an R2 file key or a full URL
          if (videoResource.url && videoResource.url.startsWith('courses/')) {
            // It's an R2 file key, fetch fresh presigned URL
            try {
              const freshUrl = await fileService.getFileUrl(videoResource.url);
              setLessonVideoUrl(freshUrl);
            } catch (error) {
              console.error('Error fetching fresh video URL:', error);
              // Fallback to stored URL if available
              if (videoResource.embedUrl) {
                setLessonVideoUrl(videoResource.embedUrl);
              }
            }
          } else if (videoResource.embedUrl) {
            // For YouTube videos, use embed URL
            setLessonVideoUrl(videoResource.embedUrl);
          } else if (videoResource.url) {
            // Use the stored URL directly (presigned URL or external link)
            setLessonVideoUrl(videoResource.url);
          }
        }

        // Get all non-video resources (PDFs, documents, links, etc.)
        const otherResources = currentLesson.resources.filter(
          r => r.type !== 'video' || r.type === 'youtube'
        );

        if (otherResources.length > 0) {
          setLessonResources(otherResources.map(r => ({
            title: r.name,
            url: r.url,
            type: r.type,
            size: r.size
          })));
        }
      }
      // Fallback: Check for old-style video_url field
      else if (currentLesson.video_url &&
               (currentLesson.video_url.startsWith('http') ||
                currentLesson.video_url.startsWith('https'))) {
        setLessonVideoUrl(currentLesson.video_url);
      }
    } catch (error) {
      console.error('Error loading lesson media:', error);
    } finally {
      setVideoLoading(false);
    }
  };

  const fetchCourse = async () => {
    try {
      setLoading(true);

      // Fetch course basic info
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('course_id', courseId)
        .single();

      if (courseError) throw courseError;

      if (!courseData) {
        navigate('/student/courses');
        return;
      }

      // Fetch modules with lessons and resources
      const { data: modulesData, error: modulesError } = await supabase
        .from('course_modules')
        .select(`
          *,
          lessons!fk_module (
            *,
            lesson_resources!fk_lesson (*)
          )
        `)
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (modulesError) {
        console.error('Error fetching modules:', modulesError);
      }

      console.log('Raw modules data from Supabase:', modulesData);

      // Transform modules data to match expected structure
      const transformedModules = (modulesData || []).map(module => {
        console.log('Processing module:', module.title, 'Raw lessons:', module.lessons);

        // Sort lessons by order_index
        const sortedLessons = (module.lessons || []).sort((a, b) =>
          (a.order_index || 0) - (b.order_index || 0)
        );

        return {
          id: module.module_id,
          title: module.title,
          description: module.description || '',
          skillTags: module.skill_tags || [],
          activities: module.activities || [],
          order: module.order_index,
          lessons: sortedLessons.map(lesson => {
            console.log('Processing lesson:', lesson.title, 'Resources:', lesson.lesson_resources);
            return {
              id: lesson.lesson_id,
              title: lesson.title,
              content: lesson.content || '',
              description: lesson.description || '',
              duration: lesson.duration || '',
              order: lesson.order_index,
              resources: (lesson.lesson_resources || []).map(resource => ({
                id: resource.resource_id,
                name: resource.name,
                type: resource.type,
                url: resource.url,
                size: resource.file_size,
                thumbnailUrl: resource.thumbnail_url,
                embedUrl: resource.embed_url
              }))
            };
          })
        };
      });

      // Combine course data with modules
      const fullCourse = {
        ...courseData,
        modules: transformedModules
      };

      console.log('Full course loaded:', fullCourse);
      console.log('Modules count:', transformedModules.length);
      console.log('Total lessons:', transformedModules.reduce((acc, m) => acc + m.lessons.length, 0));

      setCourse(fullCourse);

      // Update total_lessons in enrollment if needed
      if (transformedModules.length > 0 && enrollment) {
        const totalLessons = transformedModules.reduce(
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

  // Navigation handlers
  const goToNextLesson = async () => {
    const currentModule = course.modules[currentModuleIndex];
    const currentLesson = getCurrentLesson();

    // Save current time before navigating
    if (lessonStartTime) {
      const timeSpent = Math.floor((Date.now() - lessonStartTime) / 1000);
      if (timeSpent > 0) {
        await saveTimeSpent(timeSpent);
      }
    }

    // Mark current lesson as completed in database
    if (currentLesson) {
      await markLessonCompleted(currentLesson.id);
    }

    // Mark current lesson as completed in local state
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

  const goToPreviousLesson = async () => {
    // Save current time before navigating
    if (lessonStartTime) {
      const timeSpent = Math.floor((Date.now() - lessonStartTime) / 1000);
      if (timeSpent > 0) {
        await saveTimeSpent(timeSpent);
      }
    }

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

  const goToLesson = async (moduleIndex, lessonIndex) => {
    // Save current time before navigating
    if (lessonStartTime) {
      const timeSpent = Math.floor((Date.now() - lessonStartTime) / 1000);
      if (timeSpent > 0) {
        await saveTimeSpent(timeSpent);
      }
    }

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

  // Get appropriate icon for resource type
  const getResourceIcon = (type) => {
    switch (type) {
      case 'pdf':
      case 'document':
        return FileText;
      case 'video':
        return Video;
      case 'image':
        return Image;
      case 'youtube':
        return Video;
      case 'link':
      case 'drive':
        return LinkIcon;
      default:
        return BookOpen;
    }
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

                    {/* Video Player */}
                    {videoLoading ? (
                      <div className="mb-8 aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                          <p className="text-sm text-gray-600">Loading video...</p>
                        </div>
                      </div>
                    ) : lessonVideoUrl ? (
                      <div className="mb-8">
                        {/* Check if it's a YouTube embed URL */}
                        {lessonVideoUrl.includes('youtube.com/embed') ? (
                          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                            <iframe
                              src={lessonVideoUrl}
                              className="w-full h-full"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              title={currentLesson.title}
                            />
                          </div>
                        ) : (
                          <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                            <video
                              id="lesson-video-player"
                              src={lessonVideoUrl}
                              className="w-full h-full"
                              controls
                              controlsList="nodownload"
                              title={currentLesson.title}
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}
                        
                        {/* AI Video Learning Panel - Summary, Transcript, Chapters */}
                        {lessonVideoUrl && !lessonVideoUrl.includes('youtube.com') && (
                          <VideoLearningPanel
                            videoUrl={lessonVideoUrl}
                            lessonId={currentLesson?.id}
                            courseId={courseId}
                            lessonTitle={currentLesson?.title}
                            onSeekTo={(time) => {
                              const video = document.getElementById('lesson-video-player');
                              if (video) {
                                video.currentTime = time;
                                video.play();
                              }
                            }}
                          />
                        )}
                      </div>
                    ) : null}

                    {/* Resources */}
                    {lessonResources.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          📚 Course Resources
                        </h3>
                        <div className="space-y-2">
                          {lessonResources.map((resource, index) => {
                            const ResourceIcon = getResourceIcon(resource.type);
                            return (
                              <a
                                key={`resource-${index}`}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg transition-all group"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="p-2 bg-white rounded-lg group-hover:bg-indigo-100 transition-colors">
                                    <ResourceIcon className="w-5 h-5 text-indigo-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {resource.title}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                      {resource.type}
                                      {resource.size && ` • ${resource.size}`}
                                    </p>
                                  </div>
                                </div>
                                <div className="ml-3 flex-shrink-0">
                                  <LinkIcon className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                                </div>
                              </a>
                            );
                          })}
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

      {/* AI Course Tutor Panel */}
      {courseId && (
        <AITutorPanel
          courseId={courseId}
          courseName={course?.title}
          lessonContext={{
            lessonId: currentLesson?.id,
            lessonTitle: currentLesson?.title,
            moduleTitle: currentModule?.title
          }}
        />
      )}
    </div>
  );
};

export default CoursePlayer;
