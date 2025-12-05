import { CheckCircle, TrendingUp, Briefcase, Target, Award } from 'lucide-react';
import { Badge } from '../../../../../components/Students/components/ui/badge';
import ProgressRing from '../ProgressRing';

const CareerSection = ({ careerFit }) => {
    const clusterStyles = [
        { gradient: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200', text: 'text-emerald-600', ring: '#10b981' },
        { gradient: 'from-blue-500 to-indigo-600', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200', text: 'text-blue-600', ring: '#3b82f6' },
        { gradient: 'from-amber-500 to-orange-600', bg: 'from-amber-50 to-orange-50', border: 'border-amber-200', text: 'text-amber-600', ring: '#f59e0b' },
        { gradient: 'from-purple-500 to-pink-600', bg: 'from-purple-50 to-pink-50', border: 'border-purple-200', text: 'text-purple-600', ring: '#8b5cf6' },
        { gradient: 'from-rose-500 to-red-600', bg: 'from-rose-50 to-red-50', border: 'border-rose-200', text: 'text-rose-600', ring: '#f43f5e' }
    ];

    return (
        <div className="space-y-8">
            {/* Career Clusters */}
            <div className="space-y-6">
                {careerFit.clusters.map((cluster, idx) => {
                    const style = clusterStyles[idx % 5];
                    return (
                        <div key={idx} className="relative group">
                            <div className={`absolute inset-0 bg-gradient-to-r ${style.gradient} rounded-3xl blur-xl opacity-10 group-hover:opacity-20 transition-opacity`} />
                            <div className={`relative bg-gradient-to-br ${style.bg} rounded-3xl p-6 border ${style.border} overflow-hidden`}>
                                {/* Decorative elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full translate-y-1/2 -translate-x-1/2" />
                                
                                <div className="relative">
                                    {/* Header */}
                                    <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{cluster.title}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/80 ${style.text}`}>
                                                        {cluster.fit} Fit
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <ProgressRing value={cluster.matchScore} size={80} strokeWidth={8} color={style.ring} />
                                            <span className="text-xs font-medium text-gray-500 mt-1">Match Score</span>
                                        </div>
                                    </div>

                                    {/* Evidence Section */}
                                    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 mb-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <CheckCircle className={`w-5 h-5 ${style.text}`} />
                                            <h4 className="font-semibold text-gray-800">Why This Fits You</h4>
                                        </div>
                                        {cluster.evidence ? (
                                            <div className="grid md:grid-cols-3 gap-4">
                                                {[
                                                    { label: 'Interest Match', value: cluster.evidence.interest, icon: Target },
                                                    { label: 'Aptitude Match', value: cluster.evidence.aptitude, icon: TrendingUp },
                                                    { label: 'Personality Match', value: cluster.evidence.personality, icon: Briefcase }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-start gap-3 p-3 bg-white/60 rounded-xl">
                                                        <item.icon className={`w-4 h-4 ${style.text} mt-0.5 shrink-0`} />
                                                        <div>
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{item.label}</p>
                                                            <p className="text-sm text-gray-700 mt-1">{item.value}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-700">{cluster.reason}</p>
                                        )}
                                    </div>

                                    {/* Roles & Domains */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Career Progression</h5>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-16 text-xs font-medium text-gray-500">Entry</span>
                                                    <div className="flex-1 flex flex-wrap gap-1.5">
                                                        {cluster.roles?.entry?.length > 0 ? cluster.roles.entry.map((r, i) => (
                                                            <span key={i} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-medium">{r}</span>
                                                        )) : <span className="text-gray-400 text-xs italic">Not specified</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-16 text-xs font-medium text-gray-500">Mid</span>
                                                    <div className="flex-1 flex flex-wrap gap-1.5">
                                                        {cluster.roles?.mid?.length > 0 ? cluster.roles.mid.map((r, i) => (
                                                            <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">{r}</span>
                                                        )) : <span className="text-gray-400 text-xs italic">Not specified</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Related Domains</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {cluster.domains?.length > 0 ? cluster.domains.map((d, i) => (
                                                    <Badge key={i} className={`bg-gradient-to-r ${style.bg} ${style.text} border ${style.border}`}>{d}</Badge>
                                                )) : <span className="text-gray-400 text-xs italic">Not specified</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Specific Career Options */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 p-8">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top_right,#4f46e5_0%,transparent_50%)]" />
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_bottom_left,#10b981_0%,transparent_50%)]" />
                
                <div className="relative">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                            <Award className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Career Options Ranked</h3>
                            <p className="text-sm text-gray-400">Based on your assessment results</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* High Fit */}
                        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl p-5 border border-emerald-500/30">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                                <h4 className="font-bold text-emerald-400">High Fit</h4>
                            </div>
                            <div className="space-y-2">
                                {careerFit.specificOptions.highFit.map((role, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                        <span className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">{idx + 1}</span>
                                        <span className="text-white font-medium text-sm">{role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Medium Fit */}
                        <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-sm rounded-2xl p-5 border border-blue-500/30">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-blue-400" />
                                <h4 className="font-bold text-blue-400">Medium Fit</h4>
                            </div>
                            <div className="space-y-2">
                                {careerFit.specificOptions.mediumFit.map((role, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                        <span className="w-7 h-7 rounded-lg bg-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">{idx + 1}</span>
                                        <span className="text-gray-300 font-medium text-sm">{role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Explore Later */}
                        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-5 border border-amber-500/30">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-amber-400" />
                                <h4 className="font-bold text-amber-400">Explore Later</h4>
                            </div>
                            <div className="space-y-2">
                                {careerFit.specificOptions.exploreLater.map((role, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                        <span className="w-7 h-7 rounded-lg bg-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">{idx + 1}</span>
                                        <span className="text-gray-400 font-medium text-sm">{role}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CareerSection;
