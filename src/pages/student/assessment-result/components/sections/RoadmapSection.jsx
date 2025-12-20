import { CheckCircle, Award, Rocket, Calendar, FileText, Users, Briefcase, GraduationCap } from 'lucide-react';
import RecommendedCoursesSection from './RecommendedCoursesSection';

/**
 * Roadmap Section Component
 * Displays the career action roadmap including projects, internships, activities, and recommended courses
 * 
 * Requirements: 4.1 - Shows recommended courses section in the roadmap
 */
const RoadmapSection = ({
    roadmap,
    platformCourses = [],
    coursesByType = { technical: [], soft: [] },
    skillGapCourses = {},
    onCourseClick
}) => {
    // Defensive defaults for nested properties
    const internshipTypes = roadmap?.internship?.types || [];
    const internshipTimeline = roadmap?.internship?.timing || roadmap?.internship?.timeline || 'Not specified';
    const internshipPrep = roadmap?.internship?.preparation || {};
    const internshipWhere = roadmap?.internship?.whereToApply || [];
    const activities = roadmap?.exposure?.activities || [];
    const certifications = roadmap?.exposure?.certifications || [];
    const onlineLearning = roadmap?.exposure?.onlineLearning || [];
    const networking = roadmap?.exposure?.networking || [];
    const resources = roadmap?.exposure?.resources || [];
    const projects = roadmap?.projects || [];

    return (
        <div className="space-y-6">
            {/* Recommended Platform Courses Section - Requirements: 4.1 */}
            <RecommendedCoursesSection
                platformCourses={platformCourses}
                coursesByType={coursesByType}
                skillGapCourses={skillGapCourses}
                onCourseClick={onCourseClick}
            />

            {/* Internship & Exposure Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Internship Pathway */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-xl">Internship Pathway</h3>
                            <p className="text-sm text-gray-500">Your route to experience</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-sm font-bold text-gray-500 uppercase mb-2">Best Internship Types</p>
                        <div className="space-y-2">
                            {internshipTypes.length > 0 ? internshipTypes.map((type, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span className="text-gray-700 text-base">{type}</span>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-sm">No internship types specified</p>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-indigo-50 rounded-lg mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-bold text-indigo-600 uppercase">Target Timeline</span>
                        </div>
                        <p className="text-indigo-800 font-semibold text-base">{internshipTimeline}</p>
                    </div>

                    {internshipWhere.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm font-bold text-gray-500 uppercase mb-2">Where to Apply</p>
                            <div className="space-y-2">
                                {internshipWhere.map((place, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        <span className="text-gray-700 text-base">{place}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase mb-2">Preparation Checklist</p>
                        <div className="space-y-3">
                            {internshipPrep.resume && (
                                <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-5 h-5 text-indigo-500" />
                                        <span className="text-base font-bold text-indigo-600">Resume</span>
                                    </div>
                                    <p className="text-gray-700 text-base leading-relaxed">{internshipPrep.resume}</p>
                                </div>
                            )}
                            {internshipPrep.portfolio && (
                                <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Rocket className="w-5 h-5 text-indigo-500" />
                                        <span className="text-base font-bold text-indigo-600">Portfolio</span>
                                    </div>
                                    <p className="text-gray-700 text-base leading-relaxed">{internshipPrep.portfolio}</p>
                                </div>
                            )}
                            {internshipPrep.interview && (
                                <div className="p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="w-5 h-5 text-indigo-500" />
                                        <span className="text-base font-bold text-indigo-600">Interview Prep</span>
                                    </div>
                                    <p className="text-gray-700 text-base leading-relaxed">{internshipPrep.interview}</p>
                                </div>
                            )}
                            {!internshipPrep.resume && !internshipPrep.portfolio && !internshipPrep.interview && (
                                <p className="text-gray-500 text-sm">No preparation details specified</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Activities & Exposure */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-xl">Activities & Exposure</h3>
                            <p className="text-sm text-gray-500">Build your skills and network</p>
                        </div>
                    </div>

                    {/* Activities */}
                    {activities.length > 0 && (
                        <div className="mb-5">
                            <p className="text-sm font-bold text-gray-500 uppercase mb-2">Clubs & Activities</p>
                            <div className="space-y-2">
                                {activities.map((activity, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <span className="w-7 h-7 rounded bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">{idx + 1}</span>
                                        <span className="text-gray-700 text-base">{activity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Certifications */}
                    {certifications.length > 0 && (
                        <div className="mb-5">
                            <p className="text-sm font-bold text-gray-500 uppercase mb-2">Certifications to Pursue</p>
                            <div className="space-y-2">
                                {certifications.map((cert, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200 hover:border-amber-300 transition-colors">
                                        <GraduationCap className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700 text-base flex-1">{cert}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Online Learning */}
                    {onlineLearning.length > 0 && (
                        <div className="mb-5">
                            <p className="text-sm font-bold text-gray-500 uppercase mb-2">Online Courses</p>
                            <div className="space-y-2">
                                {onlineLearning.map((course, idx) => (
                                    <div key={idx} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <Rocket className="w-4 h-4 text-blue-600" />
                                        <span className="text-gray-700 text-base">{course}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Resources */}
                    {resources.length > 0 && (
                        <div className="mb-5">
                            <p className="text-sm font-bold text-gray-500 uppercase mb-2">Learning Resources</p>
                            <div className="flex flex-wrap gap-2">
                                {resources.map((resource, idx) => (
                                    <span key={idx} className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm border border-purple-200">
                                        {resource}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Networking */}
                    {networking.length > 0 && (
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase mb-2">Networking Tips</p>
                            <div className="space-y-2">
                                {networking.map((tip, idx) => (
                                    <div key={idx} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-100">
                                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-700 text-base">{tip}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Fallback if all sections are empty */}
                    {activities.length === 0 && certifications.length === 0 && onlineLearning.length === 0 && resources.length === 0 && networking.length === 0 && (
                        <p className="text-gray-500 text-center py-4">No exposure activities specified</p>
                    )}
                </div>
            </div>

            {/* Projects Section */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Rocket className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-xl">Portfolio Projects</h3>
                        <p className="text-sm text-gray-500">Build these to stand out</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {projects.length > 0 ? projects.map((project, idx) => (
                        <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-base">
                                    {idx + 1}
                                </div>
                                {idx < projects.length - 1 && (
                                    <div className="w-0.5 flex-1 bg-indigo-200 mt-2" />
                                )}
                            </div>
                            <div className="flex-1 pb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-gray-900 text-lg">{project.title}</h4>
                                    {project.difficulty && (
                                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                            project.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                                            project.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {project.difficulty}
                                        </span>
                                    )}
                                </div>

                                {project.description && (
                                    <p className="text-gray-700 text-base mb-4 leading-relaxed">{project.description}</p>
                                )}

                                <div className="grid md:grid-cols-2 gap-3 mb-4">
                                    {project.purpose && (
                                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-4 h-4 text-indigo-500" />
                                                <span className="text-sm font-bold text-indigo-600 uppercase">Purpose</span>
                                            </div>
                                            <p className="text-gray-700 text-base">{project.purpose}</p>
                                        </div>
                                    )}
                                    {project.output && (
                                        <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Award className="w-4 h-4 text-green-500" />
                                                <span className="text-sm font-bold text-green-600 uppercase">Output</span>
                                            </div>
                                            <p className="text-gray-700 text-base font-medium">{project.output}</p>
                                        </div>
                                    )}
                                </div>

                                {project.skills && project.skills.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm font-bold text-gray-500 uppercase mb-2">Skills You'll Build</p>
                                        <div className="flex flex-wrap gap-2">
                                            {project.skills.map((skill, i) => (
                                                <span key={i} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {project.steps && project.steps.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm font-bold text-gray-500 uppercase mb-2">Action Steps</p>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                            {project.steps.map((step, i) => (
                                                <div key={i} className="flex items-start gap-3">
                                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-bold">
                                                        {i + 1}
                                                    </span>
                                                    <p className="text-gray-700 text-base flex-1">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {project.resources && project.resources.length > 0 && (
                                    <div>
                                        <p className="text-sm font-bold text-gray-500 uppercase mb-2">Resources Needed</p>
                                        <div className="flex flex-wrap gap-2">
                                            {project.resources.map((resource, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm border border-amber-200">
                                                    {resource}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {project.timeline && (
                                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm font-medium">Timeline: {project.timeline}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )) : (
                        <p className="text-gray-500 text-center py-4">No projects specified</p>
                    )}
                </div>
            </div>

            {/* Timeline Summary - Dynamic from AI */}
            <div className="bg-slate-800 rounded-xl p-6">
                <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold text-white mb-1">Your 12-Month Journey</h3>
                    <p className="text-gray-400 text-base">Follow this personalized roadmap to career success</p>
                </div>

                {roadmap?.twelveMonthJourney ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(roadmap.twelveMonthJourney).map(([key, phase], idx) => {
                            const colors = [
                                { bar: 'bg-indigo-500', ring: 'ring-indigo-400' },
                                { bar: 'bg-blue-500', ring: 'ring-blue-400' },
                                { bar: 'bg-yellow-500', ring: 'ring-yellow-400' },
                                { bar: 'bg-green-500', ring: 'ring-green-400' }
                            ];
                            const style = colors[idx] || colors[0];

                            return (
                                <div key={key} className="text-center">
                                    <div className={`w-full h-2 rounded-full ${style.bar} mb-3`} />
                                    <div className={`bg-white/10 rounded-lg p-4 ring-1 ${style.ring} hover:bg-white/15 transition-all`}>
                                        <p className="text-sm text-gray-400 mb-1">{phase.months}</p>
                                        <h4 className="font-bold text-white text-lg mb-3">{phase.title}</h4>

                                        {phase.goals && phase.goals.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Goals</p>
                                                <div className="space-y-1">
                                                    {phase.goals.map((goal, i) => (
                                                        <p key={i} className="text-sm text-gray-300">• {goal}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {phase.activities && phase.activities.length > 0 && (
                                            <div className="mb-3">
                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Activities</p>
                                                <div className="space-y-1">
                                                    {phase.activities.map((activity, i) => (
                                                        <p key={i} className="text-sm text-indigo-300">• {activity}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {phase.outcome && (
                                            <div className="mt-3 pt-3 border-t border-white/20">
                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Outcome</p>
                                                <p className="text-sm text-green-300 font-medium">{phase.outcome}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // Fallback if AI doesn't provide twelveMonthJourney
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            { month: '0-3', title: 'Foundation', items: ['Core skills', 'First project'], color: 'bg-indigo-500' },
                            { month: '3-6', title: 'Build', items: ['Portfolio', 'Certifications'], color: 'bg-indigo-500' },
                            { month: '6-9', title: 'Apply', items: ['Internships', 'Networking'], color: 'bg-yellow-500' },
                            { month: '9-12', title: 'Launch', items: ['Full-time prep', 'Interview ready'], color: 'bg-green-500' }
                        ].map((phase, idx) => (
                            <div key={idx} className="text-center">
                                <div className={`w-full h-2 rounded-full ${phase.color} mb-3`} />
                                <div className="bg-white/10 rounded-lg p-4">
                                    <p className="text-sm text-gray-400 mb-1">Month {phase.month}</p>
                                    <h4 className="font-bold text-white text-base mb-2">{phase.title}</h4>
                                    <div className="space-y-1">
                                        {phase.items.map((item, i) => (
                                            <p key={i} className="text-sm text-gray-400">{item}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoadmapSection;
