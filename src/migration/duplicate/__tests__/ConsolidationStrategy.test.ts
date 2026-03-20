/**
 * ConsolidationStrategy Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConsolidationStrategy } from '../ConsolidationStrategy';
import type { DuplicateGroup } from '../types';

describe('ConsolidationStrategy', () => {
  let strategy: ConsolidationStrategy;

  beforeEach(() => {
    strategy = new ConsolidationStrategy();
  });

  describe('determineCanonicalLocation', () => {
    it('should move validation functions to shared/lib/validation', () => {
      const group: DuplicateGroup = {
        id: 'dup-1',
        files: [
          'src/entities/user/model/validation.ts',
          'src/entities/course/model/validation.ts',
        ],
        similarity: 0.95,
        canonicalLocation: '',
        consolidationStrategy: 'extract',
        codeBlocks: [
          {
            file: 'src/entities/user/model/validation.ts',
            startLine: 10,
            endLine: 15,
            code: 'export const isValidEmail = (email: string): boolean => { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email); };',
            hash: 'abc123',
          },
          {
            file: 'src/entities/course/model/validation.ts',
            startLine: 20,
            endLine: 25,
            code: 'export const isValidEmail = (email: string): boolean => { return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email); };',
            hash: 'abc123',
          },
        ],
      };

      const location = strategy.determineCanonicalLocation(group);
      expect(location).toContain('shared/lib/validation');
    });

    it('should move display functions to shared/lib/format', () => {
      const group: DuplicateGroup = {
        id: 'dup-2',
        files: [
          'src/entities/user/model/utils.ts',
          'src/entities/organization/model/utils.ts',
        ],
        similarity: 0.9,
        canonicalLocation: '',
        consolidationStrategy: 'extract',
        codeBlocks: [
          {
            file: 'src/entities/user/model/utils.ts',
            startLine: 5,
            endLine: 10,
            code: 'export const getUserDisplayName = (user: User): string => { return user.name || "Unknown"; };',
            hash: 'def456',
          },
          {
            file: 'src/entities/organization/model/utils.ts',
            startLine: 5,
            endLine: 10,
            code: 'export const getOrganizationDisplayName = (org: Organization): string => { return org.name || "Unknown"; };',
            hash: 'def789',
          },
        ],
      };

      const location = strategy.determineCanonicalLocation(group);
      expect(location).toContain('shared/lib/format');
    });

    it('should keep entity-specific code in entity layer', () => {
      const group: DuplicateGroup = {
        id: 'dup-3',
        files: [
          'src/entities/user/model/utils.ts',
          'src/entities/user/model/helpers.ts',
        ],
        similarity: 0.95,
        canonicalLocation: '',
        consolidationStrategy: 'merge',
        codeBlocks: [
          {
            file: 'src/entities/user/model/utils.ts',
            startLine: 10,
            endLine: 20,
            code: 'export const processUserData = (user: User): ProcessedUser => { return { ...user }; };',
            hash: 'ghi123',
          },
          {
            file: 'src/entities/user/model/helpers.ts',
            startLine: 5,
            endLine: 15,
            code: 'export const processUserData = (user: User): ProcessedUser => { return { ...user }; };',
            hash: 'ghi123',
          },
        ],
      };

      const location = strategy.determineCanonicalLocation(group);
      expect(location).toContain('entities/user');
    });

    it('should move sorting functions to shared/lib/sorting', () => {
      const group: DuplicateGroup = {
        id: 'dup-4',
        files: [
          'src/entities/user/model/utils.ts',
          'src/entities/course/model/utils.ts',
        ],
        similarity: 0.92,
        canonicalLocation: '',
        consolidationStrategy: 'extract',
        codeBlocks: [
          {
            file: 'src/entities/user/model/utils.ts',
            startLine: 30,
            endLine: 35,
            code: 'export const sortUsersByName = (users: User[]): User[] => { return [...users].sort(); };',
            hash: 'jkl456',
          },
          {
            file: 'src/entities/course/model/utils.ts',
            startLine: 40,
            endLine: 45,
            code: 'export const sortCoursesByTitle = (courses: Course[]): Course[] => { return [...courses].sort(); };',
            hash: 'jkl789',
          },
        ],
      };

      const location = strategy.determineCanonicalLocation(group);
      expect(location).toContain('shared/lib/sorting');
    });
  });

  describe('determineStrategy', () => {
    it('should use replace strategy for high similarity', () => {
      const group: DuplicateGroup = {
        id: 'dup-5',
        files: ['file1.ts', 'file2.ts'],
        similarity: 0.98,
        canonicalLocation: '',
        consolidationStrategy: 'extract',
        codeBlocks: [],
      };

      const strategyType = strategy.determineStrategy(group);
      expect(strategyType).toBe('replace');
    });

    it('should use extract strategy for cross-layer duplicates', () => {
      const group: DuplicateGroup = {
        id: 'dup-6',
        files: [
          'src/entities/user/model/utils.ts',
          'src/features/auth/lib/utils.ts',
        ],
        similarity: 0.85,
        canonicalLocation: '',
        consolidationStrategy: 'extract',
        codeBlocks: [],
      };

      const strategyType = strategy.determineStrategy(group);
      expect(strategyType).toBe('extract');
    });

    it('should use merge strategy for same-layer duplicates', () => {
      const group: DuplicateGroup = {
        id: 'dup-7',
        files: [
          'src/entities/user/model/utils.ts',
          'src/entities/course/model/utils.ts',
        ],
        similarity: 0.88,
        canonicalLocation: '',
        consolidationStrategy: 'merge',
        codeBlocks: [],
      };

      const strategyType = strategy.determineStrategy(group);
      expect(strategyType).toBe('merge');
    });
  });

  describe('generateImportPath', () => {
    it('should generate relative import path', () => {
      const canonicalLocation = 'src/shared/lib/validation/common.ts';
      const fromFile = 'src/entities/user/model/validation.ts';

      const importPath = strategy.generateImportPath(canonicalLocation, fromFile);
      expect(importPath).toContain('..');
      expect(importPath).not.toContain('.ts');
    });

    it('should handle same directory imports', () => {
      const canonicalLocation = 'src/entities/user/model/utils.ts';
      const fromFile = 'src/entities/user/model/validation.ts';

      const importPath = strategy.generateImportPath(canonicalLocation, fromFile);
      expect(importPath).toContain('./');
    });
  });
});
