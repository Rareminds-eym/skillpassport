/**
 * Unit tests for skill health categorization
 * 
 * Tests validate Requirements: 10.1-10.7, 5.6-5.7
 */

import { describe, it, expect } from 'vitest';
import { calculateSkillHealth, type SkillData } from '../skillHealth';

describe('calculateSkillHealth', () => {
    describe('Basic Categorization', () => {
        it('should categorize skills correctly based on proficiency thresholds', () => {
            const skills: SkillData[] = [
                { name: 'JavaScript', proficiency: 85 }, // healthy (>75)
                { name: 'Python', proficiency: 65 },     // upskill (50-75)
                { name: 'Java', proficiency: 40 },       // critical (<50)
            ];

            const result = calculateSkillHealth(skills);

            expect(result.healthy.count).toBe(1);
            expect(result.healthy.skills).toContain('JavaScript');
            expect(result.upskill.count).toBe(1);
            expect(result.upskill.skills).toContain('Python');
            expect(result.critical.count).toBe(1);
            expect(result.critical.skills).toContain('Java');
        });

        it('should handle proficiency at exact boundaries correctly', () => {
            const skills: SkillData[] = [
                { name: 'Skill76', proficiency: 76 },  // healthy (>75)
                { name: 'Skill75', proficiency: 75 },  // upskill (50-75 inclusive)
                { name: 'Skill50', proficiency: 50 },  // upskill (50-75 inclusive)
                { name: 'Skill49', proficiency: 49 },  // critical (<50)
            ];

            const result = calculateSkillHealth(skills);

            expect(result.healthy.count).toBe(1);
            expect(result.healthy.skills).toContain('Skill76');
            expect(result.upskill.count).toBe(2);
            expect(result.upskill.skills).toContain('Skill75');
            expect(result.upskill.skills).toContain('Skill50');
            expect(result.critical.count).toBe(1);
            expect(result.critical.skills).toContain('Skill49');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty skills array', () => {
            const result = calculateSkillHealth([]);

            expect(result.healthy.percentage).toBe(0);
            expect(result.healthy.count).toBe(0);
            expect(result.healthy.skills).toEqual([]);
            expect(result.upskill.percentage).toBe(0);
            expect(result.upskill.count).toBe(0);
            expect(result.upskill.skills).toEqual([]);
            expect(result.critical.percentage).toBe(0);
            expect(result.critical.count).toBe(0);
            expect(result.critical.skills).toEqual([]);
        });

        it('should handle null or undefined skills array', () => {
            const result = calculateSkillHealth(null as any);

            expect(result.healthy.percentage).toBe(0);
            expect(result.upskill.percentage).toBe(0);
            expect(result.critical.percentage).toBe(0);
        });

        it('should handle skills with extreme proficiency values', () => {
            const skills: SkillData[] = [
                { name: 'Perfect', proficiency: 100 },
                { name: 'Zero', proficiency: 0 },
            ];

            const result = calculateSkillHealth(skills);

            expect(result.healthy.count).toBe(1);
            expect(result.healthy.skills).toContain('Perfect');
            expect(result.critical.count).toBe(1);
            expect(result.critical.skills).toContain('Zero');
        });

        it('should clamp proficiency values outside 0-100 range', () => {
            const skills: SkillData[] = [
                { name: 'TooHigh', proficiency: 150 },  // should be treated as 100
                { name: 'TooLow', proficiency: -50 },   // should be treated as 0
            ];

            const result = calculateSkillHealth(skills);

            // Both should be categorized based on clamped values
            expect(result.healthy.count).toBe(1); // 100 -> healthy
            expect(result.critical.count).toBe(1); // 0 -> critical
        });
    });

    describe('Percentage Calculations', () => {
        it('should calculate percentages that sum to 100 or less', () => {
            const skills: SkillData[] = [
                { name: 'Skill1', proficiency: 90 },
                { name: 'Skill2', proficiency: 80 },
                { name: 'Skill3', proficiency: 65 },
                { name: 'Skill4', proficiency: 60 },
                { name: 'Skill5', proficiency: 30 },
            ];

            const result = calculateSkillHealth(skills);

            const totalPercentage = result.healthy.percentage +
                result.upskill.percentage +
                result.critical.percentage;

            expect(totalPercentage).toBeLessThanOrEqual(100);
            expect(result.healthy.percentage).toBe(40); // 2/5 = 40%
            expect(result.upskill.percentage).toBe(40); // 2/5 = 40%
            expect(result.critical.percentage).toBe(20); // 1/5 = 20%
        });

        it('should round percentages to integers', () => {
            const skills: SkillData[] = [
                { name: 'Skill1', proficiency: 90 },
                { name: 'Skill2', proficiency: 60 },
                { name: 'Skill3', proficiency: 30 },
            ];

            const result = calculateSkillHealth(skills);

            expect(Number.isInteger(result.healthy.percentage)).toBe(true);
            expect(Number.isInteger(result.upskill.percentage)).toBe(true);
            expect(Number.isInteger(result.critical.percentage)).toBe(true);
        });

        it('should handle rounding with uneven distribution', () => {
            const skills: SkillData[] = [
                { name: 'Skill1', proficiency: 90 },
                { name: 'Skill2', proficiency: 85 },
                { name: 'Skill3', proficiency: 80 },
                { name: 'Skill4', proficiency: 78 },
                { name: 'Skill5', proficiency: 77 },
                { name: 'Skill6', proficiency: 60 },
                { name: 'Skill7', proficiency: 30 },
            ];

            const result = calculateSkillHealth(skills);

            // Verify all categories have correct counts
            expect(result.healthy.count).toBe(5);
            expect(result.upskill.count).toBe(1);
            expect(result.critical.count).toBe(1);

            // Verify percentages are rounded
            expect(result.healthy.percentage).toBe(71); // 5/7 ≈ 71%
            expect(result.upskill.percentage).toBe(14);  // 1/7 ≈ 14%
            expect(result.critical.percentage).toBe(14); // 1/7 ≈ 14%
        });
    });

    describe('Skill Name Handling', () => {
        it('should support skills with skillName property', () => {
            const skills: SkillData[] = [
                { skillName: 'React', proficiency: 85 },
                { skillName: 'TypeScript', proficiency: 90 },
            ];

            const result = calculateSkillHealth(skills);

            expect(result.healthy.skills).toContain('React');
            expect(result.healthy.skills).toContain('TypeScript');
        });

        it('should support skills with name property', () => {
            const skills: SkillData[] = [
                { name: 'Vue', proficiency: 85 },
                { name: 'Angular', proficiency: 90 },
            ];

            const result = calculateSkillHealth(skills);

            expect(result.healthy.skills).toContain('Vue');
            expect(result.healthy.skills).toContain('Angular');
        });

        it('should handle skills with missing name', () => {
            const skills: SkillData[] = [
                { proficiency: 85 } as any,
            ];

            const result = calculateSkillHealth(skills);

            expect(result.healthy.count).toBe(1);
            expect(result.healthy.skills).toContain('Unknown Skill');
        });
    });

    describe('Comprehensive Scenarios', () => {
        it('should handle all skills in one category', () => {
            const allHealthy: SkillData[] = [
                { name: 'Skill1', proficiency: 90 },
                { name: 'Skill2', proficiency: 85 },
                { name: 'Skill3', proficiency: 80 },
            ];

            const result = calculateSkillHealth(allHealthy);

            expect(result.healthy.count).toBe(3);
            expect(result.healthy.percentage).toBe(100);
            expect(result.upskill.count).toBe(0);
            expect(result.upskill.percentage).toBe(0);
            expect(result.critical.count).toBe(0);
            expect(result.critical.percentage).toBe(0);
        });

        it('should handle large skill sets', () => {
            const largeSkillSet: SkillData[] = Array.from({ length: 100 }, (_, i) => ({
                name: `Skill${i}`,
                proficiency: Math.floor(Math.random() * 101),
            }));

            const result = calculateSkillHealth(largeSkillSet);

            // Verify all skills are categorized
            const totalCategorized = result.healthy.count +
                result.upskill.count +
                result.critical.count;
            expect(totalCategorized).toBe(100);

            // Verify percentages sum correctly
            const totalPercentage = result.healthy.percentage +
                result.upskill.percentage +
                result.critical.percentage;
            expect(totalPercentage).toBeLessThanOrEqual(100);
        });

        it('should maintain referential integrity for skill names', () => {
            const skills: SkillData[] = [
                { name: 'JavaScript', proficiency: 90 },
                { name: 'Python', proficiency: 65 },
                { name: 'Java', proficiency: 40 },
            ];

            const result = calculateSkillHealth(skills);

            // Verify each skill appears exactly once
            const allSkills = [
                ...result.healthy.skills,
                ...result.upskill.skills,
                ...result.critical.skills,
            ];

            expect(allSkills).toHaveLength(3);
            expect(new Set(allSkills).size).toBe(3); // No duplicates
        });
    });

    describe('Requirements Validation', () => {
        it('should validate Requirement 10.1: Classify skills with proficiency > 75% as healthy', () => {
            const skills: SkillData[] = [
                { name: 'HighSkill', proficiency: 76 },
                { name: 'VeryHighSkill', proficiency: 100 },
            ];

            const result = calculateSkillHealth(skills);

            expect(result.healthy.count).toBe(2);
            expect(result.healthy.skills).toContain('HighSkill');
            expect(result.healthy.skills).toContain('VeryHighSkill');
        });

        it('should validate Requirement 10.2: Classify skills with proficiency 50-75% as upskill', () => {
            const skills: SkillData[] = [
                { name: 'MidSkill', proficiency: 50 },
                { name: 'UpperMidSkill', proficiency: 75 },
            ];

            const result = calculateSkillHealth(skills);

            expect(result.upskill.count).toBe(2);
            expect(result.upskill.skills).toContain('MidSkill');
            expect(result.upskill.skills).toContain('UpperMidSkill');
        });

        it('should validate Requirement 10.3: Classify skills with proficiency < 50% as critical', () => {
            const skills: SkillData[] = [
                { name: 'LowSkill', proficiency: 49 },
                { name: 'VeryLowSkill', proficiency: 0 },
            ];

            const result = calculateSkillHealth(skills);

            expect(result.critical.count).toBe(2);
            expect(result.critical.skills).toContain('LowSkill');
            expect(result.critical.skills).toContain('VeryLowSkill');
        });

        it('should validate Requirement 10.4: Percentages sum to 100%', () => {
            const skills: SkillData[] = [
                { name: 'Skill1', proficiency: 90 },
                { name: 'Skill2', proficiency: 60 },
                { name: 'Skill3', proficiency: 30 },
            ];

            const result = calculateSkillHealth(skills);

            const sum = result.healthy.percentage +
                result.upskill.percentage +
                result.critical.percentage;

            expect(sum).toBeLessThanOrEqual(100);
            expect(sum).toBeGreaterThanOrEqual(99); // Allow for rounding
        });

        it('should validate Requirement 10.5: Handle empty array with zeros', () => {
            const result = calculateSkillHealth([]);

            expect(result.healthy.count).toBe(0);
            expect(result.upskill.count).toBe(0);
            expect(result.critical.count).toBe(0);
            expect(result.healthy.percentage).toBe(0);
            expect(result.upskill.percentage).toBe(0);
            expect(result.critical.percentage).toBe(0);
        });

        it('should validate Requirement 10.6: Include count of skills in each category', () => {
            const skills: SkillData[] = [
                { name: 'Skill1', proficiency: 90 },
                { name: 'Skill2', proficiency: 85 },
                { name: 'Skill3', proficiency: 65 },
                { name: 'Skill4', proficiency: 60 },
                { name: 'Skill5', proficiency: 30 },
            ];

            const result = calculateSkillHealth(skills);

            expect(result.healthy.count).toBe(2);
            expect(result.upskill.count).toBe(2);
            expect(result.critical.count).toBe(1);
        });

        it('should validate Requirement 10.7: Include list of skill names in each category', () => {
            const skills: SkillData[] = [
                { name: 'JavaScript', proficiency: 90 },
                { name: 'Python', proficiency: 65 },
                { name: 'Java', proficiency: 40 },
            ];

            const result = calculateSkillHealth(skills);

            expect(result.healthy.skills).toEqual(['JavaScript']);
            expect(result.upskill.skills).toEqual(['Python']);
            expect(result.critical.skills).toEqual(['Java']);
        });
    });
});
