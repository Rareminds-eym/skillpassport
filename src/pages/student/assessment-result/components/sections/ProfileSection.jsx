import { Compass, Zap, Heart, Star, Trophy, Rocket } from 'lucide-react';

/**
 * Profile Section Detail Component
 * Displays detailed profile information in the modal
 */
const ProfileSection = ({ results, riasecNames, riasecColors, traitNames, traitColors }) => {
    const { riasec, aptitude, bigFive, workValues } = results;

    return (
        <div className="space-y-6">
            {/* Key Findings Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* RIASEC Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                            <Compass className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-800">Top Interest Themes (RIASEC)</h3>
                    </div>
                    <div className="space-y-3">
                        {riasec.topThree.map((code, idx) => (
                            <div key={code} className="flex items-center gap-3 bg-white/70 rounded-xl p-3">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                    style={{ backgroundColor: riasecColors[code] }}
                                >
                                    {code}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">{riasecNames[code]}</p>
                                    <p className="text-xs text-gray-500">Code {idx + 1}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Multi-Aptitude Battery Card */}
                <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border border-amber-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">Multi-Aptitude Battery</h3>
                            <p className="text-xs text-gray-500">DAT/GATB Style Cognitive Assessment</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {aptitude?.scores ? (
                            Object.entries(aptitude.scores).map(([domain, data]) => {
                                const domainInfo = {
                                    verbal: { name: 'A) Verbal Reasoning', color: 'bg-blue-500' },
                                    numerical: { name: 'B) Numerical Ability', color: 'bg-green-500' },
                                    abstract: { name: 'C) Abstract/Logical', color: 'bg-purple-500' },
                                    spatial: { name: 'D) Spatial/Mechanical', color: 'bg-orange-500' },
                                    clerical: { name: 'E) Clerical Speed', color: 'bg-pink-500' }
                                };
                                const info = domainInfo[domain] || { name: domain, color: 'bg-gray-500' };
                                const percentage = data.percentage || 0;
                                return (
                                    <div key={domain} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${info.color}`}></div>
                                            <span className="text-xs font-medium text-gray-700">{info.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500">{data.correct}/{data.total}</span>
                                            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${info.color} transition-all duration-500`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-600 w-8">{percentage}%</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-gray-500 italic">Aptitude data not available</p>
                        )}
                    </div>
                    {aptitude?.topStrengths && (
                        <div className="mt-3 pt-3 border-t border-amber-200">
                            <p className="text-xs font-semibold text-amber-700 mb-1">Top Cognitive Strengths:</p>
                            <p className="text-sm text-gray-700">{aptitude.topStrengths.join(', ')}</p>
                        </div>
                    )}
                </div>

                {/* Personality Card */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center">
                            <Heart className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-800">Personality Highlights (Big Five)</h3>
                    </div>
                    <div className="space-y-2">
                        {['O', 'C', 'E', 'A', 'N'].map(trait => {
                            const score = bigFive[trait] || 0;
                            const percentage = (score / 5) * 100;
                            return (
                                <div key={trait} className="flex items-center justify-between bg-white/70 rounded-lg px-3 py-2">
                                    <span className="text-sm font-medium text-gray-700">{traitNames[trait]}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%`, backgroundColor: traitColors[trait] }}
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-gray-600 w-8">{score.toFixed(1)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Work Values Card */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
                            <Star className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-gray-800">Top Work Values</h3>
                    </div>
                    <div className="space-y-3">
                        {workValues.topThree.map((val, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-white/70 rounded-xl p-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <Trophy className="w-4 h-4 text-amber-600" />
                                </div>
                                <span className="font-semibold text-gray-800">{val.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Overall Career Direction */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                    <Rocket className="w-5 h-5" />
                    <h4 className="font-bold text-lg">Overall Career Direction</h4>
                </div>
                <p className="text-white/90 leading-relaxed italic">"{results.overallSummary}"</p>
            </div>
        </div>
    );
};

export default ProfileSection;
