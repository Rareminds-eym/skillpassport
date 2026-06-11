/**
 * Team Analytics Component
 * Comprehensive analytics dashboard for recruitment team performance
 */

import { useMemo } from 'react';
import {
    UsersIcon,
    CheckCircleIcon,
    ClockIcon,
    StarIcon,
    BriefcaseIcon,
    TrophyIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    UserGroupIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useRecruitmentMembers, useMemberStats } from '@/entities/recruitment/model/useRecruitmentMembers';
import { useRecruitmentInvitations } from '@/entities/recruitment/model/useRecruitmentInvitations';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    iconBg: string;
    trend?: number;
    trendLabel?: string;
    subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon: Icon,
    iconColor,
    iconBg,
    trend,
    trendLabel,
    subtitle,
}) => {
    const showTrend = trend !== undefined && trend !== 0;
    const isPositive = trend && trend > 0;

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                {showTrend && (
                    <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${isPositive
                                ? 'bg-green-50 text-green-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                    >
                        {isPositive ? (
                            <ArrowTrendingUpIcon className="h-3 w-3" />
                        ) : (
                            <ArrowTrendingDownIcon className="h-3 w-3" />
                        )}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
                {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
                {trendLabel && <p className="text-xs text-gray-500 mt-1">{trendLabel}</p>}
            </div>
        </div>
    );
};

interface RecruiterPerformanceRow {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    joinedAt: string;
    candidatesSourced?: number;
    candidatesHired?: number;
    avgTimeToHire?: number;
    qualityScore?: number;
}

export const TeamAnalytics: React.FC = () => {
    const { data: membersResult, isLoading: membersLoading } = useRecruitmentMembers();
    const { data: stats, isLoading: statsLoading } = useMemberStats();
    const { data: invitations } = useRecruitmentInvitations();

    const members = membersResult?.members || [];
    const pendingInvitations = invitations?.filter((inv) => inv.status === 'pending') || [];

    // Calculate team metrics
    const teamMetrics = useMemo(() => {
        const totalMembers = stats?.total || 0;
        const activeMembers = stats?.active || 0;
        const admins = stats?.admins || 0;
        const recruiters = stats?.recruiters || 0;
        const inactiveMembers = stats?.inactive || 0;

        // Mock performance data (in production, this would come from actual recruitment data)
        const totalCandidatesSourced = members.reduce((sum, member) => {
            // Mock: Each active recruiter sources 10-50 candidates
            return sum + (member.isActive ? Math.floor(Math.random() * 40) + 10 : 0);
        }, 0);

        const totalCandidatesHired = members.reduce((sum, member) => {
            // Mock: Each active recruiter hires 2-8 candidates
            return sum + (member.isActive ? Math.floor(Math.random() * 6) + 2 : 0);
        }, 0);

        const avgTimeToHire = activeMembers > 0 ? Math.floor(Math.random() * 15) + 15 : 0; // 15-30 days
        const avgQualityScore = activeMembers > 0 ? (Math.random() * 15 + 75).toFixed(1) : '0'; // 75-90

        return {
            totalMembers,
            activeMembers,
            admins,
            recruiters,
            inactiveMembers,
            pendingInvitations: pendingInvitations.length,
            totalCandidatesSourced,
            totalCandidatesHired,
            avgTimeToHire,
            avgQualityScore,
            successRate:
                totalCandidatesSourced > 0
                    ? ((totalCandidatesHired / totalCandidatesSourced) * 100).toFixed(1)
                    : '0',
        };
    }, [members, stats, pendingInvitations]);

    // Prepare recruiter performance data
    const recruiterPerformance: RecruiterPerformanceRow[] = useMemo(() => {
        return members
            .filter((member) => member.role === 'recruiter' && member.isActive)
            .map((member) => ({
                id: member.userId,
                name: `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unknown',
                email: member.email,
                role: member.role,
                status: member.isActive ? 'Active' : 'Inactive',
                joinedAt: member.joinedAt,
                // Mock performance metrics
                candidatesSourced: Math.floor(Math.random() * 40) + 10,
                candidatesHired: Math.floor(Math.random() * 6) + 2,
                avgTimeToHire: Math.floor(Math.random() * 15) + 15,
                qualityScore: parseFloat((Math.random() * 15 + 75).toFixed(1)),
            }))
            .sort((a, b) => (b.candidatesHired || 0) - (a.candidatesHired || 0)); // Sort by hires
    }, [members]);

    // Calculate top performers
    const topPerformers = useMemo(() => {
        return recruiterPerformance.slice(0, 3);
    }, [recruiterPerformance]);

    if (membersLoading || statsLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">Loading team analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Overview Stats */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Team Members"
                        value={teamMetrics.totalMembers}
                        icon={UserGroupIcon}
                        iconColor="text-blue-600"
                        iconBg="bg-blue-50"
                        subtitle={`${teamMetrics.activeMembers} active, ${teamMetrics.inactiveMembers} inactive`}
                    />
                    <StatCard
                        title="Active Recruiters"
                        value={teamMetrics.recruiters}
                        icon={UsersIcon}
                        iconColor="text-green-600"
                        iconBg="bg-green-50"
                        subtitle={`${teamMetrics.admins} admin${teamMetrics.admins !== 1 ? 's' : ''}`}
                    />
                    <StatCard
                        title="Pending Invitations"
                        value={teamMetrics.pendingInvitations}
                        icon={ClockIcon}
                        iconColor="text-yellow-600"
                        iconBg="bg-yellow-50"
                        subtitle="Awaiting acceptance"
                    />
                    <StatCard
                        title="Candidates Sourced"
                        value={teamMetrics.totalCandidatesSourced}
                        icon={BriefcaseIcon}
                        iconColor="text-purple-600"
                        iconBg="bg-purple-50"
                        subtitle="Total pipeline"
                    />
                </div>
            </div>

            {/* Performance Metrics */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Hires"
                        value={teamMetrics.totalCandidatesHired}
                        icon={CheckCircleIcon}
                        iconColor="text-green-600"
                        iconBg="bg-green-50"
                        subtitle="Successful placements"
                    />
                    <StatCard
                        title="Success Rate"
                        value={`${teamMetrics.successRate}%`}
                        icon={TrophyIcon}
                        iconColor="text-amber-600"
                        iconBg="bg-amber-50"
                        subtitle="Hire to source ratio"
                    />
                    <StatCard
                        title="Avg Time to Hire"
                        value={`${teamMetrics.avgTimeToHire} days`}
                        icon={ClockIcon}
                        iconColor="text-indigo-600"
                        iconBg="bg-indigo-50"
                        subtitle="Across all hires"
                    />
                    <StatCard
                        title="Avg Quality Score"
                        value={teamMetrics.avgQualityScore}
                        icon={StarIcon}
                        iconColor="text-yellow-600"
                        iconBg="bg-yellow-50"
                        subtitle="Of hired candidates"
                    />
                </div>
            </div>

            {/* Top Performers */}
            {topPerformers.length > 0 && (
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Top Performers
                    </h2>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                            {topPerformers.map((performer, index) => (
                                <div key={performer.id} className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${index === 0
                                                    ? 'bg-yellow-500'
                                                    : index === 1
                                                        ? 'bg-gray-400'
                                                        : 'bg-amber-600'
                                                }`}
                                        >
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 truncate">
                                                {performer.name}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {performer.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Hires</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {performer.candidatesHired}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Quality</p>
                                            <p className="text-lg font-bold text-gray-900">
                                                {performer.qualityScore}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Recruiter Performance Table */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Individual Performance
                </h2>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {recruiterPerformance.length === 0 ? (
                        <div className="p-8 text-center">
                            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium">No Active Recruiters</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Invite team members to start tracking performance
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Recruiter
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Sourced
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Hired
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Success Rate
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Avg Time
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Quality
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {recruiterPerformance.map((recruiter) => {
                                        const successRate =
                                            recruiter.candidatesSourced && recruiter.candidatesSourced > 0
                                                ? (
                                                    ((recruiter.candidatesHired || 0) /
                                                        recruiter.candidatesSourced) *
                                                    100
                                                ).toFixed(1)
                                                : '0';

                                        return (
                                            <tr key={recruiter.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {recruiter.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {recruiter.email}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {recruiter.candidatesSourced}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm font-medium text-green-600">
                                                        {recruiter.candidatesHired}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{
                                                                    width: `${Math.min(parseFloat(successRate), 100)}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <span className="text-xs font-medium text-gray-700 w-10">
                                                            {successRate}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm text-gray-700">
                                                        {recruiter.avgTimeToHire} days
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <StarIcon className="h-4 w-4 text-yellow-500" />
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {recruiter.qualityScore}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Key Insights */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">💡 Key Insights</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                    {teamMetrics.activeMembers === 0 && (
                        <li>• Start by inviting team members to join your recruitment organization</li>
                    )}
                    {teamMetrics.activeMembers > 0 && teamMetrics.activeMembers < 3 && (
                        <li>• Consider adding more recruiters to scale your hiring efforts</li>
                    )}
                    {teamMetrics.pendingInvitations > 0 && (
                        <li>
                            • You have {teamMetrics.pendingInvitations} pending invitation
                            {teamMetrics.pendingInvitations !== 1 ? 's' : ''} - follow up with invited members
                        </li>
                    )}
                    {parseFloat(teamMetrics.successRate) > 15 && (
                        <li>• Your team has a strong success rate of {teamMetrics.successRate}%</li>
                    )}
                    {teamMetrics.avgTimeToHire < 20 && teamMetrics.totalCandidatesHired > 0 && (
                        <li>• Excellent hiring speed with average time of {teamMetrics.avgTimeToHire} days</li>
                    )}
                    {topPerformers.length > 0 && (
                        <li>
                            • {topPerformers[0].name} is your top performer with{' '}
                            {topPerformers[0].candidatesHired} successful hires
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};
