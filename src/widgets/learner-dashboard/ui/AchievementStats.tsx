import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Award, GraduationCap, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { StatCard } from '@/shared/ui/StatCard';
import type { AchievementStatsProps } from '../model/types';

/**
 * AchievementStats Widget
 * 
 * Extracted from AchievementsTimeline.jsx - simplified stat cards display
 * 
 * Displays key achievement metrics in a compact, dashboard-friendly format:
 * - Current learning streak with flame icon
 * - Total badges earned with best streak indicator
 * - Total certificates earned
 * 
 * Removes timeline visualization, preserves proven streak tracking and badge counting logic
 * from the original AchievementsTimeline.jsx component.
 * 
 * @param stats - Achievement statistics (streak, badges, certificates, streakBest, badgesTotal)
 * @param onViewAchievements - Callback when "View Achievements" is clicked
 * 
 * Requirements: 2.1-2.5
 * - Displays current learning streak in days (2.1)
 * - Displays total badges earned (2.2)
 * - Displays total certificates earned (2.3)
 * - Provides link to detailed achievements (2.4)
 * - Shows flame icon alongside streak (2.5)
 */
const AchievementStats: React.FC<AchievementStatsProps> = ({
    stats,
    onViewAchievements,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-2 border-blue-200 shadow-lg overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                {/* Decorative top border */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400" />

                <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3 m-0 p-0">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                                <Award className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-gray-900">
                                    Achievement Stats
                                </span>
                                <p className="text-sm text-gray-600 mt-0.5 font-medium">
                                    Your learning milestones
                                </p>
                            </div>
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {/* Streak Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <StatCard
                                title="Learning Streak"
                                value={`${stats.streak}`}
                                subtitle={stats.streakBest ? `Best: ${stats.streakBest} days` : undefined}
                                icon={
                                    <Flame
                                        className={`w-6 h-6 ${stats.streak > 0 ? 'text-orange-500' : 'text-gray-400'}`}
                                        fill={stats.streak > 0 ? 'currentColor' : 'none'}
                                    />
                                }
                                className="border-orange-200 hover:border-orange-300 bg-gradient-to-br from-orange-50 to-white"
                            />
                        </motion.div>

                        {/* Badges Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                        >
                            <StatCard
                                title="Badges Earned"
                                value={stats.badges}
                                subtitle={stats.badgesTotal ? `of ${stats.badgesTotal} total` : undefined}
                                icon={<Award className="w-6 h-6 text-blue-500" />}
                                className="border-blue-200 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-white"
                            />
                        </motion.div>

                        {/* Certificates Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                        >
                            <StatCard
                                title="Certificates"
                                value={stats.certificates}
                                subtitle={stats.certificates > 0 ? 'Earned & verified' : 'Start learning'}
                                icon={<GraduationCap className="w-6 h-6 text-green-500" />}
                                className="border-green-200 hover:border-green-300 bg-gradient-to-br from-green-50 to-white"
                            />
                        </motion.div>
                    </div>

                    {/* Last Activity Indicator */}
                    {stats.lastActivity && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 ml-1">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            <span>
                                Last active: {new Date(stats.lastActivity).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                    )}

                    {/* View Achievements Button */}
                    {onViewAchievements && (
                        <button
                            onClick={onViewAchievements}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
                        >
                            <span>View All Achievements</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                        </button>
                    )}

                    {/* Motivational Message (when stats are good) */}
                    {stats.streak >= 7 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                        >
                            <p className="text-sm text-amber-800 font-medium text-center">
                                🔥 Amazing! You're on fire with a {stats.streak}-day streak!
                            </p>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default AchievementStats;
