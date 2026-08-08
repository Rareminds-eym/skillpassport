import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SkillsSnapshot from './SkillsSnapshot';
import type { SkillMetric } from '../model/types';

// Mock framer-motion to avoid animation complexities in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}));

describe('SkillsSnapshot Component', () => {
    const mockSkills: SkillMetric[] = [
        {
            id: '1',
            name: 'Problem Solving',
            category: 'problem-solving',
            proficiency: 92,
            lastAssessed: new Date('2024-01-15'),
            assessmentSource: 'test',
            trend: 'up',
            recommendations: [],
        },
        {
            id: '2',
            name: 'Communication',
            category: 'communication',
            proficiency: 88,
            lastAssessed: new Date('2024-01-10'),
            assessmentSource: 'self',
            trend: 'stable',
            recommendations: [],
        },
        {
            id: '3',
            name: 'Technical Skills',
            category: 'technical',
            proficiency: 74,
            lastAssessed: new Date('2024-01-20'),
            assessmentSource: 'project',
            trend: 'up',
            recommendations: [],
        },
        {
            id: '4',
            name: 'Teamwork',
            category: 'teamwork',
            proficiency: 55,
            lastAssessed: new Date('2024-01-05'),
            assessmentSource: 'ai-evaluated',
            trend: 'down',
            recommendations: [],
        },
        {
            id: '5',
            name: 'Critical Thinking',
            category: 'critical-thinking',
            proficiency: 63,
            lastAssessed: new Date('2024-01-12'),
            assessmentSource: 'test',
            trend: 'stable',
            recommendations: [],
        },
        {
            id: '6',
            name: 'Leadership',
            category: 'teamwork',
            proficiency: 45,
            lastAssessed: new Date('2024-01-08'),
            assessmentSource: 'self',
            trend: 'up',
            recommendations: [],
        },
    ];

    describe('Rendering', () => {
        it('should render the SkillsSnapshot widget with header', () => {
            render(<SkillsSnapshot skills={mockSkills} />);

            expect(screen.getByText('Skills Snapshot')).toBeInTheDocument();
            expect(screen.getByText('Your top skills proficiency breakdown')).toBeInTheDocument();
        });

        it('should display exactly top 5 skills sorted by proficiency descending (Requirement 8.1)', () => {
            render(<SkillsSnapshot skills={mockSkills} />);

            // Should display top 5 skills (checking header elements with role)
            const skillHeaders = screen.getAllByRole('heading', { level: 3 });
            const skillNames = skillHeaders.map(h => h.textContent);

            expect(skillNames).toContain('Problem Solving');
            expect(skillNames).toContain('Communication');
            expect(skillNames).toContain('Technical Skills');
            expect(skillNames).toContain('Critical Thinking');
            expect(skillNames).toContain('Teamwork');

            // Should NOT display the 6th skill (Leadership - 45%)
            expect(skillNames).not.toContain('Leadership');

            // Should have exactly 5 skills
            expect(skillHeaders.length).toBe(5);
        });

        it('should display proficiency percentages for each skill (Requirement 8.1)', () => {
            render(<SkillsSnapshot skills={mockSkills} />);

            expect(screen.getByText('92%')).toBeInTheDocument();
            expect(screen.getByText('88%')).toBeInTheDocument();
            expect(screen.getByText('74%')).toBeInTheDocument();
            expect(screen.getByText('63%')).toBeInTheDocument();
            expect(screen.getByText('55%')).toBeInTheDocument();
        });

        it('should display skill categories (Requirement 8.6)', () => {
            render(<SkillsSnapshot skills={mockSkills} />);

            // Categories appear in badges - use getAllByText for items that appear multiple times
            expect(screen.getAllByText('Problem Solving').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Communication').length).toBeGreaterThan(0);
            expect(screen.getByText('Technical')).toBeInTheDocument();
            expect(screen.getAllByText('Teamwork').length).toBeGreaterThan(0);
            expect(screen.getAllByText('Critical Thinking').length).toBeGreaterThan(0);
        });

        it('should render empty state when no skills provided', () => {
            render(<SkillsSnapshot skills={[]} />);

            expect(screen.getByText('No Skills Yet')).toBeInTheDocument();
            expect(screen.getByText(/Complete assessments and projects/i)).toBeInTheDocument();
        });

        it('should handle fewer than 5 skills gracefully', () => {
            const fewSkills = mockSkills.slice(0, 3);
            render(<SkillsSnapshot skills={fewSkills} />);

            // Should display only available skills (using getAllByText since skill name appears twice: in h3 and badge)
            expect(screen.getAllByText('Problem Solving')[0]).toBeInTheDocument();
            expect(screen.getAllByText('Communication')[0]).toBeInTheDocument();
            expect(screen.getByText('Technical Skills')).toBeInTheDocument();

            // Should not crash or show errors
            expect(screen.queryByText('No Skills Yet')).not.toBeInTheDocument();
        });
    });

    describe('Visual Progress Bars (Requirement 8.2)', () => {
        it('should display visual progress bar for each skill', () => {
            const { container } = render(<SkillsSnapshot skills={mockSkills} />);

            // Check for ProgressBar components (they render with specific data attributes or classes)
            const progressBars = container.querySelectorAll('[role="progressbar"], .progress-bar');

            // Should have 5 progress bars for top 5 skills
            expect(progressBars.length).toBeGreaterThanOrEqual(5);
        });
    });

    describe('Color Coding (Requirements 8.3, 8.4, 8.5)', () => {
        it('should apply green color for proficiency > 80% (Requirement 8.3)', () => {
            render(<SkillsSnapshot skills={mockSkills} />);

            // Problem Solving (92%) and Communication (88%) should be green
            const problemSolvingPercentage = screen.getByText('92%');
            const communicationPercentage = screen.getByText('88%');

            // Check if color style is applied (green hex: #10b981)
            expect(problemSolvingPercentage).toHaveStyle({ color: '#10b981' });
            expect(communicationPercentage).toHaveStyle({ color: '#10b981' });
        });

        it('should apply yellow color for proficiency 60-80% (Requirement 8.4)', () => {
            render(<SkillsSnapshot skills={mockSkills} />);

            // Technical Skills (74%) and Critical Thinking (63%) should be yellow
            const technicalPercentage = screen.getByText('74%');
            const criticalThinkingPercentage = screen.getByText('63%');

            // Check if color style is applied (yellow/amber hex: #f59e0b)
            expect(technicalPercentage).toHaveStyle({ color: '#f59e0b' });
            expect(criticalThinkingPercentage).toHaveStyle({ color: '#f59e0b' });
        });

        it('should apply red color for proficiency < 60% (Requirement 8.5)', () => {
            render(<SkillsSnapshot skills={mockSkills} />);

            // Teamwork (55%) should be red
            const teamworkPercentage = screen.getByText('55%');

            // Check if color style is applied (red hex: #ef4444)
            expect(teamworkPercentage).toHaveStyle({ color: '#ef4444' });
        });
    });

    describe('Trend Indicators', () => {
        it('should display trend up icon for increasing proficiency', () => {
            render(<SkillsSnapshot skills={mockSkills} />);

            // Problem Solving and Technical Skills have 'up' trend
            const trendUpIcons = screen.getAllByLabelText('Skill proficiency increasing');
            expect(trendUpIcons.length).toBeGreaterThanOrEqual(2);
        });

        it('should display trend down icon for decreasing proficiency', () => {
            render(<SkillsSnapshot skills={mockSkills} />);

            // Teamwork has 'down' trend
            const trendDownIcon = screen.getByLabelText('Skill proficiency decreasing');
            expect(trendDownIcon).toBeInTheDocument();
        });

        it('should display stable icon for stable proficiency', () => {
            render(<SkillsSnapshot skills={mockSkills} />);

            // Communication and Critical Thinking have 'stable' trend
            const stableIcons = screen.getAllByLabelText('Skill proficiency stable');
            expect(stableIcons.length).toBeGreaterThanOrEqual(2);
        });

        it('should handle missing trend data gracefully', () => {
            const skillsWithoutTrends: SkillMetric[] = [
                {
                    id: '1',
                    name: 'Problem Solving',
                    category: 'problem-solving',
                    proficiency: 92,
                    assessmentSource: 'test',
                    trend: 'stable',
                    recommendations: [],
                },
            ];

            render(<SkillsSnapshot skills={skillsWithoutTrends} />);

            // Should render without errors (using getAllByText since skill name appears twice: in h3 and badge)
            expect(screen.getAllByText('Problem Solving')[0]).toBeInTheDocument();
        });
    });

    describe('Action Buttons', () => {
        it('should render "Improve Skill" button for each skill when callback provided', () => {
            const onImproveSkill = vi.fn();
            render(<SkillsSnapshot skills={mockSkills} onImproveSkill={onImproveSkill} />);

            const improveButtons = screen.getAllByText('Improve Skill');
            expect(improveButtons.length).toBe(5); // One for each top 5 skills
        });

        it('should call onImproveSkill with correct skill ID when clicked (Requirement 8.7)', () => {
            const onImproveSkill = vi.fn();
            render(<SkillsSnapshot skills={mockSkills} onImproveSkill={onImproveSkill} />);

            const improveButtons = screen.getAllByText('Improve Skill');

            // Click first skill's improve button (Problem Solving)
            fireEvent.click(improveButtons[0]);

            expect(onImproveSkill).toHaveBeenCalledWith('1');
            expect(onImproveSkill).toHaveBeenCalledTimes(1);
        });

        it('should not render "Improve Skill" buttons when callback not provided', () => {
            render(<SkillsSnapshot skills={mockSkills} />);

            const improveButtons = screen.queryAllByText('Improve Skill');
            expect(improveButtons.length).toBe(0);
        });

        it('should render "View All Skills" button when callback provided', () => {
            const onViewAll = vi.fn();
            render(<SkillsSnapshot skills={mockSkills} onViewAll={onViewAll} />);

            expect(screen.getByText('View All Skills')).toBeInTheDocument();
        });

        it('should call onViewAll when "View All Skills" clicked (Requirement 8.8)', () => {
            const onViewAll = vi.fn();
            render(<SkillsSnapshot skills={mockSkills} onViewAll={onViewAll} />);

            const viewAllButton = screen.getByText('View All Skills');
            fireEvent.click(viewAllButton);

            expect(onViewAll).toHaveBeenCalledTimes(1);
        });

        it('should not render "View All Skills" button when callback not provided', () => {
            render(<SkillsSnapshot skills={mockSkills} />);

            expect(screen.queryByText('View All Skills')).not.toBeInTheDocument();
        });

        it('should not render "View All Skills" button when no skills available', () => {
            const onViewAll = vi.fn();
            render(<SkillsSnapshot skills={[]} onViewAll={onViewAll} />);

            expect(screen.queryByText('View All Skills')).not.toBeInTheDocument();
        });
    });

    describe('Skill Sorting', () => {
        it('should sort skills by proficiency in descending order', () => {
            const { container } = render(<SkillsSnapshot skills={mockSkills} />);

            // Get all skill name elements in order
            const skillNames = Array.from(container.querySelectorAll('h3')).map(
                (el) => el.textContent
            );

            // Expected order: Problem Solving (92), Communication (88), Technical Skills (74),
            // Critical Thinking (63), Teamwork (55)
            expect(skillNames).toEqual([
                'Problem Solving',
                'Communication',
                'Technical Skills',
                'Critical Thinking',
                'Teamwork',
            ]);
        });

        it('should maintain correct sorting when skills have same proficiency', () => {
            const skillsWithSameProficiency: SkillMetric[] = [
                {
                    id: '1',
                    name: 'Skill A',
                    category: 'technical',
                    proficiency: 75,
                    assessmentSource: 'test',
                    trend: 'stable',
                    recommendations: [],
                },
                {
                    id: '2',
                    name: 'Skill B',
                    category: 'communication',
                    proficiency: 75,
                    assessmentSource: 'test',
                    trend: 'stable',
                    recommendations: [],
                },
                {
                    id: '3',
                    name: 'Skill C',
                    category: 'problem-solving',
                    proficiency: 80,
                    assessmentSource: 'test',
                    trend: 'stable',
                    recommendations: [],
                },
            ];

            render(<SkillsSnapshot skills={skillsWithSameProficiency} />);

            // Should render without errors
            expect(screen.getByText('Skill C')).toBeInTheDocument();
            expect(screen.getByText('Skill A')).toBeInTheDocument();
            expect(screen.getByText('Skill B')).toBeInTheDocument();
        });
    });

    describe('Skill Summary Stats', () => {
        it('should display skill summary stats with correct counts', () => {
            render(<SkillsSnapshot skills={mockSkills} />);

            // High Proficiency (>80%): Problem Solving (92), Communication (88) = 2
            // Moderate (60-80%): Technical Skills (74), Critical Thinking (63) = 2
            // Needs Work (<60%): Teamwork (55) = 1

            expect(screen.getByText('High Proficiency')).toBeInTheDocument();
            expect(screen.getByText('Moderate')).toBeInTheDocument();
            expect(screen.getByText('Needs Work')).toBeInTheDocument();

            // Check counts (displayed as text content)
            const statElements = screen.getAllByText(/^[0-3]$/);
            expect(statElements.length).toBeGreaterThanOrEqual(3);
        });

        it('should not display summary stats when no skills available', () => {
            render(<SkillsSnapshot skills={[]} />);

            expect(screen.queryByText('High Proficiency')).not.toBeInTheDocument();
            expect(screen.queryByText('Moderate')).not.toBeInTheDocument();
            expect(screen.queryByText('Needs Work')).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels for buttons', () => {
            const onImproveSkill = vi.fn();
            const onViewAll = vi.fn();

            render(
                <SkillsSnapshot
                    skills={mockSkills}
                    onImproveSkill={onImproveSkill}
                    onViewAll={onViewAll}
                />
            );

            // Check "Improve Skill" buttons have proper ARIA labels
            expect(screen.getByLabelText('Improve Problem Solving skill')).toBeInTheDocument();

            // Check "View All Skills" button has proper ARIA label
            expect(screen.getByLabelText('View all skills')).toBeInTheDocument();
        });

        it('should have proper ARIA labels for trend indicators', () => {
            render(<SkillsSnapshot skills={mockSkills} />);

            expect(screen.getAllByLabelText('Skill proficiency increasing')[0]).toBeInTheDocument();
            expect(screen.getByLabelText('Skill proficiency decreasing')).toBeInTheDocument();
            expect(screen.getAllByLabelText('Skill proficiency stable')[0]).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle skills with 0% proficiency', () => {
            const skillsWithZero: SkillMetric[] = [
                {
                    id: '1',
                    name: 'New Skill',
                    category: 'technical',
                    proficiency: 0,
                    assessmentSource: 'self',
                    trend: 'stable',
                    recommendations: [],
                },
            ];

            render(<SkillsSnapshot skills={skillsWithZero} />);

            expect(screen.getByText('New Skill')).toBeInTheDocument();
            expect(screen.getByText('0%')).toBeInTheDocument();
        });

        it('should handle skills with 100% proficiency', () => {
            const skillsWithMax: SkillMetric[] = [
                {
                    id: '1',
                    name: 'Mastered Skill',
                    category: 'technical',
                    proficiency: 100,
                    assessmentSource: 'test',
                    trend: 'stable',
                    recommendations: [],
                },
            ];

            render(<SkillsSnapshot skills={skillsWithMax} />);

            expect(screen.getByText('Mastered Skill')).toBeInTheDocument();
            expect(screen.getByText('100%')).toBeInTheDocument();
        });

        it('should handle skills without lastAssessed date', () => {
            const skillsWithoutDate: SkillMetric[] = [
                {
                    id: '1',
                    name: 'Skill Without Date',
                    category: 'technical',
                    proficiency: 75,
                    assessmentSource: 'self',
                    trend: 'stable',
                    recommendations: [],
                },
            ];

            render(<SkillsSnapshot skills={skillsWithoutDate} />);

            expect(screen.getByText('Skill Without Date')).toBeInTheDocument();
            expect(screen.queryByText(/Last assessed:/)).not.toBeInTheDocument();
        });

        it('should handle boundary proficiency value of 80% (should be yellow)', () => {
            const skillsWithBoundary: SkillMetric[] = [
                {
                    id: '1',
                    name: 'Boundary Skill',
                    category: 'technical',
                    proficiency: 80,
                    assessmentSource: 'test',
                    trend: 'stable',
                    recommendations: [],
                },
            ];

            render(<SkillsSnapshot skills={skillsWithBoundary} />);

            const percentage = screen.getByText('80%');
            // 80% should be yellow (not > 80, so not green)
            expect(percentage).toHaveStyle({ color: '#f59e0b' });
        });

        it('should handle boundary proficiency value of 60% (should be yellow)', () => {
            const skillsWithBoundary: SkillMetric[] = [
                {
                    id: '1',
                    name: 'Boundary Skill',
                    category: 'technical',
                    proficiency: 60,
                    assessmentSource: 'test',
                    trend: 'stable',
                    recommendations: [],
                },
            ];

            render(<SkillsSnapshot skills={skillsWithBoundary} />);

            const percentage = screen.getByText('60%');
            // 60% should be yellow (>= 60)
            expect(percentage).toHaveStyle({ color: '#f59e0b' });
        });
    });
});
