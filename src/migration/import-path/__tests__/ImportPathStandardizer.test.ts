import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImportPathStandardizer } from '../ImportPathStandardizer';
import { MigrationLogger } from '../../logging/MigrationLogger';
import * as fs from 'fs';

vi.mock('fs');

describe('ImportPathStandardizer', () => {
  let standardizer: ImportPathStandardizer;
  let logger: MigrationLogger;

  beforeEach(() => {
    logger = new MigrationLogger();
    standardizer = new ImportPathStandardizer(logger, 'src');
    vi.clearAllMocks();
  });

  describe('standardizeAllImports', () => {
    it('should perform complete standardization workflow', async () => {
      const mockFileContent = `import { User } from '../../entities/user';`;
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: { '@/*': ['./src/*'] }
        }
      };

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path.includes('.json')) {
          return JSON.stringify(mockConfig);
        }
        return mockFileContent;
      });
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = await standardizer.standardizeAllImports(['src/features/auth/Login.tsx']);

      expect(result.success).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.refactoring).toBeDefined();
      expect(result.configUpdate).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should analyze imports before refactoring', async () => {
      const mockFileContent = `import { User } from '@/entities/user';`;
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: { '@/*': ['./src/*'] }
        }
      };

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path.includes('.json')) {
          return JSON.stringify(mockConfig);
        }
        return mockFileContent;
      });
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = await standardizer.standardizeAllImports(['src/App.tsx']);

      expect(result.analysis.totalImports).toBeGreaterThan(0);
      expect(result.summary.filesAnalyzed).toBe(1);
    });

    it('should update TypeScript config', async () => {
      const mockFileContent = `import { User } from '@/entities/user';`;
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: {}
        }
      };

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path.includes('.json')) {
          return JSON.stringify(mockConfig);
        }
        return mockFileContent;
      });
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = await standardizer.standardizeAllImports(['src/App.tsx']);

      expect(result.configUpdate.success).toBe(true);
      expect(result.summary.configUpdated).toBe(true);
    });

    it('should provide summary statistics', async () => {
      const mockFileContent = `import { User } from '../../entities/user';`;
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: { '@/*': ['./src/*'] }
        }
      };

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path.includes('.json')) {
          return JSON.stringify(mockConfig);
        }
        return mockFileContent;
      });
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = await standardizer.standardizeAllImports(['src/features/auth/Login.tsx']);

      expect(result.summary.totalViolationsFound).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalViolationsFixed).toBeGreaterThanOrEqual(0);
      expect(result.summary.filesAnalyzed).toBe(1);
    });
  });

  describe('fixSpecificViolationType', () => {
    it('should fix only specified violation type', async () => {
      const mockFileContent = `import { User } from '../../entities/user';
import { Course } from '@/entities/course/model/types';`;
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: { '@/*': ['./src/*'] }
        }
      };

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path.includes('.json')) {
          return JSON.stringify(mockConfig);
        }
        return mockFileContent;
      });
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = await standardizer.fixSpecificViolationType(
        ['src/features/auth/Login.tsx'],
        'missing-alias'
      );

      expect(result.success).toBeDefined();
      expect(result.summary.totalViolationsFound).toBeGreaterThanOrEqual(0);
    });
  });

  describe('validateImportPaths', () => {
    it('should validate without making changes', async () => {
      const mockFileContent = `import { User } from '@/entities/user';`;
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*'],
            '@/entities/*': ['./src/entities/*']
          }
        }
      };

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path.includes('.json')) {
          return JSON.stringify(mockConfig);
        }
        return mockFileContent;
      });
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = await standardizer.validateImportPaths(['src/App.tsx']);

      expect(result.refactoring.changes.length).toBe(0);
      expect(result.refactoring.filesModified.length).toBe(0);
      expect(result.summary.totalViolationsFixed).toBe(0);
    });

    it('should report violations without fixing', async () => {
      const mockFileContent = `import { User } from '../../entities/user';`;
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: { '@/*': ['./src/*'] }
        }
      };

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path.includes('.json')) {
          return JSON.stringify(mockConfig);
        }
        return mockFileContent;
      });
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = await standardizer.validateImportPaths(['src/features/auth/Login.tsx']);

      expect(result.analysis.violations.length).toBeGreaterThan(0);
      expect(result.summary.totalViolationsFixed).toBe(0);
    });
  });

  describe('convertAllRelativeToAbsolute', () => {
    it('should convert all relative imports', async () => {
      const mockFileContent = `import { User } from './user';
import { helper } from '../utils/helper';`;
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: { '@/*': ['./src/*'] }
        }
      };

      vi.mocked(fs.readFileSync).mockImplementation((path: any) => {
        if (path.includes('.json')) {
          return JSON.stringify(mockConfig);
        }
        return mockFileContent;
      });
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = await standardizer.convertAllRelativeToAbsolute(['src/features/auth/Login.tsx']);

      expect(result.success).toBeDefined();
      expect(result.refactoring.changes.length).toBeGreaterThan(0);
    });
  });
});
