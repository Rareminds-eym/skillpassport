/**
 * Validation Engine Tests
 * 
 * Unit tests for the assessment validation engine
 * 
 * @module features/assessment/__tests__/validationEngine.test.ts
 */

import { describe, it, expect } from 'vitest';
import {
  validateTiming,
  validateResponsePatterns,
  validateAntiCheatSignals,
  type ResponsePattern,
  type AntiCheatSignals
} from '../utils/validationEngine';

describe('Validation Engine', () => {
  describe('Timing Validation', () => {
    it('should pass for normal response times', () => {
      const responses: ResponsePattern[] = [
        { questionId: 'q1', answer: 3, responseTimeMs: 5000, timestamp: new Date() },
        { questionId: 'q2', answer: 4, responseTimeMs: 4500, timestamp: new Date() },
        { questionId: 'q3', answer: 2, responseTimeMs: 6000, timestamp: new Date() }
      ];

      const result = validateTiming(responses, 'riasec');
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBe(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect too fast responses', () => {
      const responses: ResponsePattern[] = [
        { questionId: 'q1', answer: 3, responseTimeMs: 500, timestamp: new Date() },
        { questionId: 'q2', answer: 4, responseTimeMs: 600, timestamp: new Date() },
        { questionId: 'q3', answer: 2, responseTimeMs: 400, timestamp: new Date() },
        { questionId: 'q4', answer: 5, responseTimeMs: 700, timestamp: new Date() },
        { questionId: 'q5', answer: 3, responseTimeMs: 500, timestamp: new Date() }
      ];

      const result = validateTiming(responses, 'riasec');
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.code === 'TOO_FAST')).toBe(true);
    });

    it('should detect uniform timing (automation)', () => {
      const responses: ResponsePattern[] = [
        { questionId: 'q1', answer: 3, responseTimeMs: 3050, timestamp: new Date() },
        { questionId: 'q2', answer: 4, responseTimeMs: 3020, timestamp: new Date() },
        { questionId: 'q3', answer: 2, responseTimeMs: 3040, timestamp: new Date() },
        { questionId: 'q4', answer: 5, responseTimeMs: 3010, timestamp: new Date() },
        { questionId: 'q5', answer: 3, responseTimeMs: 3050, timestamp: new Date() },
        { questionId: 'q6', answer: 4, responseTimeMs: 3020, timestamp: new Date() }
      ];

      const result = validateTiming(responses, 'riasec');
      
      expect(result.warnings.some(w => w.code === 'UNIFORM_TIMING')).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should handle empty responses', () => {
      const result = validateTiming([], 'riasec');
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Response Pattern Validation', () => {
    it('should detect straight-lining (all same answer)', () => {
      const answers = {
        'riasec_r1': 3,
        'riasec_r2': 3,
        'riasec_r3': 3,
        'riasec_r4': 3,
        'riasec_r5': 3
      };

      const result = validateResponsePatterns(answers, 'riasec');
      
      expect(result.warnings.some(w => w.code === 'STRAIGHT_LINING')).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should detect alternating pattern', () => {
      const answers = {
        'riasec_r1': 1,
        'riasec_r2': 5,
        'riasec_r3': 1,
        'riasec_r4': 5,
        'riasec_r5': 1,
        'riasec_r6': 5
      };

      const result = validateResponsePatterns(answers, 'riasec');
      
      expect(result.warnings.some(w => w.code === 'ALTERNATING_PATTERN')).toBe(true);
    });

    it('should detect midpoint bias', () => {
      const answers = {
        'values_aut1': 3,
        'values_fin1': 3,
        'values_sec1': 3,
        'values_cre1': 3,
        'values_lea1': 3,
        'values_imp1': 3,
        'values_sta1': 3,
        'values_lif1': 3
      };

      const result = validateResponsePatterns(answers, 'values');
      
      expect(result.warnings.some(w => w.code === 'MIDPOINT_BIAS')).toBe(true);
    });

    it('should pass for varied responses', () => {
      const answers = {
        'riasec_r1': 1,
        'riasec_r2': 5,
        'riasec_r3': 2,
        'riasec_r4': 4,
        'riasec_r5': 3,
        'riasec_r6': 1,
        'riasec_r7': 4
      };

      const result = validateResponsePatterns(answers, 'riasec');
      
      expect(result.warnings).toHaveLength(0);
      expect(result.score).toBe(0);
    });
  });

  describe('Anti-Cheat Validation', () => {
    it('should detect no mouse movement', () => {
      const signals: AntiCheatSignals = {
        mouseMovements: 5,
        tabSwitches: 0,
        copyPasteEvents: 0,
        timeAwayMs: 0,
        totalTimeMs: 120000
      };

      const result = validateAntiCheatSignals(signals);
      
      expect(result.warnings.some(w => w.code === 'NO_MOUSE_MOVEMENT')).toBe(true);
    });

    it('should detect excessive tab switching', () => {
      const signals: AntiCheatSignals = {
        mouseMovements: 100,
        tabSwitches: 8,
        copyPasteEvents: 0,
        timeAwayMs: 0,
        totalTimeMs: 120000
      };

      const result = validateAntiCheatSignals(signals);
      
      expect(result.warnings.some(w => w.code === 'EXCESSIVE_TAB_SWITCHING')).toBe(true);
    });

    it('should detect too much time away', () => {
      const signals: AntiCheatSignals = {
        mouseMovements: 200,
        tabSwitches: 1,
        copyPasteEvents: 0,
        timeAwayMs: 60000,
        totalTimeMs: 120000
      };

      const result = validateAntiCheatSignals(signals);
      
      expect(result.warnings.some(w => w.code === 'TIME_AWAY')).toBe(true);
    });

    it('should pass for normal behavior', () => {
      const signals: AntiCheatSignals = {
        mouseMovements: 150,
        tabSwitches: 1,
        copyPasteEvents: 0,
        timeAwayMs: 5000,
        totalTimeMs: 180000
      };

      const result = validateAntiCheatSignals(signals);
      
      expect(result.warnings).toHaveLength(0);
      expect(result.score).toBe(0);
    });
  });
});
