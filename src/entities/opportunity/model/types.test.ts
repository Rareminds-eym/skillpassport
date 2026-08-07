/**
 * Unit tests for Opportunity and Career Tool type definitions
 * 
 * Tests verify that the types are correctly defined and the CAREER_TOOLS
 * constant contains all required tools.
 */

import { describe, it, expect } from 'vitest';
import type { Opportunity, AIMatchedJob, CareerTool } from './types';
import { CAREER_TOOLS } from './types';

describe('Opportunity Entity Types', () => {
    describe('Opportunity interface', () => {
        it('should accept a valid opportunity object', () => {
            const opportunity: Opportunity = {
                id: 'job-1',
                title: 'Frontend Developer',
                company: 'Tech Corp',
                location: 'San Francisco, CA',
                employmentType: 'full-time',
                postedDate: new Date('2024-01-15'),
                sector: 'Technology',
                salary: '$80,000 - $120,000',
                description: 'Build amazing web applications'
            };

            expect(opportunity.id).toBe('job-1');
            expect(opportunity.employmentType).toBe('full-time');
        });

        it('should accept opportunity without optional fields', () => {
            const opportunity: Opportunity = {
                id: 'job-2',
                title: 'Software Engineer Intern',
                company: 'StartUp Inc',
                location: 'Remote',
                employmentType: 'internship',
                postedDate: new Date('2024-02-01')
            };

            expect(opportunity.sector).toBeUndefined();
            expect(opportunity.salary).toBeUndefined();
            expect(opportunity.description).toBeUndefined();
        });
    });

    describe('AIMatchedJob interface', () => {
        it('should extend Opportunity with AI matching data', () => {
            const matchedJob: AIMatchedJob = {
                id: 'job-3',
                title: 'Full Stack Developer',
                company: 'Web Solutions',
                location: 'New York, NY',
                employmentType: 'full-time',
                postedDate: new Date('2024-01-20'),
                matchScore: 85,
                matchReasons: [
                    'Strong match with your React skills',
                    'Your Node.js experience aligns well'
                ],
                skillsMatched: ['React', 'Node.js', 'TypeScript'],
                skillsGap: ['AWS', 'Docker'],
                isAIRecommended: true
            };

            expect(matchedJob.matchScore).toBe(85);
            expect(matchedJob.isAIRecommended).toBe(true);
            expect(matchedJob.skillsMatched).toHaveLength(3);
            expect(matchedJob.skillsGap).toHaveLength(2);
        });

        it('should have matchScore between 0 and 100', () => {
            const matchedJob: AIMatchedJob = {
                id: 'job-4',
                title: 'Backend Developer',
                company: 'API Corp',
                location: 'Austin, TX',
                employmentType: 'contract',
                postedDate: new Date(),
                matchScore: 92,
                matchReasons: ['Excellent backend skills'],
                skillsMatched: ['Python', 'PostgreSQL'],
                skillsGap: [],
                isAIRecommended: true
            };

            expect(matchedJob.matchScore).toBeGreaterThanOrEqual(0);
            expect(matchedJob.matchScore).toBeLessThanOrEqual(100);
        });
    });

    describe('CareerTool interface', () => {
        it('should accept a valid career tool object', () => {
            const tool: CareerTool = {
                id: 'test-tool',
                name: 'Test Career Tool',
                description: 'A tool for testing',
                icon: 'test-icon',
                category: 'assessment',
                requiresSubscription: false,
                path: '/learner/career-ai/test',
                estimatedTime: '5 mins'
            };

            expect(tool.category).toBe('assessment');
            expect(tool.requiresSubscription).toBe(false);
        });

        it('should accept tool without optional estimatedTime', () => {
            const tool: CareerTool = {
                id: 'simple-tool',
                name: 'Simple Tool',
                description: 'No time estimate',
                icon: 'icon',
                category: 'guidance',
                requiresSubscription: true,
                path: '/learner/career-ai/simple'
            };

            expect(tool.estimatedTime).toBeUndefined();
        });
    });

    describe('CAREER_TOOLS constant', () => {
        it('should contain exactly 7 career tools', () => {
            expect(CAREER_TOOLS).toHaveLength(7);
        });

        it('should include all required tools by ID', () => {
            const toolIds = CAREER_TOOLS.map(tool => tool.id);

            expect(toolIds).toContain('skill-gap');
            expect(toolIds).toContain('resume-review');
            expect(toolIds).toContain('interview-prep');
            expect(toolIds).toContain('learning-path');
            expect(toolIds).toContain('networking');
            expect(toolIds).toContain('career-guidance');
            expect(toolIds).toContain('career-advice');
        });

        it('should include all required tools by name', () => {
            const toolNames = CAREER_TOOLS.map(tool => tool.name);

            expect(toolNames).toContain('Skill Gap Analysis');
            expect(toolNames).toContain('Resume Review');
            expect(toolNames).toContain('Interview Prep');
            expect(toolNames).toContain('Learning Path');
            expect(toolNames).toContain('Networking Tips');
            expect(toolNames).toContain('Career Guidance');
            expect(toolNames).toContain('Career Advice');
        });

        it('should have correct paths for all tools', () => {
            CAREER_TOOLS.forEach(tool => {
                expect(tool.path).toMatch(/^\/learner\/career-ai\/.+/);
            });
        });

        it('should have valid categories for all tools', () => {
            const validCategories: CareerTool['category'][] = ['assessment', 'preparation', 'guidance'];

            CAREER_TOOLS.forEach(tool => {
                expect(validCategories).toContain(tool.category);
            });
        });

        it('should have descriptions for all tools', () => {
            CAREER_TOOLS.forEach(tool => {
                expect(tool.description).toBeTruthy();
                expect(tool.description.length).toBeGreaterThan(0);
            });
        });

        it('should have icons for all tools', () => {
            CAREER_TOOLS.forEach(tool => {
                expect(tool.icon).toBeTruthy();
                expect(tool.icon.length).toBeGreaterThan(0);
            });
        });

        it('should have requiresSubscription flag for all tools', () => {
            CAREER_TOOLS.forEach(tool => {
                expect(typeof tool.requiresSubscription).toBe('boolean');
            });
        });

        it('should categorize Skill Gap Analysis as assessment', () => {
            const skillGapTool = CAREER_TOOLS.find(tool => tool.id === 'skill-gap');
            expect(skillGapTool?.category).toBe('assessment');
        });

        it('should categorize Resume Review and Interview Prep as preparation', () => {
            const resumeTool = CAREER_TOOLS.find(tool => tool.id === 'resume-review');
            const interviewTool = CAREER_TOOLS.find(tool => tool.id === 'interview-prep');

            expect(resumeTool?.category).toBe('preparation');
            expect(interviewTool?.category).toBe('preparation');
        });

        it('should categorize guidance tools correctly', () => {
            const guidanceTools = CAREER_TOOLS.filter(tool => tool.category === 'guidance');
            const guidanceIds = guidanceTools.map(tool => tool.id);

            expect(guidanceIds).toContain('learning-path');
            expect(guidanceIds).toContain('networking');
            expect(guidanceIds).toContain('career-guidance');
            expect(guidanceIds).toContain('career-advice');
        });
    });

    describe('Type validation', () => {
        it('should only allow valid employment types for Opportunity', () => {
            const validTypes: Opportunity['employmentType'][] = ['full-time', 'internship', 'contract'];

            validTypes.forEach(type => {
                const opp: Opportunity = {
                    id: '1',
                    title: 'Test',
                    company: 'Test Co',
                    location: 'Test City',
                    employmentType: type,
                    postedDate: new Date()
                };
                expect(opp.employmentType).toBe(type);
            });
        });

        it('should only allow valid categories for CareerTool', () => {
            const validCategories: CareerTool['category'][] = ['assessment', 'preparation', 'guidance'];

            validCategories.forEach(category => {
                const tool: CareerTool = {
                    id: 'test',
                    name: 'Test',
                    description: 'Test',
                    icon: 'test',
                    category: category,
                    requiresSubscription: false,
                    path: '/test'
                };
                expect(tool.category).toBe(category);
            });
        });
    });
});
