import { BookOpen, Sparkles, AlertCircle, GraduationCap } from 'lucide-react';
import CourseRecommendationCard from '../CourseRecommendationCard';

/**
 * Recommended Courses Section Component
 * Displays platform course recommendations based on assessment results
 * Groups courses by relevance to skill gaps
 * 
 * Requirements: 4.1, 4.4, 3.5
 */
const RecommendedCoursesSection = ({ 
    platformCourses = [], 
    skillGapCourses = {},
    onCourseClick 
}) => {
    // Check if we have any courses to display
    const hasRecommendations = platformCourses.length > 0;
    const hasSkillGapCourses = Object.keys(skillGapCourses).length > 0;

    // Group courses by skill gaps they address
    const groupCoursesBySkillGap = () => {
        const grouped = {};
        
        platformCourses.forEach(course => {
            const skillGaps = course.skill_gaps_addressed || [];
            
            if (skillGaps.length === 0) {
                // Courses without specific skill gap mapping go to "General Recommendations"
                if (!grouped['General Recommendations']) {
                    grouped['General Recommendations'] = [];
                }
                grouped['General Recommendations'].push(course);
            } else {
                // Group by each skill gap the course addresses
                skillGaps.forEach(skillGap => {
                    if (!grouped[skillGap]) {
                        grouped[skillGap] = [];
                    }
                    // Avoid duplicates in the same group
                    if (!grouped[skillGap].find(c => c.course_id === course.course_id)) {
                        grouped[skillGap].push(course);
                    }
                });
            }
        });

        return grouped;
    };

    const groupedCourses = groupCoursesBySkillGap();
    const skillGapGroups = Object.keys(groupedCourses).filter(key => key !== 'General Recommendations');
    const generalCourses = groupedCourses['General Recommendations'] || [];

    // Empty state component
    const EmptyState = () => (
        <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="font-semibold text-gray-700 mb-2">No Course Recommendations Available</h4>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
                We couldn't find platform courses that match your profile at this time. 
                Check back later as new courses are added regularly.
            </p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Main Header */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Recommended Platform Courses</h3>
                        <p className="text-xs text-gray-500">Courses matched to your assessment results</p>
                    </div>
                </div>
                {hasRecommendations && (
                    <p className="text-sm text-gray-600 mt-3">
                        Based on your skill gaps and career interests, we've identified{' '}
                        <span className="font-semibold text-indigo-600">{platformCourses.length} courses</span>{' '}
                        that can help accelerate your career development.
                    </p>
                )}
            </div>

            {/* Empty State */}
            {!hasRecommendations && <EmptyState />}

            {/* Skill Gap Grouped Courses */}
            {hasRecommendations && skillGapGroups.length > 0 && (
                <div className="space-y-6">
                    {skillGapGroups.map((skillGap, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Skill Gap Header */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">
                                            Courses for: {skillGap}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                            {groupedCourses[skillGap].length} course{groupedCourses[skillGap].length !== 1 ? 's' : ''} to build this skill
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Course Cards Grid */}
                            <div className="p-4">
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {groupedCourses[skillGap].map((course, courseIdx) => (
                                        <CourseRecommendationCard
                                            key={course.course_id || courseIdx}
                                            course={course}
                                            onClick={onCourseClick}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* General Recommendations (courses not tied to specific skill gaps) */}
            {hasRecommendations && generalCourses.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="bg-gray-50 p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-500 flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">
                                    Additional Recommended Courses
                                </h4>
                                <p className="text-xs text-gray-500">
                                    {generalCourses.length} course{generalCourses.length !== 1 ? 's' : ''} based on your overall profile
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Course Cards Grid */}
                    <div className="p-4">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {generalCourses.map((course, courseIdx) => (
                                <CourseRecommendationCard
                                    key={course.course_id || courseIdx}
                                    course={course}
                                    onClick={onCourseClick}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Skill Gap Specific Courses (from skillGapCourses prop) */}
            {hasSkillGapCourses && (
                <div className="bg-white rounded-xl border border-yellow-200 shadow-sm overflow-hidden">
                    <div className="bg-yellow-50 p-4 border-b border-yellow-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-900">
                                    Targeted Skill Development
                                </h4>
                                <p className="text-xs text-gray-500">
                                    Specific courses mapped to your priority skill gaps
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        {Object.entries(skillGapCourses).map(([skillName, courses], idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-6 h-6 rounded bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">
                                        {idx + 1}
                                    </span>
                                    <h5 className="font-semibold text-gray-800">{skillName}</h5>
                                    <span className="text-xs text-gray-500 ml-auto">
                                        {courses.length} course{courses.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {courses.map((course, courseIdx) => (
                                        <CourseRecommendationCard
                                            key={course.course_id || courseIdx}
                                            course={course}
                                            onClick={onCourseClick}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Call to Action */}
            {hasRecommendations && (
                <div className="bg-slate-800 rounded-xl p-6 text-center">
                    <h4 className="text-lg font-bold text-white mb-2">Ready to Start Learning?</h4>
                    <p className="text-gray-400 text-sm mb-4">
                        Click on any course card above to view details and enroll. 
                        Start with courses that address your Priority A skills for maximum impact.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-indigo-400 text-sm">
                        <Sparkles className="w-4 h-4" />
                        <span>Courses are ranked by relevance to your profile</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecommendedCoursesSection;
