/**
 * Property-based tests for salary formatting utility
 *
 * Feature: career-fit-salary-display, Property 3: Salary formatting produces valid output
 * Validates: Requirements 2.3, 3.3
 *
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatSalaryRange, getRoleName, getRoleSalary } from '../salaryFormatter';

describe('salaryFormatter', () => {
  describe('formatSalaryRange', () => {
    /**
     * Property 3: Salary formatting produces valid output
     * For any salary object with numeric min and max values, the formatSalaryRange
     * function SHALL return a string containing the ₹ symbol and both min and max
     * values in lakhs notation.
     */
    it('should return string with ₹ symbol for valid salary objects', () => {
      fc.assert(
        fc.property(
          fc.record({
            min: fc.float({ min: 0, max: 100, noNaN: true }),
            max: fc.float({ min: 0, max: 100, noNaN: true }),
          }),
          (salary) => {
            const result = formatSalaryRange(salary);

            // Result should be a string
            expect(typeof result).toBe('string');

            // Result should contain ₹ symbol
            expect(result).toContain('₹');

            // Result should contain L notation
            expect(result).toContain('L');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: When min equals max, output shows single value
     */
    it('should show single value when min equals max', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 100, noNaN: true }), (value) => {
          const salary = { min: value, max: value };
          const result = formatSalaryRange(salary);

          // Should not contain range separator
          expect(result).not.toContain(' - ');

          // Should contain single ₹ symbol
          expect((result.match(/₹/g) || []).length).toBe(1);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: When min differs from max, output shows range with both values
     */
    it('should show range when min differs from max', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0, max: 50, noNaN: true }),
          fc.float({ min: 51, max: 100, noNaN: true }),
          (min, max) => {
            const salary = { min, max };
            const result = formatSalaryRange(salary);

            // Should contain range separator
            expect(result).toContain(' - ');

            // Should contain two ₹ symbols
            expect((result.match(/₹/g) || []).length).toBe(2);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Edge case: null salary returns null
     */
    it('should return null for null salary', () => {
      expect(formatSalaryRange(null)).toBeNull();
    });

    /**
     * Edge case: undefined salary returns null
     */
    it('should return null for undefined salary', () => {
      expect(formatSalaryRange(undefined)).toBeNull();
    });

    /**
     * Edge case: non-numeric values return null
     */
    it('should return null for non-numeric min/max', () => {
      expect(formatSalaryRange({ min: 'abc', max: 5 })).toBeNull();
      expect(formatSalaryRange({ min: 5, max: 'xyz' })).toBeNull();
      expect(formatSalaryRange({ min: null, max: 5 })).toBeNull();
    });

    /**
     * Edge case: negative values return null
     */
    it('should return null for negative values', () => {
      expect(formatSalaryRange({ min: -5, max: 10 })).toBeNull();
      expect(formatSalaryRange({ min: 5, max: -10 })).toBeNull();
    });

    /**
     * Specific examples for verification
     */
    it('should format specific salary ranges correctly', () => {
      expect(formatSalaryRange({ min: 4, max: 8 })).toBe('₹4L - ₹8L');
      expect(formatSalaryRange({ min: 4.5, max: 8.5 })).toBe('₹4.5L - ₹8.5L');
      expect(formatSalaryRange({ min: 10, max: 10 })).toBe('₹10L');
      expect(formatSalaryRange({ min: 0, max: 5 })).toBe('₹0L - ₹5L');
    });
  });

  describe('getRoleName', () => {
    /**
     * Property: String roles return the string itself
     */
    it('should return string for string roles', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (roleName) => {
          expect(getRoleName(roleName)).toBe(roleName);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Object roles return the name property
     */
    it('should return name property for object roles', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            salary: fc.option(
              fc.record({
                min: fc.float({ min: 0, max: 100, noNaN: true }),
                max: fc.float({ min: 0, max: 100, noNaN: true }),
              }),
              { nil: null }
            ),
          }),
          (role) => {
            expect(getRoleName(role)).toBe(role.name);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Edge case: null/undefined returns empty string
     */
    it('should return empty string for null/undefined', () => {
      expect(getRoleName(null)).toBe('');
      expect(getRoleName(undefined)).toBe('');
    });
  });

  describe('getRoleSalary', () => {
    /**
     * Property: String roles return null (backward compatibility)
     */
    it('should return null for string roles', () => {
      fc.assert(
        fc.property(fc.string(), (roleName) => {
          expect(getRoleSalary(roleName)).toBeNull();
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Object roles return the salary property
     */
    it('should return salary for object roles with salary', () => {
      fc.assert(
        fc.property(
          fc.record({
            name: fc.string({ minLength: 1 }),
            salary: fc.record({
              min: fc.float({ min: 0, max: 100, noNaN: true }),
              max: fc.float({ min: 0, max: 100, noNaN: true }),
            }),
          }),
          (role) => {
            const salary = getRoleSalary(role);
            expect(salary).toEqual(role.salary);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Edge case: Object without salary returns null
     */
    it('should return null for object roles without salary', () => {
      expect(getRoleSalary({ name: 'Developer' })).toBeNull();
      expect(getRoleSalary({ name: 'Designer', salary: null })).toBeNull();
    });
  });
});
