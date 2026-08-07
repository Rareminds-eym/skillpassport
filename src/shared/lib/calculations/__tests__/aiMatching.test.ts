/**
 * Unit tests for AI Job Matching Algorithm
 * 
 * Tests cover:
 * - Core matching algorithm logic
 * - Score calculation (skill match + proficiency bonus)
 * - Edge cases (empty arrays, no matches, partial matches)
 * - Filtering (>= 40% threshold)
 * - Sorting (descending by match score)
 * - Top 10 limit
 * - Match reasons generation
 * - Skills gap identification
 * 
 * **Validates Requirements**: 11.1-11.10, 7.4-7.6
 */

import { describe, it, expect } from 'vitest';
import { matchOpportunitiesWithAI } from '../aiMatching';
import type { Opportunity } from '../../../../entities/opportunity/model/types';
import type { SkillDataExtended } from '../../../../entities/learner/model/types';

// Helper function to create a skill with default values
function createSkill(
    name: string,
    proficiency: number,
    overrides?: Partial<SkillDataExtended>
): SkillDataExtended {
    return {
        learnerId: 'L123',
        skillId: `S-${name}`,
        skillName: name,
        category: 'technical',
        proficiency,
        verified: true,
        lastAssessed: new Date(),
        assessmentSource: 'test',
        healthStatus: proficiency > 75 ? 'healthy' : proficiency > 50 ? 'upskill' : 'critical',
        trend: 'stable',
        recommendations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides
    };
}

// Helper function to create an opportunity with required skills
function createOpportunity(
    id: string,
    title: string,
    requiredSkills: string[],
    overrides?: Partial<Opportunity>
): Opportunity & { requiredSkills: string[] } {
    return {
        id,
        title,
        company: 'TechCorp',
        location: 'Remote',
        employmentType: 'full-time',
        postedDate: new Date(),
        requiredSkills,
        ...overrides
    };
}

