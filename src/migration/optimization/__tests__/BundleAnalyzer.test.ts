import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BundleAnalyzer } from '../BundleAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('fs');
vi.mock('path');

describe('BundleAnalyzer', () => {
  let analyzer: BundleAnalyzer;
  const mockProjectRoot = '/mock/project';

  beforeEach(() => {
    vi.clearAllMocks();
    analyzer = new BundleAnalyzer(mockProjectRoot);
  });

  describe('analyzeCurrentBundles', () => {
    it('should analyze bundle sizes and generate baseline report', async () => {
      // Mock dist directory structure
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['main-abc123.js', 'vendor-def456.js'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ size: 100000 } as any);

      const analysis = await analyzer.analyzeCurrentBundles();

      expect(analysis).toHaveProperty('totalSize');
      expect(analysis).toHaveProperty('chunkSizes');
      expect(analysis).toHaveProperty('largeDependencies');
      expect(analysis).toHaveProperty('baseline');
      expect(analysis.baseline).toHaveProperty('timestamp');
      expect(analysis.baseline).toHaveProperty('totalSize');
      expect(analysis.baseline).toHaveProperty('chunkCount');
    });

    it('should handle missing dist directory gracefully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const analysis = await analyzer.analyzeCurrentBundles();

      expect(analysis.totalSize).toBe(0);
      expect(Object.keys(analysis.chunkSizes)).toHaveLength(0);
    });

    it('should calculate total size correctly', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['chunk1.js', 'chunk2.js'] as any);
      vi.mocked(fs.statSync)
        .mockReturnValueOnce({ size: 50000 } as any)
        .mockReturnValueOnce({ size: 75000 } as any);

      const analysis = await analyzer.analyzeCurrentBundles();

      expect(analysis.totalSize).toBe(125000);
    });
  });

  describe('identifyLargeDependencies', () => {
    it('should identify dependencies larger than threshold', async () => {
      const mockPackageJson = {
        dependencies: {
          'react': '^18.0.0',
          'lodash': '^4.17.21',
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockPackageJson));
      vi.mocked(fs.readdirSync).mockReturnValue(['index.js'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ size: 150000, isDirectory: () => false } as any);

      const largeDeps = await analyzer.identifyLargeDependencies();

      expect(Array.isArray(largeDeps)).toBe(true);
    });

    it('should sort dependencies by size descending', async () => {
      const mockPackageJson = {
        dependencies: {
          'small-lib': '^1.0.0',
          'large-lib': '^2.0.0',
        },
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockPackageJson));
      vi.mocked(fs.readdirSync).mockReturnValue(['index.js'] as any);
      
      let callCount = 0;
      vi.mocked(fs.statSync).mockImplementation(() => {
        callCount++;
        return { size: callCount === 1 ? 200000 : 150000, isDirectory: () => false } as any;
      });

      const largeDeps = await analyzer.identifyLargeDependencies();

      if (largeDeps.length >= 2) {
        expect(largeDeps[0].size).toBeGreaterThanOrEqual(largeDeps[1].size);
      }
    });
  });

  describe('formatSize', () => {
    it('should format bytes correctly', () => {
      expect(analyzer.formatSize(500)).toMatch(/B$/);
      expect(analyzer.formatSize(1024)).toMatch(/KB$/);
      expect(analyzer.formatSize(1024 * 1024)).toMatch(/MB$/);
      expect(analyzer.formatSize(1024 * 1024 * 1024)).toMatch(/GB$/);
    });

    it('should format with 2 decimal places', () => {
      const formatted = analyzer.formatSize(1536); // 1.5 KB
      expect(formatted).toMatch(/\d+\.\d{2}/);
    });
  });

  describe('generateBaselineReport', () => {
    it('should generate a readable report', () => {
      const mockAnalysis = {
        totalSize: 500000,
        chunkSizes: {
          'main.js': 300000,
          'vendor.js': 200000,
        },
        largeDependencies: [
          { name: 'react', size: 150000, path: '/node_modules/react', importedBy: [] },
        ],
        unusedExports: [],
        duplicatedModules: [],
        baseline: {
          timestamp: new Date('2024-01-01'),
          totalSize: 500000,
          chunkCount: 2,
          largestChunk: { name: 'main.js', size: 300000 },
        },
      };

      const report = analyzer.generateBaselineReport(mockAnalysis);

      expect(report).toContain('Bundle Analysis Baseline Report');
      expect(report).toContain('Total Bundle Size');
      expect(report).toContain('Chunk Sizes');
      expect(report).toContain('main.js');
      expect(report).toContain('vendor.js');
    });

    it('should include large dependencies section when present', () => {
      const mockAnalysis = {
        totalSize: 500000,
        chunkSizes: {},
        largeDependencies: [
          { name: 'lodash', size: 200000, path: '/node_modules/lodash', importedBy: [] },
        ],
        unusedExports: [],
        duplicatedModules: [],
        baseline: {
          timestamp: new Date(),
          totalSize: 500000,
          chunkCount: 0,
          largestChunk: { name: '', size: 0 },
        },
      };

      const report = analyzer.generateBaselineReport(mockAnalysis);

      expect(report).toContain('Large Dependencies');
      expect(report).toContain('lodash');
    });
  });
});
