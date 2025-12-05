import { Compass, Zap, Heart, Star, Trophy, Rocket, Sparkles, FileText, Calculator, Puzzle, Ruler, Bolt, BarChart3, Award } from 'lucide-react';

// Helper function to get color based on percentage (red < 40, yellow 40-70, green > 70)
const getScoreColor = (percentage) => {
    if (percentage >= 70) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100', border: 'border-green-200' };
    if (percentage >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-100', border: 'border-yellow-200' };
    return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100', border: 'border-red-200' };
};

const ProfileSection = ({ results, riasecNames, riasecColors, traitNames, traitColors }) => {
    const { riasec, aptitude, bigFive, workValues } = results;

    // Debug logging for aptitude data
    console.log('=== ProfileSection Debug ===');
    console.log('Full results:', results);
    console.log('Aptitude object:', aptitude);
    console.log('Aptitude scores:', aptitude?.scores);
    if (aptitude?.scores) {
        console.log('Aptitude scores entries:', Object.entries(aptitude.scores));
        Object.entries(aptitude.scores).forEach(([domain, data]) => {
            console.log(`Domain: ${domain}`, data, typeof data);
        });
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                {riasec?.topThree?.slice(0, 3).map((code, idx) => (
                    <div key={code} className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-3 shadow-lg" style={{ backgroundColor: riasecColors[code] }}>{code}</div>
                            <p className="font-bold text-gray-800 text-lg">{riasecNames[code]}</p>
                            <p className="text-xs text-gray-500 mt-1">#{idx + 1} Interest</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-5">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-[1px]">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 h-full">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Compass className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Interest Profile</h3>
                                <p className="text-xs text-gray-500">RIASEC Assessment</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {riasec?.topThree?.map((code) => {
                                const score = riasec.scores?.[code] || 0;
                                const pct = Math.round((score / 25) * 100);
                                const scoreColor = getScoreColor(pct);
                                return (
                                    <div key={code}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md ${scoreColor.bg}`}>{code}</div>
                                                <span className="font-semibold text-gray-700">{riasecNames[code]}</span>
                                            </div>
                                            <span className={`text-sm font-bold px-2 py-0.5 rounded ${scoreColor.light} ${scoreColor.text}`}>{pct}%</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${scoreColor.bg}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-[1px]">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 h-full">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Cognitive Abilities</h3>
                                <p className="text-xs text-gray-500">Multi-Aptitude Battery</p>
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
                                // Handle both object format {correct, total, percentage} and direct number format
                                const correct = typeof data === 'object' ? (data.correct || 0) : 0;
                                const total = typeof data === 'object' ? (data.total || 1) : 1;
                                const pct = typeof data === 'object' 
                                    ? (data.percentage || Math.round((correct / total) * 100)) 
                                    : (typeof data === 'number' ? data : 0);
                                const scoreColor = getScoreColor(pct);
                                const IconComponent = cfg.Icon;
                                return (
                                    <div key={domain} className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-lg ${scoreColor.light} flex items-center justify-center shrink-0`}>
                                            <IconComponent className={`w-4 h-4 ${scoreColor.text}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-gray-700 truncate">{cfg.n}</span>
                                                <span className={`text-xs font-bold ${scoreColor.text} ml-2`}>{correct}/{total}</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${scoreColor.bg}`} style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                        <span className={`text-sm font-bold px-2 py-0.5 rounded ${scoreColor.light} ${scoreColor.text} shrink-0`}>{pct}%</span>
                                    </div>
                                );
                            }) : <p className="text-gray-500 italic text-center py-4">No aptitude data available</p>}
                        </div>
                        {aptitude?.topStrengths && (
                            <div className="mt-6 flex flex-wrap gap-2">
                                {aptitude.topStrengths.map((s, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                        <Award className="w-3 h-3" /> {s}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-[1px]">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 h-full">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Heart className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Personality Traits</h3>
                                <p className="text-xs text-gray-500">Big Five Model</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-5 gap-3 mb-5">
                            {['O', 'C', 'E', 'A', 'N'].map(t => {
                                const sc = bigFive?.[t] || 0;
                                const p = (sc / 5) * 100;
                                const scoreColor = getScoreColor(p);
                                const strokeColor = p >= 70 ? '#22c55e' : p >= 40 ? '#eab308' : '#ef4444';
                                return (
                                    <div key={t} className="text-center">
                                        <div className="relative w-full aspect-square mb-2">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                <circle cx="18" cy="18" r="15" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                                                <circle cx="18" cy="18" r="15" fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${p * 0.94} 100`} />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className={`text-xs font-bold ${scoreColor.text}`}>{sc.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-semibold text-gray-600">{traitNames[t]}</p>
                                    </div>
                                );
                            })}
                        </div>
                        {bigFive?.workStyleSummary && <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl"><p className="text-sm text-gray-700">{bigFive.workStyleSummary}</p></div>}
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 p-[1px]">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-5 h-full">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <Star className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Work Values</h3>
                                <p className="text-xs text-gray-500">What Motivates You</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {workValues?.topThree?.map((val, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-xl border border-emerald-100 hover:shadow-md transition-all group">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                                        <Trophy className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{val.value}</p>
                                        <p className="text-xs text-gray-500">Priority #{idx + 1}</p>
                                    </div>
                                    <div className="px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-bold">{val.score}/5</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-5">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,white_0%,transparent_50%)]" />
                <div className="relative flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <Rocket className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3 h-3 text-yellow-300" />
                            <h4 className="font-bold text-white">Your Career Direction</h4>
                        </div>
                        <p className="text-white/95 text-sm leading-relaxed">{results.overallSummary}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSection;
