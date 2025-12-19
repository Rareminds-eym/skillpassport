import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, Star, Zap, Target, TrendingUp, BookOpen, Check, Clock, Sparkles, GraduationCap, AlertCircle } from 'lucide-react';



/**
 * Compact course card for skill gap display
 * Shows course title, duration, and "Why this course" explanation
 * Requirements: 5.1, 5.3, 5.4
 */
const SkillGapCourseCard = ({ course, onClick }) => {
    const navigate = useNavigate();
    
    const {
        course_id,
        title,
        duration,
        skills = [],
        relevance_score,
        why_this_course
    } = course;

    const matchPercentage = Math.round(relevance_score || 0);

    const handleClick = () => {
        if (onClick) {
            onClick(course);
        } else {
            navigate(`/student/courses/${course_id}/learn`);
        }
    };

    // Display up to 2 skills for compact view
    const displaySkills = Array.isArray(skills) ? skills.slice(0, 2) : [];

    return (
        <div
            onClick={handleClick}
            className="group bg-white rounded-lg border border-indigo-100 p-4 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer"
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h5 className="font-semibold text-gray-900 text-base line-clamp-1 group-hover:text-indigo-600 transition-colors">
                            {title}
                        </h5>
                        {duration && (
                            <div className="flex items-center gap-1 text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm">{duration}</span>
                            </div>
                        )}
                    </div>
                </div>
                <span className="flex-shrink-0 px-2 py-1 rounded bg-indigo-50 text-indigo-600 font-bold text-sm">
                    {matchPercentage}%
                </span>
            </div>

            {/* Skills tags - compact */}
            {displaySkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                    {displaySkills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-sm">
                            {skill}
                        </span>
                    ))}
                </div>
            )}

            {/* Why this course explanation - Requirement 5.4 */}
            {why_this_course && (
                <div className="flex items-start gap-1.5 p-2 bg-indigo-50/50 rounded text-sm text-gray-600">
                    <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{why_this_course}</span>
                </div>
            )}

            {/* View course link */}
            <div className="flex items-center justify-end mt-2 pt-2 border-t border-gray-100">
                <span className="text-sm text-indigo-600 font-medium group-hover:text-indigo-700 flex items-center gap-1">
                    Enroll Now
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
            </div>
        </div>
    );
};

/**
 * Component to display courses for a specific skill gap
 * Shows 1-3 courses or a message if no courses match
 * Requirements: 5.1, 5.3
 */
