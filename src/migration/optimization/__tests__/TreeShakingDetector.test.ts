import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TreeShakingDetector } from '../TreeShakingDetector';
import * as fs from 'fs';

vi.mock('fs');

describe('TreeShakingDetector', () => {
  let detector: TreeShakingDetector;
  const mockProjectRoot = '/mock/project';

  beforeEach(() => {
    vi.clearAllMocks();
    detector = new TreeShakingDetector(mockProjectRoot);
  });

  describe('detectOpportunities', () => {
    it('should detect barrel imports', async () => {
      const mockFileContent = `
        import * as Utils from './utils';
        import React from 'react';
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['test.ts'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => false } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const opportunities = await detector.detectOpportunities();

      const barrelImport = opportunities.find(o => o.issue.includes('Barrel import'));
      expect(barrelImport).toBeDefined();
      expect(barrelImport?.suggestion).toContain('specific exports');
    });

    it('should detect default lodash imports', async () => {
      const mockFileContent = `
        import _ from 'lodash';
        const result = _.debounce(fn, 300);
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['component.ts'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => false } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const opportunities = await detector.detectOpportunities();

      const lodashImport = opportunities.find(o => o.issue.includes('lodash'));
      expect(lodashImport).toBeDefined();
      expect(lodashImport?.suggestion).toContain('lodash/debounce');
    });

    it('should detect full library imports', async () => {
      const mockFileContent = `
        import { Icon } from '@heroicons/react';
        import { Button } from '@radix-ui/react-icons';
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['ui.tsx'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => false } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const opportunities = await detector.detectOpportunities();

      expect(opportunities.length).toBeGreaterThan(0);
    });

    it('should detect potentially unused imports', async () => {
      const mockFileContent = `
        import { useState, useEffect, useMemo } from 'react';
        
        function Component() {
          const [state, setState] = useState(0);
          return <div>{state}</div>;
        }
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['component.tsx'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => false } as any);
      vi.mocked(fs.readFileSync).mockReturnValue(mockFileContent);

      const opportunities = await detector.detectOpportunities();

      const unusedImports = opportunities.filter(o => o.issue.includes('unused import'));
      expect(unusedImports.length).toBeGreaterThan(0);
    });

    it('should handle empty directories gracefully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const opportunities = await detector.detectOpportunities();

      expect(opportunities).toEqual([]);
    });

    it('should skip node_modules and dist directories', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['node_modules', 'dist', 'src'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);

      const opportunities = await detector.detectOpportunities();

      // Should not throw and should handle gracefully
      expect(Array.isArray(opportunities)).toBe(true);
    });
  });

  describe('groupByType', () => {
    it('should group opportunities by type', () => {
      const opportunities = [
        { file: 'a.ts', issue: 'Barrel import: *', suggestion: 'Fix', estimatedSavings: 100 },
        { file: 'b.ts', issue: 'Full library import from lodash', suggestion: 'Fix', estimatedSavings: 200 },
        { file: 'c.ts', issue: 'Potentially unused import: foo', suggestion: 'Fix', estimatedSavings: 50 },
        { file: 'd.ts', issue: 'Barrel import: *', suggestion: 'Fix', estimatedSavings: 150 },
      ];

      const grouped = detector.groupByType(opportunities);

      expect(grouped['barrel-imports']).toHaveLength(2);
      expect(grouped['full-library-imports']).toHaveLength(1);
      expect(grouped['unused-imports']).toHaveLength(1);
    });

    it('should handle empty opportunities array', () => {
      const grouped = detector.groupByType([]);

      expect(grouped['barrel-imports']).toEqual([]);
      expect(grouped['full-library-imports']).toEqual([]);
      expect(grouped['unused-imports']).toEqual([]);
      expect(grouped['other']).toEqual([]);
    });

    it('should categorize unknown issues as other', () => {
      const opportunities = [
        { file: 'a.ts', issue: 'Some other issue', suggestion: 'Fix', estimatedSavings: 100 },
      ];

      const grouped = detector.groupByType(opportunities);

      expect(grouped['other']).toHaveLength(1);
    });
  });
});
