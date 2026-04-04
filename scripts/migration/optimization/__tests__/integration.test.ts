import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PerformanceAnalyzer } from '../PerformanceAnalyzer';
import { PerformanceOptimizer } from '../PerformanceOptimizer';
import { ResourceOptimizer } from '../ResourceOptimizer';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('Performance Optimization Integration', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-integration-test-'));
    const srcDir = path.join(testDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should complete full performance optimization workflow', async () => {
    // Create test components
    const component1Path = path.join(testDir, 'src', 'ExpensiveComponent.tsx');
    fs.writeFileSync(component1Path, `
import React, { useState } from 'react';

export const ExpensiveComponent = ({ data }) => {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([]);

  if (count > 0) {
    if (items.length > 0) {
      // Complex logic
    }
  }

  return <div>{data.map(item => <span key={item.id}>{item.name}</span>)}</div>;
};
`);

    const component2Path = path.join(testDir, 'src', 'ImageComponent.tsx');
    fs.writeFileSync(component2Path, `
import React from 'react';

export const ImageComponent = () => {
  return (
    <div>
      <img src="/image1.jpg" alt="Image 1" />
      <img src="/image2.jpg" alt="Image 2" />
    </div>
  );
};
`);

    // Step 1: Analyze performance
    const analyzer = new PerformanceAnalyzer(testDir);
    const analysis = await analyzer.analyzeRenderPerformance();

    expect(analysis).toBeDefined();
    expect(analysis.timestamp).toBeInstanceOf(Date);

    // Step 2: Identify optimizations
    const optimizer = new PerformanceOptimizer(testDir);
    const optimizations = await optimizer.identifyOptimizations();

    expect(optimizations).toBeDefined();
    expect(Array.isArray(optimizations)).toBe(true);

    // Step 3: Implement automatic optimizations
    const memoOptimizations = optimizations.filter(o => o.type === 'memo');
    if (memoOptimizations.length > 0) {
      const result = await optimizer.implementOptimizations(memoOptimizations);
      expect(result).toBeDefined();
      expect(result.optimizations).toBeDefined();
    }

    // Step 4: Identify resource optimizations
    const resourceOptimizer = new ResourceOptimizer(testDir);
    const lazyLoadCandidates = await resourceOptimizer.identifyLazyLoadCandidates();

    expect(lazyLoadCandidates).toBeDefined();
    expect(Array.isArray(lazyLoadCandidates)).toBe(true);

    // Step 5: Implement lazy loading
    const imageCandidates = lazyLoadCandidates.filter(c => c.type === 'image');
    if (imageCandidates.length > 0) {
      const lazyResult = await resourceOptimizer.implementLazyLoading(imageCandidates);
      expect(lazyResult).toBeDefined();
    }

    // Step 6: Measure improvements
    const metrics = await optimizer.measureImprovements();

    expect(metrics).toBeDefined();
    expect(metrics.before).toBeDefined();
    expect(metrics.after).toBeDefined();
    expect(metrics.improvement).toBeDefined();
    expect(metrics.improvement.renderTimeReduction).toBeGreaterThanOrEqual(0);
  });

  it('should handle empty project gracefully', async () => {
    const analyzer = new PerformanceAnalyzer(testDir);
    const optimizer = new PerformanceOptimizer(testDir);
    const resourceOptimizer = new ResourceOptimizer(testDir);

    const analysis = await analyzer.analyzeRenderPerformance();
    expect(analysis.expensiveComponents).toEqual([]);

    const optimizations = await optimizer.identifyOptimizations();
    expect(optimizations).toEqual([]);

    const virtualizationCandidates = await resourceOptimizer.identifyVirtualizationCandidates();
    expect(virtualizationCandidates).toEqual([]);

    const lazyLoadCandidates = await resourceOptimizer.identifyLazyLoadCandidates();
    expect(lazyLoadCandidates).toEqual([]);
  });

  it('should prioritize high-impact optimizations', async () => {
    // Create a very complex component
    const componentPath = path.join(testDir, 'src', 'VeryComplexComponent.tsx');
    fs.writeFileSync(componentPath, `
import React, { useState } from 'react';

export const VeryComplexComponent = ({ data }) => {
  const [s1, setS1] = useState(0);
  const [s2, setS2] = useState(0);
  const [s3, setS3] = useState(0);
  const [s4, setS4] = useState(0);
  const [s5, setS5] = useState(0);
  const [s6, setS6] = useState(0);

  if (s1 > 0) {
    if (s2 > 0) {
      if (s3 > 0) {
        if (s4 > 0) {
          if (s5 > 0) {
            if (s6 > 0) {
              // Very deep nesting
            }
          }
        }
      }
    }
  }

  return <div>Complex</div>;
};
`);

    const optimizer = new PerformanceOptimizer(testDir);
    const optimizations = await optimizer.identifyOptimizations();

    if (optimizations.length > 0) {
      // First optimization should be high or medium impact
      expect(['high', 'medium']).toContain(optimizations[0].impact);
    }
  });
});
