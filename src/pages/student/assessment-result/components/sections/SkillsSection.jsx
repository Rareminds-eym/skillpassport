import { CheckCircle, ChevronRight, Star } from 'lucide-react';
import { Badge } from '../../../../../components/Students/components/ui/badge';

/**
 * Skills Section Detail Component
 * Displays skill gap analysis in the modal
 */
const SkillsSection = ({ skillGap, employability }) => {
    return (
        <div className="space-y-6">
            {/* Current Strengths */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Current Strengths</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                        <h4 className="font-bold text-emerald-800 mb-4">Technical / Domain Skills</h4>
                        <div className="space-y-2">
                            {skillGap.currentStrengths.map((skill, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-white/70 rounded-lg p-3">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    <span className="text-gray-700 text-sm">{skill}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                        <h4 className="font-bold text-blue-800 mb-4">Employability Strengths</h4>
                        <div className="space-y-2">
                            {employability.strengthAreas.map((skill, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-white/70 rounded-lg p-3">
                                    <span className="text-gray-700 text-sm">{skill}</span>
                                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">High</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Priority A Skills */}
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                        <span className="text-white font-bold">A</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-red-800">Priority A — Must build in next 6 months</h4>
                        <p className="text-red-600 text-sm">Critical skills for your career path</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {skillGap.priorityA.map((item, idx) => (
                        <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-red-100">
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700 font-bold">{idx + 1}</span>
                                    <h5 className="font-bold text-gray-800 text-lg">{item.skill}</h5>
                                </div>
                                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
                                    <span className="text-xs text-gray-500">Level:</span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-red-600">{item.currentLevel}</span>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                        <span className="font-bold text-emerald-600">{item.targetLevel}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">/ 5</span>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="bg-red-50 rounded-lg p-4">
                                    <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2">Why needed</p>
                                    <p className="text-gray-700 text-sm">{item.whyNeeded}</p>
                                </div>
                                <div className="bg-indigo-50 rounded-lg p-4">
                                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">How to build</p>
                                    <p className="text-gray-700 text-sm">{item.howToBuild}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Priority B Skills */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                        <span className="text-white font-bold">B</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-800">Priority B — Build in next 6–12 months</h4>
                        <p className="text-amber-600 text-sm">Important skills for career advancement</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                    {skillGap.priorityB.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/70 rounded-lg p-3">
                            <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">{idx + 1}</span>
                            <span className="text-gray-700 text-sm font-medium">{item.skill}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Learning Tracks */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
                <h3 className="font-bold text-gray-800 text-lg mb-6">Recommended Learning Tracks</h3>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {skillGap.learningTracks.map((track, idx) => {
                        const isRecommended = track.track === skillGap.recommendedTrack;
                        return (
                            <div
                                key={idx}
                                className={`rounded-xl p-5 border-2 transition-all ${isRecommended
                                    ? 'bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-400 shadow-lg'
                                    : 'bg-white border-gray-200 border-dashed'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h5 className="font-bold text-gray-800">Track {idx + 1}: {track.track}</h5>
                                    {isRecommended && (
                                        <Badge className="bg-indigo-600 text-white border-0">
                                            <Star className="w-3 h-3 mr-1" />
                                            Recommended
                                        </Badge>
                                    )}
                                </div>
                                <div className="space-y-2 text-sm">
                                    <p><span className="font-semibold text-gray-600">Suggested if:</span> <span className="text-gray-700">{track.suggestedIf}</span></p>
                                    <p><span className="font-semibold text-gray-600">Core topics:</span> <span className="text-gray-700">{track.topics}</span></p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white rounded-xl p-4 flex items-center justify-between">
                    <span className="text-gray-600">Your recommended track:</span>
                    <span className="text-xl font-bold text-indigo-600">{skillGap.recommendedTrack}</span>
                </div>
            </div>
        </div>
    );
};

export default SkillsSection;
