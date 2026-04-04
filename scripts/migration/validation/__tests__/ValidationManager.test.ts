import { ValidationManager } from '../ValidationManager'
import { MigrationConfig, MigrationLogger, ValidationResult, Integration, ImportUpdate } from '../../types'

// Mock dependencies
jest.mock('fs/promises')
jest.mock('child_process')

describe('ValidationManager', () => {
  let validationManager: ValidationManager
  let mockConfig: MigrationConfig
  let mockLogger: MigrationLogger

  beforeEach(() => {
    mockConfig = {
      sourceDir: 'services',
      targetDir: 'src/features',
      sharedDir: 'src/shared/api',
      backupDir: '.migration-backup',
      dryRun: false,
      features: ['authentication', 'subscription', 'search', 'portfolio']
    }

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn()
    }

    validationManager = new ValidationManager(mockConfig, mockLogger)
  })

  describe('validatePreMigration', () => {
    it('should validate all pre-migration requirements', async () => {
      // Mock successful validations
      jest.spyOn(validationManager as any, 'validateTestSuite').mockResolvedValue({
        success: true,
        total: 10,
        passed: 10,
        failed: 0,
        errors: []
      })

      jest.spyOn(validationManager as any, 'validateEndpoints').mockResolvedValue({
        success: true,
        total: 5,
        accessible: 5,
        errors: []
      })

      jest.spyOn(validationManager as any, 'validateImportPaths').mockResolvedValue({
        success: true,
        errors: []
      })

      jest.spyOn(validationManager as any, 'validateServiceFilesExist').mockResolvedValue({
        success: true,
        errors: []
      })

      jest.spyOn(validationManager as any, 'validateDependencyGraph').mockResolvedValue({
        success: true,
        errors: []
      })

      const result = await validationManager.validatePreMigration()

      expect(result.testsPass).toBe(true)
      expect(result.endpointsAccessible).toBe(true)
      expect(result.importPathsResolved).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(mockLogger.info).toHaveBeenCalledWith('Pre-migration validation passed - system is ready for migration')
    })

    it('should handle test failures with warnings', async () => {
      jest.spyOn(validationManager as any, 'validateTestSuite').mockResolvedValue({
        success: false,
        total: 10,
        passed: 8,
        failed: 2,
        errors: [{ type: 'test', message: 'Test failed', details: 'Details' }]
      })

      jest.spyOn(validationManager as any, 'validateEndpoints').mockResolvedValue({
        success: true,
        total: 5,
        accessible: 5,
        errors: []
      })

      jest.spyOn(validationManager as any, 'validateImportPaths').mockResolvedValue({
        success: true,
        errors: []
      })

      jest.spyOn(validationManager as any, 'validateServiceFilesExist').mockResolvedValue({
        success: true,
        errors: []
      })

      jest.spyOn(validationManager as any, 'validateDependencyGraph').mockResolvedValue({
        success: true,
        errors: []
      })

      const result = await validationManager.validatePreMigration()

      expect(result.testsPass).toBe(false)
      expect(result.warnings).toContain('2 tests are currently failing - migration may introduce additional failures')
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should detect missing service files', async () => {
      jest.spyOn(validationManager as any, 'validateTestSuite').mockResolvedValue({
        success: true,
        total: 10,
        passed: 10,
        failed: 0,
        errors: []
      })

      jest.spyOn(validationManager as any, 'validateEndpoints').mockResolvedValue({
        success: true,
        total: 5,
        accessible: 5,
        errors: []
      })

      jest.spyOn(validationManager as any, 'validateImportPaths').mockResolvedValue({
        success: true,
        errors: []
      })

      jest.spyOn(validationManager as any, 'validateServiceFilesExist').mockResolvedValue({
        success: false,
        errors: [{ type: 'import', message: 'Service file missing', details: 'Details' }]
      })

      jest.spyOn(validationManager as any, 'validateDependencyGraph').mockResolvedValue({
        success: true,
        errors: []
      })

      const result = await validationManager.validatePreMigration()

      expect(result.importPathsResolved).toBe(false)
      expect(result.warnings).toContain('Some expected service files are missing')
    })
  })

  describe('validatePostMigration', () => {
    it('should validate all post-migration requirements', async () => {
      const mockIntegrations: Integration[] = [
        {
          apiFunction: 'loginUser',
          storeName: 'useAuthStore',
          actions: ['setUser', 'setToken'],
          selectors: ['user', 'token'],
          integrationPattern: 'direct'
        }
      ]

      const mockImportUpdates: ImportUpdate[] = [
        {
          file: 'src/components/Login.tsx',
          oldImport: 'services/authService',
          newImport: 'features/authentication/api',
          success: true
        }
      ]

      jest.spyOn(validationManager as any, 'validateTestSuite').mockResolvedValue({
        success: true,
        total: 10,
        passed: 10,
        failed: 0,
        errors: []
      })

      jest.spyOn(validationManager as any, 'validateEndpoints').mockResolvedValue({
        success: true,
        total: 5,
        accessible: 5,
        errors: []
      })

      jest.spyOn(validationManager as any, 'validateStoreIntegrations').mockResolvedValue({
        success: true,
        valid: 1,
        errors: []
      })

      jest.spyOn(validationManager as any, 'validateUpdatedImports').mockResolvedValue({
        success: true,
        errors: []
      })

      const result = await validationManager.validatePostMigration(mockIntegrations, mockImportUpdates)

      expect(result.testsPass).toBe(true)
      expect(result.endpointsAccessible).toBe(true)
      expect(result.storeIntegrationsValid).toBe(true)
      expect(result.importPathsResolved).toBe(true)
      expect(result.summary.totalIntegrations).toBe(1)
      expect(result.summary.validIntegrations).toBe(1)
    })

    it('should handle store integration failures', async () => {
      const mockIntegrations: Integration[] = [
        {
          apiFunction: 'loginUser',
          storeName: 'useAuthStore',
          actions: ['setUser', 'setToken'],
          selectors: ['user', 'token'],
          integrationPattern: 'direct'
        }
      ]

      jest.spyOn(validationManager as any, 'validateTestSuite').mockResolvedValue({
        success: true,
        total: 10,
        passed: 10,
        failed: 0,
        errors: []
      })

      jest.spyOn(validationManager as any, 'validateEndpoints').mockResolvedValue({
        success: true,
        total: 5,
        accessible: 5,
        errors: []
      })

      jest.spyOn(validationManager as any, 'validateStoreIntegrations').mockResolvedValue({
        success: false,
        valid: 0,
        errors: [{ type: 'integration', message: 'Store integration failed', details: 'Details' }]
      })

      jest.spyOn(validationManager as any, 'validateUpdatedImports').mockResolvedValue({
        success: true,
        errors: []
      })

      const result = await validationManager.validatePostMigration(mockIntegrations, [])

      expect(result.storeIntegrationsValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.summary.validIntegrations).toBe(0)
    })
  })

  describe('validateServiceFilesExist', () => {
    it('should validate that expected service files exist', async () => {
      jest.spyOn(validationManager as any, 'fileExists').mockResolvedValue(true)

      const result = await (validationManager as any).validateServiceFilesExist()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should report missing service files', async () => {
      jest.spyOn(validationManager as any, 'fileExists')
        .mockResolvedValueOnce(true)  // authService exists
        .mockResolvedValueOnce(false) // subscriptionService missing
        .mockResolvedValueOnce(true)  // searchService exists
        .mockResolvedValueOnce(true)  // portfolioService exists

      const result = await (validationManager as any).validateServiceFilesExist()

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('subscriptionService.js')
    })
  })

  describe('validateDependencyGraph', () => {
    it('should validate dependency graph without circular dependencies', async () => {
      jest.spyOn(validationManager as any, 'findFilesWithPattern').mockResolvedValue([
        'services/authService.js',
        'services/subscriptionService.js'
      ])

      jest.spyOn(validationManager as any, 'extractFileDependencies')
        .mockResolvedValueOnce(['./utils'])
        .mockResolvedValueOnce(['./authService'])

      const result = await (validationManager as any).validateDependencyGraph()

      expect(result.success).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect circular dependencies', async () => {
      jest.spyOn(validationManager as any, 'findFilesWithPattern').mockResolvedValue([
        'services/authService.js',
        'services/subscriptionService.js'
      ])

      jest.spyOn(validationManager as any, 'extractFileDependencies')
        .mockResolvedValueOnce(['./subscriptionService'])
        .mockResolvedValueOnce(['./authService'])

      const result = await (validationManager as any).validateDependencyGraph()

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0].message).toContain('Circular dependency detected')
    })
  })

  describe('extractFileDependencies', () => {
    it('should extract import dependencies from file content', async () => {
      const mockContent = `
        import { something } from './utils'
        import { other } from '../shared/helpers'
        import { external } from 'external-package'
        const local = require('./local')
      `

      const fs = require('fs/promises')
      fs.readFile = jest.fn().mockResolvedValue(mockContent)

      const result = await (validationManager as any).extractFileDependencies('test.js')

      expect(result).toContain('./utils')
      expect(result).toContain('../shared/helpers')
      expect(result).toContain('./local')
      expect(result).not.toContain('external-package')
    })

    it('should handle file read errors gracefully', async () => {
      const fs = require('fs/promises')
      fs.readFile = jest.fn().mockRejectedValue(new Error('File not found'))

      const result = await (validationManager as any).extractFileDependencies('nonexistent.js')

      expect(result).toEqual([])
    })
  })
})