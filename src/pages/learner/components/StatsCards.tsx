/**
 * StatsCards Component
 * 
 * Displays 4 stat cards showing key learning metrics
 * Matches the exact design from the dashboard image
 */

import {
    BookOpenIcon,
    CheckCircleIcon,
    AcademicCapIcon,
    ClockIcon
} from '@heroicons/react/24/outline';

interface StatsCardsProps {
    coursesEnrolled?: number;
    coursesCompleted?: number;
    certificatesEarned?: number;
    learningHours?: number;
    loading?: boolean;
}

const StatsCards = ({
    coursesEnrolled = 0,
    coursesCompleted = 0,
    certificatesEarned = 0,
    learningHours = 0,
    loading = false
}) => {
    const stats = [
        {
            id: 'courses-enrolled',
            label: 'Courses Enrolled',
            value: coursesEnrolled,
            icon: BookOpenIcon,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600'
        },
        {
            id: 'courses-completed',
            label: 'Courses Completed',
            value: coursesCompleted,
            icon: CheckCircleIcon,
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600'
        },
        {
            id: 'certificates-earned',
            label: 'Certificates Earned',
            value: certificatesEarned,
            icon: AcademicCapIcon,
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-600'
        },
        {
            id: 'learning-hours',
            label: 'Learning Hours',
            value: learningHours,
            icon: ClockIcon,
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600'
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1">
                                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={stat.id}
                        className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                        <div className="flex items-center space-x-4">
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                                <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                            </div>

                            {/* Value and Label */}
                            <div className="flex-1">
                                <div className="text-3xl font-bold text-gray-900">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                    {stat.label}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default StatsCards;
