import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DependencyAnalyzer } from '../DependencyAnalyzer';
import * as fs from 'fs';

vi.mock('fs');

describe('DependencyAnalyzer', () => {
  let analyzer: DependencyAnalyzer;
  const mockProjectRoot = '/mock/project';

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new DependencyAnalyzer(mockProjectRoot);
  });

  describe('analyzeDependencies', () => {
    it('should identify known large dependencies with alternatives', async () => {
      const mockPackageJson = {
        dependencies: {
          'moment': '^2.29.0',
          'lodash': '^4.17.21',
          'react': '^18.0.0',
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockPackageJson));

      const optimizations = await analyzer.analyzeDependencies();

      expect(optimizations.length).toBeGreaterThan(0);
      
      const momentOpt = optimizations.find(o => o.dependency === 'moment');
      expect(momentOpt).toBeDefined();
      expect(momentOpt?.alternative).toBe('date-fns');
      expect(momentOpt?.suggestion).toContain('date-fns');
    });

    it('should suggest lodash-es for lodash', async () => {
      const mockPackageJson = {
        dependencies: {
          'lodash': '^4.17.21',
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockPackageJson));

      const optimizations = await analyzer.analyzeDependencies();

      const lodashOpt = optimizations.find(o => o.dependency === 'lodash');
      expect(lodashOpt).toBeDefined();
      expect(lodashOpt?.alternative).toBe('lodash-es');
    });

    it('should handle missing package.json gracefully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const optimizations = await analyzer.analyzeDependencies();

      expect(optimizations).toEqual([]);
    });

    it('should return empty array when no optimizable dependencies found', async () => {
      const mockPackageJson = {
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0',
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockPackageJson));

      const optimizations = await analyzer.analyzeDependencies();

      expect(optimizations).toEqual([]);
    });
  });

  describe('suggestTreeShakingImprovements', () => {
    it('should suggest improvements for lodash', () => {
      const suggestions = analyzer.suggestTreeShakingImprovements('lodash');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.includes('lodash/debounce'))).toBe(true);
      expect(suggestions.some(s => s.includes('lodash-es'))).toBe(true);
    });

    it('should suggest improvements for icon libraries', () => {
      const suggestions = analyzer.suggestTreeShakingImprovements('@radix-ui/react-icons');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('specific'))).toBe(true);
    });

    it('should return empty array for unknown dependencies', () => {
      const suggestions = analyzer.suggestTreeShakingImprovements('unknown-package');

      expect(suggestions).toEqual([]);
    });

    it('should suggest improvements for recharts', () => {
      const suggestions = analyzer.suggestTreeShakingImprovements('recharts');

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.toLowerCase().includes('chart'))).toBe(true);
    });
  });
});
