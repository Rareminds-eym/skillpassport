import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/shared/ui/Badge';
import { ChevronRight, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/shared/model/authStore';
import { apiGet } from '@/shared/api/apiClient';
import { recordCourseInterest } from '@/features/courses';
import { CourseEnrollmentModal } from '@/shared/ui';

const TrainingRecommendations = ({ recommendations }) => {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const [savedCourses, setSavedCourses] = useState([]);
  // Interest capture: only the clicked card shows a pending state.
  const [pendingCourseId, setPendingCourseId] = useState(null);
  const [showInterestModal, setShowInterestModal] = useState(false);
  // Guards state updates from an awaited request that resolves after unmount.
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const fetchSavedCourses = async () => {
      if (!authUser?.id) return;
      try {
        const result = await apiGet(`/courses/recommendations/saved?learnerId=${authUser.id}&status=active`);
        if (result?.data?.length > 0) {
          setSavedCourses(
            result.data.map(r => ({
              course_id: r.course_id,
              title: r.course?.title || r.course?.name || '',
              description: r.course?.description || '',
              duration: r.course?.duration || '',
              relevance_score: r.relevance_score || 0,
              skill_type: r.course?.category || '',
              course_type: r.course?.course_type,
            }))
          );
        }
      } catch (err) {
        console.warn('[TrainingRecommendations] Failed to fetch saved course recs:', err);
      }
    };
    fetchSavedCourses();
  }, [authUser?.id]);

  const topCourses = useMemo(() => {
    if (savedCourses.length > 0) {
      return savedCourses
        .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    }
    if (!recommendations?.coursesByType) return [];
    const { technical = [], soft = [] } = recommendations.coursesByType;
    return [...technical, ...soft]
      .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
  }, [savedCourses, recommendations]);

  /**
   * Records the learner's interest instead of opening the course. The request
   * is awaited so the confirmation appears only after it has been persisted.
   */
  const handleCourseClick = useCallback(async (course) => {
    const courseId = course?.course_id;
    if (!courseId || pendingCourseId) return;

    // Webinars/live events bypass interest capture entirely and open directly,
    // exactly as all courses did before this feature was introduced.
    if (course.course_type === 'webinar') {
      navigate(`/learner/courses/${courseId}/learn`);
      return;
    }

    setPendingCourseId(courseId);
    try {
      if (typeof recordCourseInterest !== 'function') {
        throw new Error('recordCourseInterest not available');
      }
      await recordCourseInterest(courseId);
      if (!isMountedRef.current) return;
      setShowInterestModal(true);
    } catch (error) {
      console.error('[TrainingRecommendations] Failed to record interest:', error);
      if (!isMountedRef.current) return;
      toast.error('Unable to record your interest. Please try again.');
    } finally {
      if (isMountedRef.current) setPendingCourseId(null);
    }
  }, [pendingCourseId, navigate]);

  if (topCourses.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-300 shadow-sm">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-white/50"
            style={{
              boxShadow: '0 0 15px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.1)'
            }}
          >
            <img
              src="/assets/HomePage/Ai Logo.png"
              alt="AI Logo"
              className="w-9 h-9 object-contain"
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Recommended Courses
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">Based on your assessment</p>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 blue-scrollbar">
          {topCourses.map((course, idx) => {
            const isTopPick = idx === 0;
            const isRecording = pendingCourseId === course.course_id;
            return (
              <div
                key={course.course_id || idx}
                onClick={() => handleCourseClick(course)}
                aria-disabled={isRecording}
                className={`bg-white rounded-lg border border-gray-200 shadow-sm transition-all ${isRecording
                  ? 'opacity-60 pointer-events-none'
                  : 'cursor-pointer hover:shadow-md hover:border-blue-300'
                  }`}
              >
                <div className="flex items-center justify-between gap-2 px-3.5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {course.title}
                      </h4>
                      {isTopPick && (
                        <Badge className="shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-sm">
                          Top Pick
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                      {course.code && (
                        <span className="font-medium">{course.code}</span>
                      )}
                      {course.duration && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-500" />
                          <span>{course.duration}</span>
                        </div>
                      )}
                      {course.skill_type && (
                        <Badge className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded font-medium">
                          {course.skill_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isRecording ? (
                    <Loader2 className="w-4 h-4 text-blue-500 shrink-0 animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interest Capture Confirmation */}
      <CourseEnrollmentModal
        isOpen={showInterestModal}
        onClose={() => setShowInterestModal(false)}
      />
    </div>
  );
};

export default TrainingRecommendations;
