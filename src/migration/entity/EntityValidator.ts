/**
 * EntityValidator - Validates entity structure and FSD compliance
 * 
 * Ensures entities follow FSD architectural principles and have
 * proper structure, exports, and dependencies.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import {
  ValidationResult,
  ValidationCheck,
  ValidationError,
  ValidationSummary
} from '../types/entity-migration'

export class EntityValidator {
  private projectRoot: string
  private entitiesBasePath: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    this.entitiesBasePath = path.join(projectRoot, 'src', 'entities')
  }

  /**
   * Validate entity structure
   */
  async validateEntityStructure(entityPath: string): Promise<ValidationResult> {
    const checks: ValidationCheck[] = []
    const errors: ValidationError[] = []
    const warnings: string[] = []

    try {
      // Check 1: Entity directory exists
      await this.checkEntityDirectory(entityPath, checks, errors)

      // Check 2: Required subdirectories exist
      await this.checkRequiredDirectories(entityPath, checks, errors)

      // Check 3: Index files exist
      await this.checkIndexFiles(entityPath, checks, warnings)

      // Check 4: Public API exports
      await this.checkPublicAPIExports(entityPath, checks, warnings)

      // Check 5: No upward dependencies
      await this.checkUpwardDependencies(entityPath, checks, errors)

      // Check 6: Proper TypeScript types
      await this.checkTypeDefinitions(entityPath, checks, warnings)

      const summary = this.createSummary(checks, errors, warnings)

      return {
        valid: errors.length === 0,
        entityPath,
        checks,
        errors,
        warnings,
        summary
      }
    } catch (error) {
      errors.push({
        type: 'structure',
        message: error instanceof Error ? error.message : 'Unknown validation error',
        suggestion: 'Check entity path and permissions'
      })

      return {
        valid: false,
        entityPath,
        checks,
        errors,
        warnings,
        summary: this.createSummary(checks, errors, warnings)
      }
    }
  }

  /**
   * Validate multiple entities
   */
  async validateAllEntities(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []

    try {
      const entities = await fs.readdir(this.entitiesBasePath, { withFileTypes: true })

      for (const entity of entities) {
        if (entity.isDirectory() && entity.name !== '.gitkeep') {
          const entityPath = path.join(this.entitiesBasePath, entity.name)
          const result = await this.validateEntityStructure(entityPath)
          results.push(result)
        }
      }
    } catch (error) {
      // Entities directory doesn't exist or can't be read
    }

    return results
  }

  // ============================================================================
  // Private Validation Methods
  // ============================================================================

  /**
   * Check if entity directory exists
   */
  private async checkEntityDirectory(
    entityPath: string,
    checks: ValidationCheck[],
    errors: ValidationError[]
  ): Promise<void> {
    const exists = await this.directoryExists(entityPath)
    
    checks.push({
      name: 'Entity directory exists',
      passed: exists,
      message: exists ? 'Entity directory found' : 'Entity directory not found',
      severity: exists ? 'info' : 'error'
    })

    if (!exists) {
      errors.push({
        type: 'structure',
        message: `Entity directory not found: ${entityPath}`,
        suggestion: 'Create entity directory structure'
      })
    }
  }

  /**
   * Check required subdirectories
   */
  private async checkRequiredDirectories(
    entityPath: string,
    checks: ValidationCheck[],
    errors: ValidationError[]
  ): Promise<void> {
    const requiredDirs = ['model', 'ui', 'api']

    for (const dir of requiredDirs) {
      const dirPath = path.join(entityPath, dir)
      const exists = await this.directoryExists(dirPath)

      checks.push({
        name: `${dir} directory exists`,
        passed: exists,
        message: exists ? `${dir} directory found` : `${dir} directory not found`,
        severity: exists ? 'info' : 'error'
      })

      if (!exists) {
        errors.push({
          type: 'structure',
          message: `Required directory not found: ${dir}`,
          suggestion: `Create ${dir} directory in entity structure`
        })
      }
    }
  }

  /**
   * Check index files
   */
  private async checkIndexFiles(
    entityPath: string,
    checks: ValidationCheck[],
    warnings: string[]
  ): Promise<void> {
    const indexFiles = [
      'index.ts',
      'model/index.ts',
      'ui/index.ts',
      'api/index.ts'
    ]

    for (const indexFile of indexFiles) {
      const filePath = path.join(entityPath, indexFile)
      const exists = await this.fileExists(filePath)

      checks.push({
        name: `${indexFile} exists`,
        passed: exists,
        message: exists ? `${indexFile} found` : `${indexFile} not found`,
        severity: exists ? 'info' : 'warning'
      })

      if (!exists) {
        warnings.push(`Index file not found: ${indexFile}`)
      }
    }
  }

  /**
   * Check public API exports
   */
  private async checkPublicAPIExports(
    entityPath: string,
    checks: ValidationCheck[],
    warnings: string[]
  ): Promise<void> {
    const indexPath = path.join(entityPath, 'index.ts')
    
    if (await this.fileExists(indexPath)) {
      const content = await fs.readFile(indexPath, 'utf-8')
      const hasExports = content.includes('export')

      checks.push({
        name: 'Public API has exports',
        passed: hasExports,
        message: hasExports ? 'Public API exports found' : 'No public API exports',
        severity: hasExports ? 'info' : 'warning'
      })

      if (!hasExports) {
        warnings.push('Entity index.ts has no exports')
      }
    }
  }

  /**
   * Check for upward dependencies
   */
  private async checkUpwardDependencies(
    entityPath: string,
    checks: ValidationCheck[],
    errors: ValidationError[]
  ): Promise<void> {
    const files = await this.getAllTypeScriptFiles(entityPath)
    const upwardImports: string[] = []

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8')
      
      // Check for imports from features, widgets, pages, or app layers
      const forbiddenImports = [
        /@\/features\//,
        /@\/widgets\//,
        /@\/pages\//,
        /@\/app\//,
        /from ['"]\.\.\/\.\.\/features/,
        /from ['"]\.\.\/\.\.\/widgets/,
        /from ['"]\.\.\/\.\.\/pages/
      ]

      for (const pattern of forbiddenImports) {
        if (pattern.test(content)) {
          upwardImports.push(file)
          break
        }
      }
    }

    const hasUpwardDeps = upwardImports.length > 0

    checks.push({
      name: 'No upward dependencies',
      passed: !hasUpwardDeps,
      message: hasUpwardDeps 
        ? `Found ${upwardImports.length} files with upward dependencies` 
        : 'No upward dependencies found',
      severity: hasUpwardDeps ? 'error' : 'info'
    })

    if (hasUpwardDeps) {
      errors.push({
        type: 'imports',
        message: 'Entity has upward dependencies to features, widgets, or pages',
        suggestion: 'Remove imports from higher layers. Entities should only import from shared layer and other entities'
      })
    }
  }

  /**
   * Check type definitions
   */
  private async checkTypeDefinitions(
    entityPath: string,
    checks: ValidationCheck[],
    warnings: string[]
  ): Promise<void> {
    const typesPath = path.join(entityPath, 'model', 'types.ts')
    
    if (await this.fileExists(typesPath)) {
      const content = await fs.readFile(typesPath, 'utf-8')
      const hasInterfaces = content.includes('interface') || content.includes('type ')

      checks.push({
        name: 'Type definitions exist',
        passed: hasInterfaces,
        message: hasInterfaces ? 'Type definitions found' : 'No type definitions',
        severity: hasInterfaces ? 'info' : 'warning'
      })

      if (!hasInterfaces) {
        warnings.push('model/types.ts has no interface or type definitions')
      }
    } else {
      checks.push({
        name: 'Type definitions exist',
        passed: false,
        message: 'types.ts file not found',
        severity: 'warning'
      })
      warnings.push('model/types.ts file not found')
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Get all TypeScript files in directory recursively
   */
  private async getAllTypeScriptFiles(dir: string): Promise<string[]> {
    const files: string[] = []

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          const subFiles = await this.getAllTypeScriptFiles(fullPath)
          files.push(...subFiles)
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          files.push(fullPath)
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }

    return files
  }

  /**
   * Create validation summary
   */
  private createSummary(
    checks: ValidationCheck[],
    errors: ValidationError[],
    warnings: string[]
  ): ValidationSummary {
    return {
      totalChecks: checks.length,
      passedChecks: checks.filter(c => c.passed).length,
      failedChecks: checks.filter(c => !c.passed).length,
      warningCount: warnings.length,
      errorCount: errors.length
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
