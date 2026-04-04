import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImportPathAnalyzer } from '../ImportPathAnalyzer';
import { MigrationLogger } from '../../logging/MigrationLogger';
import * as fs from 'fs';

vi.mock('fs');

describe('ImportPathAnalyzer', () => {
  let analyzer: ImportPathAnalyzer;
  let logger: MigrationLogger;

  beforeEach(() => {
    logger = new MigrationLogger();
    analyzer = new ImportPathAnalyzer(logger, 'src');
    vi.clearAllMocks();
  });

  describe('analyzeImportPaths', () => {
    it('should analyze import paths in TypeScript files', async () => {
      const mockFileContent = `
import { User } from '@/entities/user';
import { Button } from '../shared/ui/Button';
import React from 'react';
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const result = await analyzer.analyzeImportPaths(['src/features/auth/Login.tsx']);

      expect(result.totalImports).toBeGreaterThan(0);
      expect(result.imports).toBeDefined();
      expect(result.violations).toBeDefined();
      expect(result.statistics).toBeDefined();
    });

    it('should detect cross-layer relative imports', async () => {
      const mockFileContent = `
import { User } from '../../entities/user/model/types';
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const result = await analyzer.analyzeImportPaths(['src/features/auth/Login.tsx']);

      const crossLayerViolations = result.violations.filter(v => v.type === 'cross-layer-relative');
      expect(crossLayerViolations.length).toBeGreaterThan(0);
    });

    it('should detect missing alias usage', async () => {
      const mockFileContent = `
import { User } from '../../entities/user';
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const result = await analyzer.analyzeImportPaths(['src/features/auth/Login.tsx']);

      const missingAliasViolations = result.violations.filter(v => v.type === 'missing-alias');
      expect(missingAliasViolations.length).toBeGreaterThan(0);
    });

    it('should detect deep imports', async () => {
      const mockFileContent = `
import { UserType } from '@/entities/user/model/types';
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const result = await analyzer.analyzeImportPaths(['src/features/auth/Login.tsx']);

      const deepImportViolations = result.violations.filter(v => v.type === 'deep-import');
      expect(deepImportViolations.length).toBeGreaterThan(0);
    });

    it('should calculate statistics correctly', async () => {
      const mockFileContent = `
import { User } from '@/entities/user';
import { Button } from '@/shared/ui';
import React from 'react';
import { helper } from './utils';
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const result = await analyzer.analyzeImportPaths(['src/features/auth/Login.tsx']);

      expect(result.statistics.totalImports).toBe(4);
      expect(result.statistics.externalImports).toBeGreaterThan(0);
      expect(result.statistics.fsdLayerImports).toBeGreaterThan(0);
      expect(result.statistics.complianceRate).toBeDefined();
    });

    it('should handle files with no imports', async () => {
      const mockFileContent = `
export const config = {
  apiUrl: 'https://api.example.com'
};
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const result = await analyzer.analyzeImportPaths(['src/config/api.ts']);

      expect(result.totalImports).toBe(0);
      expect(result.violations.length).toBe(0);
    });

    it('should group violations by type', async () => {
      const mockFileContent = `
import { User } from '../../entities/user';
import { Course } from '@/entities/course/model/types';
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const result = await analyzer.analyzeImportPaths(['src/features/auth/Login.tsx']);

      expect(result.violationsByType).toBeDefined();
      expect(Object.keys(result.violationsByType).length).toBeGreaterThan(0);
    });
  });

  describe('classifyImportType', () => {
    it('should classify external imports correctly', async () => {
      const mockFileContent = `
import React from 'react';
import { useState } from 'react';
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const result = await analyzer.analyzeImportPaths(['src/App.tsx']);

      const externalImports = result.imports.filter(i => i.importType === 'external');
      expect(externalImports.length).toBe(2);
    });

    it('should classify FSD layer imports correctly', async () => {
      const mockFileContent = `
import { User } from '@/entities/user';
import { Button } from '@/shared/ui';
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const result = await analyzer.analyzeImportPaths(['src/App.tsx']);

      const fsdImports = result.imports.filter(i => i.importType === 'fsd-layer');
      expect(fsdImports.length).toBe(2);
    });
  });

  describe('detectViolations', () => {
    it('should provide suggestions for violations', async () => {
      const mockFileContent = `
import { User } from '../../entities/user';
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const result = await analyzer.analyzeImportPaths(['src/features/auth/Login.tsx']);

      const violationsWithSuggestions = result.violations.filter(v => v.suggestion);
      expect(violationsWithSuggestions.length).toBeGreaterThan(0);
    });

    it('should detect upward dependencies', async () => {
      const mockFileContent = `
import { LoginPage } from '@/pages/auth/Login';
      `;

      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const result = await analyzer.analyzeImportPaths(['src/entities/user/model/types.ts']);

      const upwardViolations = result.violations.filter(v => v.type === 'upward-dependency');
      expect(upwardViolations.length).toBeGreaterThan(0);
    });
  });
});
