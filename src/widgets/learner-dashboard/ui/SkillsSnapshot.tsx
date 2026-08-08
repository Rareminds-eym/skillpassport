import React from 'react';
import { motion } from 'framer-motion';
import { Target, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { Badge } from '@/shared/ui/Badge';
import type { SkillsSnapshotProps, SkillMetric } from '../model/types';

/**
 * SkillsSnapshot Widget
 * 
 * Detailed breakdown of skill proficiency displaying:
 * - Top 5 key skills sorted by proficiency descending
 * - Visual progress bar for each skill's proficiency level
 * - Color coding: green (>80%), yellow (60-80%), red (<60%)
 * - Skill categories (problem-solving, communication, technical, teamwork, critical-thinking)
 * - Trend indicators (up, down, stable) if available
 * - "Improve Skill" action with onImproveSkill callback
 * - "View All Skills" button with onViewAll callback
 * 
 * Requirements: 8.1-8.8
 * - Display at least 5 key skills with proficiency percentages (8.1)
 * - Show visual progress bar for each skill's proficiency level (8.2)
 * - Green color indicator for proficiency > 80% (8.3)
 * - Yellow color indicator for proficiency 60-80% (8.4)
 * - Red color indicator for proficiency < 60% (8.5)
 * - Categorize skills (problem-solving, communication, technical, teamwork, critical-thinking) (8.6)
 * - Navigate to skill improvement resources when skill clicked (8.7)
 * - Navigate to complete skills page with "View All Skills" (8.8)
 * 
 * @param skills - Array of skill metrics with proficiency, category, and trend data
 * @param onViewAll - Callback when "View All Skills" button is clicked
 * @param onImproveSkill - Callback when "Improve Skill" button is clicked for a specific skill
 */
const SkillsSnapshot: React.FC<SkillsSnapshotProps> = ({
    skills,
    onViewAll,
    onImproveSkill,
}) => {
    // Sort skills by proficiency descending and take top 5
    const topSkills = React.useMemo(() => {
        return [...skills]
            .sort((a, b) => b.proficiency - a.proficiency)
            .slice(0, 5);
    }, [skills]);

    /**
     * Get color based on proficiency level
     * Requirements 8.3, 8.4, 8.5
     * - Green (>80%): High proficiency
     * - Yellow (60-80%): Moderate proficiency
     * - Red (<60%): Low proficiency, needs improvement
     */
    const getProficiencyColor = (proficiency: number): string => {
        if (proficiency > 80) return 'green';
        if (proficiency >= 60) return 'yellow';
        return 'red';
    };

    /**
     * Get color hex value for UI styling
     */
    const getColorHex = (proficiency: number): string => {
        if (proficiency > 80) return '#10b981'; // green-500
        if (proficiency >= 60) return '#f59e0b'; // amber-500
        return '#ef4444'; // red-500
    };

    /**
     * Get background color class based on proficiency
     */
    const getBgColorClass = (proficiency: number): string => {
        if (proficiency > 80) return 'bg-green-50 border-green-200';
        if (proficiency >= 60) return 'bg-amber-50 border-amber-200';
        return 'bg-red-50 border-red-200';
    };

    /**
     * Render trend indicator icon based on trend data
     */
    const renderTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
        if (!trend) return null;

        switch (trend) {
            case 'up':
                return (
                    <TrendingUp
                        className="w-4 h-4 text-green-600"
                        aria-label="Skill proficiency increasing"
                    />
                );
            case 'down':
                return (
                    <TrendingDown
                        className="w-4 h-4 text-red-600"
                        aria-label="Skill proficiency decreasing"
                    />
                );
            case 'stable':
                return (
                    <Minus
                        className="w-4 h-4 text-gray-600"
                        aria-label="Skill proficiency stable"
                    />
                );
            default:
                return null;
        }
    };

    /**
     * Format category name for display
     */
    const formatCategoryName = (category: string): string => {
        return category
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    /**
     * Get category badge color
     */
    const getCategoryColor = (category: SkillMetric['category']): string => {
        const colorMap = {
            'problem-solving': 'bg-purple-100 text-purple-700 border-purple-300',
            'communication': 'bg-blue-100 text-blue-700 border-blue-300',
            'technical': 'bg-indigo-100 text-indigo-700 border-indigo-300',
            'teamwork': 'bg-pink-100 text-pink-700 border-pink-300',
            'critical-thinking': 'bg-cyan-100 text-cyan-700 border-cyan-300',
        };
        return colorMap[category] || 'bg-gray-100 text-gray-700 border-gray-300';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-2 border-teal-200 shadow-lg overflow-hidden bg-gradient-to-br from-teal-50 via-white to-cyan-50">
                {/* Decorative top border */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />

                <CardHeader className="px-6 py-5 bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-100">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3 m-0 p-0">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
                                <Target className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-gray-900">
                                    Skills Snapshot
                                </span>
                                <p className="text-sm text-gray-600 mt-0.5 font-medium">
                                    Your top skills proficiency breakdown
                                </p>
                            </div>
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {/* Skills List */}
                    {topSkills.length > 0 ? (
                        <div className="space-y-5 mb-6">
                            {topSkills.map((skill, index) => (
                                <motion.div
                                    key={skill.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                    className={`p-4 rounded-xl border-2 shadow-sm ${getBgColorClass(skill.proficiency)}`}
                                >
                                    {/* Skill Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-bold text-gray-900 text-base">
                                                    {skill.name}
                                                </h3>
                                                {renderTrendIcon(skill.trend)}
                                            </div>

                                            {/* Category Badge */}
                                            <Badge
                                                className={`text-xs font-semibold px-2 py-1 border ${getCategoryColor(skill.category)}`}
                                            >
                                                {formatCategoryName(skill.category)}
                                            </Badge>
                                        </div>

                                        {/* Proficiency Percentage */}
                                        <div className="text-right ml-4">
                                            <span
                                                className="text-2xl font-bold"
                                                style={{ color: getColorHex(skill.proficiency) }}
                                            >
                                                {skill.proficiency}%
                                            </span>
                                            {skill.lastAssessed && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Last assessed: {new Date(skill.lastAssessed).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-3">
                                        <ProgressBar
                                            value={skill.proficiency}
                                            color={getProficiencyColor(skill.proficiency) as 'green' | 'yellow' | 'red'}
                                            height={10}
                                            showPercentage={false}
                                        />
                                    </div>

                                    {/* Improve Skill Button */}
                                    {onImproveSkill && (
                                        <button
                                            onClick={() => onImproveSkill(skill.id)}
                                            className="w-full px-4 py-2 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-all duration-200 flex items-center justify-center gap-2 group text-sm"
                                            aria-label={`Improve ${skill.name} skill`}
                                        >
                                            <Target className="w-4 h-4" />
                                            <span>Improve Skill</span>
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        /* Empty State */
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center justify-center py-12 text-center"
                        >
                            <Target className="w-16 h-16 text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                No Skills Yet
                            </h3>
                            <p className="text-sm text-gray-500 mb-4 max-w-md">
                                Complete assessments and projects to build your skill profile and track your proficiency.
                            </p>
                        </motion.div>
                    )}

                    {/* View All Skills Button */}
                    {onViewAll && topSkills.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.6 }}
                        >
                            <button
                                onClick={onViewAll}
                                className="w-full px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
                                aria-label="View all skills"
                            >
                                <span>View All Skills</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                            </button>
                        </motion.div>
                    )}

                    {/* Skill Summary Stats (if skills exist) */}
                    {topSkills.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.7 }}
                            className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-lg"
                        >
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div>
                                    <p className="text-xs text-gray-600 font-medium">High Proficiency</p>
                                    <p className="text-lg font-bold text-green-600">
                                        {topSkills.filter(s => s.proficiency > 80).length}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 font-medium">Moderate</p>
                                    <p className="text-lg font-bold text-amber-600">
                                        {topSkills.filter(s => s.proficiency >= 60 && s.proficiency <= 80).length}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 font-medium">Needs Work</p>
                                    <p className="text-lg font-bold text-red-600">
                                        {topSkills.filter(s => s.proficiency < 60).length}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default SkillsSnapshot;
