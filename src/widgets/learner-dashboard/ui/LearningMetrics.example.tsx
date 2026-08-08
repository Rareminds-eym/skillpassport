/**
 * LearningMetrics Component Usage Examples
 * 
 * This file demonstrates various usage patterns for the LearningMetrics widget.
 */

import React from 'react';
import LearningMetrics from './LearningMetrics';
import type { LearningMetricsProps } from '../model/types';

// Example 1: Basic Usage
export const BasicExample = () => {
    const metrics: LearningMetricsProps['metrics'] = {
        coursesEnrolled: 10,
        coursesCompleted: 6,
        certificatesEarned: 4,
        learningHours: 45.5,
        courseCompletionRate: 60,
        inProgressCount: 3,
        notStartedCount: 1,
    };

    const handleViewCourses = () => {
        console.log('Navigate to courses page');
        // In real app: navigate('/learner/courses');
    };

    return (
        <LearningMetrics
            metrics={metrics}
            onViewCourses={handleViewCourses}
        />
    );
};

// Example 2: High Completion Rate (Shows Motivational Message)
export const HighCompletionExample = () => {
    const metrics: LearningMetricsProps['metrics'] = {
        coursesEnrolled: 20,
        coursesCompleted: 18,
        certificatesEarned: 15,
        learningHours: 120.8,
        courseCompletionRate: 90, // High completion rate
        inProgressCount: 2,
        notStartedCount: 0,
    };

    return (
        <LearningMetrics
            metrics={metrics}
            onViewCourses={() => console.log('View courses')}
        />
    );
};

// Example 3: Empty State (No Courses)
export const EmptyStateExample = () => {
    const metrics: LearningMetricsProps['metrics'] = {
        coursesEnrolled: 0,
        coursesCompleted: 0,
        certificatesEarned: 0,
        learningHours: 0,
        courseCompletionRate: 0,
        inProgressCount: 0,
        notStartedCount: 0,
    };

    return (
        <LearningMetrics
            metrics={metrics}
            onViewCourses={() => console.log('Browse courses')}
        />
    );
};

// Example 4: Without Navigation Callback
export const WithoutCallbackExample = () => {
    const metrics: LearningMetricsProps['metrics'] = {
        coursesEnrolled: 5,
        coursesCompleted: 2,
        certificatesEarned: 1,
        learningHours: 22.3,
        courseCompletionRate: 40,
        inProgressCount: 3,
        notStartedCount: 0,
    };

    // No onViewCourses callback - button won't render
    return <LearningMetrics metrics={metrics} />;
};

// Example 5: In Dashboard Context (with Navigation Hook)
export const DashboardIntegrationExample = () => {
    // In real app, you'd use react-router-dom's useNavigate
    // const navigate = useNavigate();

    const metrics: LearningMetricsProps['metrics'] = {
        coursesEnrolled: 15,
        coursesCompleted: 8,
        certificatesEarned: 6,
        learningHours: 78.5,
        courseCompletionRate: 53.3,
        inProgressCount: 5,
        notStartedCount: 2,
    };

    const handleViewCourses = () => {
        // navigate('/learner/courses');
        window.location.href = '/learner/courses';
    };

    return (
        <div className="container mx-auto p-6">
            <LearningMetrics
                metrics={metrics}
                onViewCourses={handleViewCourses}
            />
        </div>
    );
};

// Example 6: Fetching Data from API
export const WithAPIDataExample = () => {
    const [metrics, setMetrics] = React.useState<LearningMetricsProps['metrics'] | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        // Simulate API call
        const fetchMetrics = async () => {
            try {
                // const response = await fetch('/api/learner/metrics');
                // const data = await response.json();

                // Mock data for example
                const data = {
                    coursesEnrolled: 12,
                    coursesCompleted: 7,
                    certificatesEarned: 5,
                    learningHours: 56.7,
                    courseCompletionRate: 58.3,
                    inProgressCount: 4,
                    notStartedCount: 1,
                };

                setMetrics(data);
            } catch (error) {
                console.error('Failed to fetch metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, []);

    if (loading) {
        return <div>Loading learning metrics...</div>;
    }

    if (!metrics) {
        return <div>Failed to load metrics</div>;
    }

    return (
        <LearningMetrics
            metrics={metrics}
            onViewCourses={() => console.log('View courses')}
        />
    );
};

// Example 7: Large Dataset
export const LargeDatasetExample = () => {
    const metrics: LearningMetricsProps['metrics'] = {
        coursesEnrolled: 150,
        coursesCompleted: 95,
        certificatesEarned: 68,
        learningHours: 1234.5,
        courseCompletionRate: 63.3,
        inProgressCount: 45,
        notStartedCount: 10,
    };

    return (
        <LearningMetrics
            metrics={metrics}
            onViewCourses={() => console.log('View courses')}
        />
    );
};

/**
 * Integration Notes:
 * 
 * 1. Calculating Completion Rate:
 *    courseCompletionRate = (coursesCompleted / coursesEnrolled) * 100
 * 
 * 2. Learning Hours Format:
 *    - Stored as decimal number (e.g., 45.5)
 *    - Displayed with 1 decimal place
 * 
 * 3. Course Status Counts:
 *    - coursesEnrolled = coursesCompleted + inProgressCount + notStartedCount
 * 
 * 4. Navigation:
 *    - Use React Router's navigate() or window.location.href
 *    - Typically navigates to '/learner/courses'
 * 
 * 5. Responsive Design:
 *    - Automatically adapts to mobile/tablet/desktop
 *    - 4 metrics in grid: 4 cols on desktop, 2 on tablet, 1 on mobile
 * 
 * 6. Motivational Message:
 *    - Shows when courseCompletionRate >= 75%
 * 
 * 7. Empty State:
 *    - Displays when coursesEnrolled === 0
 */
