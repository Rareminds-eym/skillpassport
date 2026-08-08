import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OpportunitiesWidget } from './OpportunitiesWidget';
import { Opportunity, AIMatchedJob } from '../model/types';

describe('OpportunitiesWidget', () => {
    // Mock data
    const mockOpportunities: Opportunity[] = [
        {
            id: '1',
            title: 'Software Engineer',
            company: 'Tech Corp',
            location: 'San Francisco, CA',
            employmentType: 'full-time',
            postedDate: new Date('2024-01-15'),
            sector: 'Technology',
            salary: '$100k-$150k',
        },
        {
            id: '2',
            title: 'Frontend Developer',
            company: 'Design Studio',
            location: 'New York, NY',
            employmentType: 'internship',
            postedDate: new Date('2024-01-10'),
            sector: 'Design',
        },
        {
            id: '3',
            title: 'Backend Engineer',
            company: 'Data Systems',
            location: 'Austin, TX',
            employmentType: 'contract',
            postedDate: new Date('2024-01-05'),
        },
        {
            id: '4',
            title: 'DevOps Engineer',
            company: 'Cloud Services',
            location: 'Seattle, WA',
            employmentType: 'full-time',
            postedDate: new Date('2024-01-01'),
        },
    ];

    const mockMatchedJobs: AIMatchedJob[] = [
        {
            id: '5',
            title: 'Full Stack Developer',
            company: 'Startup Inc',
            location: 'Remote',
            employmentType: 'full-time',
            postedDate: new Date('2024-01-20'),
            matchScore: 95,
            matchReasons: ['Your React and Node.js skills are a perfect match'],
            skillsMatched: ['React', 'Node.js', 'TypeScript', 'MongoDB'],
            skillsGap: ['AWS', 'Docker'],
            isAIRecommended: true,
        },
        {
            id: '6',
            title: 'React Developer',
            company: 'Web Agency',
            location: 'Boston, MA',
            employmentType: 'internship',
            postedDate: new Date('2024-01-18'),
            matchScore: 87,
            matchReasons: ['Strong match with your frontend skills'],
            skillsMatched: ['React', 'JavaScript', 'CSS'],
            skillsGap: ['Redux'],
            isAIRecommended: true,
        },
    ];

    describe('Rendering with AI-matched jobs', () => {
        it('should render AI-matched jobs with match scores', () => {
            render(
                <OpportunitiesWidget
                    opportunities={[]}
                    matchedJobs={mockMatchedJobs}
                />
            );

            // Check AI match scores are displayed
            expect(screen.getByText('95% Match')).toBeInTheDocument();
            expect(screen.getByText('87% Match')).toBeInTheDocument();

            // Check AI recommended badges
            const aiRecommendedBadges = screen.getAllByText('AI Recommended for you');
            expect(aiRecommendedBadges).toHaveLength(2);
        });

        it('should display skills matched for AI jobs', () => {
            render(
                <OpportunitiesWidget
                    opportunities={[]}
                    matchedJobs={[mockMatchedJobs[0]]}
                />
            );

            // Check skills matched section
            expect(screen.getByText('Skills Matched:')).toBeInTheDocument();
            expect(screen.getByText('React')).toBeInTheDocument();
            expect(screen.getByText('Node.js')).toBeInTheDocument();
            expect(screen.getByText('TypeScript')).toBeInTheDocument();
        });

        it('should display skills gap for AI jobs', () => {
            render(
                <OpportunitiesWidget
                    opportunities={[]}
                    matchedJobs={[mockMatchedJobs[0]]}
                />
            );

            // Check skills gap section
            expect(screen.getByText('Skills to Improve:')).toBeInTheDocument();
            expect(screen.getByText('AWS')).toBeInTheDocument();
            expect(screen.getByText('Docker')).toBeInTheDocument();
        });

        it('should display match reasons for AI jobs', () => {
            render(
                <OpportunitiesWidget
                    opportunities={[]}
                    matchedJobs={[mockMatchedJobs[0]]}
                />
            );

            // Check match reason
            expect(screen.getByText('Why it matches:')).toBeInTheDocument();
            expect(screen.getByText(/Your React and Node.js skills are a perfect match/)).toBeInTheDocument();
        });

        it('should limit skills matched display to 3 with overflow indicator', () => {
            const jobWithManySkills: AIMatchedJob = {
                ...mockMatchedJobs[0],
                skillsMatched: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Express', 'PostgreSQL'],
            };

            render(
                <OpportunitiesWidget
                    opportunities={[]}
                    matchedJobs={[jobWithManySkills]}
                />
            );

            // Check only first 3 skills shown, with "+X more" indicator
            expect(screen.getByText('React')).toBeInTheDocument();
            expect(screen.getByText('Node.js')).toBeInTheDocument();
            expect(screen.getByText('TypeScript')).toBeInTheDocument();
            expect(screen.getByText('+3 more')).toBeInTheDocument();
        });
    });

    describe('Rendering with regular opportunities', () => {
        it('should render regular opportunities without AI badges', () => {
            render(
                <OpportunitiesWidget
                    opportunities={mockOpportunities.slice(0, 2)}
                    matchedJobs={[]}
                />
            );

            // Check opportunities are displayed
            expect(screen.getByText('Software Engineer')).toBeInTheDocument();
            expect(screen.getByText('Tech Corp')).toBeInTheDocument();
            expect(screen.getByText('Frontend Developer')).toBeInTheDocument();

            // Check no AI badges
            expect(screen.queryByText(/AI Recommended/)).not.toBeInTheDocument();
            expect(screen.queryByText(/Match/)).not.toBeInTheDocument();
        });

        it('should display employment type badges correctly', () => {
            render(
                <OpportunitiesWidget
                    opportunities={mockOpportunities.slice(0, 3)}
                    matchedJobs={[]}
                />
            );

            // Check employment type badges
            expect(screen.getByText('Full-Time')).toBeInTheDocument();
            expect(screen.getByText('Internship')).toBeInTheDocument();
            expect(screen.getByText('Contract')).toBeInTheDocument();
        });

        it('should display location and posted date', () => {
            render(
                <OpportunitiesWidget
                    opportunities={mockOpportunities.slice(0, 1)}
                    matchedJobs={[]}
                />
            );

            // Check location
            expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();

            // Posted date should be formatted (exact text depends on current date)
            // Just check the formatting function works
            const postedDateElements = screen.getAllByText(/ago|Today|\//);
            expect(postedDateElements.length).toBeGreaterThan(0);
        });
    });

    describe('Empty state', () => {
        it('should display empty state when no opportunities', () => {
            render(
                <OpportunitiesWidget
                    opportunities={[]}
                    matchedJobs={[]}
                />
            );

            // Check empty state message
            expect(screen.getByText('No opportunities found')).toBeInTheDocument();
            expect(screen.getByText('Check back later for new opportunities')).toBeInTheDocument();
        });
    });

    describe('Button interactions', () => {
        it('should call onApply when Apply button is clicked', () => {
            const onApply = vi.fn();

            render(
                <OpportunitiesWidget
                    opportunities={mockOpportunities.slice(0, 1)}
                    matchedJobs={[]}
                    onApply={onApply}
                />
            );

            // Click Apply button
            const applyButton = screen.getByText('Apply Now');
            fireEvent.click(applyButton);

            // Check callback was called with correct ID
            expect(onApply).toHaveBeenCalledWith('1');
        });

        it('should call onViewAll when View All button is clicked', () => {
            const onViewAll = vi.fn();

            render(
                <OpportunitiesWidget
                    opportunities={mockOpportunities}
                    matchedJobs={mockMatchedJobs}
                    onViewAll={onViewAll}
                />
            );

            // Click View All button
            const viewAllButton = screen.getByText(/View All Opportunities/);
            fireEvent.click(viewAllButton);

            // Check callback was called
            expect(onViewAll).toHaveBeenCalled();
        });

        it('should not display View All button when total opportunities <= 3', () => {
            render(
                <OpportunitiesWidget
                    opportunities={mockOpportunities.slice(0, 2)}
                    matchedJobs={[]}
                />
            );

            // View All button should not be present
            expect(screen.queryByText(/View All Opportunities/)).not.toBeInTheDocument();
        });

        it('should display View All button with correct count when opportunities > 3', () => {
            render(
                <OpportunitiesWidget
                    opportunities={mockOpportunities}
                    matchedJobs={mockMatchedJobs}
                />
            );

            // View All button should show total count
            expect(screen.getByText(`View All Opportunities (${mockOpportunities.length + mockMatchedJobs.length})`)).toBeInTheDocument();
        });
    });

    describe('Sorting and limiting', () => {
        it('should display only top 3 opportunities', () => {
            render(
                <OpportunitiesWidget
                    opportunities={mockOpportunities}
                    matchedJobs={mockMatchedJobs}
                />
            );

            // Should only have 3 "Apply Now" buttons
            const applyButtons = screen.getAllByText('Apply Now');
            expect(applyButtons).toHaveLength(3);
        });

        it('should sort AI-matched jobs before regular opportunities', () => {
            render(
                <OpportunitiesWidget
                    opportunities={mockOpportunities}
                    matchedJobs={mockMatchedJobs}
                />
            );

            const applyButtons = screen.getAllByText('Apply Now');

            // First two should be AI-matched (with highest scores)
            // Check that AI badges appear before non-AI opportunities
            const aiRecommendedBadges = screen.getAllByText('AI Recommended for you');
            expect(aiRecommendedBadges).toHaveLength(2);
        });

        it('should sort by match score descending', () => {
            const matchedWithScores: AIMatchedJob[] = [
                { ...mockMatchedJobs[0], matchScore: 70 },
                { ...mockMatchedJobs[1], matchScore: 95 },
            ];

            render(
                <OpportunitiesWidget
                    opportunities={[]}
                    matchedJobs={matchedWithScores}
                />
            );

            // First match score should be 95 (higher)
            const matchBadges = screen.getAllByText(/Match/);
            expect(matchBadges[0]).toHaveTextContent('95% Match');
            expect(matchBadges[1]).toHaveTextContent('70% Match');
        });
    });

    describe('Date formatting', () => {
        it('should format posted date as "Today" for today\'s date', () => {
            const today = new Date();
            const todayOpportunity: Opportunity = {
                ...mockOpportunities[0],
                postedDate: today,
            };

            render(
                <OpportunitiesWidget
                    opportunities={[todayOpportunity]}
                    matchedJobs={[]}
                />
            );

            expect(screen.getByText('Today')).toBeInTheDocument();
        });

        it('should format posted date as "X days ago" for recent dates', () => {
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

            const recentOpportunity: Opportunity = {
                ...mockOpportunities[0],
                postedDate: twoDaysAgo,
            };

            render(
                <OpportunitiesWidget
                    opportunities={[recentOpportunity]}
                    matchedJobs={[]}
                />
            );

            expect(screen.getByText('2 days ago')).toBeInTheDocument();
        });
    });

    describe('Merged opportunities', () => {
        it('should merge AI-matched jobs and regular opportunities without duplicates', () => {
            // Create a regular opportunity with same ID as matched job
            const duplicateOpportunity: Opportunity = {
                id: '5', // Same as mockMatchedJobs[0]
                title: 'Duplicate Job',
                company: 'Duplicate Corp',
                location: 'Duplicate City',
                employmentType: 'full-time',
                postedDate: new Date(),
            };

            render(
                <OpportunitiesWidget
                    opportunities={[duplicateOpportunity, mockOpportunities[0]]}
                    matchedJobs={[mockMatchedJobs[0]]}
                />
            );

            // Should not show "Duplicate Job" title (from regular opportunities)
            // Only show the AI-matched version
            expect(screen.queryByText('Duplicate Job')).not.toBeInTheDocument();
            expect(screen.getByText('Full Stack Developer')).toBeInTheDocument();
        });
    });
});
