import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle, Clock, ArrowRight, Map, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/Card';
import { ProgressBar } from '@/shared/ui/ProgressBar';
import type { CurrentLearningPathProps } from '../model/types';

/**
 * CurrentLearningPath Widget
 * 
 * Displays current learning path progress with:
 * - Learning path name and progress percentage (0-100) with visual progress bar
 * - Current module name if available
 * - Completed modules / total modules count
 * - Estimated completion date formatted nicely
 * - List of skills covered in the path (as badges/pills)
 * - "Continue Learning" button (navigates to current module)
 * - "Change Path" button (navigates to paths selection)
 * - Null state: displays prompt to explore learning paths
 * 
 * **Performance Optimization**: Wrapped with React.memo to prevent unnecessary re-renders
 * 
 * Requirements: 6.1-6.9
 * - Display learning path name (6.1)
 * - Display progress percentage 0-100 (6.2)
 * - Display progress bar visualizing completion (6.3)
 * - Display completed/total modules count (6.4)
 * - Display estimated completion date (6.5)
 * - Display list of skills covered (6.6)
 * - "Continue Learning" navigates to current module (6.7)
 * - Display prompt when no active path (6.8)
 * - "Change Path" navigates to paths selection (6.9)
 * 
 * @param path - Learning path data with progress, modules, and skills (or null)
 * @param onContinue - Callback when "Continue Learning" is clicked
 * @param onChangePath - Callback when "Change Path" or "Explore Learning Paths" is clicked
 */
const CurrentLearningPath: React.FC<CurrentLearningPathProps> = React.memo(({
    path,
    onContinue,
    onChangePath,
}) => {
    // Format estimated completion date
    const formatDate = (date?: Date): string => {
        if (!date) return 'Not available';

        const d = new Date(date);
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    };

    // Null state: No active learning path
    if (!path) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Card className="border-2 border-gray-200 shadow-lg overflow-hidden bg-gradient-to-br from-gray-50 via-white to-slate-50">
                    {/* Decorative top border */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                    <CardContent className="p-8">
                        <div className="flex flex-col items-center justify-center text-center py-8">
                            {/* Friendly icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-6 shadow-lg"
                            >
                                <Map className="w-12 h-12 text-blue-600" />
                            </motion.div>

                            {/* Prompt message */}
                            <motion.h3
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                                className="text-2xl font-bold text-gray-900 mb-3"
                            >
                                No Active Learning Path
                            </motion.h3>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.4 }}
                                className="text-gray-600 mb-6 max-w-md"
                            >
                                Start your learning journey today! Explore our curated learning paths designed to help you master new skills and achieve your career goals.
                            </motion.p>

                            {/* Explore Learning Paths button */}
                            {onChangePath && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.5 }}
                                >
                                    <button
                                        onClick={onChangePath}
                                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 group"
                                        aria-label="Explore learning paths"
                                    >
                                        <Map className="w-5 h-5" />
                                        <span>Explore Learning Paths</span>
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    // Active path state
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Card className="border-2 border-blue-200 shadow-lg overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                {/* Decorative top border */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                <CardHeader className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3 m-0 p-0">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                <Map className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-xl font-bold text-gray-900">
                                    Current Learning Path
                                </span>
                                <p className="text-sm text-gray-600 mt-0.5 font-medium">
                                    Continue your learning journey
                                </p>
                            </div>
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {/* Learning Path Name */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="mb-6"
                    >
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            {path.name}
                        </h3>
                        {path.currentModule && (
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-blue-600" />
                                Current module: <span className="font-semibold text-gray-800">{path.currentModule}</span>
                            </p>
                        )}
                    </motion.div>

                    {/* Progress Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="mb-6 p-5 rounded-xl bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 shadow-md"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                                <span className="font-bold text-gray-900">Progress</span>
                            </div>
                            <span className="text-2xl font-bold text-blue-600">
                                {Math.round(path.progress)}%
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <ProgressBar
                            value={path.progress}
                            color="auto"
                            height={12}
                            showPercentage={false}
                            className="mb-3"
                        />

                        {/* Modules Count */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">
                                {path.completedModules} of {path.totalModules} modules completed
                            </span>
                        </div>
                    </motion.div>

                    {/* Estimated Completion Date */}
                    {path.estimatedCompletion && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                            className="mb-6 p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200"
                        >
                            <div className="flex items-center gap-2 text-gray-700">
                                <Clock className="w-5 h-5 text-indigo-600" />
                                <span className="font-semibold">Est. completion:</span>
                                <span className="text-indigo-700 font-bold">
                                    {formatDate(path.estimatedCompletion)}
                                </span>
                            </div>
                        </motion.div>
                    )}

                    {/* Skills Covered */}
                    {path.skills && path.skills.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                            className="mb-6"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <Award className="w-5 h-5 text-green-600" />
                                <h4 className="font-bold text-gray-900">Skills Covered</h4>
                            </div>

                            {/* Skills as badges in flex wrap layout */}
                            <div className="flex flex-wrap gap-2">
                                {path.skills.map((skill, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.2, delay: 0.5 + index * 0.05 }}
                                    >
                                        <span
                                            className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium text-xs shadow-sm hover:shadow-md transition-shadow duration-200"
                                        >
                                            {skill}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.6 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                        {/* Continue Learning Button */}
                        {onContinue && (
                            <button
                                onClick={onContinue}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group"
                                aria-label="Continue learning current path"
                            >
                                <BookOpen className="w-5 h-5" />
                                <span>Continue Learning</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                            </button>
                        )}

                        {/* Change Path Button */}
                        {onChangePath && (
                            <button
                                onClick={onChangePath}
                                className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 group"
                                aria-label="Change learning path"
                            >
                                <Map className="w-5 h-5" />
                                <span>Change Path</span>
                            </button>
                        )}
                    </motion.div>

                    {/* Motivational Message (when progress is high) */}
                    {path.progress >= 75 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.7 }}
                            className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                            <p className="text-sm text-green-800 font-medium text-center">
                                🎉 Amazing progress! You're almost there - keep going!
                            </p>
                        </motion.div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
});

CurrentLearningPath.displayName = 'CurrentLearningPath';

export default CurrentLearningPath;