describe('matchOpportunitiesWithAI', () => {
    describe('Edge Cases', () => {
        it('should return empty array when opportunities array is empty', () => {
            const learnerSkills = [createSkill('JavaScript', 85)];
            const result = matchOpportunitiesWithAI([], learnerSkills);
            expect(result).toEqual([]);
        });

        it('should return empty array when learner skills array is empty', () => {
            const opportunities = [createOpportunity('1', 'Frontend Dev', ['JavaScript'])];
            const result = matchOpportunitiesWithAI(opportunities, []);
            expect(result).toEqual([]);
        });

        it('should return empty array when both arrays are empty', () => {
            const result = matchOpportunitiesWithAI([], []);
            expect(result).toEqual([]);
        });

        it('should skip opportunities without requiredSkills property', () => {
            const opportunities = [
                { ...createOpportunity('1', 'Frontend Dev', []), requiredSkills: undefined as any }
            ];
            const learnerSkills = [createSkill('JavaScript', 85)];
            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);
            expect(result).toEqual([]);
        });

        it('should skip opportunities with empty requiredSkills array', () => {
            const opportunities = [createOpportunity('1', 'Frontend Dev', [])];
            const learnerSkills = [createSkill('JavaScript', 85)];
            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);
            expect(result).toEqual([]);
        });
    });

    describe('Match Score Calculation', () => {
        it('should calculate correct match score with 100% skill match and high proficiency', () => {
            const opportunities = [
                createOpportunity('1', 'JavaScript Developer', ['JavaScript', 'React'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 90),
                createSkill('React', 85)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            // Expected: (2/2 * 100 * 0.8) + ((90+85)/2 * 0.2) = 80 + 17.5 = 97.5 ≈ 98
            expect(result[0].matchScore).toBe(98);
        });

        it('should calculate correct match score with 50% skill match', () => {
            const opportunities = [
                createOpportunity('1', 'Full Stack Dev', ['JavaScript', 'React', 'Node.js', 'MongoDB'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 80),
                createSkill('React', 75)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            // Expected: (2/4 * 100 * 0.8) + ((80+75)/2 * 0.2) = 40 + 15.5 = 55.5 ≈ 56
            expect(result[0].matchScore).toBe(56);
        });

        it('should filter out jobs with 25% skill match (below 40% threshold)', () => {
            const opportunities = [
                createOpportunity('1', 'Senior Dev', ['JavaScript', 'React', 'Node.js', 'AWS'])
            ];
            const learnerSkills = [createSkill('JavaScript', 70)];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            // Expected: (1/4 * 100 * 0.8) + (70 * 0.2) = 20 + 14 = 34
            // This is below 40 threshold, so it should be filtered out
            expect(result).toHaveLength(0);
        });

        it('should cap match score at 100', () => {
            const opportunities = [
                createOpportunity('1', 'JavaScript Developer', ['JavaScript'])
            ];
            const learnerSkills = [createSkill('JavaScript', 100)];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            // Expected: (1/1 * 100 * 0.8) + (100 * 0.2) = 80 + 20 = 100
            expect(result[0].matchScore).toBe(100);
        });

        it('should handle case-insensitive skill matching', () => {
            const opportunities = [
                createOpportunity('1', 'Frontend Dev', ['javascript', 'REACT', 'TypeScript'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 85),
                createSkill('React', 80),
                createSkill('typescript', 75)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            expect(result[0].matchScore).toBeGreaterThan(80);
            expect(result[0].skillsMatched).toHaveLength(3);
        });

        it('should trim whitespace when matching skills', () => {
            const opportunities = [
                createOpportunity('1', 'Frontend Dev', [' JavaScript ', '  React'])
            ];
            const learnerSkills = [
                createSkill('JavaScript  ', 85),
                createSkill(' React', 80)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            expect(result[0].skillsMatched).toHaveLength(2);
        });
    });

    describe('Filtering by 40% Threshold', () => {
        it('should filter out jobs with match score below 40%', () => {
            const opportunities = [
                createOpportunity('1', 'Low Match Job', ['JavaScript', 'React', 'Node.js', 'AWS', 'Docker'])
            ];
            const learnerSkills = [createSkill('JavaScript', 60)];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            // Expected: (1/5 * 100 * 0.8) + (60 * 0.2) = 16 + 12 = 28 < 40
            expect(result).toHaveLength(0);
        });

        it('should include jobs with match score exactly 40%', () => {
            const opportunities = [
                createOpportunity('1', 'Threshold Job', ['JavaScript', 'React', 'Node.js'])
            ];
            // Need to find proficiency that gives exactly 40
            // (1/3 * 100 * 0.8) + (X * 0.2) = 40
            // 26.67 + (X * 0.2) = 40
            // X * 0.2 = 13.33
            // X = 66.67
            const learnerSkills = [createSkill('JavaScript', 67)];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            // Result should be around 40
            expect(result).toHaveLength(1);
            expect(result[0].matchScore).toBeGreaterThanOrEqual(40);
        });

        it('should include jobs with match score just above 40%', () => {
            const opportunities = [
                createOpportunity('1', 'Border Job', ['JavaScript', 'React'])
            ];
            const learnerSkills = [createSkill('JavaScript', 50)];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            // Expected: (1/2 * 100 * 0.8) + (50 * 0.2) = 40 + 10 = 50
            expect(result).toHaveLength(1);
            expect(result[0].matchScore).toBe(50);
        });
    });

    describe('Skills Matched and Skills Gap', () => {
        it('should correctly identify matched skills', () => {
            const opportunities = [
                createOpportunity('1', 'Full Stack Dev', ['JavaScript', 'React', 'Node.js', 'MongoDB'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 85),
                createSkill('React', 80),
                createSkill('Python', 75) // Not required
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            expect(result[0].skillsMatched).toEqual(['JavaScript', 'React']);
            expect(result[0].skillsMatched).toHaveLength(2);
        });

        it('should correctly identify skills gap', () => {
            const opportunities = [
                createOpportunity('1', 'Full Stack Dev', ['JavaScript', 'React', 'Node.js', 'MongoDB'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 85),
                createSkill('React', 80)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            expect(result[0].skillsGap).toEqual(['Node.js', 'MongoDB']);
            expect(result[0].skillsGap).toHaveLength(2);
        });

        it('should have empty skills gap when all skills are matched', () => {
            const opportunities = [
                createOpportunity('1', 'JavaScript Dev', ['JavaScript', 'React'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 85),
                createSkill('React', 80)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            expect(result[0].skillsGap).toEqual([]);
        });

        it('should preserve original casing from job for matched skills', () => {
            const opportunities = [
                createOpportunity('1', 'Frontend Dev', ['JavaScript', 'React', 'TypeScript'])
            ];
            const learnerSkills = [
                createSkill('javascript', 85),
                createSkill('REACT', 80),
                createSkill('typescript', 75)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            // Should use job's casing, not learner's
            expect(result[0].skillsMatched).toEqual(['JavaScript', 'React', 'TypeScript']);
        });
    });

    describe('Match Reasons Generation', () => {
        it('should generate match reasons for jobs', () => {
            const opportunities = [
                createOpportunity('1', 'Frontend Dev', ['JavaScript', 'React'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 90),
                createSkill('React', 85)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            expect(result[0].matchReasons).toBeDefined();
            expect(Array.isArray(result[0].matchReasons)).toBe(true);
            expect(result[0].matchReasons.length).toBeGreaterThan(0);
        });

        it('should include "Excellent skills match" reason for >=75% match', () => {
            const opportunities = [
                createOpportunity('1', 'Frontend Dev', ['JavaScript', 'React', 'CSS', 'HTML'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 85),
                createSkill('React', 80),
                createSkill('CSS', 75)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            expect(result[0].matchReasons.some(reason =>
                reason.includes('Excellent') || reason.includes('excellent')
            )).toBe(true);
        });

        it('should include "Good skills alignment" reason for 50-74% match', () => {
            const opportunities = [
                createOpportunity('1', 'Full Stack Dev', ['JavaScript', 'React', 'Node.js', 'MongoDB'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 85),
                createSkill('React', 80)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            expect(result[0].matchReasons.some(reason =>
                reason.includes('Good') || reason.includes('good')
            )).toBe(true);
        });

        it('should highlight strong skills (proficiency > 80) in match reasons', () => {
            const opportunities = [
                createOpportunity('1', 'Frontend Dev', ['JavaScript', 'React'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 92),
                createSkill('React', 88)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            expect(result[0].matchReasons.some(reason =>
                reason.includes('Strong') || reason.includes('expertise')
            )).toBe(true);
        });

        it('should limit match reasons to 4 or fewer', () => {
            const opportunities = [
                createOpportunity('1', 'Frontend Dev', ['JavaScript', 'React', 'CSS'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 90),
                createSkill('React', 85),
                createSkill('CSS', 80)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            expect(result[0].matchReasons.length).toBeLessThanOrEqual(4);
        });
    });

    describe('Sorting by Match Score', () => {
        it('should sort results by match score in descending order', () => {
            const opportunities = [
                createOpportunity('1', 'Job Low Match', ['JavaScript', 'React', 'Node.js', 'MongoDB']),
                createOpportunity('2', 'Job High Match', ['JavaScript', 'React']),
                createOpportunity('3', 'Job Medium Match', ['JavaScript', 'React', 'CSS'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 85),
                createSkill('React', 80),
                createSkill('CSS', 75)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result.length).toBeGreaterThan(0);

            // Verify descending order
            for (let i = 0; i < result.length - 1; i++) {
                expect(result[i].matchScore).toBeGreaterThanOrEqual(result[i + 1].matchScore);
            }

            // Job 2 should be first (100% match with 2 skills)
            expect(result[0].id).toBe('2');
        });

        it('should maintain stable sort for jobs with same match score', () => {
            const opportunities = [
                createOpportunity('1', 'Job A', ['JavaScript', 'React']),
                createOpportunity('2', 'Job B', ['JavaScript', 'React']),
                createOpportunity('3', 'Job C', ['JavaScript', 'React'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 85),
                createSkill('React', 80)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(3);
            // All should have same match score
            expect(result[0].matchScore).toBe(result[1].matchScore);
            expect(result[1].matchScore).toBe(result[2].matchScore);
        });
    });

    describe('Top 10 Limit', () => {
        it('should return maximum of 10 results', () => {
            const opportunities = Array.from({ length: 15 }, (_, i) =>
                createOpportunity(`${i + 1}`, `Job ${i + 1}`, ['JavaScript', 'React'])
            );
            const learnerSkills = [
                createSkill('JavaScript', 85),
                createSkill('React', 80)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(10);
        });

        it('should return top 10 highest scoring jobs', () => {
            const opportunities = [
                ...Array.from({ length: 5 }, (_, i) =>
                    createOpportunity(`low-${i}`, `Low Match ${i}`, ['JavaScript', 'React', 'Node.js', 'MongoDB'])
                ),
                ...Array.from({ length: 10 }, (_, i) =>
                    createOpportunity(`high-${i}`, `High Match ${i}`, ['JavaScript', 'React'])
                )
            ];
            const learnerSkills = [
                createSkill('JavaScript', 85),
                createSkill('React', 80)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(10);
            // All top 10 should be high match jobs
            result.forEach(job => {
                expect(job.id).toMatch(/^high-/);
            });
        });

        it('should return fewer than 10 results if fewer jobs match criteria', () => {
            const opportunities = Array.from({ length: 5 }, (_, i) =>
                createOpportunity(`${i + 1}`, `Job ${i + 1}`, ['JavaScript', 'React'])
            );
            const learnerSkills = [
                createSkill('JavaScript', 85),
                createSkill('React', 80)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(5);
        });
    });

    describe('AIMatchedJob Properties', () => {
        it('should set isAIRecommended to true for all results', () => {
            const opportunities = [
                createOpportunity('1', 'Frontend Dev', ['JavaScript', 'React'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 85),
                createSkill('React', 80)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            expect(result[0].isAIRecommended).toBe(true);
        });

        it('should preserve all original opportunity properties', () => {
            const opportunities = [
                createOpportunity('1', 'Frontend Developer', ['JavaScript'], {
                    company: 'TestCorp',
                    location: 'San Francisco',
                    employmentType: 'internship',
                    sector: 'Technology',
                    salary: '$80k-$120k'
                })
            ];
            const learnerSkills = [createSkill('JavaScript', 85)];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('1');
            expect(result[0].title).toBe('Frontend Developer');
            expect(result[0].company).toBe('TestCorp');
            expect(result[0].location).toBe('San Francisco');
            expect(result[0].employmentType).toBe('internship');
            expect(result[0].sector).toBe('Technology');
            expect(result[0].salary).toBe('$80k-$120k');
        });

        it('should include all required AIMatchedJob properties', () => {
            const opportunities = [
                createOpportunity('1', 'Frontend Dev', ['JavaScript', 'React'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 85),
                createSkill('React', 80)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            const job = result[0];

            expect(job).toHaveProperty('matchScore');
            expect(job).toHaveProperty('matchReasons');
            expect(job).toHaveProperty('skillsMatched');
            expect(job).toHaveProperty('skillsGap');
            expect(job).toHaveProperty('isAIRecommended');

            expect(typeof job.matchScore).toBe('number');
            expect(Array.isArray(job.matchReasons)).toBe(true);
            expect(Array.isArray(job.skillsMatched)).toBe(true);
            expect(Array.isArray(job.skillsGap)).toBe(true);
            expect(job.isAIRecommended).toBe(true);
        });
    });

    describe('Score Range Validation', () => {
        it('should never return match score below 40', () => {
            const opportunities = Array.from({ length: 20 }, (_, i) =>
                createOpportunity(`${i + 1}`, `Job ${i + 1}`,
                    ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS', 'Docker'])
            );
            const learnerSkills = [createSkill('JavaScript', 50)];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            result.forEach(job => {
                expect(job.matchScore).toBeGreaterThanOrEqual(40);
            });
        });

        it('should never return match score above 100', () => {
            const opportunities = [
                createOpportunity('1', 'JavaScript Dev', ['JavaScript'])
            ];
            const learnerSkills = [createSkill('JavaScript', 100)];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            expect(result[0].matchScore).toBeLessThanOrEqual(100);
        });

        it('should return integer match scores', () => {
            const opportunities = [
                createOpportunity('1', 'Frontend Dev', ['JavaScript', 'React', 'CSS'])
            ];
            const learnerSkills = [
                createSkill('JavaScript', 87),
                createSkill('React', 73)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            expect(Number.isInteger(result[0].matchScore)).toBe(true);
        });
    });

    describe('Real-world Scenarios', () => {
        it('should handle multiple opportunities with varying match quality', () => {
            const opportunities = [
                createOpportunity('1', 'Junior Frontend Developer', ['JavaScript', 'HTML', 'CSS']),
                createOpportunity('2', 'React Developer', ['JavaScript', 'React', 'Redux', 'TypeScript']),
                createOpportunity('3', 'Full Stack Engineer', ['JavaScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'Docker']),
                createOpportunity('4', 'Frontend Intern', ['JavaScript', 'React'])
            ];

            const learnerSkills = [
                createSkill('JavaScript', 85),
                createSkill('React', 80),
                createSkill('HTML', 90),
                createSkill('CSS', 85)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result.length).toBeGreaterThan(0);

            // Job 4 should score highest (100% match with 2 skills)
            // Job 1 should score very high (100% match with 3 skills)
            expect(result[0].id).toMatch(/^(1|4)$/);

            // All results should be above threshold
            result.forEach(job => {
                expect(job.matchScore).toBeGreaterThanOrEqual(40);
            });
        });

        it('should handle learner with many skills matching subset of job requirements', () => {
            const opportunities = [
                createOpportunity('1', 'Software Engineer', ['JavaScript', 'Python', 'Java', 'C++', 'Go'])
            ];

            const learnerSkills = [
                createSkill('JavaScript', 90),
                createSkill('Python', 85),
                createSkill('TypeScript', 80),
                createSkill('React', 85),
                createSkill('Node.js', 75)
            ];

            const result = matchOpportunitiesWithAI(opportunities, learnerSkills);

            expect(result).toHaveLength(1);
            expect(result[0].skillsMatched).toEqual(['JavaScript', 'Python']);
            expect(result[0].skillsGap).toEqual(['Java', 'C++', 'Go']);
            expect(result[0].matchScore).toBeGreaterThanOrEqual(40);
        });
    });
});
