import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FSDComplianceValidatorImpl } from '../FSDComplianceValidator';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('FSDComplianceValidator', () => {
  let tempDir: string;
  let validator: FSDComplianceValidatorImpl;

  beforeEach(async () => {
    // Create temporary test directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fsd-test-'));
    validator = new FSDComplianceValidatorImpl(tempDir);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('validateLayerHierarchy', () => {
    it('should validate basic FSD layer structure', async () => {
      // Create basic FSD structure
      await fs.mkdir(path.join(tempDir, 'src', 'features', 'auth'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'src', 'entities', 'user'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'src', 'shared', 'ui'), { recursive: true });

      const result = await validator.validateLayerHierarchy();

      expect(result.layerStructure).toBeDefined();
      expect(result.layerStructure.length).toBeGreaterThan(0);
      
      const featuresLayer = result.layerStructure.find(l => l.layer === 'features');
      expect(featuresLayer?.exists).toBe(true);
      expect(featuresLayer?.slices).toContain('auth');
    });

    it('should detect missing layer directories', async () => {
      // Create only shared layer
      await fs.mkdir(path.join(tempDir, 'src', 'shared'), { recursive: true });

      const result = await validator.validateLayerHierarchy();

      const entitiesLayer = result.layerStructure.find(l => l.layer === 'entities');
      expect(entitiesLayer?.exists).toBe(false);
    });

    it('should validate entity structure with model/ui/api', async () => {
      // Create entity with proper structure
      const entityPath = path.join(tempDir, 'src', 'entities', 'user');
      await fs.mkdir(path.join(entityPath, 'model'), { recursive: true });
      await fs.mkdir(path.join(entityPath, 'ui'), { recursive: true });
      await fs.mkdir(path.join(entityPath, 'api'), { recursive: true });
      await fs.writeFile(path.join(entityPath, 'index.ts'), 'export * from "./model"');

      const result = await validator.validateLayerHierarchy();

      const entitiesLayer = result.layerStructure.find(l => l.layer === 'entities');
      expect(entitiesLayer?.slices).toContain('user');
      expect(entitiesLayer?.violations.length).toBe(0);
    });

    it('should detect missing model directory in entity', async () => {
      // Create entity without model directory
      const entityPath = path.join(tempDir, 'src', 'entities', 'user');
      await fs.mkdir(path.join(entityPath, 'ui'), { recursive: true });

      const result = await validator.validateLayerHierarchy();

      const entitiesLayer = result.layerStructure.find(l => l.layer === 'entities');
      const violations = entitiesLayer?.violations || [];
      
      expect(violations.some(v => v.message.includes('Missing required model directory'))).toBe(true);
    });
  });

  describe('validateDependencies', () => {
    it('should detect upward dependencies', async () => {
      // Create files with upward dependency
      const entitiesPath = path.join(tempDir, 'src', 'entities', 'user');
      const featuresPath = path.join(tempDir, 'src', 'features', 'auth');
      
      await fs.mkdir(entitiesPath, { recursive: true });
      await fs.mkdir(featuresPath, { recursive: true });

      // Entity importing from feature (upward dependency)
      await fs.writeFile(
        path.join(entitiesPath, 'model.ts'),
        `import { login } from '@/features/auth';\nexport const userModel = {};`
      );

      const result = await validator.validateDependencies();

      expect(result.upwardDependencies.length).toBeGreaterThan(0);
      expect(result.invalidDependencies).toBeGreaterThan(0);
      
      const upwardDep = result.upwardDependencies[0];
      expect(upwardDep.fromLayer).toBe('entities');
      expect(upwardDep.toLayer).toBe('features');
    });

    it('should allow downward dependencies', async () => {
      // Create files with valid downward dependency
      const entitiesPath = path.join(tempDir, 'src', 'entities', 'user');
      const featuresPath = path.join(tempDir, 'src', 'features', 'auth');
      
      await fs.mkdir(entitiesPath, { recursive: true });
      await fs.mkdir(featuresPath, { recursive: true });

      // Feature importing from entity (downward dependency - valid)
      await fs.writeFile(
        path.join(featuresPath, 'login.ts'),
        `import { User } from '@/entities/user';\nexport const login = () => {};`
      );

      await fs.writeFile(
        path.join(entitiesPath, 'index.ts'),
        `export interface User { id: string; }`
      );

      const result = await validator.validateDependencies();

      // Should have dependencies but no upward ones
      expect(result.totalDependencies).toBeGreaterThan(0);
      expect(result.upwardDependencies.length).toBe(0);
    });

    it('should allow same-layer dependencies', async () => {
      // Create two features that depend on each other
      const auth = path.join(tempDir, 'src', 'features', 'auth');
      const profile = path.join(tempDir, 'src', 'features', 'profile');
      
      await fs.mkdir(auth, { recursive: true });
      await fs.mkdir(profile, { recursive: true });

      await fs.writeFile(
        path.join(profile, 'index.ts'),
        `import { useAuth } from '@/features/auth';\nexport const profile = {};`
      );

      const result = await validator.validateDependencies();

      // Same-layer dependencies are not upward dependencies
      expect(result.upwardDependencies.length).toBe(0);
    });
  });

  describe('validatePublicAPIs', () => {
    it('should detect missing public API (index.ts)', async () => {
      // Create feature without index.ts
      const featurePath = path.join(tempDir, 'src', 'features', 'auth');
      await fs.mkdir(path.join(featurePath, 'model'), { recursive: true });
      await fs.writeFile(path.join(featurePath, 'model', 'types.ts'), 'export interface Auth {}');

      const result = await validator.validatePublicAPIs();

      expect(result.slicesWithoutPublicAPI).toContain('features/auth');
      expect(result.publicAPIViolations.length).toBeGreaterThan(0);
    });

    it('should validate existing public APIs', async () => {
      // Create feature with index.ts
      const featurePath = path.join(tempDir, 'src', 'features', 'auth');
      await fs.mkdir(featurePath, { recursive: true });
      await fs.writeFile(
        path.join(featurePath, 'index.ts'),
        'export { login } from "./api";\nexport type { User } from "./model";'
      );

      const result = await validator.validatePublicAPIs();

      expect(result.slicesWithPublicAPI).toBeGreaterThan(0);
    });

    it('should detect deep imports bypassing public API', async () => {
      // Create feature with public API
      const featurePath = path.join(tempDir, 'src', 'features', 'auth');
      await fs.mkdir(path.join(featurePath, 'api'), { recursive: true });
      await fs.writeFile(path.join(featurePath, 'index.ts'), 'export * from "./api";');
      await fs.writeFile(path.join(featurePath, 'api', 'login.ts'), 'export const login = () => {};');

      // Create another file with deep import
      const otherPath = path.join(tempDir, 'src', 'features', 'profile');
      await fs.mkdir(otherPath, { recursive: true });
      await fs.writeFile(
        path.join(otherPath, 'index.ts'),
        'import { login } from "@/features/auth/api/login";' // Deep import
      );

      const result = await validator.validatePublicAPIs();

      // Should detect the deep import
      const authAPI = result.publicAPIViolations.find(v => 
        v.message.includes('deep imports')
      );
      expect(authAPI).toBeDefined();
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate comprehensive compliance report', async () => {
      // Create minimal valid structure
      await fs.mkdir(path.join(tempDir, 'src', 'shared'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'src', 'entities', 'user', 'model'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'src', 'entities', 'user', 'index.ts'),
        'export * from "./model";'
      );

      const report = await validator.generateComplianceReport();

      expect(report.timestamp).toBeInstanceOf(Date);
      expect(report.complianceScore).toBeGreaterThanOrEqual(0);
      expect(report.complianceScore).toBeLessThanOrEqual(100);
      expect(report.hierarchyValidation).toBeDefined();
      expect(report.dependencyValidation).toBeDefined();
      expect(report.apiValidation).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.remediationRecommendations).toBeDefined();
    });

    it('should calculate compliance score correctly', async () => {
      // Create structure with no violations
      const layers = ['shared', 'entities', 'features'];
      for (const layer of layers) {
        const layerPath = path.join(tempDir, 'src', layer, 'test');
        await fs.mkdir(path.join(layerPath, 'model'), { recursive: true });
        await fs.writeFile(path.join(layerPath, 'index.ts'), 'export const test = {};');
      }

      const report = await validator.generateComplianceReport();

      // With no violations, score should be high
      expect(report.complianceScore).toBeGreaterThan(80);
      expect(report.summary.errorCount).toBe(0);
    });

    it('should provide remediation recommendations for violations', async () => {
      // Create structure with violations
      const entitiesPath = path.join(tempDir, 'src', 'entities', 'user');
      const featuresPath = path.join(tempDir, 'src', 'features', 'auth');
      
      await fs.mkdir(entitiesPath, { recursive: true });
      await fs.mkdir(featuresPath, { recursive: true });

      // Create upward dependency
      await fs.writeFile(
        path.join(entitiesPath, 'model.ts'),
        `import { auth } from '@/features/auth';\nexport const user = {};`
      );

      const report = await validator.generateComplianceReport();

      expect(report.remediationRecommendations.length).toBeGreaterThan(0);
      
      const upwardDepRec = report.remediationRecommendations.find(
        r => r.category === 'dependencies'
      );
      expect(upwardDepRec).toBeDefined();
      expect(upwardDepRec?.priority).toBe('high');
      expect(upwardDepRec?.steps.length).toBeGreaterThan(0);
    });

    it('should mark compliance as failed when errors exist', async () => {
      // Create structure with errors
      const entitiesPath = path.join(tempDir, 'src', 'entities', 'user');
      await fs.mkdir(entitiesPath, { recursive: true });
      // Missing model directory and index.ts

      const report = await validator.generateComplianceReport();

      expect(report.overallCompliance).toBe(false);
      expect(report.summary.errorCount).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty project structure', async () => {
      await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });

      const report = await validator.generateComplianceReport();

      expect(report).toBeDefined();
      expect(report.summary.filesScanned).toBe(0);
    });

    it('should handle non-existent src directory', async () => {
      const report = await validator.generateComplianceReport();

      expect(report).toBeDefined();
      expect(report.hierarchyValidation.layerStructure.every(l => !l.exists || l.layer === 'app' || l.layer === 'pages')).toBe(true);
    });

    it('should ignore test files', async () => {
      const featurePath = path.join(tempDir, 'src', 'features', 'auth');
      await fs.mkdir(featurePath, { recursive: true });
      
      // Create test file with upward dependency
      await fs.writeFile(
        path.join(featurePath, 'auth.test.ts'),
        `import { something } from '@/pages/login';\ntest('auth', () => {});`
      );

      const result = await validator.validateDependencies();

      // Test files should be ignored
      expect(result.upwardDependencies.length).toBe(0);
    });

    it('should handle circular imports within same layer', async () => {
      const feature1 = path.join(tempDir, 'src', 'features', 'auth');
      const feature2 = path.join(tempDir, 'src', 'features', 'profile');
      
      await fs.mkdir(feature1, { recursive: true });
      await fs.mkdir(feature2, { recursive: true });

      await fs.writeFile(
        path.join(feature1, 'index.ts'),
        `import { profile } from '@/features/profile';\nexport const auth = {};`
      );

      await fs.writeFile(
        path.join(feature2, 'index.ts'),
        `import { auth } from '@/features/auth';\nexport const profile = {};`
      );

      const result = await validator.validateDependencies();

      // Circular imports within same layer are not upward dependencies
      expect(result.upwardDependencies.length).toBe(0);
    });
  });

  describe('remediation recommendations', () => {
    it('should prioritize high-severity issues', async () => {
      // Create multiple types of violations
      const entitiesPath = path.join(tempDir, 'src', 'entities', 'user');
      const featuresPath = path.join(tempDir, 'src', 'features', 'auth');
      
      await fs.mkdir(entitiesPath, { recursive: true });
      await fs.mkdir(featuresPath, { recursive: true });

      // Upward dependency (high priority)
      await fs.writeFile(
        path.join(entitiesPath, 'model.ts'),
        `import { auth } from '@/features/auth';\nexport const user = {};`
      );

      // Missing public API (high priority)
      // (no index.ts created)

      const report = await validator.generateComplianceReport();

      const recommendations = report.remediationRecommendations;
      expect(recommendations.length).toBeGreaterThan(0);
      
      // High priority recommendations should come first
      expect(recommendations[0].priority).toBe('high');
    });

    it('should provide actionable steps for each recommendation', async () => {
      const featurePath = path.join(tempDir, 'src', 'features', 'auth');
      await fs.mkdir(featurePath, { recursive: true });
      // Missing index.ts

      const report = await validator.generateComplianceReport();

      const publicAPIRec = report.remediationRecommendations.find(
        r => r.category === 'public-api'
      );

      expect(publicAPIRec).toBeDefined();
      expect(publicAPIRec?.steps.length).toBeGreaterThan(0);
      expect(publicAPIRec?.steps[0]).toContain('index.ts');
    });
  });
});
