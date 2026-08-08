import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LearningMetrics from './LearningMetrics';
import type { LearningMetricsProps } from '../model/types';

describe('LearningMetrics', () => {
    const mockMetrics: LearningMetricsProps['metrics'] = {
        coursesEnrolled: 10,
        coursesCompleted: 6,
        certificatesEarned: 4,
        learningHours: 45.5,
        courseCompletionRate: 60,
        inProgressCount: 3,
        notStartedCount: 1,
    };

    const mockOnViewCourses = vi.fn();

    describe('Rendering', () => {
        it('should render without errors with valid data', () => {
            render(
                <LearningMetrics
                    metrics={mockMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            expect(screen.getByText('Learning Metrics')).toBeInTheDocument();
            expect(screen.getByText('Your learning journey overview')).toBeInTheDocument();
        });

        it('should render all 4 key metrics (Req 3.1-3.4)', () => {
            render(
                <LearningMetrics
                    metrics={mockMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            // Req 3.1: Display total courses enrolled
            expect(screen.getByText('Courses Enrolled')).toBeInTheDocument();
            expect(screen.getByText('Total courses')).toBeInTheDocument();

            // Req 3.2: Display total courses completed
            expect(screen.getByText('Courses Completed')).toBeInTheDocument();
            expect(screen.getByText('Successfully finished')).toBeInTheDocument();

            // Req 3.3: Display total certificates earned
            expect(screen.getByText('Certificates')).toBeInTheDocument();
            expect(screen.getByText('Earned & verified')).toBeInTheDocument();

            // Req 3.4: Display total learning hours (formatted to 1 decimal)
            expect(screen.getByText('Learning Hours')).toBeInTheDocument();
            expect(screen.getByText('45.5')).toBeInTheDocument();
        });

        it('should display course completion rate with visual indicator (Req 3.5)', () => {
            render(
                <LearningMetrics
                    metrics={mockMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            // Check for completion rate display
            expect(screen.getByText('Course Completion Rate')).toBeInTheDocument();
            expect(screen.getByText('60%')).toBeInTheDocument();

            // Check for progress bar (visual indicator)
            const progressBars = document.querySelectorAll('[role="progressbar"]');
            expect(progressBars.length).toBeGreaterThan(0);
        });

        it('should display in progress and not started counts (Req 3.6, 3.7)', () => {
            render(
                <LearningMetrics
                    metrics={mockMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            // Req 3.6: Display count of courses in progress
            expect(screen.getByText('In Progress')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();

            // Req 3.7: Display count of courses not yet started
            expect(screen.getByText('Not Started')).toBeInTheDocument();
            expect(screen.getByText('1')).toBeInTheDocument();
        });

        it('should display course status breakdown section', () => {
            render(
                <LearningMetrics
                    metrics={mockMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            expect(screen.getByText('Course Status Breakdown')).toBeInTheDocument();

            // All three status types should be visible
            expect(screen.getByText('Completed')).toBeInTheDocument();
            expect(screen.getByText('In Progress')).toBeInTheDocument();
            expect(screen.getByText('Not Started')).toBeInTheDocument();
        });

        it('should render View Courses button when callback provided (Req 3.8)', () => {
            render(
                <LearningMetrics
                    metrics={mockMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            const viewButton = screen.getByRole('button', { name: /view all courses/i });
            expect(viewButton).toBeInTheDocument();
        });

        it('should not render View Courses button when callback not provided', () => {
            render(
                <LearningMetrics metrics={mockMetrics} />
            );

            const viewButton = screen.queryByRole('button', { name: /view all courses/i });
            expect(viewButton).not.toBeInTheDocument();
        });

        it('should display motivational message when completion rate is high', () => {
            const highCompletionMetrics = {
                ...mockMetrics,
                courseCompletionRate: 80,
            };

            render(
                <LearningMetrics
                    metrics={highCompletionMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            expect(screen.getByText(/Excellent progress!/i)).toBeInTheDocument();
        });

        it('should not display motivational message when completion rate is low', () => {
            const lowCompletionMetrics = {
                ...mockMetrics,
                courseCompletionRate: 50,
            };

            render(
                <LearningMetrics
                    metrics={lowCompletionMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            expect(screen.queryByText(/Excellent progress!/i)).not.toBeInTheDocument();
        });

        it('should display empty state when no courses are enrolled', () => {
            const emptyMetrics: LearningMetricsProps['metrics'] = {
                coursesEnrolled: 0,
                coursesCompleted: 0,
                certificatesEarned: 0,
                learningHours: 0,
                courseCompletionRate: 0,
                inProgressCount: 0,
                notStartedCount: 0,
            };

            render(
                <LearningMetrics
                    metrics={emptyMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            expect(screen.getByText('No courses enrolled yet')).toBeInTheDocument();
            expect(screen.getByText('Start your learning journey today!')).toBeInTheDocument();
        });
    });

    describe('Interactions', () => {
        it('should call onViewCourses when View Courses button is clicked (Req 3.8)', async () => {
            const user = userEvent.setup();
            render(
                <LearningMetrics
                    metrics={mockMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            const viewButton = screen.getByRole('button', { name: /view all courses/i });
            await user.click(viewButton);

            expect(mockOnViewCourses).toHaveBeenCalledTimes(1);
        });
    });

    describe('Number Formatting', () => {
        it('should format learning hours to 1 decimal place', () => {
            const metricsWithDecimal = {
                ...mockMetrics,
                learningHours: 123.456789,
            };

            render(
                <LearningMetrics
                    metrics={metricsWithDecimal}
                    onViewCourses={mockOnViewCourses}
                />
            );

            // Should be formatted to 1 decimal place
            expect(screen.getByText('123.5')).toBeInTheDocument();
        });

        it('should format completion rate as whole number percentage', () => {
            const metricsWithDecimalRate = {
                ...mockMetrics,
                courseCompletionRate: 65.789,
            };

            render(
                <LearningMetrics
                    metrics={metricsWithDecimalRate}
                    onViewCourses={mockOnViewCourses}
                />
            );

            // Should be formatted as whole number
            expect(screen.getByText('66%')).toBeInTheDocument();
        });

        it('should handle zero values correctly', () => {
            const zeroMetrics: LearningMetricsProps['metrics'] = {
                coursesEnrolled: 0,
                coursesCompleted: 0,
                certificatesEarned: 0,
                learningHours: 0.0,
                courseCompletionRate: 0,
                inProgressCount: 0,
                notStartedCount: 0,
            };

            render(
                <LearningMetrics
                    metrics={zeroMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            expect(screen.getByText('0.0')).toBeInTheDocument(); // Learning hours
            expect(screen.getByText('0%')).toBeInTheDocument(); // Completion rate
        });
    });

    describe('Edge Cases', () => {
        it('should handle 100% completion rate', () => {
            const fullCompletionMetrics = {
                coursesEnrolled: 10,
                coursesCompleted: 10,
                certificatesEarned: 10,
                learningHours: 100,
                courseCompletionRate: 100,
                inProgressCount: 0,
                notStartedCount: 0,
            };

            render(
                <LearningMetrics
                    metrics={fullCompletionMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            expect(screen.getByText('100%')).toBeInTheDocument();
            expect(screen.getByText(/Excellent progress!/i)).toBeInTheDocument();
        });

        it('should handle large numbers correctly', () => {
            const largeMetrics = {
                coursesEnrolled: 999,
                coursesCompleted: 500,
                certificatesEarned: 250,
                learningHours: 9999.9,
                courseCompletionRate: 50.1,
                inProgressCount: 400,
                notStartedCount: 99,
            };

            render(
                <LearningMetrics
                    metrics={largeMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            // Check for large values using getAllByText since numbers may appear multiple times
            expect(screen.getAllByText('999').length).toBeGreaterThan(0);
            expect(screen.getAllByText('500').length).toBeGreaterThan(0);
            expect(screen.getByText('9999.9')).toBeInTheDocument();
        });

        it('should render correctly when only some courses are in progress', () => {
            const partialMetrics = {
                coursesEnrolled: 5,
                coursesCompleted: 0,
                certificatesEarned: 0,
                learningHours: 15.5,
                courseCompletionRate: 0,
                inProgressCount: 5,
                notStartedCount: 0,
            };

            render(
                <LearningMetrics
                    metrics={partialMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            // Check for in progress status with more specific query
            expect(screen.getByText('In Progress')).toBeInTheDocument();
            expect(screen.getByText('0%')).toBeInTheDocument(); // completion rate
        });
    });

    describe('Accessibility', () => {
        it('should have accessible button with aria-label', () => {
            render(
                <LearningMetrics
                    metrics={mockMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            const button = screen.getByRole('button', { name: /view all courses/i });
            expect(button).toHaveAttribute('aria-label', 'View all courses');
        });

        it('should have progress bars with role="progressbar"', () => {
            render(
                <LearningMetrics
                    metrics={mockMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            const progressBars = document.querySelectorAll('[role="progressbar"]');
            expect(progressBars.length).toBeGreaterThan(0);
        });

        it('should have semantic structure with headings', () => {
            render(
                <LearningMetrics
                    metrics={mockMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            // Check for semantic headings
            expect(screen.getByText('Learning Metrics')).toBeInTheDocument();
            expect(screen.getByText('Course Status Breakdown')).toBeInTheDocument();
        });
    });

    describe('Responsive Layout', () => {
        it('should render grid layout for 4 key metrics', () => {
            const { container } = render(
                <LearningMetrics
                    metrics={mockMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            // Find the grid container
            const gridContainer = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
            expect(gridContainer).toBeInTheDocument();
        });

        it('should render status breakdown grid', () => {
            const { container } = render(
                <LearningMetrics
                    metrics={mockMetrics}
                    onViewCourses={mockOnViewCourses}
                />
            );

            // Find the status breakdown grid
            const statusGrid = container.querySelector('.grid.grid-cols-3');
            expect(statusGrid).toBeInTheDocument();
        });
    });
});
