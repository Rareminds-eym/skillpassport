import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Target, Calendar, TrendingUp, Play, RefreshCw, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import { Badge } from '@/shared/ui/Badge';
import type { CurrentLearningPathProps } from '../model/types';

/**
 * CurrentLearningPath Widget
 * 
 * Displays the learner's current learning path progress with comprehensive tracking:
 * - Learning path name and overall progress percentage
 * - Visual progress bar for completion tracking
 * - Current module name (if in progress)
 * - Completed modules vs total modules count
 * - Estimated completion date
 * - List of skills covered in the path
 * - "Continue Learning" button to resume current module
 * - "Change Path" button to explore other learning paths
 * 
 * Handles null path state gracefully with prompt to explore available paths.
 * 
 * @param path - Current learning path data (null if no active path)
 * @param onContinue - Callback when "Continue Learning" is clicked
 * @param onChangePath - Callback when "Change Path" is clicked
 * 
 * Requirements: 6.1-6.9
 * - Displays learning path name (6.1)
 * - Displays progress percentage (0-100) (6.2)
 * - Shows progress bar visualizing completion (6.3)
 * - Displays completed/total modules count (6.4)
 * - Shows estimated completion date (6.5)
 * - Lists skills covered in path (6.6)
 * - "Continue Learning" navigation (6.7)
 * - Handles null path with explore prompt (6.8)
 * - "Change Path" navigation (6.9)
 */
const CurrentLearningPath: React.FC<CurrentLearningPathProps> = ({
    path,
    onContinue,
    onChangePath,
}) => {
    // Format estimated completion date
    const formatDate = (date?: Date) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Handle null path - display exploration prompt
    if (!path) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="border-2 border-purple-200 shadow-lg overflow-hidden bg-gradient-to-br from-purple-50 via-white to-indigo-50">
                    {/* Decorative top border */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400" />

                    <CardContent className="p-8 text-center">
                        <div className="mb-6">
                            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg mb-4">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                Start Your Learning Journey
                            </h3>
                            <p className="text-gray-600 text-lg max-w-md mx-auto">
                                Explore personalized learning paths designed to help you master new skills and advance your career.
                            </p>
                        </div>

                        {onChangePath && (
                            <button
                                onClick={onChangePath}
                                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 mx-auto group"
                            >
                                <Sparkles className="w-5 h-5" />
                                <span>Explore Learning Paths</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                            </button>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    // Active path display
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-2 border-indigo-200 shadow-lg overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                {/* Decorative top border */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />

                <CardHeader className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3 m-0 p-0">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-gray-900">
                                    Current Learning Path
                                </span>
                                <p className="text-sm text-gray-600 mt-0.5 font-medium">
                                    Track your progress
                                </p>
                            </div>
                        </CardTitle>

                        {/* Progress Badge */}
                        <Badge
                            variant={path.progress >= 75 ? 'success' : path.progress >= 50 ? 'info' : 'warning'}
                            className="text-base px-3 py-1"
                        >
                            {Math.round(path.progress)}% Complete
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {/* Path Name */}
                    <div className="mb-5">
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {path.name}
                        </h3>
                        {path.currentModule && (
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Play className="w-4 h-4 text-indigo-500" />
                                <span className="font-medium">Current: {path.currentModule}</span>
                            </p>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <ProgressBar
                            value={path.progress}
                            color="auto"
                            height={12}
                            showPercentage={false}
                            className="mb-2"
                        />
                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span className="font-medium">
                                {path.completedModules} of {path.totalModules} modules completed
                            </span>
                            {path.completedModules < path.totalModules && (
                                <span className="text-indigo-600 font-medium">
                                    {path.totalModules - path.completedModules} remaining
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {/* Modules Progress */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Target className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 font-medium">Progress</p>
                                    <p className="text-lg font-bold text-gray-900">
                                        {path.completedModules}/{path.totalModules}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Estimated Completion */}
                        {path.estimatedCompletion && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                                className="p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600 font-medium">Est. Completion</p>
                                        <p className="text-sm font-bold text-gray-900">
                                            {formatDate(path.estimatedCompletion)}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Skills Covered */}
                    {path.skills && path.skills.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <h4 className="text-sm font-semibold text-gray-700">
                                    Skills You'll Learn
                                </h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {path.skills.map((skill, index) => (
                                    <motion.span
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
                                    >
                                        <Badge
                                            variant="outline"
                                            className="text-xs px-3 py-1 border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                                        >
                                            {skill}
                                        </Badge>
                                    </motion.span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Continue Learning Button */}
                        {onContinue && (
                            <button
                                onClick={onContinue}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
                            >
                                <Play className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                                <span>Continue Learning</span>
                            </button>
                        )}

                        {/* Change Path Button */}
                        {onChangePath && (
                            <button
                                onClick={onChangePath}
                                className="px-6 py-3 bg-white hover:bg-gray-50 text-indigo-600 font-semibold rounded-lg border-2 border-indigo-300 hover:border-indigo-400 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 group"
                            >
                                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                                <span>Change Path</span>
                            </button>
                        )}
                    </div>

                    {/* Motivational Message (when near completion) */}
                    {path.progress >= 80 && path.progress < 100 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                            <p className="text-sm text-green-800 font-medium text-center">
                                🎯 You're almost there! Just {100 - Math.round(path.progress)}% to go!
                            </p>
                        </motion.div>
                    )}

                    {/* Completion Celebration */}
                    {path.progress === 100 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg"
                        >
                            <p className="text-base text-green-800 font-bold text-center">
                                🎉 Congratulations! You've completed this learning path!
                            </p>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default CurrentLearningPath;
