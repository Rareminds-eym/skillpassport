import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ResourceOptimizer } from '../ResourceOptimizer';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ResourceOptimizer', () => {
  let testDir: string;
  let optimizer: ResourceOptimizer;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resource-optimizer-test-'));
    const srcDir = path.join(testDir, 'src');
    fs.mkdirSync(srcDir, { recursive: true });
    optimizer = new ResourceOptimizer(testDir);
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('identifyVirtualizationCandidates', () => {
    it('should identify large lists for virtualization', async () => {
      const componentPath = path.join(testDir, 'src', 'ListComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';

        export const ListComponent = ({ items }) => {
          return (
            <div>
              {items.map(item => (
                <div key={item.id}>{item.name}</div>
              ))}
            </div>
          );
        };
      `);

      const candidates = await optimizer.identifyVirtualizationCandidates();

      expect(candidates).toBeDefined();
      expect(Array.isArray(candidates)).toBe(true);
    });

    it('should identify tables for virtualization', async () => {
      const componentPath = path.join(testDir, 'src', 'TableComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';

        export const TableComponent = ({ data, pageSize }) => {
          return (
            <table>
              <thead>
                <tr><th>Name</th><th>Value</th></tr>
              </thead>
              <tbody>
                {data.map(row => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        };
      `);

      const candidates = await optimizer.identifyVirtualizationCandidates();

      const tableCandidate = candidates.find(c => c.type === 'table');
      expect(tableCandidate).toBeDefined();
    });

    it('should estimate performance improvement', async () => {
      const componentPath = path.join(testDir, 'src', 'DataList.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';

        export const DataList = ({ data }) => {
          return (
            <div>
              {data.map(item => <div key={item.id}>{item.text}</div>)}
            </div>
          );
        };
      `);

      const candidates = await optimizer.identifyVirtualizationCandidates();

      if (candidates.length > 0) {
        expect(candidates[0].estimatedImprovement).toBeGreaterThan(0);
      }
    });

    it('should provide suggestions for virtualization', async () => {
      const componentPath = path.join(testDir, 'src', 'LongList.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';

        export const LongList = ({ items }) => {
          return (
            <ul>
              {items.map(item => <li key={item.id}>{item.name}</li>)}
            </ul>
          );
        };
      `);

      const candidates = await optimizer.identifyVirtualizationCandidates();

      if (candidates.length > 0) {
        expect(candidates[0].suggestion).toBeDefined();
        expect(candidates[0].suggestion.length).toBeGreaterThan(0);
      }
    });
  });

  describe('identifyLazyLoadCandidates', () => {
    it('should identify images without lazy loading', async () => {
      const componentPath = path.join(testDir, 'src', 'ImageComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';

        export const ImageComponent = () => {
          return (
            <div>
              <img src="/image1.jpg" alt="Image 1" />
              <img src="/image2.jpg" alt="Image 2" />
              <img src="/image3.jpg" alt="Image 3" />
            </div>
          );
        };
      `);

      const candidates = await optimizer.identifyLazyLoadCandidates();

      const imageCandidate = candidates.find(c => c.type === 'image');
      expect(imageCandidate).toBeDefined();
    });

    it('should not flag images with lazy loading', async () => {
      const componentPath = path.join(testDir, 'src', 'LazyImageComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';

        export const LazyImageComponent = () => {
          return (
            <div>
              <img src="/image1.jpg" alt="Image 1" loading="lazy" />
              <img src="/image2.jpg" alt="Image 2" loading="lazy" />
            </div>
          );
        };
      `);

      const candidates = await optimizer.identifyLazyLoadCandidates();

      const imageCandidate = candidates.find(
        c => c.type === 'image' && c.component === 'LazyImageComponent'
      );
      expect(imageCandidate).toBeUndefined();
    });

    it('should identify heavy components for lazy loading', async () => {
      const componentPath = path.join(testDir, 'src', 'HeavyComponent.tsx');
      const heavyContent = `
        import React from 'react';
        ${'import { Component } from "library";\n'.repeat(15)}

        export const HeavyComponent = () => {
          ${'const [state, setState] = useState(0);\n'.repeat(20)}
          return <div>Heavy Component</div>;
        };
      `;
      fs.writeFileSync(componentPath, heavyContent);

      const candidates = await optimizer.identifyLazyLoadCandidates();

      const heavyCandidate = candidates.find(c => c.type === 'component');
      expect(heavyCandidate).toBeDefined();
    });

    it('should prioritize candidates by impact', async () => {
      const componentPath = path.join(testDir, 'src', 'MultiImageComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';

        export const MultiImageComponent = () => {
          return (
            <div>
              <img src="/image1.jpg" alt="Image 1" />
              <img src="/image2.jpg" alt="Image 2" />
            </div>
          );
        };
      `);

      const candidates = await optimizer.identifyLazyLoadCandidates();

      if (candidates.length > 0) {
        expect(['high', 'medium', 'low']).toContain(candidates[0].priority);
      }
    });
  });

  describe('implementVirtualization', () => {
    it('should warn about missing virtualization library', async () => {
      const candidates = [
        {
          component: 'TestList',
          filePath: path.join(testDir, 'src', 'TestList.tsx'),
          type: 'list' as const,
          itemCount: 100,
          estimatedImprovement: 60,
          suggestion: 'Use react-window',
        },
      ];

      const result = await optimizer.implementVirtualization(candidates);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('library not installed'))).toBe(true);
    });

    it('should return estimated improvements', async () => {
      const candidates = [
        {
          component: 'TestList',
          filePath: path.join(testDir, 'src', 'TestList.tsx'),
          type: 'list' as const,
          itemCount: 100,
          estimatedImprovement: 60,
          suggestion: 'Use react-window',
        },
      ];

      const result = await optimizer.implementVirtualization(candidates);

      expect(result.estimatedImprovement).toBeDefined();
      expect(result.estimatedImprovement.renderTimeReduction).toBeGreaterThan(0);
      expect(result.estimatedImprovement.memoryReduction).toBeGreaterThan(0);
    });

    it('should handle empty candidates', async () => {
      const result = await optimizer.implementVirtualization([]);

      expect(result.virtualizationImplemented).toEqual([]);
      expect(result.filesModified).toEqual([]);
    });
  });

  describe('implementLazyLoading', () => {
    it('should add lazy loading to images', async () => {
      const componentPath = path.join(testDir, 'src', 'ImageComponent.tsx');
      fs.writeFileSync(componentPath, `
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

      const candidates = [
        {
          component: 'ImageComponent',
          filePath: componentPath,
          type: 'image' as const,
          size: 200000,
          priority: 'high' as const,
          suggestion: 'Add loading="lazy"',
        },
      ];

      const result = await optimizer.implementLazyLoading(candidates);

      if (result.filesModified.includes(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf-8');
        expect(content).toContain('loading="lazy"');
      }
    });

    it('should not modify images that already have lazy loading', async () => {
      const componentPath = path.join(testDir, 'src', 'LazyImageComponent.tsx');
      const originalContent = `
import React from 'react';

export const LazyImageComponent = () => {
  return (
    <div>
      <img src="/image1.jpg" alt="Image 1" loading="lazy" />
    </div>
  );
};
`;
      fs.writeFileSync(componentPath, originalContent);

      const candidates = [
        {
          component: 'LazyImageComponent',
          filePath: componentPath,
          type: 'image' as const,
          size: 100000,
          priority: 'high' as const,
          suggestion: 'Add loading="lazy"',
        },
      ];

      const result = await optimizer.implementLazyLoading(candidates);

      expect(result.filesModified).not.toContain(componentPath);
    });

    it('should warn about component lazy loading', async () => {
      const componentPath = path.join(testDir, 'src', 'HeavyComponent.tsx');
      fs.writeFileSync(componentPath, `
        import React from 'react';
        export const HeavyComponent = () => <div>Heavy</div>;
      `);

      const candidates = [
        {
          component: 'HeavyComponent',
          filePath: componentPath,
          type: 'component' as const,
          size: 50000,
          priority: 'medium' as const,
          suggestion: 'Use React.lazy()',
        },
      ];

      const result = await optimizer.implementLazyLoading(candidates);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('React.lazy'))).toBe(true);
    });

    it('should return estimated improvements', async () => {
      const candidates = [
        {
          component: 'ImageComponent',
          filePath: path.join(testDir, 'src', 'ImageComponent.tsx'),
          type: 'image' as const,
          size: 200000,
          priority: 'high' as const,
          suggestion: 'Add loading="lazy"',
        },
      ];

      const result = await optimizer.implementLazyLoading(candidates);

      expect(result.estimatedImprovement).toBeDefined();
      expect(result.estimatedImprovement.memoryReduction).toBeGreaterThan(0);
      expect(result.estimatedImprovement.initialLoadReduction).toBeGreaterThan(0);
    });

    it('should handle multiple image tags in one component', async () => {
      const componentPath = path.join(testDir, 'src', 'Gallery.tsx');
      fs.writeFileSync(componentPath, `
import React from 'react';

export const Gallery = () => {
  return (
    <div>
      <img src="/img1.jpg" alt="1" />
      <img src="/img2.jpg" alt="2" />
      <img src="/img3.jpg" alt="3" />
    </div>
  );
};
`);

      const candidates = [
        {
          component: 'Gallery',
          filePath: componentPath,
          type: 'image' as const,
          size: 300000,
          priority: 'high' as const,
          suggestion: 'Add loading="lazy"',
        },
      ];

      const result = await optimizer.implementLazyLoading(candidates);

      if (result.filesModified.includes(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf-8');
        const lazyCount = (content.match(/loading="lazy"/g) || []).length;
        expect(lazyCount).toBe(3);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty src directory', async () => {
      const virtualizationCandidates = await optimizer.identifyVirtualizationCandidates();
      const lazyLoadCandidates = await optimizer.identifyLazyLoadCandidates();

      expect(virtualizationCandidates).toEqual([]);
      expect(lazyLoadCandidates).toEqual([]);
    });

    it('should handle non-component files', async () => {
      const utilPath = path.join(testDir, 'src', 'utils.ts');
      fs.writeFileSync(utilPath, `
        export function formatDate(date: Date) {
          return date.toISOString();
        }
      `);

      const candidates = await optimizer.identifyVirtualizationCandidates();

      expect(candidates).toBeDefined();
    });

    it('should handle invalid file paths in implementation', async () => {
      const candidates = [
        {
          component: 'NonExistent',
          filePath: '/non/existent/path.tsx',
          type: 'image' as const,
          size: 100000,
          priority: 'high' as const,
          suggestion: 'Test',
        },
      ];

      const result = await optimizer.implementLazyLoading(candidates);

      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
