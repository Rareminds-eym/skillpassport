import { CheckCircle, ChevronRight, Star, Zap, Target, TrendingUp, BookOpen, Check } from 'lucide-react';

// Helper function to get color based on skill level (1-5 scale)
const getSkillLevelColor = (level) => {
    const pct = (level / 5) * 100;
    if (pct >= 70) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100' };
    if (pct >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-100' };
    return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100' };
};

const SkillsSection = ({ skillGap, employability }) => {
    return (
        <div className="space-y-6">
            {/* Current Strengths */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Technical Strengths</h3>
                            <p className="text-xs text-gray-500">Your current skills</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {skillGap.currentStrengths.map((skill, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-100">
                                <Check className="w-4 h-4 text-green-600" />
                                <span className="text-gray-700 text-sm">{skill}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Employability Skills</h3>
                            <p className="text-xs text-gray-500">Job-ready competencies</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {employability.strengthAreas.map((skill, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <span className="text-gray-700 text-sm">{skill}</span>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">Strong</span>
                            </div>
                        ))}
                    </div>
                    {employability.improvementAreas?.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 mb-2">Areas to Improve</p>
                            <div className="flex flex-wrap gap-1">
                                {employability.improvementAreas.map((area, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">{area}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Priority A Skills */}
            <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
                <div className="bg-red-50 p-4 border-b border-red-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Priority A Skills</h3>
                                <p className="text-xs text-gray-500">Must build in next 6 months</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold">{skillGap.priorityA.length} Skills</span>
                    </div>
                </div>
                <div className="p-4 space-y-4">
                    {skillGap.priorityA.map((item, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold">{idx + 1}</span>
                                    <h4 className="font-bold text-gray-900">{item.skill}</h4>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border">
                                    <span className="text-red-500 font-bold">{item.currentLevel}</span>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                    <span className="text-green-500 font-bold">{item.targetLevel}</span>
                                    <span className="text-gray-400 text-sm">/ 5</span>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-3">
                                <div className="p-3 bg-white rounded-lg border border-red-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Target className="w-3 h-3 text-red-500" />
                                        <span className="text-xs font-bold text-red-600 uppercase">Why Needed</span>
                                    </div>
                                    <p className="text-gray-700 text-sm">{item.whyNeeded}</p>
                                </div>
                                <div className="p-3 bg-white rounded-lg border border-indigo-100">
                                    <div className="flex items-center gap-2 mb-1">
                                        <BookOpen className="w-3 h-3 text-indigo-500" />
                                        <span className="text-xs font-bold text-indigo-600 uppercase">How to Build</span>
                                    </div>
                                    <p className="text-gray-700 text-sm">{item.howToBuild}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Priority B Skills */}
            <div className="bg-white rounded-xl p-5 border border-yellow-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500 flex items-center justify-center">
                        <span className="text-white font-bold">B</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">Priority B Skills</h3>
                        <p className="text-xs text-gray-500">Build in 6-12 months</p>
                    </div>
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                    {skillGap.priorityB.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                            <span className="w-6 h-6 rounded bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">{idx + 1}</span>
                            <span className="text-gray-700 text-sm">{item.skill}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Learning Tracks */}
            <div className="bg-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Learning Tracks</h3>
                        <p className="text-sm text-gray-400">Choose your path</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {skillGap.learningTracks?.map((track, idx) => {
                        const isRecommended = track.track === skillGap.recommendedTrack;
                        return (
                            <div key={idx} className={`rounded-lg p-4 ${isRecommended ? 'bg-indigo-500/20 border-2 border-indigo-400' : 'bg-white/5 border border-white/10'}`}>
                                {isRecommended && (
                                    <div className="flex items-center gap-1 mb-2">
                                        <Star className="w-3 h-3 text-yellow-400" />
                                        <span className="text-xs font-bold text-yellow-400">Recommended</span>
                                    </div>
                                )}
                                <h4 className="font-bold text-white mb-2">{track.track}</h4>
                                <div className="space-y-1 text-sm">
                                    <p className="text-gray-400"><span className="text-gray-300">Best if:</span> {track.suggestedIf}</p>
                                    <p className="text-gray-400"><span className="text-gray-300">Topics:</span> {track.topics}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                    <span className="text-gray-300 text-sm">Your recommended track:</span>
                    <span className="font-bold text-indigo-400">{skillGap.recommendedTrack}</span>
                </div>
            </div>
        </div>
    );
};

export default SkillsSection;
