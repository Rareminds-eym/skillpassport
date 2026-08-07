import React from 'react';
import AchievementStats from './AchievementStats';
import type { AchievementStatsProps } from '../model/types';

/**
 * Example usage of the AchievementStats widget
 * 
 * This widget is extracted from AchievementsTimeline.jsx and displays
 * simplified achievement statistics in a compact, dashboard-friendly format.
 */

// Example 1: Complete stats with all optional fields
const Example1: React.FC = () => {
    const stats: AchievementStatsProps = {
        stats: {
            streak: 15,
            streakBest: 30,
            badges: 12,
            badgesTotal: 50,
            certificates: 5,
            lastActivity: new Date('2024-01-15'),
        },
        onViewAchievements: () => {
            console.log('Navigating to achievements page...');
            // Navigate to /learner/achievements
        },
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Example 1: Complete Stats</h2>
            <AchievementStats {...stats} />
        </div>
    );
};

// Example 2: Minimal stats (no optional fields)
const Example2: React.FC = () => {
    const stats: AchievementStatsProps = {
        stats: {
            streak: 7,
            badges: 5,
            certificates: 2,
        },
        onViewAchievements: () => {
            console.log('View achievements clicked');
        },
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Example 2: Minimal Stats</h2>
            <AchievementStats {...stats} />
        </div>
    );
};

// Example 3: Beginner with zero achievements
const Example3: React.FC = () => {
    const stats: AchievementStatsProps = {
        stats: {
            streak: 0,
            badges: 0,
            certificates: 0,
        },
        onViewAchievements: () => {
            console.log('Start your learning journey!');
        },
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Example 3: Beginner (Zero Stats)</h2>
            <AchievementStats {...stats} />
        </div>
    );
};

// Example 4: High achiever with motivational message
const Example4: React.FC = () => {
    const stats: AchievementStatsProps = {
        stats: {
            streak: 100,
            streakBest: 150,
            badges: 45,
            badgesTotal: 50,
            certificates: 25,
            lastActivity: new Date(),
        },
        onViewAchievements: () => {
            console.log('Amazing achievements!');
        },
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Example 4: High Achiever</h2>
            <AchievementStats {...stats} />
        </div>
    );
};

// Example 5: No callback (button hidden)
const Example5: React.FC = () => {
    const stats: AchievementStatsProps = {
        stats: {
            streak: 10,
            badges: 8,
            certificates: 3,
            lastActivity: new Date('2024-01-20'),
        },
        // No onViewAchievements callback
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Example 5: No Action Button</h2>
            <AchievementStats {...stats} />
        </div>
    );
};

// Example 6: Integration with React Router
const Example6: React.FC = () => {
    // Simulate useNavigate from react-router-dom
    const navigate = (path: string) => {
        console.log(`Navigating to: ${path}`);
    };

    const stats: AchievementStatsProps = {
        stats: {
            streak: 20,
            streakBest: 25,
            badges: 15,
            certificates: 7,
            lastActivity: new Date(),
        },
        onViewAchievements: () => {
            navigate('/learner/achievements');
        },
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">Example 6: With Router Navigation</h2>
            <AchievementStats {...stats} />
        </div>
    );
};

// Example 7: Dashboard Integration Pattern
const DashboardExample: React.FC = () => {
    // Simulated API data
    const learnerAchievements = {
        currentStreak: 15,
        longestStreak: 30,
        totalBadges: 12,
        availableBadges: 50,
        earnedCertificates: 5,
        lastActive: new Date('2024-01-15'),
    };

    // Map API data to component props
    const achievementStatsProps: AchievementStatsProps = {
        stats: {
            streak: learnerAchievements.currentStreak,
            streakBest: learnerAchievements.longestStreak,
            badges: learnerAchievements.totalBadges,
            badgesTotal: learnerAchievements.availableBadges,
            certificates: learnerAchievements.earnedCertificates,
            lastActivity: learnerAchievements.lastActive,
        },
        onViewAchievements: () => {
            console.log('Navigate to /learner/achievements');
        },
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Learner Dashboard</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Other dashboard widgets */}
                <div className="lg:col-span-2">
                    <AchievementStats {...achievementStatsProps} />
                </div>
            </div>
        </div>
    );
};

// Export all examples
export {
    Example1,
    Example2,
    Example3,
    Example4,
    Example5,
    Example6,
    DashboardExample,
};

export default Example1;
