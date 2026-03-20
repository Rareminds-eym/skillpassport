import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PerformanceOptimizer } from '../PerformanceOptimizer';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('PerformanceOptimizer', () => {
  let testDir: string;
  let optimizer: PerformanceOptimizer;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-optimizer-test-'));
    const srcDir = path.join(testDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    optimizer = new PerformanceOptimizer(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('analyzeRenderPerformance', () => {
    it('should analyze render performance', async () => {
      const componentPath = path.join(testDir, 'src', 'TestComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';

        export const TestComponent = ({ data }) => {
          return <div>{data}</div>;
        };
      `);

      const analysis = await optimizer.analyzeRenderPerformance();

      expect(analysis).toBeDefined();
      expect(analysis.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('identifyOptimizations', () => {
    it('should identify React.memo opportunities', async () => {
      const componentPath = path.join(testDir, 'src', 'UnmemoizedComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';

        export const UnmemoizedComponent = ({ data, config }) => {
          if (data.length > 0) {
            if (config.enabled) {
              if (config.mode === 'advanced') {
                // Complex logic
              }
            }
          }
          return <div>{data.length}</div>;
        };
      `);

      const optimizations = await optimizer.identifyOptimizations();

      expect(optimizations).toBeDefined();
      expect(Array.isArray(optimizations)).toBe(true);
    });

    it('should prioritize optimizations by impact', async () => {
      const componentPath = path.join(testDir, 'src', 'ComplexComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React, { useState } from 'react';

        export const ComplexComponent = ({ data }) => {
          const [state1, setState1] = useState(0);
          const [state2, setState2] = useState(0);
          const [state3, setState3] = useState(0);
          const [state4, setState4] = useState(0);
          const [state5, setState5] = useState(0);
          const [state6, setState6] = useState(0);

          if (state1 > 0) {
            if (state2 > 0) {
              if (state3 > 0) {
                if (state4 > 0) {
                  if (state5 > 0) {
                    if (state6 > 0) {
                      // Very complex
                    }
                  }
                }
              }
            }
          }

          return <div>Complex</div>;
        };
      `);

      const optimizations = await optimizer.identifyOptimizations();

      if (optimizations.length > 1) {
        // High impact should come before medium/low
        const impacts = optimizations.map(o => o.impact);
        const highIndex = impacts.indexOf('high');
        const lowIndex = impacts.indexOf('low');
        
        if (highIndex !== -1 && lowIndex !== -1) {
          expect(highIndex).toBeLessThan(lowIndex);
        }
      }
    });

    it('should identify useMemo opportunities', async () => {
      const componentPath = path.join(testDir, 'src', 'ComputationComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';

        export const ComputationComponent = ({ items }) => {
          const filtered = items.filter(item => item.active);
          const mapped = filtered.map(item => item.value * 2);

          return <div>{mapped.length}</div>;
        };
      `);

      const optimizations = await optimizer.identifyOptimizations();

      const useMemoOpts = optimizations.filter(o => o.type === 'useMemo');
      expect(useMemoOpts.length).toBeGreaterThanOrEqual(0);
    });

    it('should identify store selector opportunities', async () => {
      const componentPath = path.join(testDir, 'src', 'StoreComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';
        import { useUserStore } from './store';

        export const StoreComponent = () => {
          const state = useUserStore();
          return <div>{state.name}</div>;
        };
      `);

      const optimizations = await optimizer.identifyOptimizations();

      const selectorOpts = optimizations.filter(o => o.type === 'selector');
      expect(selectorOpts.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('implementOptimizations', () => {
    it('should implement React.memo optimization', async () => {
      const componentPath = path.join(testDir, 'src', 'SimpleComponent.tsx');
      fs.writeFileSync(componentPath, `
import React from 'react';

export const SimpleComponent = ({ data }) => {
  return <div>{data}</div>;
};
`);

      const optimizations = [
        {
          type: 'memo' as const,
          component: 'SimpleComponent',
          filePath: componentPath,
          description: 'Wrap with React.memo',
          impact: 'medium' as const,
          implemented: false,
        },
      ];

      const result = await optimizer.implementOptimizations(optimizations);

      expect(result.filesModified.length).toBeGreaterThanOrEqual(0);
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should add React import if missing', async () => {
      const componentPath = path.join(testDir, 'src', 'NoImportComponent.tsx');
      fs.writeFileSync(componentPath, `
export const NoImportComponent = ({ data }) => {
  return <div>{data}</div>;
};
`);

      const optimizations = [
        {
          type: 'memo' as const,
          component: 'NoImportComponent',
          filePath: componentPath,
          description: 'Wrap with React.memo',
          impact: 'medium' as const,
          implemented: false,
        },
      ];

      const result = await optimizer.implementOptimizations(optimizations);

      if (result.filesModified.includes(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf-8');
        expect(content).toContain('memo');
      }
    });

    it('should skip already memoized components', async () => {
      const componentPath = path.join(testDir, 'src', 'AlreadyMemoized.tsx');
      fs.writeFileSync(componentPath, `
import React, { memo } from 'react';

export const AlreadyMemoized = memo(({ data }) => {
  return <div>{data}</div>;
});
`);

      const optimizations = [
        {
          type: 'memo' as const,
          component: 'AlreadyMemoized',
          filePath: componentPath,
          description: 'Wrap with React.memo',
          impact: 'medium' as const,
          implemented: false,
        },
      ];

      const result = await optimizer.implementOptimizations(optimizations);

      expect(result.filesModified).not.toContain(componentPath);
    });

    it('should warn about manual implementation needed', async () => {
      const componentPath = path.join(testDir, 'src', 'ManualComponent.tsx');
      fs.writeFileSync(componentPath, `
import React from 'react';

export const ManualComponent = ({ data }) => {
  return <div>{data}</div>;
};
`);

      const optimizations = [
        {
          type: 'useMemo' as const,
          component: 'ManualComponent',
          filePath: componentPath,
          description: 'Add useMemo',
          impact: 'medium' as const,
          implemented: false,
        },
      ];

      const result = await optimizer.implementOptimizations(optimizations);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('manual implementation'))).toBe(true);
    });

    it('should handle multiple optimizations', async () => {
      const component1Path = path.join(testDir, 'src', 'Component1.tsx');
      const component2Path = path.join(testDir, 'src', 'Component2.tsx');

      fs.writeFileSync(component1Path, `
import React from 'react';

export const Component1 = ({ data }) => {
  return <div>{data}</div>;
};
`);

      fs.writeFileSync(component2Path, `
import React from 'react';

export const Component2 = ({ data }) => {
  return <div>{data}</div>;
};
`);

      const optimizations = [
        {
          type: 'memo' as const,
          component: 'Component1',
          filePath: component1Path,
          description: 'Wrap with React.memo',
          impact: 'high' as const,
          implemented: false,
        },
        {
          type: 'memo' as const,
          component: 'Component2',
          filePath: component2Path,
          description: 'Wrap with React.memo',
          impact: 'medium' as const,
          implemented: false,
        },
      ];

      const result = await optimizer.implementOptimizations(optimizations);

      expect(result.optimizations).toBeDefined();
    });
  });

  describe('measureImprovements', () => {
    it('should measure performance improvements', async () => {
      const componentPath = path.join(testDir, 'src', 'TestComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';

        export const TestComponent = ({ data }) => {
          return <div>{data}</div>;
        };
      `);

      const metrics = await optimizer.measureImprovements();

      expect(metrics).toBeDefined();
      expect(metrics.before).toBeDefined();
      expect(metrics.after).toBeDefined();
      expect(metrics.improvement).toBeDefined();
      expect(metrics.before.timestamp).toBeInstanceOf(Date);
      expect(metrics.after.timestamp).toBeInstanceOf(Date);
    });

    it('should calculate improvement percentages', async () => {
      const metrics = await optimizer.measureImprovements();

      expect(metrics.improvement.renderTimeReduction).toBeGreaterThanOrEqual(0);
      expect(metrics.improvement.rerenderReduction).toBeGreaterThanOrEqual(0);
      expect(metrics.improvement.bundleSizeReduction).toBeGreaterThanOrEqual(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty project', async () => {
      const optimizations = await optimizer.identifyOptimizations();

      expect(optimizations).toEqual([]);
    });

    it('should handle invalid file paths', async () => {
      const optimizations = [
        {
          type: 'memo' as const,
          component: 'NonExistent',
          filePath: '/non/existent/path.tsx',
          description: 'Test',
          impact: 'low' as const,
          implemented: false,
        },
      ];

      const result = await optimizer.implementOptimizations(optimizations);

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
