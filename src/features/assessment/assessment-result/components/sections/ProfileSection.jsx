import { Compass, Zap, Heart, Star, Trophy, Sparkles, FileText, Calculator, Puzzle, Ruler, Bolt, BarChart3, Award } from 'lucide-react';

// Helper function to get color based on percentage (red < 40, yellow 40-70, green > 70)
const getScoreColor = (percentage) => {
    if (percentage >= 70) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100', border: 'border-green-200', stroke: '#22c55e' };
    if (percentage >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-100', border: 'border-yellow-200', stroke: '#eab308' };
    return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100', border: 'border-red-200', stroke: '#ef4444' };
};

const ProfileSection = ({ results, riasecNames }) => {
    const { riasec, aptitude, bigFive, workValues, profileSnapshot } = results;

    // Debug logging for aptitude data
    console.log('=== ProfileSection Debug ===');
    console.log('Aptitude object:', aptitude);
    console.log('Aptitude scores:', aptitude?.scores);
    console.log('ProfileSnapshot:', profileSnapshot);

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
                        <div key={code} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-all">
                            <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-white font-bold text-2xl mb-3 ${scoreColor.bg}`}>{code}</div>
                            <p className="font-bold text-gray-800 text-lg">{riasecNames[code]}</p>
                            <p className="text-base text-gray-500">#{idx + 1} Interest • {score}/{maxScore}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
                {/* Interest Profile */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Compass className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-xl">Interest Profile</h3>
                            <p className="text-base text-gray-500">Career Interest Assessment</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {riasec?.topThree?.map((code) => {
                            const score = riasec.scores?.[code] || 0;
                            const maxScore = riasec.maxScore || 20;
                            // Use percentages from AI if available, otherwise calculate
                            const pct = riasec.percentages?.[code] || Math.round((score / maxScore) * 100);
                            const scoreColor = getScoreColor(pct);
                            return (
                                <div key={code}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-8 h-8 rounded flex items-center justify-center text-white font-bold text-base ${scoreColor.bg}`}>{code}</span>
                                            <span className="text-lg font-medium text-gray-700">{riasecNames[code]}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-base font-bold px-2 py-1 rounded ${scoreColor.light} ${scoreColor.text}`}>{score}/{maxScore}</span>
                                            <span className={`text-lg font-bold ${scoreColor.text}`}>{pct}%</span>
                                        </div>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${scoreColor.bg}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Cognitive Abilities */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Zap className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-xl">Cognitive Strengths</h3>
                            <p className="text-base text-gray-500">Your natural abilities</p>
                        </div>
                    </div>

                    {/* For high school: display aptitudeStrengths from profileSnapshot */}
                    {profileSnapshot?.aptitudeStrengths && profileSnapshot.aptitudeStrengths.length > 0 ? (
                        <div className="space-y-4">
                            {profileSnapshot.aptitudeStrengths.map((strength, index) => (
                                <div key={index} className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                                            <Star className="w-4 h-4 text-white fill-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 text-lg mb-1">{strength.name}</h4>
                                            <p className="text-gray-600 text-base leading-relaxed">{strength.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : aptitude?.scores ? (
                        /* For after12: display test scores with progress bars */
                        <>
                            <div className="space-y-3">
                                {Object.entries(aptitude.scores).map(([domain, data]) => {
                                    const configs = {
                                        verbal: { n: 'Verbal Reasoning', Icon: FileText },
                                        numerical: { n: 'Numerical Ability', Icon: Calculator },
                                        abstract: { n: 'Abstract Reasoning', Icon: Puzzle },
                                        spatial: { n: 'Spatial Reasoning', Icon: Ruler },
                                        clerical: { n: 'Clerical Speed', Icon: Bolt }
                                    };
                                    const cfg = configs[domain.toLowerCase()] || { n: domain, Icon: BarChart3 };

                                    // After12: test-based (correct/total)
                                    const correct = typeof data === 'object' ? (data.correct || 0) : 0;
                                    const total = typeof data === 'object' ? (data.total || 1) : 1;
                                    const scoreText = `${correct}/${total}`;
                                    const pct = typeof data === 'object'
                                        ? (data.percentage || Math.round((correct / total) * 100))
                                        : (typeof data === 'number' ? data : 0);

                                    const scoreColor = getScoreColor(pct);
                                    const IconComponent = cfg.Icon;
                                    return (
                                        <div key={domain} className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg ${scoreColor.light} flex items-center justify-center shrink-0`}>
                                                <IconComponent className={`w-5 h-5 ${scoreColor.text}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-lg font-medium text-gray-700 truncate">{cfg.n}</span>
                                                    <span className={`text-base font-bold ${scoreColor.text} ml-2`}>{scoreText}</span>
                                                </div>
                                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${scoreColor.bg}`} style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                            <span className={`text-base font-bold px-2 py-1 rounded ${scoreColor.light} ${scoreColor.text} shrink-0`}>{pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                            {aptitude?.topStrengths && (
                                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                                    {aptitude.topStrengths.map((s, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-base font-semibold flex items-center gap-1">
                                            <Award className="w-4 h-4" /> {s}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="text-gray-500 italic text-center py-4 text-base">No cognitive data available</p>
                    )}
                </div>

                {/* Personality Traits */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Heart className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-xl">Personality Traits</h3>
                            <p className="text-base text-gray-500">Big Five Model</p>
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
                                            <span className={`text-base font-bold ${scoreColor.text}`}>{sc.toFixed(1)}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-600">{name}</p>
                                </div>
                            );
                        })}
                    </div>
                    {bigFive?.workStyleSummary && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-base text-gray-700">{bigFive.workStyleSummary}</p>
                        </div>
                    )}
                </div>

                {/* Work Values */}
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                            <Star className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-xl">Work Values</h3>
                            <p className="text-base text-gray-500">What Motivates You</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {workValues?.topThree?.map((val, idx) => {
                            const pct = (val.score / 5) * 100;
                            const scoreColor = getScoreColor(pct);
                            return (
                                <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                                    <div className={`w-10 h-10 rounded-lg ${scoreColor.bg} flex items-center justify-center text-white`}>
                                        <Trophy className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800 text-lg">{val.value}</p>
                                        <p className="text-base text-gray-500">Priority #{idx + 1}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded text-base font-bold ${scoreColor.light} ${scoreColor.text}`}>{val.score}/5</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Career Direction Summary */}
            <div className="bg-slate-800 rounded-xl p-6">
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <img src="/assets/HomePage/Ai Logo.png" alt="AI" className="w-10 h-10 object-contain" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                            <h4 className="font-bold text-white text-2xl">Your Career Direction</h4>
                        </div>
                        <p className="text-gray-300 text-base leading-relaxed">{results.overallSummary}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSection;
