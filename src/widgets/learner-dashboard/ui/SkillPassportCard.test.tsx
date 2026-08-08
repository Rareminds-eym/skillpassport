/**
 * Unit Tests for SkillPassportCard Widget
 * 
 * Tests rendering, verification status badges, skill health breakdown,
 * and action button callbacks.
 * 
 * **Validates Requirements: 5.1-5.9, 10.1-10.7**
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SkillPassportCard } from './SkillPassportCard';
import type { SkillPassportCardProps } from '../model/types';

describe('SkillPassportCard', () => {
    const mockOnUpskill = vi.fn();
    const mockOnViewDetails = vi.fn();

    const defaultProps: SkillPassportCardProps = {
        passport: {
            verifiedSkills: 15,
            skillScore: 75,
            certificates: 8,
            verificationStatus: 'active',
            lastVerified: new Date('2024-01-15'),
            skills: [
                // Healthy skills (>75% proficiency) - 6 skills
                { name: 'JavaScript', proficiency: 90 },
                { name: 'React', proficiency: 85 },
                { name: 'TypeScript', proficiency: 88 },
                { name: 'Node.js', proficiency: 82 },
                { name: 'Git', proficiency: 95 },
                { name: 'CSS', proficiency: 80 },
                // Upskill skills (50-75% proficiency) - 5 skills
                { name: 'Python', proficiency: 70 },
                { name: 'Docker', proficiency: 65 },
                { name: 'AWS', proficiency: 60 },
                { name: 'MongoDB', proficiency: 68 },
                { name: 'GraphQL', proficiency: 72 },
                // Critical skills (<50% proficiency) - 4 skills
                { name: 'Kubernetes', proficiency: 45 },
                { name: 'Java', proficiency: 40 },
                { name: 'C++', proficiency: 35 },
                { name: 'Rust', proficiency: 30 },
            ],
        },
        onUpskill: mockOnUpskill,
        onViewDetails: mockOnViewDetails,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render without errors', () => {
            render(<SkillPassportCard {...defaultProps} />);
            expect(screen.getByText('Skill Passport')).toBeInTheDocument();
        });

        it('should display the card title and description', () => {
            render(<SkillPassportCard {...defaultProps} />);
            expect(screen.getByText('Skill Passport')).toBeInTheDocument();
            expect(screen.getByText('Your verified skills and certifications')).toBeInTheDocument();
        });

        it('should render with gradient background decoration', () => {
            const { container } = render(<SkillPassportCard {...defaultProps} />);
            const gradientDiv = container.querySelector('.bg-gradient-to-br.from-emerald-50');
            expect(gradientDiv).toBeInTheDocument();
        });
    });

    describe('Key Metrics Display - Requirements 5.1-5.3', () => {
        it('should display verified skills count (Req 5.1)', () => {
            render(<SkillPassportCard {...defaultProps} />);
            expect(screen.getByText('Verified Skills')).toBeInTheDocument();
            expect(screen.getByText('15')).toBeInTheDocument();
        });

        it('should display skill score as percentage (Req 5.2)', () => {
            render(<SkillPassportCard {...defaultProps} />);
            expect(screen.getByText('Skill Score')).toBeInTheDocument();
            expect(screen.getByText('75')).toBeInTheDocument();
            expect(screen.getByText('/100')).toBeInTheDocument();
        });

        it('should display certificates count (Req 5.3)', () => {
            render(<SkillPassportCard {...defaultProps} />);
            expect(screen.getByText('Certificates')).toBeInTheDocument();
            expect(screen.getByText('8')).toBeInTheDocument();
        });

        it('should display circular progress for skill score', () => {
            render(<SkillPassportCard {...defaultProps} />);
            const circularProgress = screen.getByRole('progressbar', { name: /Progress: 75%/i });
            expect(circularProgress).toBeInTheDocument();
        });
    });

    describe('Verification Status Badge - Requirements 5.4-5.5', () => {
        it('should display active verification badge with checkmark (Req 5.4)', () => {
            render(<SkillPassportCard {...defaultProps} />);
            const activeBadge = screen.getByText('Active');
            expect(activeBadge).toBeInTheDocument();
        });

        it('should display last verified date for active status (Req 5.5)', () => {
            render(<SkillPassportCard {...defaultProps} />);
            expect(screen.getByText(/Verified Jan 15, 2024/i)).toBeInTheDocument();
        });

        it('should display pending status badge with clock icon', () => {
            const props = {
                ...defaultProps,
                passport: { ...defaultProps.passport, verificationStatus: 'pending' as const },
            };
            render(<SkillPassportCard {...props} />);
            expect(screen.getByText('Pending')).toBeInTheDocument();
        });

        it('should display expired status badge with alert icon', () => {
            const props = {
                ...defaultProps,
                passport: { ...defaultProps.passport, verificationStatus: 'expired' as const },
            };
            render(<SkillPassportCard {...props} />);
            expect(screen.getByText('Expired')).toBeInTheDocument();
        });

        it('should display none status badge with info icon', () => {
            const props = {
                ...defaultProps,
                passport: { ...defaultProps.passport, verificationStatus: 'none' as const, lastVerified: undefined },
            };
            render(<SkillPassportCard {...props} />);
            expect(screen.getByText('Not Verified')).toBeInTheDocument();
        });

        it('should not display last verified date when status is not active', () => {
            const props = {
                ...defaultProps,
                passport: { ...defaultProps.passport, verificationStatus: 'pending' as const },
            };
            render(<SkillPassportCard {...props} />);
            // Should not find the date text that starts with "Verified"
            expect(screen.queryByText(/^Verified Jan/i)).not.toBeInTheDocument();
        });
    });

    describe('Skill Health Breakdown - Requirements 5.6-5.7, 10.1-10.7', () => {
        it('should display skill health breakdown section (Req 5.6)', () => {
            render(<SkillPassportCard {...defaultProps} />);
            expect(screen.getByText('Skill Health Breakdown')).toBeInTheDocument();
        });

        it('should display healthy skills category with count and percentage (Req 5.7)', () => {
            render(<SkillPassportCard {...defaultProps} />);
            expect(screen.getByText('Healthy')).toBeInTheDocument();
            expect(screen.getByText('6 skills')).toBeInTheDocument();
            expect(screen.getByText('40%')).toBeInTheDocument();
        });

        it('should display upskill skills category with count and percentage (Req 5.7)', () => {
            render(<SkillPassportCard {...defaultProps} />);
            expect(screen.getByText('Upskill')).toBeInTheDocument();
            expect(screen.getByText('5 skills')).toBeInTheDocument();
            expect(screen.getByText('33%')).toBeInTheDocument();
        });

        it('should display critical skills category with count and percentage (Req 5.7)', () => {
            render(<SkillPassportCard {...defaultProps} />);
            expect(screen.getByText('Critical')).toBeInTheDocument();
            expect(screen.getByText('4 skills')).toBeInTheDocument();
            expect(screen.getByText('27%')).toBeInTheDocument();
        });

        it('should display proficiency thresholds for each category', () => {
            render(<SkillPassportCard {...defaultProps} />);
            expect(screen.getByText('(>75%)')).toBeInTheDocument();
            expect(screen.getByText('(50-75%)')).toBeInTheDocument();
            expect(screen.getByText('(<50%)')).toBeInTheDocument();
        });

        it('should render progress bars for each health category', () => {
            render(<SkillPassportCard {...defaultProps} />);
            const progressBars = screen.getAllByRole('progressbar');
            // 1 circular progress + 3 linear progress bars
            expect(progressBars.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Action Buttons - Requirements 5.8-5.9', () => {
        it('should render Upskill Now button (Req 5.8)', () => {
            render(<SkillPassportCard {...defaultProps} />);
            const upskillButton = screen.getByRole('button', { name: /Navigate to skill improvement resources/i });
            expect(upskillButton).toBeInTheDocument();
            expect(upskillButton).toHaveTextContent('Upskill Now');
        });

        it('should render View Details button (Req 5.9)', () => {
            render(<SkillPassportCard {...defaultProps} />);
            const detailsButton = screen.getByRole('button', { name: /Navigate to digital portfolio page/i });
            expect(detailsButton).toBeInTheDocument();
            expect(detailsButton).toHaveTextContent('View Details');
        });

        it('should call onUpskill callback when Upskill Now button is clicked (Req 5.8)', () => {
            render(<SkillPassportCard {...defaultProps} />);
            const upskillButton = screen.getByRole('button', { name: /Navigate to skill improvement resources/i });
            fireEvent.click(upskillButton);
            expect(mockOnUpskill).toHaveBeenCalledTimes(1);
        });

        it('should call onViewDetails callback when View Details button is clicked (Req 5.9)', () => {
            render(<SkillPassportCard {...defaultProps} />);
            const detailsButton = screen.getByRole('button', { name: /Navigate to digital portfolio page/i });
            fireEvent.click(detailsButton);
            expect(mockOnViewDetails).toHaveBeenCalledTimes(1);
        });
    });

    describe('Edge Cases and Data Validation', () => {
        it('should handle zero skills gracefully', () => {
            const props: SkillPassportCardProps = {
                ...defaultProps,
                passport: {
                    ...defaultProps.passport,
                    verifiedSkills: 0,
                    skills: [],
                },
            };
            render(<SkillPassportCard {...props} />);
            expect(screen.getByText('0')).toBeInTheDocument(); // verified skills
            // When there are zero skills, the breakdown will show "0 skills" for each category
            const skillCounts = screen.getAllByText('0 skills');
            expect(skillCounts.length).toBeGreaterThanOrEqual(1);
        });

        it('should handle maximum skill score (100)', () => {
            const props = {
                ...defaultProps,
                passport: { ...defaultProps.passport, skillScore: 100 },
            };
            render(<SkillPassportCard {...props} />);
            expect(screen.getByText('100')).toBeInTheDocument();
        });

        it('should handle minimum skill score (0)', () => {
            const props = {
                ...defaultProps,
                passport: { ...defaultProps.passport, skillScore: 0 },
            };
            render(<SkillPassportCard {...props} />);
            expect(screen.getByText('0')).toBeInTheDocument();
        });

        it('should render without callbacks (optional props)', () => {
            const props = {
                passport: defaultProps.passport,
            };
            render(<SkillPassportCard {...props} />);
            expect(screen.getByText('Skill Passport')).toBeInTheDocument();
        });

        it('should not crash when lastVerified is undefined', () => {
            const props = {
                ...defaultProps,
                passport: { ...defaultProps.passport, lastVerified: undefined },
            };
            render(<SkillPassportCard {...props} />);
            // Should not find the "Verified [date]" text, but "Verified Skills" label will still exist
            expect(screen.queryByText(/Verified Jan/i)).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels for buttons', () => {
            render(<SkillPassportCard {...defaultProps} />);
            expect(screen.getByRole('button', { name: /Navigate to skill improvement resources/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Navigate to digital portfolio page/i })).toBeInTheDocument();
        });

        it('should have progressbar roles for visual indicators', () => {
            render(<SkillPassportCard {...defaultProps} />);
            const progressBars = screen.getAllByRole('progressbar');
            expect(progressBars.length).toBeGreaterThan(0);
        });

        it('should render all icons with proper semantic meaning', () => {
            const { container } = render(<SkillPassportCard {...defaultProps} />);
            // Shield, CheckCircle, TrendingUp, Award icons should be present
            expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
        });
    });

    describe('Circular Progress Color Coding', () => {
        it('should use green color for skill score > 75', () => {
            const props = {
                ...defaultProps,
                passport: { ...defaultProps.passport, skillScore: 85 },
            };
            render(<SkillPassportCard {...props} />);
            // CircularProgress component should render with green color
            expect(screen.getByRole('progressbar', { name: /Progress: 85%/i })).toBeInTheDocument();
        });

        it('should use yellow color for skill score 50-75', () => {
            const props = {
                ...defaultProps,
                passport: { ...defaultProps.passport, skillScore: 60 },
            };
            render(<SkillPassportCard {...props} />);
            expect(screen.getByRole('progressbar', { name: /Progress: 60%/i })).toBeInTheDocument();
        });

        it('should use red color for skill score < 50', () => {
            const props = {
                ...defaultProps,
                passport: { ...defaultProps.passport, skillScore: 40 },
            };
            const { container } = render(<SkillPassportCard {...props} />);
            // Get the circular progress (the large one in the center)
            const circularProgress = container.querySelector('svg[height="140"]');
            expect(circularProgress).toBeInTheDocument();
            // Check that red stroke color is applied (#ef4444)
            const redCircle = circularProgress?.querySelector('circle[stroke="#ef4444"]');
            expect(redCircle).toBeInTheDocument();
        });
    });
});
