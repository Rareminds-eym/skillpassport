/**
 * Property-based tests for PrintView component salary display
 * 
 * Feature: career-fit-salary-display, Property 4: Print view includes salary for all roles
 * Validates: Requirements 4.1
 * 
 * Note: These tests verify the data transformation logic used by PrintView.
 * The actual component rendering is tested via manual/integration testing.
 * 
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatSalaryRange, getRoleName, getRoleSalary } from '../../../../../utils/salaryFormatter';

// Helper to generate valid role objects
const roleArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  salary: fc.record({
    min: fc.integer({ min: 1, max: 50 }),
    max: fc.integer({ min: 1, max: 100 })
  })
});

// Helper to generate career fit data structure
const careerFitArbitrary = fc.record({
  clusters: fc.array(fc.record({
    title: fc.string({ minLength: 1 }),
    matchScore: fc.integer({ min: 0, max: 100 }),
    fit: fc.constantFrom('High', 'Medium', 'Explore')
  }), { minLength: 0, maxLength: 3 }),
  specificOptions: fc.record({
    highFit: fc.array(roleArbitrary, { minLength: 0, maxLength: 5 }),
    mediumFit: fc.array(roleArbitrary, { minLength: 0, maxLength: 5 }),
    exploreLater: fc.array(roleArbitrary, { minLength: 0, maxLength: 5 })
  })
});

describe('PrintView Salary Data Processing', () => {
  /**
   * Property 4: Print view includes salary for all roles
   * For any assessment results with salary data, the print view SHALL render 
   * salary information for each career role in the specificOptions.
   */
  describe('Career Fit Data Processing', () => {
    it('should process all highFit roles with salary', () => {
      fc.assert(
        fc.property(
          careerFitArbitrary,
          (careerFit) => {
            careerFit.specificOptions.highFit.forEach(role => {
              const name = getRoleName(role);
              const salary = getRoleSalary(role);
              const formatted = formatSalaryRange(salary);
              
              // Name should be extracted
              expect(name).toBe(role.name);
              
              // Salary should be extracted and formatted
              expect(salary).toEqual(role.salary);
              expect(formatted).toContain('₹');
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should process all mediumFit roles with salary', () => {
      fc.assert(
        fc.property(
          careerFitArbitrary,
          (careerFit) => {
            careerFit.specificOptions.mediumFit.forEach(role => {
              const name = getRoleName(role);
              const salary = getRoleSalary(role);
              const formatted = formatSalaryRange(salary);
              
              expect(name).toBe(role.name);
              expect(salary).toEqual(role.salary);
              expect(formatted).toContain('₹');
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should process all exploreLater roles with salary', () => {
      fc.assert(
        fc.property(
          careerFitArbitrary,
          (careerFit) => {
            careerFit.specificOptions.exploreLater.forEach(role => {
              const name = getRoleName(role);
              const salary = getRoleSalary(role);
              const formatted = formatSalaryRange(salary);
              
              expect(name).toBe(role.name);
              expect(salary).toEqual(role.salary);
              expect(formatted).toContain('₹');
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Print Format Generation', () => {
    /**
     * Simulates the print view format generation
     */
    const generatePrintFormat = (role) => {
      const name = getRoleName(role);
      const salary = formatSalaryRange(getRoleSalary(role));
      return salary ? `• ${name} (${salary})` : `• ${name}`;
    };

    it('should generate correct print format for roles with salary', () => {
      fc.assert(
        fc.property(
          roleArbitrary,
          (role) => {
            const printFormat = generatePrintFormat(role);
            
            // Should contain bullet point
            expect(printFormat).toContain('•');
            
            // Should contain role name
            expect(printFormat).toContain(role.name);
            
            // Should contain salary in parentheses
            expect(printFormat).toContain('(₹');
            expect(printFormat).toContain('L)');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate correct print format for string roles (backward compatibility)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (roleName) => {
            const printFormat = generatePrintFormat(roleName);
            
            // Should contain bullet point
            expect(printFormat).toContain('•');
            
            // Should contain role name
            expect(printFormat).toContain(roleName);
            
            // Should NOT contain salary parentheses
            expect(printFormat).not.toContain('(₹');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Specific Examples for Print View', () => {
    it('should format High Fit roles correctly for print', () => {
      const highFitRoles = [
        { name: 'Software Developer', salary: { min: 4, max: 12 } },
        { name: 'Data Scientist', salary: { min: 6, max: 15 } }
      ];

      const formatted = highFitRoles.map(role => {
        const name = getRoleName(role);
        const salary = formatSalaryRange(getRoleSalary(role));
        return `• ${name} (${salary})`;
      });

      expect(formatted[0]).toBe('• Software Developer (₹4L - ₹12L)');
      expect(formatted[1]).toBe('• Data Scientist (₹6L - ₹15L)');
    });

    it('should format Medium Fit roles correctly for print', () => {
      const mediumFitRoles = [
        { name: 'Product Manager', salary: { min: 5, max: 18 } },
        { name: 'Business Analyst', salary: { min: 4, max: 10 } }
      ];

      const formatted = mediumFitRoles.map(role => {
        const name = getRoleName(role);
        const salary = formatSalaryRange(getRoleSalary(role));
        return `• ${name} (${salary})`;
      });

      expect(formatted[0]).toBe('• Product Manager (₹5L - ₹18L)');
      expect(formatted[1]).toBe('• Business Analyst (₹4L - ₹10L)');
    });

    it('should format Explore Later roles correctly for print', () => {
      const exploreLaterRoles = [
        { name: 'Technical Writer', salary: { min: 3, max: 7 } }
      ];

      const formatted = exploreLaterRoles.map(role => {
        const name = getRoleName(role);
        const salary = formatSalaryRange(getRoleSalary(role));
        return `• ${name} (${salary})`;
      });

      expect(formatted[0]).toBe('• Technical Writer (₹3L - ₹7L)');
    });

    it('should handle mixed format (legacy string + new object)', () => {
      const mixedRoles = [
        'Legacy Role Name',
        { name: 'New Format Role', salary: { min: 5, max: 10 } }
      ];

      const formatted = mixedRoles.map(role => {
        const name = getRoleName(role);
        const salary = formatSalaryRange(getRoleSalary(role));
        return salary ? `• ${name} (${salary})` : `• ${name}`;
      });

      expect(formatted[0]).toBe('• Legacy Role Name');
      expect(formatted[1]).toBe('• New Format Role (₹5L - ₹10L)');
    });
  });
});
