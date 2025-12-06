import { CheckCircle, Award, Rocket, Calendar, FileText, Users, Briefcase, GraduationCap } from 'lucide-react';

const RoadmapSection = ({ roadmap }) => {
    return (
        <div className="space-y-6">
            {/* Projects Section */}
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Rocket className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Portfolio Projects</h3>
                        <p className="text-xs text-gray-500">Build these to stand out</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {roadmap.projects.map((project, idx) => (
                        <div key={idx} className="flex gap-4">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                                    {idx + 1}
                                </div>
                                {idx < roadmap.projects.length - 1 && (
                                    <div className="w-0.5 flex-1 bg-indigo-200 mt-2" />
                                )}
                            </div>
                            <div className="flex-1 pb-4">
                                <h4 className="font-bold text-gray-900 mb-3">{project.title}</h4>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FileText className="w-3 h-3 text-indigo-500" />
                                            <span className="text-xs font-bold text-indigo-600 uppercase">Purpose</span>
                                        </div>
                                        <p className="text-gray-700 text-sm">{project.purpose}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Award className="w-3 h-3 text-indigo-500" />
                                            <span className="text-xs font-bold text-indigo-600 uppercase">Output</span>
                                        </div>
                                        <p className="text-indigo-600 text-sm font-medium">{project.output}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Internship & Exposure Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Internship Pathway */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Briefcase className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Internship Pathway</h3>
                            <p className="text-xs text-gray-500">Your route to experience</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Best Internship Types</p>
                        <div className="space-y-2">
                            {roadmap.internship.types.map((type, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-gray-700 text-sm">{type}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-3 bg-indigo-50 rounded-lg mb-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Calendar className="w-3 h-3 text-indigo-600" />
                            <span className="text-xs font-bold text-indigo-600 uppercase">Target Timeline</span>
                        </div>
                        <p className="text-indigo-800 font-semibold text-sm">{roadmap.internship.timeline}</p>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Preparation Checklist</p>
                        <div className="space-y-2">
                            {[
                                { label: 'Resume', value: roadmap.internship.preparation.resume, icon: FileText },
                                { label: 'Portfolio', value: roadmap.internship.preparation.portfolio, icon: Rocket },
                                { label: 'Interview', value: roadmap.internship.preparation.interview, icon: Users }
                            ].map((item, idx) => (
                                <div key={idx} className="p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                        <item.icon className="w-3 h-3 text-indigo-500" />
                                        <span className="text-xs font-bold text-indigo-600">{item.label}</span>
                                    </div>
                                    <p className="text-gray-600 text-sm">{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Activities & Exposure */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Activities & Exposure</h3>
                            <p className="text-xs text-gray-500">Build your network</p>
                        </div>
                    </div>

                    <div className="mb-5">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Join / Lead These</p>
                        <div className="space-y-2">
                            {roadmap.exposure.activities.map((activity, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                    <span className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">{idx + 1}</span>
                                    <span className="text-gray-700 text-sm">{activity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Certifications to Pursue</p>
                        <div className="space-y-2">
                            {roadmap.exposure.certifications.map((cert, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                                    <GraduationCap className="w-4 h-4 text-yellow-600" />
                                    <span className="text-gray-700 text-sm">{cert}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline Summary */}
            <div className="bg-slate-800 rounded-xl p-6">
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-1">Your 12-Month Journey</h3>
                    <p className="text-gray-400 text-sm">Follow this roadmap to career success</p>
                </div>

                <div className="grid grid-cols-4 gap-3">
                    {[
                        { month: '0-3', title: 'Foundation', items: ['Core skills', 'First project'], color: 'bg-indigo-500' },
                        { month: '3-6', title: 'Build', items: ['Portfolio', 'Certifications'], color: 'bg-indigo-500' },
                        { month: '6-9', title: 'Apply', items: ['Internships', 'Networking'], color: 'bg-yellow-500' },
                        { month: '9-12', title: 'Launch', items: ['Full-time prep', 'Interview ready'], color: 'bg-green-500' }
                    ].map((phase, idx) => (
                        <div key={idx} className="text-center">
                            <div className={`w-full h-1.5 rounded-full ${phase.color} mb-3`} />
                            <div className="bg-white/10 rounded-lg p-3">
                                <p className="text-xs text-gray-400 mb-1">Month {phase.month}</p>
                                <h4 className="font-bold text-white text-sm mb-2">{phase.title}</h4>
                                <div className="space-y-1">
                                    {phase.items.map((item, i) => (
                                        <p key={i} className="text-xs text-gray-400">{item}</p>
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
