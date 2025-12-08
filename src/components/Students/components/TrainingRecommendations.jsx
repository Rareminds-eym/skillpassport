import { Badge } from './ui/badge';
import { Sparkles, BookOpen, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo, useCallback } from 'react';

const TrainingRecommendations = ({ recommendations }) => {
  const navigate = useNavigate();

  // Memoize top courses calculation to avoid re-sorting on every render
  const topCourses = useMemo(() => {
    if (!recommendations?.coursesByType) return [];

    const { technical = [], soft = [] } = recommendations.coursesByType;
    
    // Combine and sort by relevance_score (highest first)
    return [...technical, ...soft]
      .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
      .slice(0, 3);
  }, [recommendations]);

  // Memoize click handler to prevent recreation on every render
  const handleCourseClick = useCallback((courseId) => {
    navigate(`/student/courses/${courseId}/learn`);
  }, [navigate]);

  if (topCourses.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-blue-50 rounded-lg p-4 border-2 border-blue-200">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            Recommended Courses
          </h3>
          <p className="text-xs text-gray-600">Based on your assessment</p>
        </div>
      </div>

      {/* Top 3 Courses */}
      <div className="space-y-2">
        {topCourses.map((course, idx) => {
          const isTopPick = idx === 0;
          return (
            <div
              key={course.course_id || idx}
              onClick={() => handleCourseClick(course.course_id)}
              className={`bg-white rounded-lg p-3 border shadow-sm cursor-pointer hover:shadow-md transition-all ${
                isTopPick ? 'border-blue-300 ring-2 ring-blue-100' : 'border-blue-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-gray-900">
                        {course.title}
                      </h4>
                      {isTopPick && (
                        <Badge className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5">
                          Top Pick
                        </Badge>
                      )}
                      {course.skill_type && (
                        <Badge className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5">
                          {course.skill_type}
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  </div>

                  {/* Course Code & Duration */}
                  <div className="flex items-center gap-3 mb-2 text-xs text-gray-600">
                    {course.code && (
                      <span className="font-medium">{course.code}</span>
                    )}
                    {course.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{course.duration}</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {course.description && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  {/* Skills */}
                  {course.skills && course.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {course.skills.slice(0, 3).map((skill, skillIdx) => (
                        <span
                          key={skillIdx}
                          className="px-2 py-0.5 text-[10px] rounded-md bg-blue-100 text-blue-700 font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                      {course.skills.length > 3 && (
                        <span className="px-2 py-0.5 text-[10px] rounded-md bg-gray-100 text-gray-600 font-medium">
                          +{course.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
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
