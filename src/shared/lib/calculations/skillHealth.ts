/**
 * Skill Health Categorization
 * 
 * This module provides functionality to categorize learner skills based on proficiency levels
 * and calculate health breakdowns for dashboard display.
 * 
 * Validates Requirements: 10.1-10.7, 5.6-5.7
 */

import type { SkillHealthBreakdown } from '@/entities/learner/model/types';

/**
 * Skill data interface with proficiency field
 * Supports both SkillDataExtended from types and simplified skill objects
 */
export interface SkillData {
    skillName?: string;
    name?: string;
    proficiency: number; // 0-100
}

/**
 * Calculates skill health categorization based on proficiency levels
 * 
 * Categorization rules:
 * - Healthy: proficiency > 75%
 * - Upskill: proficiency 50-75%
 * - Critical: proficiency < 50%
 * 
 * **Preconditions:**
 * - skills is a valid array (may be empty)
 * - Each skill has valid proficiency (0-100)
 * 
 * **Postconditions:**
 * - Returns breakdown with percentages that sum to 100% or less
 * - Handles empty skills array (returns zeros)
 * - Each skill is categorized into exactly one category
 * 
 * @param skills - Array of skill data with proficiency values
 * @returns SkillHealthBreakdown with categorized skills
 * 
 * @example
 * ```typescript
 * const skills = [
 *   { name: 'JavaScript', proficiency: 85 },
 *   { name: 'Python', proficiency: 65 },
 *   { name: 'Java', proficiency: 40 }
 * ];
 * const breakdown = calculateSkillHealth(skills);
 * // Returns:
 * // {
 * //   healthy: { percentage: 33, count: 1, skills: ['JavaScript'] },
 * //   upskill: { percentage: 33, count: 1, skills: ['Python'] },
 * //   critical: { percentage: 33, count: 1, skills: ['Java'] }
 * // }
 * ```
 */
export function calculateSkillHealth(skills: SkillData[]): SkillHealthBreakdown {
    // Handle empty array case
    if (!skills || skills.length === 0) {
        return {
            healthy: { percentage: 0, count: 0, skills: [] },
            upskill: { percentage: 0, count: 0, skills: [] },
            critical: { percentage: 0, count: 0, skills: [] },
        };
    }

    // Initialize categories
    const healthy: string[] = [];
    const upskill: string[] = [];
    const critical: string[] = [];

    // Categorize each skill based on proficiency
    for (const skill of skills) {
        // Get skill name (supports both skillName and name properties)
        const skillName = skill.skillName || skill.name || 'Unknown Skill';

        // Validate proficiency is within bounds
        const proficiency = Math.max(0, Math.min(100, skill.proficiency));

        // Categorize based on proficiency thresholds
        if (proficiency > 75) {
            healthy.push(skillName);
        } else if (proficiency >= 50) {
            upskill.push(skillName);
        } else {
            critical.push(skillName);
        }
    }

    const totalSkills = skills.length;

    // Calculate percentages (rounded to integers)
    const healthyPercentage = Math.round((healthy.length / totalSkills) * 100);
    const upskillPercentage = Math.round((upskill.length / totalSkills) * 100);
    const criticalPercentage = Math.round((critical.length / totalSkills) * 100);

    return {
        healthy: {
            percentage: healthyPercentage,
            count: healthy.length,
            skills: healthy,
        },
        upskill: {
            percentage: upskillPercentage,
            count: upskill.length,
            skills: upskill,
        },
        critical: {
            percentage: criticalPercentage,
            count: critical.length,
            skills: critical,
        },
    };
}
