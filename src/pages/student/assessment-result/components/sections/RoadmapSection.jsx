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
    const internshipTimeline = roadmap?.internship?.timeline || 'Not specified';
    const internshipPrep = roadmap?.internship?.preparation || {};
    const activities = roadmap?.exposure?.activities || [];
    const certifications = roadmap?.exposure?.certifications || [];
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

                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase mb-2">Preparation Checklist</p>
                        <div className="space-y-2">
                            {[
                                { label: 'Resume', value: internshipPrep.resume || 'Not specified', icon: FileText },
                                { label: 'Portfolio', value: internshipPrep.portfolio || 'Not specified', icon: Rocket },
                                { label: 'Interview', value: internshipPrep.interview || 'Not specified', icon: Users }
                            ].map((item, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <item.icon className="w-4 h-4 text-indigo-500" />
                                        <span className="text-sm font-bold text-indigo-600">{item.label}</span>
                                    </div>
                                    <p className="text-gray-600 text-base">{item.value}</p>
                                </div>
                            ))}
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
                            <p className="text-sm text-gray-500">Build your network</p>
                        </div>
                    </div>

                    <div className="mb-5">
                        <p className="text-sm font-bold text-gray-500 uppercase mb-2">Join / Lead These</p>
                        <div className="space-y-2">
                            {activities.length > 0 ? activities.map((activity, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                    <span className="w-7 h-7 rounded bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">{idx + 1}</span>
                                    <span className="text-gray-700 text-base">{activity}</span>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-sm">No activities specified</p>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase mb-2">Certifications to Pursue</p>
                        <div className="space-y-2">
                            {certifications.length > 0 ? certifications.map((cert, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                    <GraduationCap className="w-5 h-5 text-yellow-600" />
                                    <span className="text-gray-700 text-base">{cert}</span>
                                </div>
                            )) : (
                                <p className="text-gray-500 text-sm">No certifications specified</p>
                            )}
                        </div>
                    </div>
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

                <div className="space-y-4">
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
                                <h4 className="font-bold text-gray-900 mb-3 text-lg">{project.title}</h4>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FileText className="w-4 h-4 text-indigo-500" />
                                            <span className="text-sm font-bold text-indigo-600 uppercase">Purpose</span>
                                        </div>
                                        <p className="text-gray-700 text-base">{project.purpose}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Award className="w-4 h-4 text-indigo-500" />
                                            <span className="text-sm font-bold text-indigo-600 uppercase">Output</span>
                                        </div>
                                        <p className="text-indigo-600 text-base font-medium">{project.output}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-gray-500 text-center py-4">No projects specified</p>
                    )}
                </div>
            </div>

            {/* Timeline Summary */}
            <div className="bg-slate-800 rounded-xl p-6">
                <div className="text-center mb-6">
                    <h3 className="text-3xl font-bold text-white mb-1">Your 12-Month Journey</h3>
                    <p className="text-gray-400 text-base">Follow this roadmap to career success</p>
                </div>

                <div className="grid grid-cols-4 gap-3">
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
            </div>
        </div>
    );
};

export default RoadmapSection;
