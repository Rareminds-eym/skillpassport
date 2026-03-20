import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TypeScriptConfigUpdater } from '../TypeScriptConfigUpdater';
import { MigrationLogger } from '../../logging/MigrationLogger';
import { PathMapping } from '../../types/import-path';
import * as fs from 'fs';

vi.mock('fs');

describe('TypeScriptConfigUpdater', () => {
  let updater: TypeScriptConfigUpdater;
  let logger: MigrationLogger;

  beforeEach(() => {
    logger = new MigrationLogger();
    updater = new TypeScriptConfigUpdater(logger, 'tsconfig.app.json');
    vi.clearAllMocks();
  });

  describe('updatePathMappings', () => {
    it('should add new path mappings', async () => {
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*']
          }
        }
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const newMappings: PathMapping[] = [
        { alias: '@/entities/*', paths: ['./src/entities/*'] }
      ];

      const result = await updater.updatePathMappings(newMappings);

      expect(result.success).toBe(true);
      expect(result.addedMappings.length).toBe(1);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should modify existing path mappings', async () => {
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*']
          }
        }
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const newMappings: PathMapping[] = [
        { alias: '@/*', paths: ['./src/*', './lib/*'] }
      ];

      const result = await updater.updatePathMappings(newMappings);

      expect(result.success).toBe(true);
      expect(result.modifiedMappings.length).toBe(1);
    });

    it('should create compilerOptions if missing', async () => {
      const mockConfig = {};

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const newMappings: PathMapping[] = [
        { alias: '@/*', paths: ['./src/*'] }
      ];

      const result = await updater.updatePathMappings(newMappings);

      expect(result.success).toBe(true);
      expect(result.addedMappings.length).toBe(1);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      const newMappings: PathMapping[] = [
        { alias: '@/*', paths: ['./src/*'] }
      ];

      const result = await updater.updatePathMappings(newMappings);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('ensureFSDPathMappings', () => {
    it('should add all FSD layer path mappings', async () => {
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: {}
        }
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = await updater.ensureFSDPathMappings();

      expect(result.success).toBe(true);
      expect(result.addedMappings.length).toBeGreaterThan(0);
      
      const aliases = result.addedMappings.map(m => m.alias);
      expect(aliases).toContain('@/*');
      expect(aliases).toContain('@/entities/*');
      expect(aliases).toContain('@/features/*');
      expect(aliases).toContain('@/shared/*');
    });
  });

  describe('validatePathMappings', () => {
    it('should validate existing path mappings', async () => {
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*'],
            '@/entities/*': ['./src/entities/*']
          }
        }
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = await updater.validatePathMappings();

      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('should detect missing required mappings', async () => {
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: {}
        }
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

      const result = await updater.validatePathMappings();

      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should detect non-existent directories', async () => {
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@/nonexistent/*': ['./nonexistent/*']
          }
        }
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await updater.validatePathMappings();

      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.includes('non-existent'))).toBe(true);
    });

    it('should detect missing baseUrl', async () => {
      const mockConfig = {
        compilerOptions: {
          paths: {
            '@/*': ['./src/*']
          }
        }
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const result = await updater.validatePathMappings();

      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.includes('baseUrl'))).toBe(true);
    });
  });

  describe('addPathMapping', () => {
    it('should add a single path mapping', async () => {
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: {}
        }
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const result = await updater.addPathMapping('@/test/*', ['./src/test/*']);

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('removePathMapping', () => {
    it('should remove an existing path mapping', async () => {
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*'],
            '@/test/*': ['./src/test/*']
          }
        }
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const result = await updater.removePathMapping('@/test/*');

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should return false for non-existent mapping', async () => {
      const mockConfig = {
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*']
          }
        }
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

      const result = await updater.removePathMapping('@/nonexistent/*');

      expect(result).toBe(false);
    });
  });
});
