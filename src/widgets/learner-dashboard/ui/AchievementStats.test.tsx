import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AchievementStats from './AchievementStats';
import type { AchievementStatsProps } from '../model/types';

describe('AchievementStats', () => {
    const mockOnViewAchievements = vi.fn();

    const defaultProps: AchievementStatsProps = {
        stats: {
            streak: 15,
            streakBest: 30,
            badges: 12,
            badgesTotal: 50,
            certificates: 5,
            lastActivity: new Date('2024-01-15'),
        },
        onViewAchievements: mockOnViewAchievements,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render without errors with valid data', () => {
            render(<AchievementStats {...defaultProps} />);
            expect(screen.getByText('Achievement Stats')).toBeInTheDocument();
        });

        it('should display the component title and subtitle', () => {
            render(<AchievementStats {...defaultProps} />);
            expect(screen.getByText('Achievement Stats')).toBeInTheDocument();
            expect(screen.getByText('Your learning milestones')).toBeInTheDocument();
        });

        it('should render all three stat cards', () => {
            render(<AchievementStats {...defaultProps} />);
            expect(screen.getByText('Learning Streak')).toBeInTheDocument();
            expect(screen.getByText('Badges Earned')).toBeInTheDocument();
            expect(screen.getByText('Certificates')).toBeInTheDocument();
        });
    });

    describe('Streak Display (Requirement 2.1, 2.5)', () => {
        it('should display current learning streak in days', () => {
            render(<AchievementStats {...defaultProps} />);
            expect(screen.getByText('15')).toBeInTheDocument();
        });

        it('should display best streak when available', () => {
            render(<AchievementStats {...defaultProps} />);
            expect(screen.getByText('Best: 30 days')).toBeInTheDocument();
        });

        it('should not display best streak when not available', () => {
            const props: AchievementStatsProps = {
                ...defaultProps,
                stats: {
                    ...defaultProps.stats,
                    streakBest: undefined,
                },
            };
            render(<AchievementStats {...props} />);
            expect(screen.queryByText(/Best:/)).not.toBeInTheDocument();
        });

        it('should display flame icon for streak', () => {
            const { container } = render(<AchievementStats {...defaultProps} />);
            // Check for the flame icon by looking for the SVG with flame styling
            const streakCard = screen.getByText('Learning Streak').closest('.rounded-lg');
            expect(streakCard).toBeInTheDocument();
        });

        it('should handle zero streak gracefully', () => {
            const props: AchievementStatsProps = {
                ...defaultProps,
                stats: {
                    ...defaultProps.stats,
                    streak: 0,
                },
            };
            render(<AchievementStats {...props} />);
            expect(screen.getByText('0')).toBeInTheDocument();
        });

        it('should display motivational message for streak >= 7 days', () => {
            render(<AchievementStats {...defaultProps} />);
            expect(screen.getByText(/Amazing! You're on fire with a 15-day streak!/)).toBeInTheDocument();
        });

        it('should not display motivational message for streak < 7 days', () => {
            const props: AchievementStatsProps = {
                ...defaultProps,
                stats: {
                    ...defaultProps.stats,
                    streak: 5,
                },
            };
            render(<AchievementStats {...props} />);
            expect(screen.queryByText(/Amazing!/)).not.toBeInTheDocument();
        });
    });

    describe('Badges Display (Requirement 2.2)', () => {
        it('should display total number of badges earned', () => {
            render(<AchievementStats {...defaultProps} />);
            expect(screen.getByText('12')).toBeInTheDocument();
        });

        it('should display badgesTotal when available', () => {
            render(<AchievementStats {...defaultProps} />);
            expect(screen.getByText('of 50 total')).toBeInTheDocument();
        });

        it('should not display badgesTotal when not available', () => {
            const props: AchievementStatsProps = {
                ...defaultProps,
                stats: {
                    ...defaultProps.stats,
                    badgesTotal: undefined,
                },
            };
            render(<AchievementStats {...props} />);
            expect(screen.queryByText(/of.*total/)).not.toBeInTheDocument();
        });

        it('should handle zero badges gracefully', () => {
            const props: AchievementStatsProps = {
                ...defaultProps,
                stats: {
                    ...defaultProps.stats,
                    badges: 0,
                },
            };
            render(<AchievementStats {...props} />);
            expect(screen.getByText('0')).toBeInTheDocument();
        });
    });

    describe('Certificates Display (Requirement 2.3)', () => {
        it('should display total number of certificates earned', () => {
            render(<AchievementStats {...defaultProps} />);
            expect(screen.getByText('5')).toBeInTheDocument();
        });

        it('should display "Earned & verified" subtitle when certificates > 0', () => {
            render(<AchievementStats {...defaultProps} />);
            expect(screen.getByText('Earned & verified')).toBeInTheDocument();
        });

        it('should display "Start learning" subtitle when certificates = 0', () => {
            const props: AchievementStatsProps = {
                ...defaultProps,
                stats: {
                    ...defaultProps.stats,
                    certificates: 0,
                },
            };
            render(<AchievementStats {...props} />);
            expect(screen.getByText('Start learning')).toBeInTheDocument();
        });
    });

    describe('View Achievements Link (Requirement 2.4)', () => {
        it('should provide a link to view detailed achievements', () => {
            render(<AchievementStats {...defaultProps} />);
            expect(screen.getByText('View All Achievements')).toBeInTheDocument();
        });

        it('should call onViewAchievements callback when button clicked', () => {
            render(<AchievementStats {...defaultProps} />);
            const button = screen.getByText('View All Achievements');
            fireEvent.click(button);
            expect(mockOnViewAchievements).toHaveBeenCalledTimes(1);
        });

        it('should not render button when onViewAchievements is not provided', () => {
            const props: AchievementStatsProps = {
                stats: defaultProps.stats,
                onViewAchievements: undefined,
            };
            render(<AchievementStats {...props} />);
            expect(screen.queryByText('View All Achievements')).not.toBeInTheDocument();
        });
    });

    describe('Last Activity Display', () => {
        it('should display last activity date when available', () => {
            render(<AchievementStats {...defaultProps} />);
            expect(screen.getByText(/Last active:/)).toBeInTheDocument();
            expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
        });

        it('should not display last activity when not available', () => {
            const props: AchievementStatsProps = {
                ...defaultProps,
                stats: {
                    ...defaultProps.stats,
                    lastActivity: undefined,
                },
            };
            render(<AchievementStats {...props} />);
            expect(screen.queryByText(/Last active:/)).not.toBeInTheDocument();
        });

        it('should format date correctly', () => {
            const props: AchievementStatsProps = {
                ...defaultProps,
                stats: {
                    ...defaultProps.stats,
                    lastActivity: new Date('2024-12-25'),
                },
            };
            render(<AchievementStats {...props} />);
            expect(screen.getByText(/Dec 25, 2024/)).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle all zeros gracefully', () => {
            const props: AchievementStatsProps = {
                stats: {
                    streak: 0,
                    badges: 0,
                    certificates: 0,
                },
            };
            render(<AchievementStats {...props} />);
            expect(screen.getByText('Learning Streak')).toBeInTheDocument();
            expect(screen.getByText('Badges Earned')).toBeInTheDocument();
            expect(screen.getByText('Certificates')).toBeInTheDocument();
        });

        it('should handle large numbers correctly', () => {
            const props: AchievementStatsProps = {
                stats: {
                    streak: 365,
                    streakBest: 500,
                    badges: 150,
                    badgesTotal: 200,
                    certificates: 50,
                },
            };
            render(<AchievementStats {...props} />);
            expect(screen.getByText('365')).toBeInTheDocument();
            expect(screen.getByText('150')).toBeInTheDocument();
            expect(screen.getByText('50')).toBeInTheDocument();
        });

        it('should handle missing optional fields', () => {
            const props: AchievementStatsProps = {
                stats: {
                    streak: 5,
                    badges: 3,
                    certificates: 1,
                },
            };
            render(<AchievementStats {...props} />);
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('3')).toBeInTheDocument();
            expect(screen.getByText('1')).toBeInTheDocument();
        });
    });

    describe('Responsive Design', () => {
        it('should render in grid layout', () => {
            const { container } = render(<AchievementStats {...defaultProps} />);
            const grid = container.querySelector('.grid');
            expect(grid).toBeInTheDocument();
            expect(grid).toHaveClass('grid-cols-1', 'sm:grid-cols-3');
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading structure', () => {
            render(<AchievementStats {...defaultProps} />);
            expect(screen.getByText('Achievement Stats')).toBeInTheDocument();
        });

        it('should have clickable button when callback provided', () => {
            render(<AchievementStats {...defaultProps} />);
            const button = screen.getByRole('button', { name: /View All Achievements/i });
            expect(button).toBeInTheDocument();
        });
    });

    describe('Animation and Styling', () => {
        it('should have gradient background on card', () => {
            const { container } = render(<AchievementStats {...defaultProps} />);
            const card = container.querySelector('.bg-gradient-to-br');
            expect(card).toBeInTheDocument();
        });

        it('should have decorative top border', () => {
            const { container } = render(<AchievementStats {...defaultProps} />);
            const border = container.querySelector('.bg-gradient-to-r.from-amber-400');
            expect(border).toBeInTheDocument();
        });
    });
});
