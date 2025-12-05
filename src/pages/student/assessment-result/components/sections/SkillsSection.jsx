import { CheckCircle, ChevronRight, Star, Zap, Target, TrendingUp, BookOpen } from 'lucide-react';
import { Badge } from '../../../../../components/Students/components/ui/badge';

const SkillsSection = ({ skillGap, employability }) => {
    return (
        <div className="space-y-8">
            {/* Current Strengths */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-[1px]">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 h-full">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                                <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Technical Strengths</h3>
                                <p className="text-xs text-gray-500">Your current skills</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {skillGap.currentStrengths.map((skill, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100 group hover:shadow-md transition-all">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform">✓</div>
                                    <span className="text-gray-700 font-medium text-sm">{skill}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[1px]">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 h-full">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Employability Skills</h3>
                                <p className="text-xs text-gray-500">Job-ready competencies</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {employability.strengthAreas.map((skill, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                    <span className="text-gray-700 font-medium text-sm">{skill}</span>
                                    <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Strong</Badge>
                                </div>
                            ))}
                        </div>
                        {employability.improvementAreas?.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs font-semibold text-gray-500 mb-2">Areas to Improve</p>
                                <div className="flex flex-wrap gap-2">
                                    {employability.improvementAreas.map((area, idx) => (
                                        <span key={idx} className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium">{area}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Priority A Skills */}
            <div className="relative overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-rose-500 to-pink-600" />
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_30%,white_0%,transparent_50%)]" />
                <div className="relative p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Zap className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Priority A Skills</h3>
                            <p className="text-white/70 text-sm">Must build in next 6 months</p>
                        </div>
                        <div className="ml-auto px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                            <span className="text-white font-bold">{skillGap.priorityA.length} Skills</span>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {skillGap.priorityA.map((item, idx) => (
                            <div key={idx} className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 shadow-xl">
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white font-bold shadow-lg">{idx + 1}</div>
                                        <h4 className="font-bold text-gray-900 text-lg">{item.skill}</h4>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl">
                                        <span className="text-red-500 font-bold text-lg">{item.currentLevel}</span>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                        <span className="text-emerald-500 font-bold text-lg">{item.targetLevel}</span>
                                        <span className="text-gray-400 text-sm">/ 5</span>
                                    </div>
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="w-4 h-4 text-red-500" />
                                            <span className="text-xs font-bold text-red-600 uppercase">Why Needed</span>
                                        </div>
                                        <p className="text-gray-700 text-sm">{item.whyNeeded}</p>
                                    </div>
                                    <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BookOpen className="w-4 h-4 text-indigo-500" />
                                            <span className="text-xs font-bold text-indigo-600 uppercase">How to Build</span>
                                        </div>
                                        <p className="text-gray-700 text-sm">{item.howToBuild}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Priority B Skills */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-[1px]">
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold">B</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Priority B Skills</h3>
                            <p className="text-xs text-gray-500">Build in 6-12 months</p>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        {skillGap.priorityB.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 hover:shadow-md transition-all">
                                <span className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white text-xs font-bold">{idx + 1}</span>
                                <span className="text-gray-700 font-medium text-sm">{item.skill}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Learning Tracks */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 p-8">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,#8b5cf6_0%,transparent_50%)]" />
                <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Learning Tracks</h3>
                            <p className="text-sm text-gray-400">Choose your path</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                        {skillGap.learningTracks?.map((track, idx) => {
                            const isRecommended = track.track === skillGap.recommendedTrack;
                            return (
                                <div key={idx} className={`relative rounded-2xl p-5 transition-all ${isRecommended ? 'bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border-2 border-indigo-400' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}>
                                    {isRecommended && (
                                        <div className="absolute -top-3 left-4 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full">
                                            <span className="text-xs font-bold text-white flex items-center gap-1"><Star className="w-3 h-3" /> Recommended</span>
                                        </div>
                                    )}
                                    <h4 className="font-bold text-white text-lg mb-3 mt-1">{track.track}</h4>
                                    <div className="space-y-2 text-sm">
                                        <p className="text-gray-400"><span className="text-gray-300 font-medium">Best if:</span> {track.suggestedIf}</p>
                                        <p className="text-gray-400"><span className="text-gray-300 font-medium">Topics:</span> {track.topics}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                        <span className="text-gray-300">Your recommended track:</span>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{skillGap.recommendedTrack}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillsSection;
