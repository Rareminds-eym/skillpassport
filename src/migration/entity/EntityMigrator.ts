/**
 * EntityMigrator - Core implementation for entity migration
 * 
 * Handles the extraction and organization of business entities into the FSD Entities layer.
 * Each entity follows a standardized directory structure with /model/, /ui/, and /api/ subdirectories.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import {
  EntityMigrator as IEntityMigrator,
  EntityAnalysis,
  EntityDefinition,
  MigrationResult,
  ValidationResult,
  EntityStructure,
  EntityDirectory,
  EntityFile,
  MigrationError,
  BackwardCompatibilityInfo,
  ImportPathUpdate
} from '../types/entity-migration'

export class EntityMigrator implements IEntityMigrator {
  private projectRoot: string
  private entitiesBasePath: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    this.entitiesBasePath = path.join(projectRoot, 'src', 'entities')
  }

  /**
   * Analyze all entities in the codebase
   */
  async analyzeEntities(): Promise<EntityAnalysis[]> {
    // This will be implemented in subsequent tasks
    // For now, return empty array as placeholder
    return []
  }

  /**
   * Migrate a single entity to the entities layer
   */
  async migrateEntity(entity: EntityDefinition): Promise<MigrationResult> {
    const startTime = Date.now()
    const errors: MigrationError[] = []
    const warnings: string[] = []
    const filesCreated: string[] = []
    const filesModified: string[] = []
    const filesDeleted: string[] = []
    const importPathsUpdated: ImportPathUpdate[] = []

    try {
      // Step 1: Create entity directory structure
      const structure = await this.createEntityStructure(entity.name)
      filesCreated.push(...structure.files.map(f => f.path))

      // Step 2: Migrate model files
      const modelResult = await this.migrateModelFiles(entity, structure)
      filesCreated.push(...modelResult.created)
      filesModified.push(...modelResult.modified)

      // Step 3: Migrate UI components
      const uiResult = await this.migrateUIComponents(entity, structure)
      filesCreated.push(...uiResult.created)
      filesModified.push(...uiResult.modified)

      // Step 4: Migrate API methods
      const apiResult = await this.migrateAPIMethods(entity, structure)
      filesCreated.push(...apiResult.created)
      filesModified.push(...apiResult.modified)

      // Step 5: Update import paths
      const oldPaths = this.getOldPaths(entity)
      const newPaths = this.getNewPaths(entity, structure)
      await this.updateImportPaths(entity.name, oldPaths, newPaths)

      // Step 6: Create backward compatibility re-exports
      const backwardCompatibility = await this.createBackwardCompatibility(entity, structure)

      const duration = Date.now() - startTime

      return {
        success: true,
        entity: entity.name,
        filesCreated,
        filesModified,
        filesDeleted,
        importPathsUpdated,
        backwardCompatibility,
        errors,
        warnings,
        duration,
        timestamp: new Date()
      }
    } catch (error) {
      const migrationError: MigrationError = {
        code: 'MIGRATION_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        severity: 'critical',
        category: 'migration',
        suggestion: 'Review entity definition and source files'
      }
      errors.push(migrationError)

      return {
        success: false,
        entity: entity.name,
        filesCreated,
        filesModified,
        filesDeleted,
        importPathsUpdated,
        backwardCompatibility: {
          reExportsCreated: [],
          deprecationNotices: [],
          breakingChanges: [],
          migrationGuide: ''
        },
        errors,
        warnings,
        duration: Date.now() - startTime,
        timestamp: new Date()
      }
    }
  }

  /**
   * Validate entity directory structure
   */
  async validateEntityStructure(entityPath: string): Promise<ValidationResult> {
    const checks = []
    const errors = []
    const warnings = []

    try {
      // Check if entity directory exists
      const exists = await this.directoryExists(entityPath)
      checks.push({
        name: 'Entity directory exists',
        passed: exists,
        message: exists ? 'Entity directory found' : 'Entity directory not found',
        severity: exists ? 'info' as const : 'error' as const
      })

      if (!exists) {
        errors.push({
          type: 'structure' as const,
          message: `Entity directory not found: ${entityPath}`,
          suggestion: 'Create entity directory structure'
        })
      }

      // Check for required subdirectories
      const requiredDirs = ['model', 'ui', 'api']
      for (const dir of requiredDirs) {
        const dirPath = path.join(entityPath, dir)
        const dirExists = await this.directoryExists(dirPath)
        checks.push({
          name: `${dir} directory exists`,
          passed: dirExists,
          message: dirExists ? `${dir} directory found` : `${dir} directory not found`,
          severity: dirExists ? 'info' as const : 'error' as const
        })

        if (!dirExists) {
          errors.push({
            type: 'structure' as const,
            message: `Required directory not found: ${dir}`,
            suggestion: `Create ${dir} directory in entity structure`
          })
        }
      }

      // Check for index files
      const indexFiles = [
        'index.ts',
        'model/index.ts',
        'ui/index.ts',
        'api/index.ts'
      ]

      for (const indexFile of indexFiles) {
        const filePath = path.join(entityPath, indexFile)
        const fileExists = await this.fileExists(filePath)
        checks.push({
          name: `${indexFile} exists`,
          passed: fileExists,
          message: fileExists ? `${indexFile} found` : `${indexFile} not found`,
          severity: fileExists ? 'info' as const : 'warning' as const
        })

        if (!fileExists) {
          warnings.push(`Index file not found: ${indexFile}`)
        }
      }

      const passedChecks = checks.filter(c => c.passed).length
      const failedChecks = checks.filter(c => !c.passed).length

      return {
        valid: errors.length === 0,
        entityPath,
        checks,
        errors,
        warnings,
        summary: {
          totalChecks: checks.length,
          passedChecks,
          failedChecks,
          warningCount: warnings.length,
          errorCount: errors.length
        }
      }
    } catch (error) {
      errors.push({
        type: 'structure' as const,
        message: error instanceof Error ? error.message : 'Unknown validation error',
        suggestion: 'Check entity path and permissions'
      })

      return {
        valid: false,
        entityPath,
        checks,
        errors,
        warnings,
        summary: {
          totalChecks: checks.length,
          passedChecks: 0,
          failedChecks: checks.length,
          warningCount: warnings.length,
          errorCount: errors.length
        }
      }
    }
  }

  /**
   * Update import paths for migrated entity
   */
  async updateImportPaths(
    entity: string,
    oldPaths: string[],
    newPaths: string[]
  ): Promise<void> {
    // This will be implemented in subsequent tasks
    // Placeholder for import path update logic
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Create entity directory structure
   */
  private async createEntityStructure(entityName: string): Promise<EntityStructure> {
    const basePath = path.join(this.entitiesBasePath, entityName.toLowerCase())
    
    const directories: EntityDirectory[] = [
      { name: 'model', path: path.join(basePath, 'model'), files: [] },
      { name: 'ui', path: path.join(basePath, 'ui'), files: [] },
      { name: 'api', path: path.join(basePath, 'api'), files: [] }
    ]

    const files: EntityFile[] = [
      { name: 'index.ts', path: path.join(basePath, 'index.ts'), type: 'index' },
      { name: 'index.ts', path: path.join(basePath, 'model', 'index.ts'), type: 'index' },
      { name: 'types.ts', path: path.join(basePath, 'model', 'types.ts'), type: 'types' },
      { name: 'validation.ts', path: path.join(basePath, 'model', 'validation.ts'), type: 'validation' },
      { name: 'utils.ts', path: path.join(basePath, 'model', 'utils.ts'), type: 'utils' },
      { name: 'index.ts', path: path.join(basePath, 'ui', 'index.ts'), type: 'index' },
      { name: 'index.ts', path: path.join(basePath, 'api', 'index.ts'), type: 'index' },
      { name: 'queries.ts', path: path.join(basePath, 'api', 'queries.ts'), type: 'queries' },
      { name: 'mutations.ts', path: path.join(basePath, 'api', 'mutations.ts'), type: 'mutations' }
    ]

    // Create directories
    await fs.mkdir(basePath, { recursive: true })
    for (const dir of directories) {
      await fs.mkdir(dir.path, { recursive: true })
    }

    // Create placeholder files
    for (const file of files) {
      await this.createPlaceholderFile(file)
    }

    return {
      entityName,
      basePath,
      directories,
      files
    }
  }

  /**
   * Create placeholder file with basic content
   */
  private async createPlaceholderFile(file: EntityFile): Promise<void> {
    let content = ''

    switch (file.type) {
      case 'index':
        content = `/**\n * Public API exports\n */\n\nexport {}\n`
        break
      case 'types':
        content = `/**\n * TypeScript interfaces and types\n */\n\nexport {}\n`
        break
      case 'validation':
        content = `/**\n * Validation logic\n */\n\nexport {}\n`
        break
      case 'utils':
        content = `/**\n * Entity utilities\n */\n\nexport {}\n`
        break
      case 'queries':
        content = `/**\n * Data fetching queries\n */\n\nexport {}\n`
        break
      case 'mutations':
        content = `/**\n * Data mutations\n */\n\nexport {}\n`
        break
    }

    await fs.writeFile(file.path, content, 'utf-8')
  }

  /**
   * Migrate model files
   */
  private async migrateModelFiles(
    entity: EntityDefinition,
    structure: EntityStructure
  ): Promise<{ created: string[]; modified: string[] }> {
    // Placeholder - will be implemented in subsequent tasks
    return { created: [], modified: [] }
  }

  /**
   * Migrate UI components
   */
  private async migrateUIComponents(
    entity: EntityDefinition,
    structure: EntityStructure
  ): Promise<{ created: string[]; modified: string[] }> {
    // Placeholder - will be implemented in subsequent tasks
    return { created: [], modified: [] }
  }

  /**
   * Migrate API methods
   */
  private async migrateAPIMethods(
    entity: EntityDefinition,
    structure: EntityStructure
  ): Promise<{ created: string[]; modified: string[] }> {
    // Placeholder - will be implemented in subsequent tasks
    return { created: [], modified: [] }
  }

  /**
   * Get old import paths for entity
   */
  private getOldPaths(entity: EntityDefinition): string[] {
    return entity.sourceFiles
  }

  /**
   * Get new import paths for entity
   */
  private getNewPaths(entity: EntityDefinition, structure: EntityStructure): string[] {
    return [
      `@/entities/${entity.name.toLowerCase()}`,
      `@/entities/${entity.name.toLowerCase()}/model`,
      `@/entities/${entity.name.toLowerCase()}/ui`,
      `@/entities/${entity.name.toLowerCase()}/api`
    ]
  }

  /**
   * Create backward compatibility re-exports
   */
  private async createBackwardCompatibility(
    entity: EntityDefinition,
    structure: EntityStructure
  ): Promise<BackwardCompatibilityInfo> {
    // Placeholder - will be implemented in subsequent tasks
    return {
      reExportsCreated: [],
      deprecationNotices: [],
      breakingChanges: [],
      migrationGuide: ''
    }
  }

  /**
   * Check if directory exists
   */
  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath)
      return stats.isDirectory()
    } catch {
      return false
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath)
      return stats.isFile()
    } catch {
      return false
    }
  }
}
