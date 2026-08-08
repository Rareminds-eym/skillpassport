import React from 'react';
import { Briefcase, MapPin, Calendar, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/shared/ui';
import { OpportunitiesWidgetProps, AIMatchedJob, Opportunity } from '../model/types';

/**
 * OpportunitiesWidget - Displays top 3 job/internship opportunities with AI matching
 * 
 * Refactored from OpportunitiesCard.tsx to:
 * - Limit display to top 3 opportunities only
 * - Show AI match scores with reasons
 * - Display skills matched and skills gap
 * - Add Apply button per opportunity
 * - Add View All Opportunities button
 * - Handle empty state
 * - Sort by match score descending
 * - Update styling with gradient theme
 * 
 * @requirements 7.1-7.9, 11.1-11.10
 */
export const OpportunitiesWidget: React.FC<OpportunitiesWidgetProps> = ({
    opportunities,
    matchedJobs = [],
    onViewAll,
    onApply,
}) => {
    // Merge matched jobs (AI-recommended) with regular opportunities
    const allOpportunities = React.useMemo(() => {
        // Start with matched jobs (already sorted by score descending)
        const merged: (AIMatchedJob | Opportunity)[] = [...matchedJobs];

        // Add non-matched opportunities
        const matchedIds = new Set(matchedJobs.map(job => job.id));
        const nonMatched = opportunities.filter(opp => !matchedIds.has(opp.id));
        merged.push(...nonMatched);

        // Sort by match score descending (AI jobs first), limit to top 3
        return merged
            .sort((a, b) => {
                const scoreA = 'matchScore' in a ? a.matchScore : 0;
                const scoreB = 'matchScore' in b ? b.matchScore : 0;
                return scoreB - scoreA;
            })
            .slice(0, 3);
    }, [opportunities, matchedJobs]);

    // Helper to check if opportunity is AI-matched
    const isAIMatched = (opp: Opportunity | AIMatchedJob): opp is AIMatchedJob => {
        return 'isAIRecommended' in opp && opp.isAIRecommended === true;
    };

    // Format posted date (e.g., "2 days ago")
    const formatPostedDate = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return new Date(date).toLocaleDateString();
    };

    // Render individual opportunity card
    const renderOpportunityCard = (opp: Opportunity | AIMatchedJob) => {
        const isAI = isAIMatched(opp);
        const isInternship = opp.employmentType === 'internship';

        return (
            <div
                key={opp.id}
                className="p-4 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200"
            >
                {/* Header: Title and Badges */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-1">{opp.title}</h4>
                        <p className="text-sm font-semibold text-gray-700">{opp.company}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {isAI && (
                            <Badge className="text-xs !bg-gradient-to-r !from-purple-500 !to-blue-500 !text-white font-semibold shadow-md">
                                <Sparkles className="w-3 h-3 mr-1 inline" />
                                {Math.round(opp.matchScore)}% Match
                            </Badge>
                        )}
                        <Badge className={`text-xs ${isInternship
                                ? '!bg-green-100 !text-green-700'
                                : opp.employmentType === 'contract'
                                    ? '!bg-yellow-100 !text-yellow-700'
                                    : '!bg-blue-100 !text-blue-700'
                            }`}>
                            {isInternship ? 'Internship' : opp.employmentType === 'contract' ? 'Contract' : 'Full-Time'}
                        </Badge>
                    </div>
                </div>

                {/* AI Recommendation Badge */}
                {isAI && (
                    <div className="flex items-center gap-1 mb-3 px-2 py-1 bg-purple-50 rounded-md border border-purple-200">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-xs text-purple-700 font-semibold">AI Recommended for you</span>
                    </div>
                )}

                {/* Location, Posted Date */}
                <div className="space-y-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{opp.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{formatPostedDate(opp.postedDate)}</span>
                    </div>
                </div>

                {/* AI Match Details: Skills Matched & Gap */}
                {isAI && (
                    <div className="mb-3 space-y-2">
                        {/* Match Reasons */}
                        {opp.matchReasons && opp.matchReasons.length > 0 && (
                            <div className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                <span className="font-semibold text-blue-700">Why it matches:</span>{' '}
                                {opp.matchReasons[0]}
                            </div>
                        )}

                        {/* Skills Matched */}
                        {opp.skillsMatched && opp.skillsMatched.length > 0 && (
                            <div className="flex items-start gap-2">
                                <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <span className="text-xs font-semibold text-green-700">Skills Matched:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {opp.skillsMatched.slice(0, 3).map((skill, idx) => (
                                            <span key={idx} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                                {skill}
                                            </span>
                                        ))}
                                        {opp.skillsMatched.length > 3 && (
                                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                                +{opp.skillsMatched.length - 3} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Skills Gap */}
                        {opp.skillsGap && opp.skillsGap.length > 0 && (
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                    <span className="text-xs font-semibold text-orange-700">Skills to Improve:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {opp.skillsGap.slice(0, 2).map((skill, idx) => (
                                            <span key={idx} className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                                                {skill}
                                            </span>
                                        ))}
                                        {opp.skillsGap.length > 2 && (
                                            <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                                                +{opp.skillsGap.length - 2} more
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Apply Button */}
                <div className="pt-3 border-t border-gray-200">
                    <Button
                        onClick={() => onApply?.(opp.id)}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-md"
                        size="sm"
                    >
                        Apply Now
                    </Button>
                </div>
            </div>
        );
    };

    // Empty state
    if (allOpportunities.length === 0) {
        return (
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Briefcase className="w-6 h-6 text-blue-600" />
                        Opportunities for You
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg font-medium">No opportunities found</p>
                        <p className="text-gray-400 text-sm mt-2">Check back later for new opportunities</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-md hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                    Opportunities for You
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                    Top {allOpportunities.length} opportunities matched to your skills
                </p>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-4">
                    {allOpportunities.map(renderOpportunityCard)}
                </div>

                {/* View All Button */}
                {(opportunities.length > 3 || matchedJobs.length > 3) && (
                    <div className="text-center pt-4 mt-4 border-t border-gray-200">
                        <Button
                            onClick={onViewAll}
                            variant="outline"
                            size="md"
                            className="font-semibold text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                        >
                            View All Opportunities ({opportunities.length + matchedJobs.length})
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default OpportunitiesWidget;
