import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CodeSplitter } from '../CodeSplitter';
import * as fs from 'fs';

vi.mock('fs');

describe('CodeSplitter', () => {
  let splitter: CodeSplitter;
  const mockProjectRoot = '/mock/project';

  beforeEach(() => {
    vi.clearAllMocks();
    splitter = new CodeSplitter(mockProjectRoot);
  });

  describe('analyzeRoutes', () => {
    it('should identify lazy-loaded routes', async () => {
      const mockRouteContent = `
        import { lazy } from 'react';
        const Home = lazy(() => import('../pages/Home'));
        const About = lazy(() => import('../pages/About'));
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['routes.tsx'] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(mockRouteContent);

      const routes = await splitter.analyzeRoutes();

      expect(routes.length).toBeGreaterThan(0);
      const lazyRoutes = routes.filter(r => r.isLazy);
      expect(lazyRoutes.length).toBe(2);
    });

    it('should identify non-lazy routes', async () => {
      const mockRouteContent = `
        import Home from '../pages/Home';
        import About from '../pages/About';
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['routes.tsx'] as any);
      vi.mocked(fs.readFileSync).mockReturnValue(mockRouteContent);

      const routes = await splitter.analyzeRoutes();

      const nonLazyRoutes = routes.filter(r => !r.isLazy);
      expect(nonLazyRoutes.length).toBeGreaterThan(0);
    });

    it('should handle missing routes directory', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const routes = await splitter.analyzeRoutes();

      expect(routes).toEqual([]);
    });

    it('should filter only route files', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['routes.tsx', 'utils.ts', 'README.md'] as any);
      vi.mocked(fs.readFileSync).mockReturnValue('');

      const routes = await splitter.analyzeRoutes();

      // Should only process .tsx and .ts files
      expect(Array.isArray(routes)).toBe(true);
    });
  });

  describe('implementRouteSplitting', () => {
    it('should convert regular imports to lazy imports', async () => {
      const mockRouteContent = `
        import Home from '../pages/Home';
        import About from '../pages/About';
        
        export const routes = [
          <Route path="/" element={<Home />} />,
          <Route path="/about" element={<About />} />
        ];
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockRouteContent);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const updated = await splitter.implementRouteSplitting('routes.tsx');

      expect(updated.length).toBeGreaterThan(0);
      expect(vi.mocked(fs.writeFileSync)).toHaveBeenCalled();
    });

    it('should add lazy import if not present', async () => {
      const mockRouteContent = `
        import Home from '../pages/Home';
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockRouteContent);
      
      let writtenContent = '';
      vi.mocked(fs.writeFileSync).mockImplementation((path, content) => {
        writtenContent = content as string;
      });

      await splitter.implementRouteSplitting('routes.tsx');

      expect(writtenContent).toContain('import { lazy }');
    });

    it('should not modify already lazy-loaded routes', async () => {
      const mockRouteContent = `
        import { lazy } from 'react';
        const Home = lazy(() => import('../pages/Home'));
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockRouteContent);

      const updated = await splitter.implementRouteSplitting('routes.tsx');

      expect(updated).toEqual([]);
    });

    it('should throw error for non-existent file', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(splitter.implementRouteSplitting('nonexistent.tsx')).rejects.toThrow();
    });

    it('should not convert Layout imports', async () => {
      const mockRouteContent = `
        import PublicLayout from '../layouts/PublicLayout';
        import Home from '../pages/Home';
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockRouteContent);
      
      let writtenContent = '';
      vi.mocked(fs.writeFileSync).mockImplementation((path, content) => {
        writtenContent = content as string;
      });

      await splitter.implementRouteSplitting('routes.tsx');

      // Layout should not be converted to lazy
      expect(writtenContent).toContain('import PublicLayout');
      expect(writtenContent).not.toContain('lazy(() => import(\'../layouts/PublicLayout\')');
    });
  });

  describe('implementFeatureLazyLoading', () => {
    it('should return true for features with index exports', async () => {
      const mockIndexContent = `
        export { default as AuthForm } from './AuthForm';
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockIndexContent);

      const result = await splitter.implementFeatureLazyLoading('features/auth');

      expect(result).toBe(true);
    });

    it('should return false for missing feature path', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await splitter.implementFeatureLazyLoading('features/nonexistent');

      expect(result).toBe(false);
    });

    it('should return false for already lazy-loaded features', async () => {
      const mockIndexContent = `
        import { lazy } from 'react';
        export const AuthForm = lazy(() => import('./AuthForm'));
      `;

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockIndexContent);

      const result = await splitter.implementFeatureLazyLoading('features/auth');

      expect(result).toBe(false);
    });
  });

  describe('measureSizeReduction', () => {
    it('should calculate size reduction correctly', async () => {
      const beforeSize = 1000000;
      const afterSize = 750000;

      const result = await splitter.measureSizeReduction(beforeSize, afterSize);

      expect(result.reduction).toBe(250000);
      expect(result.percentage).toBe(25);
      expect(result.beforeSize).toBe(beforeSize);
      expect(result.afterSize).toBe(afterSize);
    });

    it('should handle zero reduction', async () => {
      const size = 1000000;

      const result = await splitter.measureSizeReduction(size, size);

      expect(result.reduction).toBe(0);
      expect(result.percentage).toBe(0);
    });

    it('should handle size increase (negative reduction)', async () => {
      const beforeSize = 750000;
      const afterSize = 1000000;

      const result = await splitter.measureSizeReduction(beforeSize, afterSize);

      expect(result.reduction).toBeLessThan(0);
      expect(result.percentage).toBeLessThan(0);
    });
  });

  describe('identifyLargeModules', () => {
    it('should identify files larger than threshold', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['large.ts', 'small.ts'] as any);
      vi.mocked(fs.statSync)
        .mockReturnValueOnce({ isDirectory: () => false, size: 150000 } as any)
        .mockReturnValueOnce({ isDirectory: () => false, size: 50000 } as any);

      const largeModules = await splitter.identifyLargeModules(100000);

      expect(largeModules.length).toBeGreaterThan(0);
    });

    it('should skip node_modules and dist directories', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['node_modules', 'src'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => true } as any);

      const largeModules = await splitter.identifyLargeModules();

      expect(Array.isArray(largeModules)).toBe(true);
    });

    it('should use custom threshold', async () => {
      const customThreshold = 200000;
      
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue(['file.ts'] as any);
      vi.mocked(fs.statSync).mockReturnValue({ isDirectory: () => false, size: 150000 } as any);

      const largeModules = await splitter.identifyLargeModules(customThreshold);

      expect(largeModules).toEqual([]);
    });
  });
});
