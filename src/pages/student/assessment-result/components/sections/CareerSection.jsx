import { CheckCircle } from 'lucide-react';
import { Badge } from '../../../../../components/Students/components/ui/badge';
import ProgressRing from '../ProgressRing';

/**
 * Career Section Detail Component
 * Displays career fit results in the modal
 */
const CareerSection = ({ careerFit }) => {
    const gradients = [
        'from-emerald-500 to-teal-500',
        'from-blue-500 to-indigo-500',
        'from-amber-500 to-orange-500',
        'from-purple-500 to-pink-500',
        'from-rose-500 to-red-500'
    ];
    const bgColors = [
        'from-emerald-50 to-teal-50 border-emerald-200',
        'from-blue-50 to-indigo-50 border-blue-200',
        'from-amber-50 to-orange-50 border-amber-200',
        'from-purple-50 to-pink-50 border-purple-200',
        'from-rose-50 to-red-50 border-rose-200'
    ];

    return (
        <div className="space-y-6">
            {/* Career Clusters */}
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-6">Best-Fit Career Clusters</h3>
                <div className="space-y-6">
                    {careerFit.clusters.map((cluster, idx) => (
                        <div key={idx} className={`bg-gradient-to-br ${bgColors[idx % 5]} rounded-2xl p-6 border relative overflow-hidden`}>
                            <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${gradients[idx % 5]}`}></div>

                            <div className="pl-4">
                                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradients[idx % 5]} flex items-center justify-center text-white font-bold text-sm`}>
                                                {idx + 1}
                                            </span>
                                            <h4 className="text-xl font-bold text-gray-800">{cluster.title}</h4>
                                        </div>
                                        <p className="text-sm text-gray-500 ml-11">Fit Level: <span className="font-semibold">{cluster.fit}</span></p>
                                    </div>
                                    <ProgressRing value={cluster.matchScore} size={70} strokeWidth={6} color={idx === 0 ? '#10b981' : idx === 1 ? '#3b82f6' : '#f59e0b'} />
                                </div>

                                <div className="bg-white/60 rounded-xl p-4 mb-4">
                                    <h5 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                                        Why this fits you
                                    </h5>
                                    {cluster.evidence ? (
                                        <div className="space-y-2 text-sm">
                                            <div className="flex gap-2">
                                                <span className="font-semibold text-gray-600 min-w-[120px]">Interest:</span>
                                                <span className="text-gray-700">{cluster.evidence.interest}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="font-semibold text-gray-600 min-w-[120px]">Aptitude:</span>
                                                <span className="text-gray-700">{cluster.evidence.aptitude}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="font-semibold text-gray-600 min-w-[120px]">Personality:</span>
                                                <span className="text-gray-700">{cluster.evidence.personality}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-700 text-sm">{cluster.reason}</p>
                                    )}
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-white/60 rounded-xl p-4">
                                        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Typical Roles</h5>
                                        <div className="space-y-1 text-sm">
                                            <p>
                                                <span className="font-semibold text-gray-700">Entry:</span>{' '}
                                                <span className="text-gray-600">
                                                    {cluster.roles?.entry?.length > 0
                                                        ? cluster.roles.entry.join(', ')
                                                        : <span className="text-gray-400 italic">Not specified</span>}
                                                </span>
                                            </p>
                                            <p>
                                                <span className="font-semibold text-gray-700">Mid:</span>{' '}
                                                <span className="text-gray-600">
                                                    {cluster.roles?.mid?.length > 0
                                                        ? cluster.roles.mid.join(', ')
                                                        : <span className="text-gray-400 italic">Not specified</span>}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-white/60 rounded-xl p-4">
                                        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Related Domains</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {cluster.domains?.length > 0 ? (
                                                cluster.domains.map((domain, dIdx) => (
                                                    <Badge key={dIdx} variant="outline" className="bg-white text-gray-700 border-gray-300">{domain}</Badge>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 italic text-sm">Not specified</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Specific Career Options */}
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
                <h3 className="font-bold text-gray-800 text-lg mb-6">Specific Career Options (Ranked)</h3>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* High Fit */}
                    <div className="bg-white rounded-xl p-5 border-2 border-emerald-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <h4 className="font-bold text-emerald-700">High Fit</h4>
                        </div>
                        <ol className="space-y-2">
                            {careerFit.specificOptions.highFit.map((role, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm">
                                    <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">{idx + 1}</span>
                                    <span className="font-medium text-gray-800">{role}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Medium Fit */}
                    <div className="bg-white rounded-xl p-5 border-2 border-blue-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <h4 className="font-bold text-blue-700">Medium Fit</h4>
                        </div>
                        <ol className="space-y-2">
                            {careerFit.specificOptions.mediumFit.map((role, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">{idx + 1}</span>
                                    <span className="text-gray-700">{role}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Explore Later */}
                    <div className="bg-white rounded-xl p-5 border-2 border-amber-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <h4 className="font-bold text-amber-700">Explore Later</h4>
                        </div>
                        <ol className="space-y-2">
                            {careerFit.specificOptions.exploreLater.map((role, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm">
                                    <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-xs">{idx + 1}</span>
                                    <span className="text-gray-500">{role}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CareerSection;
