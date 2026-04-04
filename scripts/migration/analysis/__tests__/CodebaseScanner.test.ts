import { CodebaseScanner } from '../CodebaseScanner';
import { MigrationConfig, MigrationLogger, APIFunction } from '../../types';
import { promises as fs } from 'fs';
import path from 'path';

// Mock file system
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
    access: jest.fn()
  }
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('CodebaseScanner', () => {
  let scanner: CodebaseScanner;
  let mockConfig: MigrationConfig;
  let mockLogger: MigrationLogger;

  beforeEach(() => {
    mockConfig = {
      projectRoot: '/test/project',
      dryRun: false,
      backupEnabled: true,
      validateAfterMigration: true,
      rollbackOnFailure: true,
      storeIntegrationRules: []
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    scanner = new CodebaseScanner(mockConfig, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('scanForImportReferences', () => {
    it('should scan files and find import references', async () => {
      // Mock directory structure
      mockFs.readdir.mockImplementation((dirPath: any, options: any) => {
        if (dirPath === '/test/project') {
          return Promise.resolve([
            { name: 'src', isDirectory: () => true, isFile: () => false },
            { name: 'node_modules', isDirectory: () => true, isFile: () => false }
          ] as any);
        }
        if (dirPath === '/test/project/src') {
          return Promise.resolve([
            { name: 'component.ts', isDirectory: () => false, isFile: () => true }
          ] as any);
        }
        return Promise.resolve([]);
      });

      // Mock file content with import statements
      mockFs.readFile.mockResolvedValue(`
        import { authService } from '@/shared/api/authService';
        import userService from '@/shared/api/userService';
        import * as apiUtils from '@/shared/api/apiUtils';
        
        export function useAuth() {
          return authService.login();
        }
      `);

      const result = await scanner.scanForImportReferences();

      expect(result.references).toHaveLength(3);
      expect(result.references[0].importType).toBe('named');
      expect(result.references[0].importedIdentifiers).toContain('authService');
      expect(result.references[1].importType).toBe('default');
      expect(result.references[1].importedIdentifiers).toContain('userService');
      expect(result.references[2].importType).toBe('namespace');
      expect(result.references[2].importedIdentifiers).toContain('apiUtils');
    });

    it('should handle relative and absolute import paths', async () => {
      mockFs.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === '/test/project') {
          return Promise.resolve([
            { name: 'src', isDirectory: () => true, isFile: () => false }
          ] as any);
        }
        if (dirPath === '/test/project/src') {
          return Promise.resolve([
            { name: 'test.ts', isDirectory: () => false, isFile: () => true }
          ] as any);
        }
        return Promise.resolve([]);
      });

      mockFs.readFile.mockResolvedValue(`
        import { relativeFunc } from './relative/path';
        import { absoluteFunc } from 'absolute/path';
      `);

      const result = await scanner.scanForImportReferences();

      expect(result.references).toHaveLength(2);
      expect(result.references[0].pathType).toBe('relative');
      expect(result.references[1].pathType).toBe('absolute');
    });

    it('should filter references by migrated functions', async () => {
      const migratedFunctions: APIFunction[] = [
        {
          name: 'authService',
          signature: 'authService',
          feature: 'authentication',
          isShared: false,
          dependencies: [],
          usageCount: 1,
          storeIntegrations: []
        }
      ];

      mockFs.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === '/test/project') {
          return Promise.resolve([
            { name: 'src', isDirectory: () => true, isFile: () => false }
          ] as any);
        }
        if (dirPath === '/test/project/src') {
          return Promise.resolve([
            { name: 'test.ts', isDirectory: () => false, isFile: () => true }
          ] as any);
        }
        return Promise.resolve([]);
      });

      mockFs.readFile.mockResolvedValue(`
        import { authService, otherService } from '@/shared/api/auth';
      `);

      const result = await scanner.scanForImportReferences(migratedFunctions);

      expect(result.references).toHaveLength(1);
      expect(result.references[0].referencedFunction).toBeDefined();
      expect(result.references[0].referencedFunction?.name).toBe('authService');
    });
  });

  describe('findServiceFileReferences', () => {
    it('should find references to specific service files', async () => {
      mockFs.readdir.mockImplementation((dirPath: any) => {
        if (dirPath === '/test/project') {
          return Promise.resolve([
            { name: 'src', isDirectory: () => true, isFile: () => false }
          ] as any);
        }
        if (dirPath === '/test/project/src') {
          return Promise.resolve([
            { name: 'component.ts', isDirectory: () => false, isFile: () => true }
          ] as any);
        }
        return Promise.resolve([]);
      });

      mockFs.readFile.mockResolvedValue(`
        import { authService } from '@/shared/api/authService';
        import { userService } from '@/shared/api/userService';
      `);

      const serviceFiles = ['/test/project/services/authService.ts'];
      const references = await scanner.findServiceFileReferences(serviceFiles);

      expect(references.length).toBeGreaterThan(0);
      expect(references[0].importPath).toContain('authService');
    });
  });

  describe('filterReferencesByFunctions', () => {
    it('should filter references by function names', () => {
      const references = [
        {
          filePath: '/test/file1.ts',
          lineNumber: 1,
          columnNumber: 1,
          importStatement: 'import { authService } from "./auth"',
          importPath: './auth',
          importType: 'named' as const,
          importedIdentifiers: ['authService'],
          pathType: 'relative' as const
        },
        {
          filePath: '/test/file2.ts',
          lineNumber: 1,
          columnNumber: 1,
          importStatement: 'import { userService } from "./user"',
          importPath: './user',
          importType: 'named' as const,
          importedIdentifiers: ['userService'],
          pathType: 'relative' as const
        }
      ];

      const filtered = scanner.filterReferencesByFunctions(references, ['authService']);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].importedIdentifiers).toContain('authService');
    });
  });

  describe('groupReferencesByFile', () => {
    it('should group references by file path', () => {
      const references = [
        {
          filePath: '/test/file1.ts',
          lineNumber: 1,
          columnNumber: 1,
          importStatement: 'import { authService } from "./auth"',
          importPath: './auth',
          importType: 'named' as const,
          importedIdentifiers: ['authService'],
          pathType: 'relative' as const
        },
        {
          filePath: '/test/file1.ts',
          lineNumber: 2,
          columnNumber: 1,
          importStatement: 'import { userService } from "./user"',
          importPath: './user',
          importType: 'named' as const,
          importedIdentifiers: ['userService'],
          pathType: 'relative' as const
        }
      ];

      const grouped = scanner.groupReferencesByFile(references);

      expect(grouped.size).toBe(1);
      expect(grouped.get('/test/file1.ts')).toHaveLength(2);
    });
  });
});