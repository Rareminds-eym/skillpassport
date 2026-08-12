/**
 * SkillPassportCard Widget
 * 
 * Displays skill passport metrics, verification status, and skill health breakdown.
 * Shows verified skills count, skill score, certificates, verification badge,
 * and categorizes skills into healthy/upskill/critical with visual breakdown.
 * 
 * **Validates Requirements: 5.1-5.9, 10.1-10.7**
 * 
 * Task 9.1: Create SkillPassportCard component
 * Phase 3: Core Widgets
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import {
    Shield,
    Award,
    CheckCircle,
    Clock,
    AlertTriangle,
    Info,
    TrendingUp,
    ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { Badge } from '@/shared/ui/Badge';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { CircularProgress } from '@/shared/ui/CircularProgress';
import { Button } from '@/shared/ui/Button';
import { calculateSkillHealth } from '@/shared/lib/calculations/skillHealth';
import type { SkillPassportCardProps } from '../model/types';

/**
 * SkillPassportCard Component
 * 
 * **Performance Optimization**: Wrapped with React.memo to prevent unnecessary re-renders
 * 
 * @param props - SkillPassportCardProps containing passport data and callbacks
 * @returns Skill passport card with health breakdown and verification status
 */
export const SkillPassportCard: React.FC<SkillPassportCardProps> = React.memo(({
    passport,
    onUpskill,
    onViewDetails,
}) => {
    // Calculate skill health breakdown using shared utility
    const healthBreakdown = React.useMemo(() => {
        // ULTRA-DEFENSIVE: Ensure we always pass an array
        const skills = passport?.skills;

        // Validate it's actually an array, not just truthy
        const validSkills = Array.isArray(skills) ? skills : [];

        // Debug logging (can be removed later)
        if (skills && !Array.isArray(skills)) {
            console.warn('[SkillPassportCard] passport.skills is not an array:', typeof skills, skills);
        }

        return calculateSkillHealth(validSkills);
    }, [passport?.skills]);

    // Get verification badge configuration
    const getVerificationBadge = () => {
        const statusConfig = {
            active: {
                icon: CheckCircle,
                variant: 'success' as const,
                label: 'Active',
                color: 'text-green-600',
                bgColor: 'bg-green-50',
            },
            pending: {
                icon: Clock,
                variant: 'warning' as const,
                label: 'Pending',
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-50',
            },
            expired: {
                icon: AlertTriangle,
                variant: 'error' as const,
                label: 'Expired',
                color: 'text-red-600',
                bgColor: 'bg-red-50',
            },
            none: {
                icon: Info,
                variant: 'secondary' as const,
                label: 'Not Verified',
                color: 'text-gray-600',
                bgColor: 'bg-gray-50',
            },
        };

        return statusConfig[passport.verificationStatus];
    };

    const verificationBadge = getVerificationBadge();
    const VerificationIcon = verificationBadge.icon;

    // Format last verified date
    const formatDate = (date?: Date) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="relative overflow-hidden">
                {/* Gradient background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50 opacity-50" />

                <CardHeader className="relative pb-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 p-3">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Skill Passport</CardTitle>
                                <p className="mt-1 text-sm text-gray-600">
                                    Your verified skills and certifications
                                </p>
                            </div>
                        </div>

                        {/* Verification Status Badge */}
                        <div className="flex flex-col items-end gap-1">
                            <Badge variant={verificationBadge.variant} className="flex items-center gap-1">
                                <VerificationIcon className="h-3 w-3" />
                                {verificationBadge.label}
                            </Badge>
                            {passport.verificationStatus === 'active' && passport.lastVerified && (
                                <span className="text-xs text-gray-500">
                                    Verified {formatDate(passport.lastVerified)}
                                </span>
                            )}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="relative space-y-6">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Verified Skills */}
                        <motion.div
                            className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex items-center gap-2 text-gray-600">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs font-medium">Verified Skills</span>
                            </div>
                            <p className="mt-2 text-2xl font-bold text-gray-900">
                                {passport.verifiedSkills}
                            </p>
                        </motion.div>

                        {/* Skill Score */}
                        <motion.div
                            className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex items-center gap-2 text-gray-600">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-xs font-medium">Skill Score</span>
                            </div>
                            <p className="mt-2 text-2xl font-bold text-gray-900">
                                {passport.skillScore}
                                <span className="text-sm font-normal text-gray-500">/100</span>
                            </p>
                        </motion.div>

                        {/* Certificates */}
                        <motion.div
                            className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex items-center gap-2 text-gray-600">
                                <Award className="h-4 w-4" />
                                <span className="text-xs font-medium">Certificates</span>
                            </div>
                            <p className="mt-2 text-2xl font-bold text-gray-900">
                                {passport.certificates}
                            </p>
                        </motion.div>
                    </div>

                    {/* Skill Score Visual Indicator */}
                    <div className="flex items-center justify-center py-4">
                        <CircularProgress
                            value={passport.skillScore}
                            size={140}
                            color={
                                passport.skillScore > 75
                                    ? 'green'
                                    : passport.skillScore >= 50
                                        ? 'yellow'
                                        : 'red'
                            }
                            strokeWidth={10}
                            showPercentage
                        />
                    </div>

                    {/* Skill Health Breakdown */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-700">
                            Skill Health Breakdown
                        </h3>

                        {/* Healthy Skills */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-green-500" />
                                    <span className="font-medium text-gray-700">Healthy</span>
                                    <span className="text-xs text-gray-500">(&gt;75%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-900">
                                        {healthBreakdown.healthy.count} skills
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {healthBreakdown.healthy.percentage}%
                                    </span>
                                </div>
                            </div>
                            <ProgressBar
                                value={healthBreakdown.healthy.percentage}
                                color="green"
                                height={8}
                            />
                        </div>

                        {/* Upskill Skills */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                                    <span className="font-medium text-gray-700">Upskill</span>
                                    <span className="text-xs text-gray-500">(50-75%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-900">
                                        {healthBreakdown.upskill.count} skills
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {healthBreakdown.upskill.percentage}%
                                    </span>
                                </div>
                            </div>
                            <ProgressBar
                                value={healthBreakdown.upskill.percentage}
                                color="yellow"
                                height={8}
                            />
                        </div>

                        {/* Critical Skills */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-500" />
                                    <span className="font-medium text-gray-700">Critical</span>
                                    <span className="text-xs text-gray-500">(&lt;50%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-900">
                                        {healthBreakdown.critical.count} skills
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {healthBreakdown.critical.percentage}%
                                    </span>
                                </div>
                            </div>
                            <ProgressBar
                                value={healthBreakdown.critical.percentage}
                                color="red"
                                height={8}
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            onClick={onUpskill}
                            className="flex-1 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                            aria-label="Navigate to skill improvement resources"
                        >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Upskill Now
                        </Button>
                        <Button
                            onClick={onViewDetails}
                            variant="outline"
                            className="flex-1"
                            aria-label="Navigate to digital portfolio page"
                        >
                            View Details
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
});

SkillPassportCard.displayName = 'SkillPassportCard';

export default SkillPassportCard;
