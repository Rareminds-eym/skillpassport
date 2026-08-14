/**
 * SkillsSnapshotSection Component
 * 
 * Displays top 5 skills with progress bars
 */

import { SparklesIcon } from "@heroicons/react/24/outline";
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui';
import { useCollegeDashboard } from '@/features/learner-profile/model/useCollegeDashboard';

interface SkillData {
    name: string;
    percentage: number;
    color: string;
}

const SkillsSnapshotSection = () => {
    const { skills, skillsLoading } = useCollegeDashboard();

    // Default top skills - replace with real data
    const defaultSkills: SkillData[] = [
        { name: 'Problem Solving', percentage: 92, color: 'bg-blue-500' },
        { name: 'Communication', percentage: 88, color: 'bg-cyan-500' },
        { name: 'Technical Skills', percentage: 74, color: 'bg-teal-500' },
        { name: 'Teamwork', percentage: 55, color: 'bg-blue-400' },
        { name: 'Critical Thinking', percentage: 63, color: 'bg-cyan-400' }
    ];

    // TODO: Map real skills data when available
    const topSkills = defaultSkills;

    if (skillsLoading) {
        return (
            <Card className="h-full bg-white rounded-xl border border-gray-200 shadow-sm">
                <CardHeader className="px-6 py-5 bg-white border-b border-gray-100">
                    <CardTitle className="flex items-center gap-3 m-0 p-0">
                        <div className="p-2 rounded-lg bg-blue-500">
                            <SparklesIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <div className="text-base font-bold text-gray-900">Skills Snapshot</div>
                            <div className="text-xs text-gray-500 font-normal">Top 5 Skills</div>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4 animate-pulse">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i}>
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-2 bg-gray-200 rounded-full"></div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm">
            <CardHeader className="px-6 py-5 bg-white border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 m-0 p-0">
                    <div className="p-2 rounded-lg bg-blue-500">
                        <SparklesIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="text-base font-bold text-gray-900">Skills Snapshot</div>
                        <div className="text-xs text-gray-500 font-normal">Top 5 Skills</div>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
                <div className="space-y-5">
                    {topSkills.map((skill, index) => (
                        <div key={index}>
                            {/* Skill Name and Percentage */}
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-900">
                                    {skill.name}
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                    {skill.percentage}%
                                </span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className={`h-full ${skill.color} rounded-full transition-all duration-500`}
                                    style={{ width: `${skill.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default SkillsSnapshotSection;
