import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, ChevronRight, Sparkles } from 'lucide-react';

/**
 * Course Recommendation Card Component
 * Displays a recommended course with title, duration, skills, and match percentage
 * Navigates to course enrollment on click
 * 
 * Requirements: 4.2, 4.3
 */
const CourseRecommendationCard = ({ course, onClick }) => {
    const navigate = useNavigate();

    const {
        course_id,
        title,
        duration,
        skills = [],
        relevance_score,
        match_reasons = [],
    } = course;

    // Calculate match percentage display
    const matchPercentage = Math.round(relevance_score || 0);

    // Get color based on match percentage
    const getMatchColor = (percentage) => {
        if (percentage >= 80) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-50', border: 'border-green-200' };
        if (percentage >= 60) return { bg: 'bg-indigo-500', text: 'text-indigo-600', light: 'bg-indigo-50', border: 'border-indigo-200' };
        if (percentage >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-50', border: 'border-yellow-200' };
        return { bg: 'bg-gray-500', text: 'text-gray-600', light: 'bg-gray-50', border: 'border-gray-200' };
    };

    const matchColor = getMatchColor(matchPercentage);

    // Handle click to navigate to course enrollment
    const handleClick = () => {
        if (onClick) {
            onClick(course);
        } else {
            navigate(`/student/courses/${course_id}/learn`);
        }
    };

    // Display up to 3 skills
    const displaySkills = Array.isArray(skills) ? skills.slice(0, 3) : [];
    const remainingSkillsCount = Array.isArray(skills) ? Math.max(0, skills.length - 3) : 0;

    return (
        <div
            onClick={handleClick}
            className={`group relative bg-white rounded-xl border ${matchColor.border} shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden`}
        >
            {/* Match percentage indicator bar */}
            <div className={`absolute top-0 left-0 h-1 ${matchColor.bg}`} style={{ width: `${matchPercentage}%` }} />

            <div className="p-4">
                {/* Header with title and match badge */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg ${matchColor.light} flex items-center justify-center flex-shrink-0`}>
                            <BookOpen className={`w-5 h-5 ${matchColor.text}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                {title}
                            </h4>
                            {duration && (
                                <div className="flex items-center gap-1 mt-1 text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    <span className="text-xs">{duration}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Match percentage badge */}
                    <div className={`flex-shrink-0 px-2 py-1 rounded-lg ${matchColor.light} ${matchColor.text} font-bold text-sm`}>
                        {matchPercentage}%
                    </div>
                </div>

                {/* Skills tags */}
                {displaySkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {displaySkills.map((skill, idx) => (
                            <span
                                key={idx}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                            >
                                {skill}
                            </span>
                        ))}
                        {remainingSkillsCount > 0 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                                +{remainingSkillsCount} more
                            </span>
                        )}
                    </div>
                )}

                {/* Match reason (first one) */}
                {match_reasons.length > 0 && (
                    <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg mb-3">
                        <Sparkles className="w-3 h-3 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-600 line-clamp-2">{match_reasons[0]}</p>
                    </div>
                )}

                {/* View course action */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-indigo-600 font-medium group-hover:text-indigo-700">
                        View Course
                    </span>
                    <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </div>
    );
};

export default CourseRecommendationCard;
