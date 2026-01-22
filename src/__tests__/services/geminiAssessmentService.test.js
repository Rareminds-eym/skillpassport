/**
 * Unit Tests for Gemini Assessment Service - getSectionPrefix
 * 
 * Tests for getSectionPrefix() function to verify correct section prefix mapping
 * for different grade levels.
 * 
 * Feature: fix-higher-secondary-score-extraction
 * Task 3.1: Test middle school prefix mapping
 * 
 * @requirement Requirements 7.1, 8.1
 */

import { describe, expect, it } from 'vitest';
import { getSectionPrefix } from '../../services/geminiAssessmentService.js';

describe('getSectionPrefix - Middle School Prefix Mapping', () => {
  describe('Task 3.1: Middle school prefix mapping', () => {
    it('should return "middle_interest_explorer" for riasec section in middle school', () => {
      const result = getSectionPrefix('riasec', 'middle');
      expect(result).toBe('middle_interest_explorer');
    });

    it('should return "middle_strengths_character" for bigfive section in middle school', () => {
      const result = getSectionPrefix('bigfive', 'middle');
      expect(result).toBe('middle_strengths_character');
    });

    it('should return "middle_learning_preferences" for knowledge section in middle school', () => {
      const result = getSectionPrefix('knowledge', 'middle');
      expect(result).toBe('middle_learning_preferences');
    });

    it('should return base section for unmapped sections in middle school', () => {
      const result = getSectionPrefix('aptitude', 'middle');
      expect(result).toBe('aptitude');
    });
  });
});
