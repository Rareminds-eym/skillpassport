/**
 * CurrentLearningPathSection Component
 * 
 * Displays current learning path with progress and milestones
 */

import { AcademicCapIcon, ClockIcon, PlayIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/shared/ui';
import { useCollegeDashboard } from '@/features/learner-profile/model/useCollegeDashboard';

const CurrentLearningPathSection = () => {
    const navigate = useNavigate();
    const { learningPath, learningPathLoading } = useCollegeDashboard();

    // Default data if no learning path
    const pathData = learningPath || {
        title: 'Full Stack Development',
        duration: '6 months',
        totalCourses: 8,
        progress: 66,
        currentMilestone: 'Build & Deploy a Full Stack Project',
        daysUntilMilestone: 8
    };

    const progressPercentage = pathData.progress || 66;

    if (learningPathLoading) {
        return (
            <Card className="h-full bg-white rounded-xl border border-gray-200 shadow-sm">
                <CardHeader className="px-6 py-5 bg-white border-b border-gray-100">
                    <CardTitle className="flex items-center gap-3 m-0 p-0">
                        <div className="text-base font-bold text-gray-900">Current Learning Path</div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4 animate-pulse">
                    <div className="h-20 bg-gray-100 rounded-lg"></div>
                    <div className="h-12 bg-gray-100 rounded-lg"></div>
                    <div className="h-16 bg-gray-100 rounded-lg"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 shadow-sm">
            <CardHeader className="px-6 py-5 bg-white border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 m-0 p-0">
                    <div className="text-base font-bold text-gray-900">Current Learning Path</div>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Course Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-start gap-4">
                        {/* Course Icon */}
                        <div className="p-3 bg-blue-600 rounded-xl flex-shrink-0">
                            <AcademicCapIcon className="w-8 h-8 text-white" />
                        </div>

                        {/* Course Info */}
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {pathData.title}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1.5">
                                    <ClockIcon className="w-4 h-4" />
                                    <span>{pathData.duration}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span>•</span>
                                    <span>{pathData.totalCourses} courses</span>
                                </div>
                            </div>
                        </div>

                        {/* Progress Badge */}
                        <div className="flex-shrink-0">
                            <div className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                                <span className="text-lg font-bold">{progressPercentage}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                            <span className="text-sm font-semibold text-blue-600">{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Continue Learning Button */}
                <Button
                    onClick={() => navigate('/learner/my-learning')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 text-base shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                    <PlayIcon className="w-5 h-5" />
                    Continue Learning
                </Button>

                {/* Next Milestone */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="p-2 bg-white rounded-lg border border-gray-200">
                                <CalendarIcon className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                                    {pathData.currentMilestone}
                                </h4>
                                <p className="text-xs text-gray-500">Next milestone</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-semibold text-blue-600">
                                Start in {pathData.daysUntilMilestone} days
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default CurrentLearningPathSection;
