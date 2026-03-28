/**
 * EntityMigrator Tests
 * 
 * Tests for entity directory structure creation and migration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EntityMigrator } from '../EntityMigrator'
import { EntityDefinition, EntityType } from '@/shared/types/entity-migration'
import * as fs from 'fs/promises'
import * as path from 'path'

describe('EntityMigrator', () => {
  const testRoot = path.join(process.cwd(), 'test-output', 'entity-migration')
  let migrator: EntityMigrator

  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(testRoot, { recursive: true })
    migrator = new EntityMigrator(testRoot)
  })

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testRoot, { recursive: true, force: true })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  describe('Entity Directory Structure Creation', () => {
    it('should create entity directory with required subdirectories', async () => {
      const entityDef: EntityDefinition = {
        name: 'User',
        type: 'User' as EntityType,
        sourceFiles: [],
        models: [],
        uiComponents: [],
        apiMethods: [],
        relationships: []
      }

      const result = await migrator.migrateEntity(entityDef)

      expect(result.success).toBe(true)
      expect(result.entity).toBe('User')

      // Verify directories were created
      const basePath = path.join(testRoot, 'src', 'entities', 'user')
      const modelPath = path.join(basePath, 'model')
      const uiPath = path.join(basePath, 'ui')
      const apiPath = path.join(basePath, 'api')

      const baseExists = await directoryExists(basePath)
      const modelExists = await directoryExists(modelPath)
      const uiExists = await directoryExists(uiPath)
      const apiExists = await directoryExists(apiPath)

      expect(baseExists).toBe(true)
      expect(modelExists).toBe(true)
      expect(uiExists).toBe(true)
      expect(apiExists).toBe(true)
    })

    it('should create index files in all directories', async () => {
      const entityDef: EntityDefinition = {
        name: 'Course',
        type: 'Course' as EntityType,
        sourceFiles: [],
        models: [],
        uiComponents: [],
        apiMethods: [],
        relationships: []
      }

      const result = await migrator.migrateEntity(entityDef)

      expect(result.success).toBe(true)

      const basePath = path.join(testRoot, 'src', 'entities', 'course')
      
      // Check for index files
      const rootIndex = await fileExists(path.join(basePath, 'index.ts'))
      const modelIndex = await fileExists(path.join(basePath, 'model', 'index.ts'))
      const uiIndex = await fileExists(path.join(basePath, 'ui', 'index.ts'))
      const apiIndex = await fileExists(path.join(basePath, 'api', 'index.ts'))

      expect(rootIndex).toBe(true)
      expect(modelIndex).toBe(true)
      expect(uiIndex).toBe(true)
      expect(apiIndex).toBe(true)
    })

    it('should create model files (types, validation, utils)', async () => {
      const entityDef: EntityDefinition = {
        name: 'Organization',
        type: 'Organization' as EntityType,
        sourceFiles: [],
        models: [],
        uiComponents: [],
        apiMethods: [],
        relationships: []
      }

      const result = await migrator.migrateEntity(entityDef)

      expect(result.success).toBe(true)

      const modelPath = path.join(testRoot, 'src', 'entities', 'organization', 'model')
      
      const typesExists = await fileExists(path.join(modelPath, 'types.ts'))
      const validationExists = await fileExists(path.join(modelPath, 'validation.ts'))
      const utilsExists = await fileExists(path.join(modelPath, 'utils.ts'))

      expect(typesExists).toBe(true)
      expect(validationExists).toBe(true)
      expect(utilsExists).toBe(true)
    })

    it('should create API files (queries, mutations)', async () => {
      const entityDef: EntityDefinition = {
        name: 'Assessment',
        type: 'Assessment' as EntityType,
        sourceFiles: [],
        models: [],
        uiComponents: [],
        apiMethods: [],
        relationships: []
      }

      const result = await migrator.migrateEntity(entityDef)

      expect(result.success).toBe(true)

      const apiPath = path.join(testRoot, 'src', 'entities', 'assessment', 'api')
      
      const queriesExists = await fileExists(path.join(apiPath, 'queries.ts'))
      const mutationsExists = await fileExists(path.join(apiPath, 'mutations.ts'))

      expect(queriesExists).toBe(true)
      expect(mutationsExists).toBe(true)
    })
  })

  describe('Entity Structure Validation', () => {
    it('should validate entity structure successfully', async () => {
      const entityDef: EntityDefinition = {
        name: 'Student',
        type: 'Student' as EntityType,
        sourceFiles: [],
        models: [],
        uiComponents: [],
        apiMethods: [],
        relationships: []
      }

      await migrator.migrateEntity(entityDef)

      const entityPath = path.join(testRoot, 'src', 'entities', 'student')
      const validation = await migrator.validateEntityStructure(entityPath)

      expect(validation.valid).toBe(true)
      expect(validation.errors.length).toBe(0)
      expect(validation.summary.passedChecks).toBeGreaterThan(0)
    })

    it('should detect missing entity directory', async () => {
      const entityPath = path.join(testRoot, 'src', 'entities', 'nonexistent')
      const validation = await migrator.validateEntityStructure(entityPath)

      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
      expect(validation.errors[0].type).toBe('structure')
    })
  })
})

// Helper functions
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath)
    return stats.isDirectory()
  } catch {
    return false
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath)
    return stats.isFile()
  } catch {
    return false
  }
}