const SkillGapCoursesDisplay = ({ courses = [] }) => {
    // Limit to 1-3 courses per skill gap (Requirement 5.1)
    const displayCourses = courses.slice(0, 3);

    if (displayCourses.length === 0) {
        // Handle case when no courses match (Requirement 5.3)
        return (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-gray-500">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-base">No platform courses currently address this skill. Check back later for new courses.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-3">
            <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-semibold text-indigo-600 uppercase">Recommended Courses</span>
            </div>
            <div className="grid gap-2">
                {displayCourses.map((course, idx) => (
                    <SkillGapCourseCard key={course.course_id || idx} course={course} />
                ))}
            </div>
        </div>
    );
};

const SkillsSection = ({ skillGap, employability, skillGapCourses = {} }) => {
    // Defensive defaults for nested arrays
    const currentStrengths = skillGap?.currentStrengths || [];
    const strengthAreas = employability?.strengthAreas || [];
    const improvementAreas = employability?.improvementAreas || [];
    const priorityA = skillGap?.priorityA || [];
    const priorityB = skillGap?.priorityB || [];
    const learningTracks = skillGap?.learningTracks || [];

    return (
        <div className="space-y-6">
            {/* Current Strengths */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-xl">Technical Strengths</h3>
                            <p className="text-sm text-gray-500">Your current skills</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {currentStrengths.length > 0 ? currentStrengths.map((skill, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                                <Check className="w-5 h-5 text-green-600" />
                                <span className="text-gray-700 text-base">{skill}</span>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-sm">No strengths identified yet</p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-xl">Employability Skills</h3>
                            <p className="text-sm text-gray-500">Job-ready competencies</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {strengthAreas.length > 0 ? strengthAreas.map((skill, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-700 text-base">{skill}</span>
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">Strong</span>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-sm">No strength areas identified yet</p>
                        )}
                    </div>
                    {improvementAreas.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-sm font-semibold text-gray-500 mb-2">Areas to Improve</p>
                            <div className="flex flex-wrap gap-1">
                                {improvementAreas.map((area, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm">{area}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Priority A Skills */}
            <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
                <div className="bg-red-50 p-5 border-b border-red-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-xl">Priority A Skills</h3>
                                <p className="text-sm text-gray-500">Must build in next 6 months</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-red-500 text-white rounded-full text-base font-bold">{priorityA.length} Skills</span>
                    </div>
                </div>
                <div className="p-5 space-y-4">
                    {priorityA.map((item, idx) => {
                        // Get courses for this skill gap (Requirement 5.1)
                        const coursesForSkill = skillGapCourses[item.skill] || [];
                        
                        return (
                            <div key={idx} className="bg-gray-50 rounded-lg p-5">
                                <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-lg">{idx + 1}</span>
                                        <h4 className="font-bold text-gray-900 text-lg">{item.skill}</h4>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border">
                                        <span className="text-red-500 font-bold text-base">{item.currentLevel}</span>
                                        <ChevronRight className="w-5 h-5 text-gray-400" />
                                        <span className="text-green-500 font-bold text-base">{item.targetLevel}</span>
                                        <span className="text-gray-400 text-base">/ 5</span>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div className="p-4 bg-white rounded-lg border border-red-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Target className="w-4 h-4 text-red-500" />
                                            <span className="text-sm font-bold text-red-600 uppercase">Why Needed</span>
                                        </div>
                                        <p className="text-gray-700 text-base">{item.whyNeeded}</p>
                                    </div>
                                    <div className="p-4 bg-white rounded-lg border border-indigo-100">
                                        <div className="flex items-center gap-2 mb-1">
                                            <BookOpen className="w-4 h-4 text-indigo-500" />
                                            <span className="text-sm font-bold text-indigo-600 uppercase">How to Build</span>
                                        </div>
                                        <p className="text-gray-700 text-base">{item.howToBuild}</p>
                                    </div>
                                </div>
                                
                                {/* Course suggestions for this skill gap - Requirements 5.1, 5.3, 5.4 */}
                                <SkillGapCoursesDisplay courses={coursesForSkill} />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Priority B Skills */}
            <div className="bg-white rounded-xl p-6 border border-yellow-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-yellow-500 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">B</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-xl">Priority B Skills</h3>
                        <p className="text-sm text-gray-500">Build in 6-12 months</p>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                    {priorityB.length > 0 ? priorityB.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                            <span className="w-7 h-7 rounded bg-yellow-500 flex items-center justify-center text-white text-sm font-bold">{idx + 1}</span>
                            <span className="text-gray-700 text-base">{item.skill}</span>
                        </div>
                    )) : (
                        <p className="text-gray-500 text-sm col-span-2">No priority B skills identified</p>
                    )}
                </div>
            </div>

            {/* Learning Tracks */}
            <div className="bg-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-2xl">Learning Tracks</h3>
                        <p className="text-base text-gray-400">Choose your path</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {learningTracks.map((track, idx) => {
                        const isRecommended = track.track === skillGap?.recommendedTrack;
                        return (
                            <div key={idx} className={`rounded-lg p-5 ${isRecommended ? 'bg-indigo-500/20 border-2 border-indigo-400' : 'bg-white/5 border border-white/10'}`}>
                                {isRecommended && (
                                    <div className="flex items-center gap-1 mb-2">
                                        <Star className="w-4 h-4 text-yellow-400" />
                                        <span className="text-sm font-bold text-yellow-400">Recommended</span>
                                    </div>
                                )}
                                <h4 className="font-bold text-white mb-2 text-lg">{track.track}</h4>
                                <div className="space-y-1 text-base">
                                    <p className="text-gray-400"><span className="text-gray-300">Best if:</span> {track.suggestedIf}</p>
                                    <p className="text-gray-400"><span className="text-gray-300">Topics:</span> {track.topics}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between p-4 bg-white/10 rounded-lg">
                    <span className="text-gray-300 text-base">Your recommended track:</span>
                    <span className="font-bold text-indigo-400 text-lg">{skillGap?.recommendedTrack || 'Not determined'}</span>
                </div>
            </div>
        </div>
    );
};

export default SkillsSection;
