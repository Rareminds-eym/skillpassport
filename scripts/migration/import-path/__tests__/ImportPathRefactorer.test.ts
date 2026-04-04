import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImportPathRefactorer } from '../ImportPathRefactorer';
import { MigrationLogger } from '../../logging/MigrationLogger';
import { ImportViolation } from '@/shared/types/import-path';
import * as fs from 'fs';

vi.mock('fs');

describe('ImportPathRefactorer', () => {
  let refactorer: ImportPathRefactorer;
  let logger: MigrationLogger;

  beforeEach(() => {
    logger = new MigrationLogger();
    refactorer = new ImportPathRefactorer(logger, 'src');
    vi.clearAllMocks();
  });

  describe('refactorImportPaths', () => {
    it('should refactor import paths based on violations', async () => {
      const mockFileContent = `import { User } from '../../entities/user';\n`;
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const violations: ImportViolation[] = [
        {
          type: 'missing-alias',
          severity: 'warning',
          filePath: 'src/features/auth/Login.tsx',
          line: 1,
          importPath: '../../entities/user',
          message: 'Should use @ alias',
          suggestion: '@/entities/user'
        }
      ];

      const result = await refactorer.refactorImportPaths(violations);

      expect(result.success).toBe(true);
      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.filesModified.length).toBeGreaterThan(0);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should handle multiple violations in the same file', async () => {
      const mockFileContent = `import { User } from '../../entities/user';
import { Course } from '../../entities/course';
`;
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const violations: ImportViolation[] = [
        {
          type: 'missing-alias',
          severity: 'warning',
          filePath: 'src/features/auth/Login.tsx',
          line: 1,
          importPath: '../../entities/user',
          message: 'Should use @ alias',
          suggestion: '@/entities/user'
        },
        {
          type: 'missing-alias',
          severity: 'warning',
          filePath: 'src/features/auth/Login.tsx',
          line: 2,
          importPath: '../../entities/course',
          message: 'Should use @ alias',
          suggestion: '@/entities/course'
        }
      ];

      const result = await refactorer.refactorImportPaths(violations);

      expect(result.changes.length).toBe(2);
      expect(result.filesModified.length).toBe(1);
    });

    it('should skip violations without suggestions', async () => {
      const mockFileContent = `import { User } from '../../entities/user';\n`;
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const violations: ImportViolation[] = [
        {
          type: 'upward-dependency',
          severity: 'error',
          filePath: 'src/features/auth/Login.tsx',
          line: 1,
          importPath: '../../entities/user',
          message: 'Upward dependency detected'
          // No suggestion
        }
      ];

      const result = await refactorer.refactorImportPaths(violations);

      expect(result.changes.length).toBe(0);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should collect errors for failed refactorings', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      const violations: ImportViolation[] = [
        {
          type: 'missing-alias',
          severity: 'warning',
          filePath: 'src/nonexistent.tsx',
          line: 1,
          importPath: '../../entities/user',
          message: 'Should use @ alias',
          suggestion: '@/entities/user'
        }
      ];

      const result = await refactorer.refactorImportPaths(violations);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should group changes by type', async () => {
      const mockFileContent = `import { User } from '../../entities/user';
import { Course } from '@/entities/course/model/types';
`;
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const violations: ImportViolation[] = [
        {
          type: 'missing-alias',
          severity: 'warning',
          filePath: 'src/features/auth/Login.tsx',
          line: 1,
          importPath: '../../entities/user',
          message: 'Should use @ alias',
          suggestion: '@/entities/user'
        },
        {
          type: 'deep-import',
          severity: 'warning',
          filePath: 'src/features/auth/Login.tsx',
          line: 2,
          importPath: '@/entities/course/model/types',
          message: 'Should use public API',
          suggestion: '@/entities/course'
        }
      ];

      const result = await refactorer.refactorImportPaths(violations);

      expect(result.statistics.changesByType).toBeDefined();
      expect(Object.keys(result.statistics.changesByType).length).toBeGreaterThan(0);
    });
  });

  describe('convertRelativeToAbsolute', () => {
    it('should convert relative imports to absolute', async () => {
      const mockFileContent = `import { User } from './user';
import { helper } from "@/shared/lib/helper";
`;
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const result = await refactorer.convertRelativeToAbsolute(['src/features/auth/Login.tsx']);

      expect(result.success).toBe(true);
      expect(result.changes.length).toBeGreaterThan(0);
    });

    it('should not convert external package imports', async () => {
      const mockFileContent = `import React from 'react';
import { useState } from 'react';
`;
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const result = await refactorer.convertRelativeToAbsolute(['src/App.tsx']);

      expect(result.changes.length).toBe(0);
    });
  });
});
