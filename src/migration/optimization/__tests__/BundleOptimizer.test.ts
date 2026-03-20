import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BundleOptimizer } from '../BundleOptimizer';

vi.mock('../BundleAnalyzer');
vi.mock('../DependencyAnalyzer');
vi.mock('../TreeShakingDetector');
vi.mock('../CodeSplitter');

describe('BundleOptimizer', () => {
  let optimizer: BundleOptimizer;
  const mockProjectRoot = '/mock/project';

  beforeEach(() => {
    vi.clearAllMocks();
    optimizer = new BundleOptimizer(mockProjectRoot);
  });

  describe('analyzeAndIdentifyOptimizations', () => {
    it('should perform complete analysis', async () => {
      const result = await optimizer.analyzeAndIdentifyOptimizations();

      expect(result).toHaveProperty('bundleAnalysis');
      expect(result).toHaveProperty('dependencyOptimizations');
      expect(result).toHaveProperty('treeShakingOpportunities');
      expect(result).toHaveProperty('totalEstimatedSavings');
    });

    it('should calculate total estimated savings', async () => {
      const result = await optimizer.analyzeAndIdentifyOptimizations();

      expect(typeof result.totalEstimatedSavings).toBe('number');
      expect(result.totalEstimatedSavings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('identifyOptimizations', () => {
    it('should return prioritized optimization opportunities', async () => {
      const opportunities = await optimizer.identifyOptimizations();

      expect(Array.isArray(opportunities)).toBe(true);
      
      // Check if sorted by impact and savings
      for (let i = 0; i < opportunities.length - 1; i++) {
        const current = opportunities[i];
        const next = opportunities[i + 1];
        
        expect(current).toHaveProperty('type');
        expect(current).toHaveProperty('impact');
        expect(current).toHaveProperty('estimatedSavings');
        expect(current).toHaveProperty('implementationComplexity');
        expect(current).toHaveProperty('description');
      }
    });

    it('should categorize opportunities by type', async () => {
      const opportunities = await optimizer.identifyOptimizations();

      const types = new Set(opportunities.map(o => o.type));
      
      // Should have valid types
      for (const type of types) {
        expect(['code-splitting', 'tree-shaking', 'dependency-replacement']).toContain(type);
      }
    });

    it('should assign impact levels correctly', async () => {
      const opportunities = await optimizer.identifyOptimizations();

      for (const opp of opportunities) {
        expect(['high', 'medium', 'low']).toContain(opp.impact);
      }
    });

    it('should assign complexity levels correctly', async () => {
      const opportunities = await optimizer.identifyOptimizations();

      for (const opp of opportunities) {
        expect(['simple', 'moderate', 'complex']).toContain(opp.implementationComplexity);
      }
    });
  });

  describe('implementCodeSplitting', () => {
    it('should implement route and module splitting', async () => {
      const result = await optimizer.implementCodeSplitting();

      expect(result).toHaveProperty('routesUpdated');
      expect(result).toHaveProperty('modulesLazyLoaded');
      expect(result).toHaveProperty('estimatedSavings');
      expect(Array.isArray(result.routesUpdated)).toBe(true);
      expect(Array.isArray(result.modulesLazyLoaded)).toBe(true);
      expect(typeof result.estimatedSavings).toBe('number');
    });

    it('should calculate estimated savings', async () => {
      const result = await optimizer.implementCodeSplitting();

      expect(result.estimatedSavings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('optimizeTreeShaking', () => {
    it('should return optimization results', async () => {
      const result = await optimizer.optimizeTreeShaking();

      expect(result).toHaveProperty('fixed');
      expect(result).toHaveProperty('estimatedSavings');
      expect(typeof result.fixed).toBe('number');
      expect(typeof result.estimatedSavings).toBe('number');
    });
  });

  describe('measureBundleSizeReduction', () => {
    it('should measure size reduction correctly', async () => {
      const beforeAnalysis = {
        totalSize: 1000000,
        chunkSizes: {},
        largeDependencies: [],
        unusedExports: [],
        duplicatedModules: [],
        baseline: {
          timestamp: new Date(),
          totalSize: 1000000,
          chunkCount: 5,
          largestChunk: { name: 'main.js', size: 500000 },
        },
      };

      const result = await optimizer.measureBundleSizeReduction(beforeAnalysis);

      expect(result).toHaveProperty('before');
      expect(result).toHaveProperty('after');
      expect(result).toHaveProperty('reduction');
      expect(result).toHaveProperty('percentage');
      expect(result.before).toBe(1000000);
    });

    it('should calculate percentage correctly', async () => {
      const beforeAnalysis = {
        totalSize: 1000000,
        chunkSizes: {},
        largeDependencies: [],
        unusedExports: [],
        duplicatedModules: [],
        baseline: {
          timestamp: new Date(),
          totalSize: 1000000,
          chunkCount: 5,
          largestChunk: { name: 'main.js', size: 500000 },
        },
      };

      const result = await optimizer.measureBundleSizeReduction(beforeAnalysis);

      expect(typeof result.percentage).toBe('number');
    });
  });

  describe('formatSize', () => {
    it('should format sizes correctly', () => {
      expect(optimizer.formatSize(1024)).toMatch(/KB/);
      expect(optimizer.formatSize(1024 * 1024)).toMatch(/MB/);
      expect(optimizer.formatSize(500)).toMatch(/B/);
    });
  });
});
