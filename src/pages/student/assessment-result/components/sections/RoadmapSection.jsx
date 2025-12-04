import { CheckCircle, Award } from 'lucide-react';

/**
 * Roadmap Section Detail Component
 * Displays the 6-12 month action roadmap in the modal
 */
const RoadmapSection = ({ roadmap }) => {
    return (
        <div className="space-y-6">
            {/* Projects Section */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Projects / Portfolio</h3>
                <div className="space-y-4">
                    {roadmap.projects.map((project, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-purple-500 to-pink-500"></div>
                            <div className="pl-4 flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shrink-0">
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-800 text-lg mb-3">{project.title}</h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-white/70 rounded-lg p-4">
                                            <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">Purpose</p>
                                            <p className="text-gray-700 text-sm">{project.purpose}</p>
                                        </div>
                                        <div className="bg-white/70 rounded-lg p-4">
                                            <p className="text-xs font-bold text-pink-700 uppercase tracking-wider mb-1">Output / Proof</p>
                                            <p className="text-indigo-600 text-sm font-medium">{project.output}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Internship & Exposure Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Internship Pathway */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <h3 className="font-bold text-gray-800 mb-6">Internship Pathway</h3>

                    <div className="mb-6">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">Best internship type(s)</p>
                        <div className="space-y-2">
                            {roadmap.internship.types.map((type, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-white/70 rounded-lg p-3">
                                    <CheckCircle className="w-4 h-4 text-blue-500" />
                                    <span className="text-gray-700 text-sm">{type}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 bg-blue-100 rounded-lg p-3">
                            <span className="text-xs font-bold text-blue-700">Target Timeline:</span>
                            <span className="text-blue-800 text-sm ml-2">{roadmap.internship.timeline}</span>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">How to prepare</p>
                        <div className="space-y-3 text-sm">
                            <div className="bg-white/70 rounded-lg p-3">
                                <span className="font-semibold text-gray-700">Resume:</span>
                                <span className="text-gray-600 ml-2">{roadmap.internship.preparation.resume}</span>
                            </div>
                            <div className="bg-white/70 rounded-lg p-3">
                                <span className="font-semibold text-gray-700">Portfolio:</span>
                                <span className="text-gray-600 ml-2">{roadmap.internship.preparation.portfolio}</span>
                            </div>
                            <div className="bg-white/70 rounded-lg p-3">
                                <span className="font-semibold text-gray-700">Interview:</span>
                                <span className="text-gray-600 ml-2">{roadmap.internship.preparation.interview}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Campus & External Exposure */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                    <h3 className="font-bold text-gray-800 mb-6">Campus & External Exposure</h3>

                    <div className="mb-6">
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">Join / Lead these activities</p>
                        <div className="space-y-2">
                            {roadmap.exposure.activities.map((activity, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-white/70 rounded-lg p-3">
                                    <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">{idx + 1}</span>
                                    <span className="text-gray-700 text-sm">{activity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">Certifications Recommended</p>
                        <div className="space-y-2">
                            {roadmap.exposure.certifications.map((cert, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-white/70 rounded-lg p-3">
                                    <Award className="w-4 h-4 text-emerald-500" />
                                    <span className="text-gray-700 text-sm">{cert}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoadmapSection;
