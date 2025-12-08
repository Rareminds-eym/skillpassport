import { CheckCircle, TrendingUp, Briefcase, Target, Award } from 'lucide-react';
import ProgressRing from '../ProgressRing';

// Helper function to get color based on match score (red < 40, yellow 40-70, green > 70)
const getMatchColor = (score) => {
    if (score >= 70) return { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100', border: 'border-green-200', ring: '#22c55e' };
    if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-600', light: 'bg-yellow-100', border: 'border-yellow-200', ring: '#eab308' };
    return { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100', border: 'border-red-200', ring: '#ef4444' };
};

const CareerSection = ({ careerFit }) => {
    return (
        <div className="space-y-6">
            {/* Career Clusters */}
            <div className="space-y-4">
                {careerFit.clusters.map((cluster, idx) => {
                    const style = getMatchColor(cluster.matchScore || 0);
                    return (
                        <div key={idx} className={`bg-white rounded-xl p-6 border ${style.border} shadow-sm`}>
                            {/* Header */}
                            <div className="flex flex-wrap justify-between items-start gap-4 mb-5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-14 h-14 rounded-lg ${style.bg} flex items-center justify-center text-white font-bold text-2xl`}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">{cluster.title}</h3>
                                        <span className={`px-2 py-1 rounded text-sm font-semibold ${style.light} ${style.text}`}>
                                            {cluster.fit} Fit
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center">
                                    <ProgressRing value={cluster.matchScore} size={80} strokeWidth={6} color={style.ring} />
                                    <span className="text-sm text-gray-500 mt-1">Match</span>
                                </div>
                            </div>

                            {/* Evidence Section */}
                            <div className="bg-gray-50 rounded-lg p-5 mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle className={`w-5 h-5 ${style.text}`} />
                                    <h4 className="font-semibold text-gray-800 text-base">Why This Fits You</h4>
                                </div>
                                {cluster.evidence ? (
                                    <div className="grid md:grid-cols-3 gap-3">
                                        {[
                                            { label: 'Interest', value: cluster.evidence.interest, icon: Target },
                                            { label: 'Aptitude', value: cluster.evidence.aptitude, icon: TrendingUp },
                                            { label: 'Personality', value: cluster.evidence.personality, icon: Briefcase }
                                        ].map((item, i) => (
                                            <div key={i} className="bg-white p-4 rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <item.icon className="w-4 h-4 text-indigo-500" />
                                                    <p className="text-sm font-semibold text-gray-500 uppercase">{item.label}</p>
                                                </div>
                                                <p className="text-base text-gray-700">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-700 text-base">{cluster.reason}</p>
                                )}
                            </div>

                            {/* Roles & Domains */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <h5 className="text-sm font-bold text-gray-500 uppercase mb-2">Career Progression</h5>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                            <span className="w-14 text-sm font-medium text-gray-500 pt-1">Entry</span>
                                            <div className="flex-1 flex flex-wrap gap-1">
                                                {cluster.roles?.entry?.length > 0 ? cluster.roles.entry.map((r, i) => (
                                                    <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">{r}</span>
                                                )) : <span className="text-gray-400 text-sm">Not specified</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="w-14 text-sm font-medium text-gray-500 pt-1">Mid</span>
                                            <div className="flex-1 flex flex-wrap gap-1">
                                                {cluster.roles?.mid?.length > 0 ? cluster.roles.mid.map((r, i) => (
                                                    <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm">{r}</span>
                                                )) : <span className="text-gray-400 text-sm">Not specified</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h5 className="text-sm font-bold text-gray-500 uppercase mb-2">Related Domains</h5>
                                    <div className="flex flex-wrap gap-1">
                                        {cluster.domains?.length > 0 ? cluster.domains.map((d, i) => (
                                            <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">{d}</span>
                                        )) : <span className="text-gray-400 text-sm">Not specified</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Specific Career Options */}
            <div className="bg-slate-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-2xl">Career Options Ranked</h3>
                        <p className="text-base text-gray-400">Based on your assessment</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    {/* High Fit */}
                    <div className="bg-green-500/10 rounded-lg p-5 border border-green-500/30">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                            <h4 className="font-bold text-green-400 text-base">High Fit</h4>
                        </div>
                        <div className="space-y-2">
                            {careerFit.specificOptions.highFit.map((role, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-3 bg-white/5 rounded">
                                    <span className="w-6 h-6 rounded bg-green-500/30 flex items-center justify-center text-green-400 font-bold text-sm">{idx + 1}</span>
                                    <span className="text-white text-base">{role}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Medium Fit */}
                    <div className="bg-yellow-500/10 rounded-lg p-5 border border-yellow-500/30">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <h4 className="font-bold text-yellow-400 text-base">Medium Fit</h4>
                        </div>
                        <div className="space-y-2">
                            {careerFit.specificOptions.mediumFit.map((role, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-3 bg-white/5 rounded">
                                    <span className="w-6 h-6 rounded bg-yellow-500/30 flex items-center justify-center text-yellow-400 font-bold text-sm">{idx + 1}</span>
                                    <span className="text-gray-300 text-base">{role}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Explore Later */}
                    <div className="bg-red-500/10 rounded-lg p-5 border border-red-500/30">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <h4 className="font-bold text-red-400 text-base">Explore Later</h4>
                        </div>
                        <div className="space-y-2">
                            {careerFit.specificOptions.exploreLater.map((role, idx) => (
                                <div key={idx} className="flex items-center gap-2 p-3 bg-white/5 rounded">
                                    <span className="w-6 h-6 rounded bg-red-500/30 flex items-center justify-center text-red-400 font-bold text-sm">{idx + 1}</span>
                                    <span className="text-gray-400 text-base">{role}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CareerSection;
