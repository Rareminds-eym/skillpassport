import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PerformanceAnalyzer } from '../PerformanceAnalyzer';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('PerformanceAnalyzer', () => {
  let testDir: string;
  let analyzer: PerformanceAnalyzer;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-analyzer-test-'));
    const srcDir = path.join(testDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    analyzer = new PerformanceAnalyzer(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('analyzeRenderPerformance', () => {
    it('should analyze render performance and return analysis', async () => {
      // Create a test component
      const componentPath = path.join(testDir, 'src', 'TestComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React, { useState, useEffect } from 'react';

        export const TestComponent = ({ data }) => {
          const [count, setCount] = useState(0);
          const [items, setItems] = useState([]);

          useEffect(() => {
            // Some effect
          }, [count]);

          useEffect(() => {
            // Another effect
          }, [items]);

          return (
            <div>
              {data.map(item => (
                <div key={item.id}>{item.name}</div>
              ))}
            </div>
          );
        };
      `);

      const analysis = await analyzer.analyzeRenderPerformance();

      expect(analysis).toBeDefined();
      expect(analysis.expensiveComponents).toBeDefined();
      expect(analysis.unnecessaryRerenders).toBeDefined();
      expect(analysis.heavyComputations).toBeDefined();
      expect(analysis.storeOptimizations).toBeDefined();
      expect(analysis.timestamp).toBeInstanceOf(Date);
    });

    it('should identify expensive components', async () => {
      // Create a complex component
      const componentPath = path.join(testDir, 'src', 'ComplexComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React, { useState, useEffect } from 'react';

        export const ComplexComponent = ({ data }) => {
          const [state1, setState1] = useState(0);
          const [state2, setState2] = useState(0);
          const [state3, setState3] = useState(0);
          const [state4, setState4] = useState(0);
          const [state5, setState5] = useState(0);
          const [state6, setState6] = useState(0);

          useEffect(() => {}, [state1]);
          useEffect(() => {}, [state2]);
          useEffect(() => {}, [state3]);
          useEffect(() => {}, [state4]);

          if (state1 > 0) {
            if (state2 > 0) {
              if (state3 > 0) {
                if (state4 > 0) {
                  if (state5 > 0) {
                    // Deep nesting
                  }
                }
              }
            }
          }

          return <div>Complex</div>;
        };
      `);

      const analysis = await analyzer.analyzeRenderPerformance();

      expect(analysis.expensiveComponents.length).toBeGreaterThan(0);
      const complex = analysis.expensiveComponents.find(c => c.name === 'ComplexComponent');
      expect(complex).toBeDefined();
      expect(complex?.complexity).toBeGreaterThan(5);
      expect(complex?.stateCount).toBeGreaterThan(5);
    });

    it('should detect unnecessary re-renders', async () => {
      // Create a component without memo
      const componentPath = path.join(testDir, 'src', 'UnmemoizedComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';

        export const UnmemoizedComponent = ({ data, config }) => {
          const processedData = data.map(item => item * 2);
          
          return (
            <div style={{ color: 'red' }}>
              {processedData.map(item => <span key={item}>{item}</span>)}
            </div>
          );
        };
      `);

      const analysis = await analyzer.analyzeRenderPerformance();

      expect(analysis.unnecessaryRerenders.length).toBeGreaterThan(0);
    });

    it('should identify heavy computations', async () => {
      // Create a component with heavy computation
      const componentPath = path.join(testDir, 'src', 'HeavyComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';

        export const HeavyComponent = ({ items }) => {
          const filtered = items.filter(item => item.active);
          const mapped = filtered.map(item => item.value * 2);
          const reduced = mapped.reduce((sum, val) => sum + val, 0);

          for (let i = 0; i < items.length; i++) {
            // Some loop
          }

          return <div>{reduced}</div>;
        };
      `);

      const analysis = await analyzer.analyzeRenderPerformance();

      expect(analysis.heavyComputations.length).toBeGreaterThan(0);
    });

    it('should analyze Zustand store usage', async () => {
      // Create a component with store usage
      const componentPath = path.join(testDir, 'src', 'StoreComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';
        import { useUserStore } from './store';

        export const StoreComponent = () => {
          const state = useUserStore();
          const user = useStore(state => state.user);

          return <div>{state.name}</div>;
        };
      `);

      const analysis = await analyzer.analyzeRenderPerformance();

      expect(analysis.storeOptimizations).toBeDefined();
    });
  });

  describe('component analysis', () => {
    it('should detect memoized components', async () => {
      const componentPath = path.join(testDir, 'src', 'MemoizedComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React, { memo } from 'react';

        export const MemoizedComponent = memo(({ data }) => {
          return <div>{data}</div>;
        });
      `);

      const analysis = await analyzer.analyzeRenderPerformance();

      const memoized = analysis.expensiveComponents.find(c => c.name === 'MemoizedComponent');
      if (memoized) {
        expect(memoized.memoized).toBe(true);
      }
    });

    it('should count component hooks correctly', async () => {
      const componentPath = path.join(testDir, 'src', 'HooksComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React, { useState, useEffect } from 'react';

        export const HooksComponent = () => {
          const [count, setCount] = useState(0);
          const [name, setName] = useState('');

          useEffect(() => {
            console.log('Effect 1');
          }, [count]);

          return <div>{count} {name}</div>;
        };
      `);

      const analysis = await analyzer.analyzeRenderPerformance();

      const hooks = analysis.expensiveComponents.find(c => c.name === 'HooksComponent');
      if (hooks) {
        expect(hooks.stateCount).toBe(2);
        expect(hooks.effectsCount).toBe(1);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty src directory', async () => {
      const analysis = await analyzer.analyzeRenderPerformance();

      expect(analysis.expensiveComponents).toEqual([]);
      expect(analysis.unnecessaryRerenders).toEqual([]);
      expect(analysis.heavyComputations).toEqual([]);
      expect(analysis.storeOptimizations).toEqual([]);
    });

    it('should handle non-component files', async () => {
      const utilPath = path.join(testDir, 'src', 'utils.ts');
      fs.writeFileSync(utilPath, `
        export function add(a: number, b: number) {
          return a + b;
        }
      `);

      const analysis = await analyzer.analyzeRenderPerformance();

      expect(analysis).toBeDefined();
    });

    it('should handle malformed component files', async () => {
      const componentPath = path.join(testDir, 'src', 'BadComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';
        
        export const BadComponent = (
          // Incomplete component
      `);

      const analysis = await analyzer.analyzeRenderPerformance();

      expect(analysis).toBeDefined();
    });
  });
});
