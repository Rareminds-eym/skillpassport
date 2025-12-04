import { Compass, Zap, Heart, Star, Trophy, Rocket, Sparkles } from 'lucide-react';

const ProfileSection = ({ results, riasecNames, riasecColors, traitNames, traitColors }) => {
    const { riasec, aptitude, bigFive, workValues } = results;

    return (
        <div className="space-y-10">
            <div className="grid grid-cols-3 gap-6">
                {riasec?.topThree?.slice(0, 3).map((code, idx) => (
                    <div key={code} className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg" style={{ backgroundColor: riasecColors[code] }}>{code}</div>
                            <p className="font-bold text-gray-800 text-xl">{riasecNames[code]}</p>
                            <p className="text-sm text-gray-500 mt-1">#{idx + 1} Interest</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-8">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-[1px]">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 h-full">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Compass className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Interest Profile</h3>
                                <p className="text-xs text-gray-500">RIASEC Assessment</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {riasec?.topThree?.map((code) => {
                                const score = riasec.scores?.[code] || 0;
                                const pct = Math.round((score / 25) * 100);
                                return (
                                    <div key={code}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md" style={{ backgroundColor: riasecColors[code] }}>{code}</div>
                                                <span className="font-semibold text-gray-700">{riasecNames[code]}</span>
                                            </div>
                                            <span className="text-sm font-bold" style={{ color: riasecColors[code] }}>{pct}%</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: riasecColors[code] }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-[1px]">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 h-full">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                <Zap className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-xl">Cognitive Abilities</h3>
                                <p className="text-sm text-gray-500">Multi-Aptitude Battery</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {aptitude?.scores ? Object.entries(aptitude.scores).map(([domain, data]) => {
                                const configs = { verbal: { n: 'Verbal', i: '📝', c: '#3b82f6' }, numerical: { n: 'Numerical', i: '🔢', c: '#10b981' }, abstract: { n: 'Abstract', i: '🧩', c: '#8b5cf6' }, spatial: { n: 'Spatial', i: '📐', c: '#f59e0b' }, clerical: { n: 'Clerical', i: '⚡', c: '#ec4899' } };
                                const cfg = configs[domain] || { n: domain, i: '📊', c: '#6b7280' };
                                return (
                                    <div key={domain} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-lg">{cfg.i}</div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-medium text-gray-700">{cfg.n}</span>
                                                <span className="text-xs font-bold" style={{ color: cfg.c }}>{data.correct}/{data.total}</span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${data.percentage || 0}%`, backgroundColor: cfg.c }} />
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-600 w-12 text-right">{data.percentage || 0}%</span>
                                    </div>
                                );
                            }) : <p className="text-gray-500 italic text-center py-4">No aptitude data</p>}
                        </div>
                        {aptitude?.topStrengths && (
                            <div className="mt-6 flex flex-wrap gap-2">
                                {aptitude.topStrengths.map((s, i) => <span key={i} className="px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 rounded-full text-xs font-semibold">⭐ {s}</span>)}
                            </div>
                        )}
                    </div>
                </div>
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 p-[1px]">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 h-full">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Heart className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-xl">Personality Traits</h3>
                                <p className="text-sm text-gray-500">Big Five Model</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-5 gap-4 mb-8">
                            {['O', 'C', 'E', 'A', 'N'].map(t => {
                                const sc = bigFive?.[t] || 0;
                                const p = (sc / 5) * 100;
                                return (
                                    <div key={t} className="text-center">
                                        <div className="relative w-full aspect-square mb-2">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                <circle cx="18" cy="18" r="15" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                                                <circle cx="18" cy="18" r="15" fill="none" stroke={traitColors[t]} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${p * 0.94} 100`} />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-xs font-bold" style={{ color: traitColors[t] }}>{sc.toFixed(1)}</span>
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-semibold text-gray-600">{traitNames[t]}</p>
                                    </div>
                                );
                            })}
                        </div>
                        {bigFive?.workStyleSummary && <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl"><p className="text-sm text-gray-700">{bigFive.workStyleSummary}</p></div>}
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 p-[1px]">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 h-full">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <Star className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-xl">Work Values</h3>
                                <p className="text-sm text-gray-500">What Motivates You</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {workValues?.topThree?.map((val, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-2xl border border-emerald-100 hover:shadow-md transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                                        <Trophy className="w-5 h-5" />
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
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_50%,white_0%,transparent_50%)]" />
                <div className="relative flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Rocket className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-yellow-300" />
                            <h4 className="font-bold text-white text-lg">Your Career Direction</h4>
                        </div>
                        <p className="text-white/95 text-lg leading-relaxed">{results.overallSummary}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSection;
