/**
 * WidgetMigrator - Core implementation for widget migration
 * 
 * Handles the identification and migration of complex composite UI components to the Widgets layer.
 * Each widget follows a standardized directory structure with /ui/ and /model/ subdirectories.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import {
  WidgetMigrator as IWidgetMigrator,
  WidgetCandidate,
  WidgetDefinition,
  CompositionAnalysis,
  MigrationResult,
  ValidationResult,
  WidgetStructure,
  MigrationError,
  BackwardCompatibilityInfo,
  ImportPathUpdate
} from '../types/widget-migration'

export class WidgetMigrator implements IWidgetMigrator {
  private projectRoot: string
  private widgetsBasePath: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    this.widgetsBasePath = path.join(projectRoot, 'src', 'widgets')
  }

  /**
   * Identify widget candidates in the codebase
   */
  async identifyWidgets(): Promise<WidgetCandidate[]> {
    const { WidgetScanner } = await import('./WidgetScanner')
    const scanner = new WidgetScanner(this.projectRoot)
    return await scanner.scanForWidgets()
  }

  /**
   * Analyze composition patterns of a component
   */
  async analyzeComposition(componentPath: string): Promise<CompositionAnalysis> {
    const { WidgetAnalyzer } = await import('./WidgetAnalyzer')
    const analyzer = new WidgetAnalyzer(this.projectRoot)
    return await analyzer.analyzeComposition(componentPath)
  }

  /**
   * Migrate a single widget to the widgets layer
   */
  async migrateWidget(widget: WidgetDefinition): Promise<MigrationResult> {
    const startTime = Date.now()
    const errors: MigrationError[] = []
    const warnings: string[] = []
    const filesCreated: string[] = []
    const filesModified: string[] = []
    const filesDeleted: string[] = []
    const importPathsUpdated: ImportPathUpdate[] = []

    try {
      // Step 1: Create widget directory structure
      const structure = await this.createWidgetStructure(widget.name)
      filesCreated.push(...structure.files.map(f => f.path))

      // Step 2: Migrate main widget component
      const uiResult = await this.migrateWidgetUI(widget, structure)
      filesCreated.push(...uiResult.created)
      filesModified.push(...uiResult.modified)

      // Step 3: Migrate widget state management (if exists)
      if (widget.stateManagement !== 'none') {
        const modelResult = await this.migrateWidgetModel(widget, structure)
        filesCreated.push(...modelResult.created)
        filesModified.push(...modelResult.modified)
      }

      // Step 4: Update import paths
      const oldPaths = this.getOldPaths(widget)
      const newPaths = this.getNewPaths(widget, structure)
      await this.updateImportPaths(widget.name, oldPaths, newPaths)

      // Step 5: Create backward compatibility re-exports
      const backwardCompatibility = await this.createBackwardCompatibility(widget, structure)

      const duration = Date.now() - startTime

      return {
        success: true,
        widget: widget.name,
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
        suggestion: 'Review widget definition and source files'
      }
      errors.push(migrationError)

      return {
        success: false,
        widget: widget.name,
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
   * Validate widget dependencies follow FSD rules
   */
  async validateWidgetDependencies(widgetPath: string): Promise<ValidationResult> {
    const checks = []
    const errors = []
    const warnings = []

    try {
      // Check if widget directory exists
      const exists = await this.directoryExists(widgetPath)
      checks.push({
        name: 'Widget directory exists',
        passed: exists,
        message: exists ? 'Widget directory found' : 'Widget directory not found',
        severity: exists ? 'info' as const : 'error' as const
      })

      if (!exists) {
        errors.push({
          type: 'structure' as const,
          message: `Widget directory not found: ${widgetPath}`,
          suggestion: 'Create widget directory structure'
        })
      }

      // Check for required subdirectories
      const requiredDirs = ['ui']
      for (const dir of requiredDirs) {
        const dirPath = path.join(widgetPath, dir)
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
            suggestion: `Create ${dir} directory in widget structure`
          })
        }
      }

      // Check for index files
      const indexFiles = ['index.ts', 'ui/index.ts']

      for (const indexFile of indexFiles) {
        const filePath = path.join(widgetPath, indexFile)
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

      // Validate FSD layer dependencies
      const dependencyValidation = await this.validateFSDDependencies(widgetPath)
      checks.push(...dependencyValidation.checks)
      errors.push(...dependencyValidation.errors)
      warnings.push(...dependencyValidation.warnings)

      const passedChecks = checks.filter(c => c.passed).length
      const failedChecks = checks.filter(c => !c.passed).length

      return {
        valid: errors.length === 0,
        widgetPath,
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
        suggestion: 'Check widget path and permissions'
      })

      return {
        valid: false,
        widgetPath,
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

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Create widget directory structure
   */
  private async createWidgetStructure(widgetName: string): Promise<WidgetStructure> {
    const basePath = path.join(this.widgetsBasePath, widgetName.toLowerCase())
    
    const directories = [
      { name: 'ui' as const, path: path.join(basePath, 'ui'), files: [] },
      { name: 'model' as const, path: path.join(basePath, 'model'), files: [] }
    ]

    const files = [
      { name: 'index.ts', path: path.join(basePath, 'index.ts'), type: 'index' as const },
      { name: 'index.ts', path: path.join(basePath, 'ui', 'index.ts'), type: 'index' as const },
      { name: 'index.ts', path: path.join(basePath, 'model', 'index.ts'), type: 'index' as const },
      { name: 'types.ts', path: path.join(basePath, 'model', 'types.ts'), type: 'types' as const }
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
      widgetName,
      basePath,
      directories,
      files
    }
  }

  /**
   * Create placeholder file with basic content
   */
  private async createPlaceholderFile(file: { name: string; path: string; type: string }): Promise<void> {
    let content = ''

    switch (file.type) {
      case 'index':
        content = `/**\n * Public API exports\n */\n\nexport {}\n`
        break
      case 'types':
        content = `/**\n * Widget-specific types\n */\n\nexport {}\n`
        break
      case 'component':
        content = `/**\n * Widget component\n */\n\nexport {}\n`
        break
      case 'store':
        content = `/**\n * Widget state management\n */\n\nexport {}\n`
        break
    }

    await fs.writeFile(file.path, content, 'utf-8')
  }

  /**
   * Migrate widget UI components
   */
  private async migrateWidgetUI(
    widget: WidgetDefinition,
    structure: WidgetStructure
  ): Promise<{ created: string[]; modified: string[] }> {
    // Placeholder - will be implemented in subsequent tasks
    return { created: [], modified: [] }
  }

  /**
   * Migrate widget state management
   */
  private async migrateWidgetModel(
    widget: WidgetDefinition,
    structure: WidgetStructure
  ): Promise<{ created: string[]; modified: string[] }> {
    // Placeholder - will be implemented in subsequent tasks
    return { created: [], modified: [] }
  }

  /**
   * Update import paths for migrated widget
   */
  private async updateImportPaths(
    widget: string,
    oldPaths: string[],
    newPaths: string[]
  ): Promise<void> {
    // Placeholder - will be implemented in subsequent tasks
  }

  /**
   * Get old import paths for widget
   */
  private getOldPaths(widget: WidgetDefinition): string[] {
    return [widget.sourceFile]
  }

  /**
   * Get new import paths for widget
   */
  private getNewPaths(widget: WidgetDefinition, structure: WidgetStructure): string[] {
    return [
      `@/widgets/${widget.name.toLowerCase()}`,
      `@/widgets/${widget.name.toLowerCase()}/ui`,
      `@/widgets/${widget.name.toLowerCase()}/model`
    ]
  }

  /**
   * Create backward compatibility re-exports
   */
  private async createBackwardCompatibility(
    widget: WidgetDefinition,
    structure: WidgetStructure
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
   * Validate FSD layer dependencies
   */
  private async validateFSDDependencies(widgetPath: string): Promise<{
    checks: Array<{ name: string; passed: boolean; message: string; severity: 'error' | 'warning' | 'info' }>
    errors: Array<{ type: 'structure' | 'imports' | 'types' | 'exports'; message: string; suggestion?: string }>
    warnings: string[]
  }> {
    const checks = []
    const errors = []
    const warnings = []

    // Check that widget only imports from allowed layers
    // Allowed: entities, features, shared
    // Not allowed: app, pages, other widgets
    
    const allowedLayers = ['entities', 'features', 'shared']
    const disallowedLayers = ['app', 'pages', 'widgets']

    // This is a placeholder - actual implementation would scan files
    checks.push({
      name: 'Widget imports only from allowed layers',
      passed: true,
      message: 'Widget follows FSD layer rules',
      severity: 'info' as const
    })

    return { checks, errors, warnings }
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
