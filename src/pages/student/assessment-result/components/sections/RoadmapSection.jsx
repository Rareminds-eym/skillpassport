import { CheckCircle, Award, Rocket, Calendar, FileText, Users, Briefcase, GraduationCap } from 'lucide-react';

const RoadmapSection = ({ roadmap }) => {
    return (
        <div className="space-y-8">
            {/* Projects Section */}
            <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                        <Rocket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Portfolio Projects</h3>
                        <p className="text-sm text-gray-500">Build these to stand out</p>
                    </div>
                </div>

                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-pink-500 to-rose-500 rounded-full" />
                    
                    <div className="space-y-6">
                        {roadmap.projects.map((project, idx) => (
                            <div key={idx} className="relative pl-16 group">
                                {/* Timeline dot */}
                                <div className="absolute left-3 top-6 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform">
                                    {idx + 1}
                                </div>
                                
                                <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-2xl p-6 border border-purple-100 hover:shadow-xl transition-all group-hover:-translate-y-1">
                                    <h4 className="font-bold text-gray-900 text-lg mb-4">{project.title}</h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/80 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FileText className="w-4 h-4 text-purple-500" />
                                                <span className="text-xs font-bold text-purple-600 uppercase">Purpose</span>
                                            </div>
                                            <p className="text-gray-700 text-sm">{project.purpose}</p>
                                        </div>
                                        <div className="p-4 bg-white/80 rounded-xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Award className="w-4 h-4 text-pink-500" />
                                                <span className="text-xs font-bold text-pink-600 uppercase">Output</span>
                                            </div>
                                            <p className="text-indigo-600 text-sm font-medium">{project.output}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Internship & Exposure Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Internship Pathway */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-[1px]">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <Briefcase className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Internship Pathway</h3>
                                <p className="text-xs text-gray-500">Your route to experience</p>
                            </div>
                        </div>

                        <div className="mb-5">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Best Internship Types</p>
                            <div className="space-y-2">
                                {roadmap.internship.types.map((type, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                        <CheckCircle className="w-5 h-5 text-blue-500" />
                                        <span className="text-gray-700 font-medium text-sm">{type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl mb-5">
                            <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-bold text-indigo-600 uppercase">Target Timeline</span>
                            </div>
                            <p className="text-indigo-800 font-semibold">{roadmap.internship.timeline}</p>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Preparation Checklist</p>
                            <div className="space-y-3">
                                {[
                                    { label: 'Resume', value: roadmap.internship.preparation.resume, icon: FileText, color: 'blue' },
                                    { label: 'Portfolio', value: roadmap.internship.preparation.portfolio, icon: Rocket, color: 'purple' },
                                    { label: 'Interview', value: roadmap.internship.preparation.interview, icon: Users, color: 'indigo' }
                                ].map((item, idx) => (
                                    <div key={idx} className="p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-2 mb-1">
                                            <item.icon className={`w-4 h-4 text-${item.color}-500`} />
                                            <span className={`text-xs font-bold text-${item.color}-600`}>{item.label}</span>
                                        </div>
                                        <p className="text-gray-600 text-sm">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Campus & External Exposure */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 p-[1px]">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 h-full">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Activities & Exposure</h3>
                                <p className="text-xs text-gray-500">Build your network</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Join / Lead These</p>
                            <div className="space-y-2">
                                {roadmap.exposure.activities.map((activity, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 group hover:shadow-md transition-all">
                                        <span className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform">{idx + 1}</span>
                                        <span className="text-gray-700 font-medium text-sm">{activity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Certifications to Pursue</p>
                            <div className="space-y-2">
                                {roadmap.exposure.certifications.map((cert, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100 group hover:shadow-md transition-all">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <GraduationCap className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-gray-700 font-medium text-sm">{cert}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline Summary */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-800 via-slate-900 to-gray-900 p-8">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_bottom_right,#10b981_0%,transparent_50%)]" />
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_left,#8b5cf6_0%,transparent_50%)]" />
                
                <div className="relative">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-white mb-2">Your 12-Month Journey</h3>
                        <p className="text-gray-400">Follow this roadmap to career success</p>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { month: '0-3', title: 'Foundation', items: ['Core skills', 'First project'], color: 'from-blue-500 to-indigo-500' },
                            { month: '3-6', title: 'Build', items: ['Portfolio', 'Certifications'], color: 'from-purple-500 to-pink-500' },
                            { month: '6-9', title: 'Apply', items: ['Internships', 'Networking'], color: 'from-amber-500 to-orange-500' },
                            { month: '9-12', title: 'Launch', items: ['Full-time prep', 'Interview ready'], color: 'from-emerald-500 to-teal-500' }
                        ].map((phase, idx) => (
                            <div key={idx} className="text-center">
                                <div className={`w-full h-2 rounded-full bg-gradient-to-r ${phase.color} mb-4`} />
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <p className="text-xs text-gray-400 mb-1">Month {phase.month}</p>
                                    <h4 className="font-bold text-white mb-2">{phase.title}</h4>
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
        </div>
    );
};

export default RoadmapSection;
