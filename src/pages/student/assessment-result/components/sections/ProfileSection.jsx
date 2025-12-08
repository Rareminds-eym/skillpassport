import { Compass, Zap, Heart, Star, Trophy, Rocket, Sparkles, FileText, Calculator, Puzzle, Ruler, Bolt, BarChart3, Award } from 'lucide-react';

// Helper function to get color based on percentage (red < 40, yellow 40-70, green > 70)
const getScoreColor = (percentage) => {
    if (percentage >= 70) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100', border: 'border-green-200', stroke: '#22c55e' };
    if (percentage >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-100', border: 'border-yellow-200', stroke: '#eab308' };
    return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100', border: 'border-red-200', stroke: '#ef4444' };
};

const ProfileSection = ({ results, riasecNames }) => {
    const { riasec, aptitude, bigFive, workValues } = results;

    // Debug logging for aptitude data
    console.log('=== ProfileSection Debug ===');
    console.log('Aptitude object:', aptitude);
    console.log('Aptitude scores:', aptitude?.scores);

    return (
        <div className="space-y-6">
            {/* Top Interests Summary */}
            <div className="grid grid-cols-3 gap-4">
                {riasec?.topThree?.slice(0, 3).map((code, idx) => {
                    const score = riasec.scores?.[code] || 0;
                    const maxScore = riasec.maxScore || 20;
                    const pct = Math.round((score / maxScore) * 100);
                    const scoreColor = getScoreColor(pct);
                    return (
                        <div key={code} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl mb-3 ${scoreColor.bg}`}>{code}</div>
                            <p className="font-bold text-gray-800">{riasecNames[code]}</p>
                            <p className="text-sm text-gray-500">#{idx + 1} Interest • {score}/{maxScore}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
                {/* Interest Profile */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Compass className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Interest Profile</h3>
                            <p className="text-sm text-gray-500">Career Interest Assessment</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {riasec?.topThree?.map((code) => {
                            const score = riasec.scores?.[code] || 0;
                            const maxScore = riasec.maxScore || 20;
                            const pct = Math.round((score / maxScore) * 100);
                            const scoreColor = getScoreColor(pct);
                            return (
                                <div key={code}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-7 h-7 rounded flex items-center justify-center text-white font-bold text-sm ${scoreColor.bg}`}>{code}</span>
                                            <span className="text-base font-medium text-gray-700">{riasecNames[code]}</span>
                                        </div>
                                        <span className={`text-base font-bold px-2 py-0.5 rounded ${scoreColor.light} ${scoreColor.text}`}>{score}/{maxScore}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${scoreColor.bg}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Cognitive Abilities */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Cognitive Abilities</h3>
                            <p className="text-sm text-gray-500">Multi-Aptitude</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {aptitude?.scores ? Object.entries(aptitude.scores).map(([domain, data]) => {
                            const configs = {
                                verbal: { n: 'Verbal Reasoning', Icon: FileText },
                                numerical: { n: 'Numerical Ability', Icon: Calculator },
                                abstract: { n: 'Abstract Reasoning', Icon: Puzzle },
                                spatial: { n: 'Spatial Reasoning', Icon: Ruler },
                                clerical: { n: 'Clerical Speed', Icon: Bolt }
                            };
                            const cfg = configs[domain.toLowerCase()] || { n: domain, Icon: BarChart3 };
                            const correct = typeof data === 'object' ? (data.correct || 0) : 0;
                            const total = typeof data === 'object' ? (data.total || 1) : 1;
                            const pct = typeof data === 'object'
                                ? (data.percentage || Math.round((correct / total) * 100))
                                : (typeof data === 'number' ? data : 0);
                            const scoreColor = getScoreColor(pct);
                            const IconComponent = cfg.Icon;
                            return (
                                <div key={domain} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${scoreColor.light} flex items-center justify-center shrink-0`}>
                                        <IconComponent className={`w-4 h-4 ${scoreColor.text}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-base font-medium text-gray-700 truncate">{cfg.n}</span>
                                            <span className={`text-sm font-bold ${scoreColor.text} ml-2`}>{correct}/{total}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${scoreColor.bg}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                    <span className={`text-base font-bold px-2 py-0.5 rounded ${scoreColor.light} ${scoreColor.text} shrink-0`}>{pct}%</span>
                                </div>
                            );
                        }) : <p className="text-gray-500 italic text-center py-4">No aptitude data available</p>}
                    </div>
                    {aptitude?.topStrengths && (
                        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                            {aptitude.topStrengths.map((s, i) => (
                                <span key={i} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-1">
                                    <Award className="w-3 h-3" /> {s}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Personality Traits */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Heart className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Personality Traits</h3>
                            <p className="text-sm text-gray-500">Big Five Model</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-5 gap-3 mb-4">
                        {[
                            { key: 'O', name: 'Open' },
                            { key: 'C', name: 'Conscientious' },
                            { key: 'E', name: 'Extraverted' },
                            { key: 'A', name: 'Agreeable' },
                            { key: 'N', name: 'Neurotic' }
                        ].map(({ key, name }) => {
                            const sc = bigFive?.[key] || 0;
                            const p = (sc / 5) * 100;
                            const scoreColor = getScoreColor(p);
                            return (
                                <div key={key} className="text-center">
                                    <div className="relative w-full aspect-square mb-2">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="15" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                                            <circle cx="18" cy="18" r="15" fill="none" stroke={scoreColor.stroke} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${p * 0.94} 100`} />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className={`text-sm font-bold ${scoreColor.text}`}>{sc.toFixed(1)}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-600">{name}</p>
                                </div>
                            );
                        })}
                    </div>
                    {bigFive?.workStyleSummary && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{bigFive.workStyleSummary}</p>
                        </div>
                    )}
                </div>

                {/* Work Values */}
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Star className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Work Values</h3>
                            <p className="text-sm text-gray-500">What Motivates You</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {workValues?.topThree?.map((val, idx) => {
                            const pct = (val.score / 5) * 100;
                            const scoreColor = getScoreColor(pct);
                            return (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className={`w-8 h-8 rounded-lg ${scoreColor.bg} flex items-center justify-center text-white`}>
                                        <Trophy className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{val.value}</p>
                                        <p className="text-sm text-gray-500">Priority #{idx + 1}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-sm font-bold ${scoreColor.light} ${scoreColor.text}`}>{val.score}/5</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Career Direction Summary */}
            <div className="bg-slate-800 rounded-xl p-5">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <Rocket className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3 h-3 text-yellow-400" />
                            <h4 className="font-bold text-white">Your Career Direction</h4>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{results.overallSummary}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSection;
