import { Badge } from './ui/badge';
import { ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo, useCallback } from 'react';

const TrainingRecommendations = ({ recommendations }) => {
  const navigate = useNavigate();

  // Memoize top courses calculation to avoid re-sorting on every render
  const topCourses = useMemo(() => {
    if (!recommendations?.coursesByType) return [];

    const { technical = [], soft = [] } = recommendations.coursesByType;

    // Combine and sort by relevance_score (highest first), show top 3
    return [...technical, ...soft]
      .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
      .slice(0, 3);
  }, [recommendations]);

  // Memoize click handler to prevent recreation on every render
  const handleCourseClick = useCallback(
    (courseId) => {
      navigate(`/student/courses/${courseId}/learn`);
    },
    [navigate]
  );

  if (topCourses.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 border-2 border-dashed border-blue-300 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-14 h-14 rounded-lg  flex items-center justify-center shrink-0 overflow-hidden border border-white/50"
          style={{
            boxShadow:
              '0 0 15px rgba(255, 255, 255, 0.5), 0 0 30px rgba(255, 255, 255, 0.3), inset 0 0 10px rgba(255, 255, 255, 0.1)',
          }}
        >
          <img
            src="/assets/HomePage/Ai Logo.png"
            alt="AI Logo"
            className="w-12 h-12 object-contain"
          />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Recommended Courses</h3>
          <p className="text-xs text-gray-900 font-medium">Based on your assessment</p>
        </div>
      </div>

      {/* Top Course */}
      <div className="space-y-3 max-h-[200px] overflow-y-auto blue-scrollbar">
        {topCourses.map((course, idx) => {
          const isTopPick = idx === 0;
          return (
            <div
              key={course.course_id || idx}
              onClick={() => handleCourseClick(course.course_id)}
              className={`bg-gradient-to-r from-blue-50 to-white rounded-xl p-4 border-l-4 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-all ${
                isTopPick ? 'border-l-blue-500' : 'border-l-blue-400'
              }`}
            >
              <div className="flex items-start">
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      <h4 className="text-base font-bold text-gray-900">{course.title}</h4>
                      {isTopPick && (
                        <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold shadow-sm">
                          Top Pick
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  </div>

                  {/* Course Code, Duration & Skill Type */}
                  <div className="flex items-center gap-4 text-sm text-gray-900 font-medium flex-wrap">
                    {course.code && <span className="font-medium">{course.code}</span>}
                    {course.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>{course.duration}</span>
                      </div>
                    )}
                    {course.skill_type && (
                      <Badge className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                        {course.skill_type}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrainingRecommendations;
