/**
 * Integration test to verify exports from calculations index
 */

import { describe, it, expect } from 'vitest';
import { calculateSkillHealth, calculateEnrollabilityScore } from '../index';

describe('Calculations Module Exports', () => {
    it('should export calculateSkillHealth function', () => {
        expect(calculateSkillHealth).toBeDefined();
        expect(typeof calculateSkillHealth).toBe('function');
    });

    it('should export calculateEnrollabilityScore function', () => {
        expect(calculateEnrollabilityScore).toBeDefined();
        expect(typeof calculateEnrollabilityScore).toBe('function');
    });

    it('should allow calculateSkillHealth to be called from index export', () => {
        const skills = [
            { name: 'JavaScript', proficiency: 85 },
            { name: 'Python', proficiency: 65 },
        ];

        const result = calculateSkillHealth(skills);

        expect(result).toBeDefined();
        expect(result.healthy.count).toBe(1);
        expect(result.upskill.count).toBe(1);
    });
});
