import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/shared/ui/Badge';
import { ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/model/authStore';
import { apiPost, apiGet } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('TrainingRecommendations');

const TrainingRecommendations = ({ recommendations }) => {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const [displayCourses, setDisplayCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch recommendations with capability details from backend
  useEffect(() => {
    if (!authUser?.id) return;

    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        // Try new system first (LTE recommendations)
        const result = await apiPost('/learner-dashboard-widgets/actions', {
          action: 'get-recommended-courses',
          learnerId: authUser.id
        });

        if (result?.data && Array.isArray(result.data) && result.data.length > 0) {
          const coursesWithSource = result.data.map(course => ({
            ...course,
            source: 'lte'
          }));
          setDisplayCourses(coursesWithSource);
          setLoading(false);
          return;
        }

        // Fallback to old system if no new recommendations
        try {
          const oldResult = await apiGet(`/courses/recommendations/saved?learnerId=${authUser.id}&status=active`);
          if (oldResult?.data && Array.isArray(oldResult.data) && oldResult.data.length > 0) {
            const transformedCourses = oldResult.data.map((r) => ({
              id: r.course_id,
              course_id: r.course_id,
              learner_id: authUser.id,
              source: 'old',
              capability: {
                id: r.course_id,
                name: r.course?.title || r.course?.name || r.title || '',
                code: r.course?.code || '',
                description: r.course?.description || r.description || ''
              }
            }));
            setDisplayCourses(transformedCourses);
            setLoading(false);
            return;
          }
        } catch (oldErr) {
          logger.debug('Old recommendations endpoint not available', oldErr);
        }

        setDisplayCourses([]);
        setLoading(false);
      } catch (err) {
        logger.error('Failed to fetch recommendations', err);
        setDisplayCourses([]);
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [authUser?.id]);

  const handleCourseClick = useCallback((item) => {
    if (item.source === 'lte') {
      // New system - navigate to my-learning
      navigate('/learner/my-learning');
    } else {
      // Old system - navigate to specific course
      navigate(`/learner/courses/${item.course_id}/learn`);
    }
  }, [navigate]);

  // Show loading state
  if (loading && displayCourses.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-300 shadow-sm">
        <div className="p-6 flex items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600 font-medium">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  // Filter to only show courses with valid capability data
  const validCourses = displayCourses.filter(item => item.capability);

  // No courses to show - return nothing
  if (validCourses.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-dashed border-blue-300 shadow-sm">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-white border border-white/50 overflow-hidden"
            style={{
              boxShadow: '0 0 15px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.1)'
            }}
          >
            <img src="/assets/HomePage/Ai Logo.png" alt="AI" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Recommended Courses
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">Personalized for your career path</p>
          </div>
        </div>

        {/* Course List */}
        <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1 blue-scrollbar">
          {validCourses.map((item, idx) => {
            const isTopPick = idx === 0;
            const cap = item.capability;

            return (
              <div
                key={item.id}
                onClick={() => handleCourseClick(item)}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer p-3.5"
              >
                {/* Title + Top Pick Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 truncate flex-1">
                    {cap.name}
                  </h4>
                  {isTopPick && (
                    <Badge className="shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Top
                    </Badge>
                  )}
                </div>

                {/* Code */}
                <p className="text-xs text-gray-500 font-medium mb-1.5">{cap.code}</p>

                {/* Description */}
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                  {cap.description}
                </p>

                {/* View Link */}
                <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100">
                  <span className="text-xs text-blue-600 font-medium">View course</span>
                  <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrainingRecommendations;
