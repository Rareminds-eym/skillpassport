/**
 * WidgetScanner - Scans codebase for widget candidates
 * 
 * Identifies components that should be migrated to the widgets layer
 * based on composition patterns and complexity.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import {
  WidgetCandidate,
  WidgetIndicator
} from '@/shared/types/widget-migration'

export class WidgetScanner {
  private projectRoot: string
  private srcPath: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    this.srcPath = path.join(projectRoot, 'src')
  }

  /**
   * Scan codebase for widget candidates
   */
  async scanForWidgets(): Promise<WidgetCandidate[]> {
    const candidates: WidgetCandidate[] = []

    // Scan directories that might contain widgets
    const searchPaths = [
      path.join(this.srcPath, 'components'),
      path.join(this.srcPath, 'features'),
      path.join(this.srcPath, 'pages')
    ]

    for (const searchPath of searchPaths) {
      if (await this.directoryExists(searchPath)) {
        const pathCandidates = await this.scanDirectory(searchPath)
        candidates.push(...pathCandidates)
      }
    }

    return candidates
  }

  /**
   * Scan specific directory for widget candidates
   */
  private async scanDirectory(dirPath: string): Promise<WidgetCandidate[]> {
    const candidates: WidgetCandidate[] = []

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          const subCandidates = await this.scanDirectory(fullPath)
          candidates.push(...subCandidates)
        } else if (entry.isFile() && this.isComponentFile(entry.name)) {
          const candidate = await this.analyzeFile(fullPath)
          if (candidate) {
            candidates.push(candidate)
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or can't be read
    }

    return candidates
  }

  /**
   * Analyze file for widget indicators
   */
  private async analyzeFile(filePath: string): Promise<WidgetCandidate | null> {
    const content = await this.readFile(filePath)
    const indicators = this.detectWidgetIndicators(content, filePath)

    if (indicators.length === 0) return null

    const confidence = this.calculateConfidence(indicators)
    
    // Only return candidates with confidence > 0.5
    if (confidence < 0.5) return null

    const componentName = this.extractComponentName(filePath)
    const featureDeps = this.extractFeatureDependencies(content)
    const entityDeps = this.extractEntityDependencies(content)

    return {
      name: componentName,
      sourceFile: filePath,
      featureDependencies: featureDeps,
      entityDependencies: entityDeps,
      complexity: this.calculateComplexity(content, featureDeps, entityDeps),
      isComposite: featureDeps.length > 0 || entityDeps.length > 0,
      stateManagement: this.detectStateManagement(content),
      migrationStrategy: this.determineMigrationStrategy(featureDeps, entityDeps)
    }
  }

  /**
   * Detect widget indicators in content
   */
  private detectWidgetIndicators(content: string, filePath: string): WidgetIndicator[] {
    const indicators: WidgetIndicator[] = []

    // Indicator 1: Multiple feature imports
    const featureImports = this.extractFeatureDependencies(content)
    if (featureImports.length >= 2) {
      indicators.push({
        type: 'composition',
        name: 'multiple-features',
        filePath,
        confidence: 0.9
      })
    }

    // Indicator 2: Feature + Entity imports
    const entityImports = this.extractEntityDependencies(content)
    if (featureImports.length >= 1 && entityImports.length >= 1) {
      indicators.push({
        type: 'composition',
        name: 'feature-entity-mix',
        filePath,
        confidence: 0.8
      })
    }

    // Indicator 3: Complex state management
    const stateManagement = this.detectStateManagement(content)
    if (stateManagement === 'zustand' || stateManagement === 'context') {
      indicators.push({
        type: 'state',
        name: 'complex-state',
        filePath,
        confidence: 0.7
      })
    }

    // Indicator 4: Large component (>200 lines)
    const lineCount = content.split('\n').length
    if (lineCount > 200) {
      indicators.push({
        type: 'complexity',
        name: 'large-component',
        filePath,
        confidence: 0.6
      })
    }

    // Indicator 5: Dashboard/Layout keywords
    const isDashboard = /dashboard|layout|panel|workspace/i.test(content)
    if (isDashboard) {
      indicators.push({
        type: 'pattern',
        name: 'dashboard-pattern',
        filePath,
        confidence: 0.8
      })
    }

    // Indicator 6: Form with multiple features
    const isComplexForm = /form/i.test(content) && featureImports.length >= 2
    if (isComplexForm) {
      indicators.push({
        type: 'pattern',
        name: 'complex-form',
        filePath,
        confidence: 0.7
      })
    }

    return indicators
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(indicators: WidgetIndicator[]): number {
    if (indicators.length === 0) return 0

    const totalConfidence = indicators.reduce((sum, ind) => sum + ind.confidence, 0)
    return Math.min(totalConfidence / indicators.length, 1.0)
  }

  /**
   * Calculate complexity score
   */
  private calculateComplexity(content: string, featureDeps: string[], entityDeps: string[]): number {
    let score = 0

    score += featureDeps.length * 3
    score += entityDeps.length * 2
    score += content.split('\n').length / 50

    return Math.round(score)
  }

  /**
   * Extract feature dependencies
   */
  private extractFeatureDependencies(content: string): string[] {
    const features = new Set<string>()
    const regex = /from\s+['"]@\/features\/([^\/'"]+)/g
    let match

    while ((match = regex.exec(content)) !== null) {
      features.add(match[1])
    }

    return Array.from(features)
  }

  /**
   * Extract entity dependencies
   */
  private extractEntityDependencies(content: string): string[] {
    const entities = new Set<string>()
    const regex = /from\s+['"]@\/entities\/([^\/'"]+)/g
    let match

    while ((match = regex.exec(content)) !== null) {
      entities.add(match[1])
    }

    return Array.from(entities)
  }

  /**
   * Detect state management type
   */
  private detectStateManagement(content: string): 'local' | 'context' | 'zustand' | 'none' {
    if (content.includes('create(') && content.includes('zustand')) {
      return 'zustand'
    }
    if (content.includes('createContext') || content.includes('useContext')) {
      return 'context'
    }
    if (content.includes('useState') || content.includes('useReducer')) {
      return 'local'
    }
    return 'none'
  }

  /**
   * Determine migration strategy
   */
  private determineMigrationStrategy(
    featureDeps: string[],
    entityDeps: string[]
  ): 'direct' | 'refactor' | 'split' {
    const totalDeps = featureDeps.length + entityDeps.length

    if (totalDeps <= 3) return 'direct'
    if (totalDeps > 6) return 'split'
    return 'refactor'
  }

  /**
   * Check if file is a component file
   */
  private isComponentFile(filename: string): boolean {
    return (
      (filename.endsWith('.tsx') || filename.endsWith('.jsx')) &&
      !filename.endsWith('.test.tsx') &&
      !filename.endsWith('.test.jsx') &&
      !filename.endsWith('.spec.tsx') &&
      !filename.endsWith('.spec.jsx')
    )
  }

  /**
   * Extract component name from file path
   */
  private extractComponentName(filePath: string): string {
    const basename = path.basename(filePath, path.extname(filePath))
    return basename.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
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
   * Read file content
   */
  private async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8')
    } catch {
      return ''
    }
  }
}
