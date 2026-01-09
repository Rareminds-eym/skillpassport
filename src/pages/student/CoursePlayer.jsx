import { AnimatePresence, motion } from 'framer-motion';
import {
    Award,
    BookOpen,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Circle,
    Clock,
    FileText,
    Image,
    Link as LinkIcon,
    Menu,
    Video,
    X
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AITutorPanel, VideoLearningPanel } from '../../components/ai-tutor';
import RestoreProgressModal from '../../components/student/courses/RestoreProgressModal';
import { Badge } from '../../components/Students/components/ui/badge';
import { Button } from '../../components/Students/components/ui/button';
import { Card, CardContent } from '../../components/Students/components/ui/card';
import { useAuth } from '../../context/AuthContext';
import { useSessionRestore } from '../../hooks/useSessionRestore';
import { supabase } from '../../lib/supabaseClient';
import { generateCourseCertificate } from '../../services/certificateService';
import { courseEnrollmentService } from '../../services/courseEnrollmentService';
import { courseProgressService } from '../../services/courseProgressService';
import { fileService } from '../../services/fileService';

const CoursePlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get the correct back navigation path based on user role
  const getBackPath = () => {
    switch (user?.role) {
      case 'educator':
        return '/educator/browse-courses';
      case 'student':
        return '/student/courses';
      case 'school_admin':
        return '/school-admin/academics/browse-courses';
      case 'college_admin':
        return '/college-admin/academics/browse-courses';
      case 'university_admin':
        return '/university-admin/browse-courses';
      default:
        return '/student/courses'; // fallback
    }
  };

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
  const [positionInitialized, setPositionInitialized] = useState(false);
  
  // Video progress tracking refs
  const videoRef = useRef(null);
  const videoSaveTimeoutRef = useRef(null);
  const lastSavedVideoPositionRef = useRef(0);

  // Check if user is a student (for progress tracking)
  const isStudent = user?.role === 'student';

  // Session restore hook - only for students
  const {
    restorePoint,
    showRestoreModal,
    isLoading: restoreLoading,
    shouldAutoRestore,
    handleRestore,
    handleStartFresh,
    dismissModal,
    saveRestorePoint,
    getLastAccessedText
  } = useSessionRestore(user?.id, courseId, { enabled: isStudent });

  // Track if enrollment has been initialized
  const enrollmentInitializedRef = useRef(false);

  // Enroll student and load existing progress (only for students)
  useEffect(() => {
    if (isStudent && user?.email && courseId && !enrollmentInitializedRef.current) {
      enrollmentInitializedRef.current = true;
      enrollAndLoadProgress();
    } else if (!isStudent && !positionInitialized) {
      // For non-students, immediately mark position as initialized
      console.log('📍 Non-student user, using default position');
      setPositionInitialized(true);
    }
  }, [user, courseId, isStudent, positionInitialized]);

  const enrollAndLoadProgress = async () => {
    if (!user?.email || !isStudent) {
      // For non-students, position is initialized at default (0, 0)
      setPositionInitialized(true);
      return;
    }

    try {
      console.log('📚 Enrolling student:', user.email, 'in course:', courseId);

      // Enroll student (or get existing enrollment)
      const enrollResult = await courseEnrollmentService.enrollStudent(user.email, courseId);

      console.log('📚 Enrollment result:', enrollResult);

      if (enrollResult.success && enrollResult.data) {
        setEnrollment(enrollResult.data);

        // Load previously completed lessons
        if (enrollResult.data.completed_lessons && enrollResult.data.completed_lessons.length > 0) {
          setCompletedLessons(new Set(enrollResult.data.completed_lessons));
        }

        // Restore last position if available (and not at the beginning)
        const savedModuleIndex = enrollResult.data.last_module_index || 0;
        const savedLessonIndex = enrollResult.data.last_lesson_index || 0;
        const savedLessonId = enrollResult.data.last_lesson_id;
        const savedVideoPosition = enrollResult.data.last_video_position || 0;
        
        console.log('📍 Saved position from enrollment:', {
          moduleIndex: savedModuleIndex,
          lessonIndex: savedLessonIndex,
          lessonId: savedLessonId,
          videoPosition: savedVideoPosition
        });
        
        if (savedModuleIndex > 0 || savedLessonIndex > 0) {
          console.log('📍 Restoring to saved position - Module:', savedModuleIndex, 'Lesson:', savedLessonIndex);
          setCurrentModuleIndex(savedModuleIndex);
          setCurrentLessonIndex(savedLessonIndex);
          
          // Also set the video position ref for when video loads
          if (savedVideoPosition > 0) {
            lastSavedVideoPositionRef.current = Math.max(0, savedVideoPosition - 2);
            console.log('📹 Pre-setting video position from enrollment:', lastSavedVideoPositionRef.current);
          }
        }
        
        // Mark position as initialized after setting the correct indices
        setPositionInitialized(true);
      } else if (!enrollResult.success) {
        console.error('Failed to enroll:', enrollResult.error);
        // Still mark as initialized so we can proceed with default position
        setPositionInitialized(true);
      }
    } catch (error) {
      console.error('Error enrolling student:', error);
      setPositionInitialized(true);
    }
  };

  // Save progress whenever completed lessons change (only for students)
  useEffect(() => {
    if (isStudent && user?.email && courseId && completedLessons.size > 0 && course) {
      saveProgress();
    }
  }, [completedLessons, isStudent, course]);

  const saveProgress = async () => {
    if (!user?.email || !isStudent || !course) return;

    try {
      const lessonsArray = Array.from(completedLessons);
      const result = await courseEnrollmentService.updateProgress(user.email, courseId, lessonsArray);
      console.log('📊 Progress saved:', lessonsArray.length, 'lessons completed');
      
      // Also update the enrollment state with new progress
      if (result.success && result.data) {
        setEnrollment(prev => ({ ...prev, ...result.data }));
      }
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

  // ═══════════════════════════════════════════════════════════════════════════
  // VIDEO PROGRESS TRACKING HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Save video position to database
  const saveVideoPosition = useCallback(async (position, duration) => {
    console.log('📹 saveVideoPosition called:', { position, duration, isStudent, userId: user?.id, courseId });
    if (!isStudent || !user?.id || !courseId) {
      console.log('📹 saveVideoPosition skipped - missing params');
      return;
    }
    const currentLesson = getCurrentLesson();
    if (!currentLesson) {
      console.log('📹 saveVideoPosition skipped - no current lesson');
      return;
    }

    console.log('📹 Saving video position for lesson:', currentLesson.id, 'position:', position, 'duration:', duration);
    const result = await courseProgressService.saveVideoPosition(
      user.id,
      courseId,
      currentLesson.id,
      Math.floor(position),
      Math.floor(duration)
    );
    console.log('📹 Save video position result:', result);
    lastSavedVideoPositionRef.current = position;
  }, [isStudent, user?.id, courseId, currentModuleIndex, currentLessonIndex]);

  // Load saved video position when lesson changes
  useEffect(() => {
    if (!isStudent || !user?.id || !courseId || !course) return;
    const currentLesson = getCurrentLesson();
    if (!currentLesson) return;

    const loadVideoPosition = async () => {
      console.log('📹 Loading video position for lesson:', currentLesson.id, currentLesson.title);
      const saved = await courseProgressService.getVideoPosition(user.id, courseId, currentLesson.id);
      console.log('📹 Saved video position data:', saved);
      if (saved && saved.video_position_seconds > 0 && !saved.video_completed) {
        lastSavedVideoPositionRef.current = Math.max(0, saved.video_position_seconds - 2);
        console.log('📹 Will restore video to position:', lastSavedVideoPositionRef.current);
      } else {
        lastSavedVideoPositionRef.current = 0;
        console.log('📹 No saved position, starting from beginning');
      }
    };

    loadVideoPosition();
  }, [isStudent, user?.id, courseId, currentModuleIndex, currentLessonIndex, course]);

  // Video event handlers
  const handleVideoLoadedMetadata = useCallback(() => {
    console.log('📹 Video loaded metadata, lastSavedVideoPositionRef:', lastSavedVideoPositionRef.current);
    if (videoRef.current && lastSavedVideoPositionRef.current > 0) {
      console.log('📹 Setting video currentTime to:', lastSavedVideoPositionRef.current);
      videoRef.current.currentTime = lastSavedVideoPositionRef.current;
      console.log('📹 Restored video position to:', lastSavedVideoPositionRef.current);
    }
  }, []);

  const handleVideoTimeUpdate = useCallback(() => {
    if (!videoRef.current || !isStudent) return;
    
    const video = videoRef.current;
    const position = video.currentTime;
    const duration = video.duration;

    // Debounced save during playback (every 5 seconds of progress)
    if (videoSaveTimeoutRef.current) {
      clearTimeout(videoSaveTimeoutRef.current);
    }

    videoSaveTimeoutRef.current = setTimeout(() => {
      if (!video.paused && position > lastSavedVideoPositionRef.current + 3) {
        saveVideoPosition(position, duration);
      }
    }, 5000);

    // Check for completion (90%)
    if (duration > 0 && position / duration >= 0.9) {
      const currentLesson = getCurrentLesson();
      if (currentLesson) {
        courseProgressService.markVideoCompleted(user.id, courseId, currentLesson.id);
      }
    }
  }, [isStudent, user?.id, courseId, saveVideoPosition]);

  const handleVideoPause = useCallback(() => {
    if (!videoRef.current || !isStudent) return;
    saveVideoPosition(videoRef.current.currentTime, videoRef.current.duration);
  }, [isStudent, saveVideoPosition]);

  const handleVideoSeeked = useCallback(() => {
    if (!videoRef.current || !isStudent) return;
    saveVideoPosition(videoRef.current.currentTime, videoRef.current.duration);
  }, [isStudent, saveVideoPosition]);

  const handleVideoEnded = useCallback(() => {
    if (!isStudent || !user?.id || !courseId) return;
    const currentLesson = getCurrentLesson();
    if (currentLesson) {
      courseProgressService.markVideoCompleted(user.id, courseId, currentLesson.id);
    }
  }, [isStudent, user?.id, courseId]);

  // Save video position on page unload
  useEffect(() => {
    if (!isStudent) return;

    const handleBeforeUnload = () => {
      if (videoRef.current && videoRef.current.currentTime > 0) {
        saveVideoPosition(videoRef.current.currentTime, videoRef.current.duration);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && videoRef.current) {
        saveVideoPosition(videoRef.current.currentTime, videoRef.current.duration);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (videoSaveTimeoutRef.current) {
        clearTimeout(videoSaveTimeoutRef.current);
      }
    };
  }, [isStudent, saveVideoPosition]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION RESTORE HANDLING
  // ═══════════════════════════════════════════════════════════════════════════

  // Handle user choosing to start fresh from modal
  const onStartFresh = useCallback(async () => {
    console.log('📍 User chose to start fresh');
    await handleStartFresh();
    // Reset to beginning
    setCurrentModuleIndex(0);
    setCurrentLessonIndex(0);
    lastSavedVideoPositionRef.current = 0;
    console.log('📍 Reset to Module 0, Lesson 0');
  }, [handleStartFresh]);

  // Handle restore from modal
  const onRestoreConfirm = useCallback(() => {
    const point = handleRestore();
    if (point) {
      console.log('📍 Restore point data:', point);
      console.log('📍 Restoring to Module Index:', point.lastModuleIndex, 'Lesson Index:', point.lastLessonIndex);
      console.log('📍 Last Lesson ID:', point.lastLessonId, 'Video Position:', point.lastVideoPosition);
      
      // Set the video position from restore point for immediate use
      if (point.lastVideoPosition > 0) {
        lastSavedVideoPositionRef.current = Math.max(0, point.lastVideoPosition - 2);
        console.log('📹 Set video position from restore point:', lastSavedVideoPositionRef.current);
      }
      
      // Update indices - this will trigger the media fetch effect
      setCurrentModuleIndex(point.lastModuleIndex);
      setCurrentLessonIndex(point.lastLessonIndex);
      
      console.log('📍 Restored to Module', point.lastModuleIndex + 1, 'Lesson', point.lastLessonIndex + 1);
    }
  }, [handleRestore]);

  // Auto-restore for high progress
  useEffect(() => {
    if (shouldAutoRestore && restorePoint && course) {
      setCurrentModuleIndex(restorePoint.lastModuleIndex);
      setCurrentLessonIndex(restorePoint.lastLessonIndex);
      console.log('📍 Auto-restored to last position');
    }
  }, [shouldAutoRestore, restorePoint, course]);

  // Save restore point when lesson changes
  useEffect(() => {
    if (!isStudent || !user?.id || !courseId || !course) return;
    const currentLesson = getCurrentLesson();
    if (!currentLesson) return;

    saveRestorePoint(
      currentModuleIndex,
      currentLessonIndex,
      currentLesson.id,
      videoRef.current?.currentTime || 0
    );
  }, [isStudent, user?.id, courseId, currentModuleIndex, currentLessonIndex, course, saveRestorePoint]);

  // Save time spent on lesson (only for students)
  const saveTimeSpent = async (additionalSeconds) => {
    if (!user?.id || !courseId || !isStudent) return;

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

  // Mark lesson as completed (only for students)
  const markLessonCompleted = async (lessonId) => {
    if (!user?.id || !courseId || !isStudent) return;

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
        return;
      }

      // Check if all lessons in the course are now completed
      await checkAndUpdateCourseCompletion();

      // Update student streak after completing lesson
      try {
        const response = await fetch(`https://streak-api.dark-mode-d021.workers.dev/${user.id}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const streakData = await response.json();
          console.log('✅ Streak updated:', streakData);
        }
      } catch (streakError) {
        // Don't block lesson completion if streak update fails
        console.error('Error updating streak:', streakError);
      }
    } catch (error) {
      console.error('Error in markLessonCompleted:', error);
    }
  };

  // Check if all lessons are completed and update course_enrollments.completed_at
  const checkAndUpdateCourseCompletion = async () => {
    if (!user?.id || !courseId || !course) return;

    try {
      // Get total lessons count
      const totalLessons = course.modules?.reduce((acc, module) => acc + (module.lessons?.length || 0), 0) || 0;
      if (totalLessons === 0) return;

      // Get completed lessons count from database
      const { count: completedCount, error: countError } = await supabase
        .from('student_course_progress')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .eq('status', 'completed');

      if (countError) {
        console.error('Error checking completion:', countError);
        return;
      }

      // If all lessons are completed, update course_enrollments.completed_at
      if (completedCount >= totalLessons) {
        const { error: updateError } = await supabase
          .from('course_enrollments')
          .update({ completed_at: new Date().toISOString() })
          .eq('student_id', user.id)
          .eq('course_id', courseId)
          .is('completed_at', null); // Only update if not already completed

        if (updateError) {
          console.error('Error updating course completion:', updateError);
        } else {
          console.log('🎉 Course marked as completed!');
        }
      }
    } catch (error) {
      console.error('Error in checkAndUpdateCourseCompletion:', error);
    }
  };

  // Initialize lesson progress tracking
  const initializeLessonProgress = async (targetLesson) => {
    if (!user?.id || !courseId || !isStudent) return;

    // Use passed lesson or fall back to getCurrentLesson()
    const currentLesson = targetLesson || getCurrentLesson();
    if (!currentLesson) return;

    console.log('📚 initializeLessonProgress for lesson:', currentLesson.title, 'ID:', currentLesson.id);

    try {
      // Check if progress record exists
      const { data: existing, error: fetchError } = await supabase
        .from('student_course_progress')
        .select('*')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .eq('lesson_id', currentLesson.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching lesson progress:', fetchError);
        return;
      }

      // If record exists, load accumulated time
      if (existing) {
        setAccumulatedTime(existing.time_spent_seconds || 0);
        console.log('📚 Loaded existing progress for lesson:', currentLesson.title, 'Time:', existing.time_spent_seconds);

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
        console.log('📚 Creating new progress record for lesson:', currentLesson.title);
        setAccumulatedTime(0);
        
        const { error: insertError } = await supabase
          .from('student_course_progress')
          .insert({
            student_id: user.id,
            course_id: courseId,
            lesson_id: currentLesson.id,
            status: 'in_progress',
            time_spent_seconds: 0,
            last_accessed: new Date().toISOString()
          });
          
        if (insertError && insertError.code !== '23505') {
          console.error('Error creating lesson progress:', insertError);
        }
      }

      // Also update the course enrollment's last position
      await courseProgressService.saveRestorePoint(
        user.id,
        courseId,
        currentModuleIndex,
        currentLessonIndex,
        currentLesson.id,
        0
      );
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
    // Wait for position to be initialized before loading media
    // This prevents loading the wrong lesson's media before enrollment data is loaded
    if (!positionInitialized) {
      console.log('🎬 Waiting for position to be initialized...');
      return;
    }
    
    if (course && currentModuleIndex !== null && currentLessonIndex !== null) {
      // Get the lesson directly here to avoid stale closure issues
      const module = course.modules?.[currentModuleIndex];
      const lesson = module?.lessons?.[currentLessonIndex];
      
      console.log('🎬 Lesson change detected - Module:', currentModuleIndex, 'Lesson:', currentLessonIndex);
      console.log('🎬 Target lesson:', lesson?.title, 'ID:', lesson?.id);
      
      if (lesson) {
        fetchLessonMedia(lesson);
        initializeLessonProgress(lesson);
      }
    }
  }, [course, currentModuleIndex, currentLessonIndex, positionInitialized]);

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

  const fetchLessonMedia = async (targetLesson) => {
    // Use passed lesson or fall back to getCurrentLesson()
    const currentLesson = targetLesson || getCurrentLesson();
    if (!currentLesson) {
      console.log('🎬 fetchLessonMedia: No lesson provided');
      return;
    }

    console.log('🎬 fetchLessonMedia: Loading media for lesson:', currentLesson.title, 'ID:', currentLesson.id);

    // Reset states
    setLessonVideoUrl(null);
    setLessonResources([]);
    setVideoLoading(true);

    // Helper function to extract R2 file key from presigned URL
    const extractFileKeyFromUrl = (url) => {
      if (!url) return null;
      try {
        // Check if it's an R2 presigned URL
        if (url.includes('r2.cloudflarestorage.com')) {
          const urlObj = new URL(url);
          const pathname = urlObj.pathname;
          // Remove leading slash to get the file key
          // URL format: /courses/courseId/lessons/lessonId/filename.mp4
          const fileKey = pathname.replace(/^\//, '');
          if (fileKey.startsWith('courses/')) {
            return fileKey;
          }
        }
        // Check if URL contains courses/ path (might be different R2 URL format)
        if (url.includes('/courses/')) {
          const match = url.match(/\/?(courses\/[^?]+)/);
          if (match) {
            return match[1];
          }
        }
      } catch (e) {
        console.log('Could not parse URL:', e);
      }
      return null;
    };

    try {
      // Check if lesson has resources from educator upload
      if (currentLesson.resources && currentLesson.resources.length > 0) {
        console.log('🎬 Lesson resources for', currentLesson.title, ':', currentLesson.resources);

        // Find video resources (uploaded by educator)
        const videoResource = currentLesson.resources.find(
          r => r.type === 'video' || r.type === 'youtube'
        );

        if (videoResource) {
          console.log('🎬 Found video resource for lesson:', currentLesson.title, 'Resource:', videoResource.name, 'Type:', videoResource.type);
          
          // For YouTube videos, use embed URL directly
          if (videoResource.type === 'youtube' && videoResource.embedUrl) {
            console.log('🎬 Setting YouTube embed URL for lesson:', currentLesson.title);
            setLessonVideoUrl(videoResource.embedUrl);
          } else if (videoResource.url) {
            console.log('🎬 Video resource URL for lesson:', currentLesson.title, ':', videoResource.url);
            
            // Try to extract file key and get fresh presigned URL
            const fileKey = extractFileKeyFromUrl(videoResource.url);
            console.log('Extracted file key:', fileKey);
            
            if (fileKey) {
              try {
                console.log('Fetching fresh URL for file key:', fileKey);
                const freshUrl = await fileService.getFileUrl(fileKey);
                console.log('🎬 Setting fresh video URL for lesson:', currentLesson.title);
                setLessonVideoUrl(freshUrl);
              } catch (error) {
                console.error('Error fetching fresh video URL:', error);
                // Don't fallback to expired URL - it won't work anyway
                console.log('Could not refresh video URL - video may not be available');
              }
            } else if (videoResource.url.startsWith('courses/')) {
              // It's already a file key
              try {
                console.log('URL is already a file key, fetching fresh URL');
                const freshUrl = await fileService.getFileUrl(videoResource.url);
                setLessonVideoUrl(freshUrl);
              } catch (error) {
                console.error('Error fetching fresh video URL:', error);
              }
            } else if (!videoResource.url.includes('r2.cloudflarestorage.com')) {
              // Use the stored URL directly (external link or other non-R2 URL)
              console.log('Using external URL directly');
              setLessonVideoUrl(videoResource.url);
            } else {
              console.log('Could not extract file key from R2 URL');
            }
          }
        }

        // Get all non-video resources (PDFs, documents, links, etc.)
        const otherResources = currentLesson.resources.filter(
          r => r.type !== 'video' || r.type === 'youtube'
        );

        if (otherResources.length > 0) {
          // Also refresh URLs for other resources if they're R2 files
          const refreshedResources = await Promise.all(
            otherResources.map(async (r) => {
              let url = r.url;
              const fileKey = extractFileKeyFromUrl(r.url);
              if (fileKey && r.type !== 'youtube' && r.type !== 'link') {
                try {
                  url = await fileService.getFileUrl(fileKey);
                } catch (e) {
                  console.log('Could not refresh URL for resource:', r.name);
                }
              }
              return {
                title: r.name,
                url: url,
                type: r.type,
                size: r.size
              };
            })
          );
          setLessonResources(refreshedResources);
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
        .maybeSingle();

      if (courseError) throw courseError;

      if (!courseData) {
        navigate(getBackPath());
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
      navigate(getBackPath());
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

    // Calculate next position
    let nextModuleIndex = currentModuleIndex;
    let nextLessonIndex = currentLessonIndex;

    // Check if there's a next lesson in current module
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      nextLessonIndex = currentLessonIndex + 1;
    }
    // Move to next module
    else if (currentModuleIndex < course.modules.length - 1) {
      nextModuleIndex = currentModuleIndex + 1;
      nextLessonIndex = 0;
    }

    // Update state
    setCurrentModuleIndex(nextModuleIndex);
    setCurrentLessonIndex(nextLessonIndex);

    // Save the new position to database immediately
    const nextModule = course.modules[nextModuleIndex];
    const nextLesson = nextModule?.lessons?.[nextLessonIndex];
    if (nextLesson) {
      console.log('📍 Saving position - Module:', nextModuleIndex, 'Lesson:', nextLessonIndex);
      await courseProgressService.saveRestorePoint(
        user.id,
        courseId,
        nextModuleIndex,
        nextLessonIndex,
        nextLesson.id,
        0
      );
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

    // Calculate previous position
    let prevModuleIndex = currentModuleIndex;
    let prevLessonIndex = currentLessonIndex;

    // Check if there's a previous lesson in current module
    if (currentLessonIndex > 0) {
      prevLessonIndex = currentLessonIndex - 1;
    }
    // Move to previous module's last lesson
    else if (currentModuleIndex > 0) {
      prevModuleIndex = currentModuleIndex - 1;
      const previousModule = course.modules[prevModuleIndex];
      prevLessonIndex = previousModule.lessons.length - 1;
    }

    // Update state
    setCurrentModuleIndex(prevModuleIndex);
    setCurrentLessonIndex(prevLessonIndex);

    // Save the new position to database immediately
    const prevModule = course.modules[prevModuleIndex];
    const prevLesson = prevModule?.lessons?.[prevLessonIndex];
    if (prevLesson && user?.id) {
      console.log('📍 Saving position - Module:', prevModuleIndex, 'Lesson:', prevLessonIndex);
      await courseProgressService.saveRestorePoint(
        user.id,
        courseId,
        prevModuleIndex,
        prevLessonIndex,
        prevLesson.id,
        0
      );
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

    // Save the new position to database immediately
    const targetModule = course.modules[moduleIndex];
    const targetLesson = targetModule?.lessons?.[lessonIndex];
    if (targetLesson && user?.id) {
      console.log('📍 Saving position - Module:', moduleIndex, 'Lesson:', lessonIndex);
      await courseProgressService.saveRestorePoint(
        user.id,
        courseId,
        moduleIndex,
        lessonIndex,
        targetLesson.id,
        0
      );
    }
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

  // Check if this is the last lesson in the course
  const isLastLesson = () => {
    if (!course?.modules) return false;
    const currentModule = course.modules[currentModuleIndex];
    return currentModuleIndex === course.modules.length - 1 &&
           currentLessonIndex === currentModule.lessons.length - 1;
  };

  // Complete the course (called when clicking Complete on last lesson)
  const completeCourse = async () => {
    const currentLesson = getCurrentLesson();

    // Save current time before completing
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

    // Update course enrollment to completed status
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: 100
        })
        .eq('student_id', user.id)
        .eq('course_id', courseId);

      if (error) {
        console.error('Error completing course:', error);
      } else {
        console.log('🎉 Course completed successfully!');
        
        // Generate certificate for the completed course
        const studentName = user?.name || user?.email?.split('@')[0] || 'Student';
        const courseName = course?.title || 'Course';
        const educatorName = course?.educator_name || enrollment?.educator_name || 'Skill Ecosystem Platform';
        
        console.log('📜 Generating certificate...');
        const certResult = await generateCourseCertificate(
          user.id,
          studentName,
          courseId,
          courseName,
          educatorName
        );
        
        if (certResult.success) {
          console.log('✅ Certificate generated:', certResult.credentialId);
          // Navigate to my learning page with success message
          navigate('/student/my-learning', { 
            state: { 
              courseCompleted: true, 
              courseName,
              certificateUrl: certResult.certificateUrl 
            } 
          });
        } else {
          console.error('Certificate generation failed:', certResult.error);
          // Still navigate even if certificate fails
          navigate('/student/my-learning');
        }
      }
    } catch (error) {
      console.error('Error in completeCourse:', error);
    }
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
      {/* Session Restore Modal */}
      {isStudent && (
        <RestoreProgressModal
          isOpen={showRestoreModal}
          restorePoint={restorePoint}
          courseName={course?.title}
          onRestore={onRestoreConfirm}
          onStartFresh={onStartFresh}
          onClose={dismissModal}
          lastAccessedText={getLastAccessedText()}
        />
      )}

      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate(getBackPath())}
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
                              ref={videoRef}
                              id="lesson-video-player"
                              src={lessonVideoUrl}
                              className="w-full h-full"
                              controls
                              controlsList="nodownload"
                              title={currentLesson.title}
                              onLoadedMetadata={handleVideoLoadedMetadata}
                              onTimeUpdate={handleVideoTimeUpdate}
                              onPause={handleVideoPause}
                              onSeeked={handleVideoSeeked}
                              onEnded={handleVideoEnded}
                              onError={(e) => {
                                console.error('Video load error:', e);
                                console.log('Failed video URL:', lessonVideoUrl);
                              }}
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

                      {isLastLesson() ? (
                        // Only show Complete Course button if course is not already completed
                        enrollment?.status !== 'completed' && !enrollment?.completed_at ? (
                          <Button
                            onClick={completeCourse}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Complete Course
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium">
                            <CheckCircle className="w-4 h-4" />
                            Course Completed
                          </div>
                        )
                      ) : (
                        <Button
                          onClick={goToNextLesson}
                          disabled={!canGoNext()}
                          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}
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
                    onClick={() => navigate(getBackPath())}
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
