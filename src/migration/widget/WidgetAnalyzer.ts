/**
 * WidgetAnalyzer - Analyzes widget candidates and composition patterns
 * 
 * Identifies components that should be widgets based on composition patterns,
 * feature dependencies, and complexity assessment.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import {
  WidgetCandidate,
  WidgetDefinition,
  CompositionAnalysis,
  WidgetComplexityAssessment,
  StateManagementType
} from '../types/widget-migration'

export class WidgetAnalyzer {
  private projectRoot: string
  private srcPath: string

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot
    this.srcPath = path.join(projectRoot, 'src')
  }

  /**
   * Identify widget candidates in the codebase
   */
  async identifyWidgetCandidates(): Promise<WidgetCandidate[]> {
    const candidates: WidgetCandidate[] = []

    // Scan common locations for widget candidates
    const searchPaths = [
      path.join(this.srcPath, 'components'),
      path.join(this.srcPath, 'features'),
      path.join(this.srcPath, 'pages')
    ]

    for (const searchPath of searchPaths) {
      if (await this.directoryExists(searchPath)) {
        const pathCandidates = await this.scanDirectoryForWidgets(searchPath)
        candidates.push(...pathCandidates)
      }
    }

    // Filter and rank candidates
    return this.rankCandidates(candidates)
  }

  /**
   * Analyze composition patterns of a component
   */
  async analyzeComposition(componentPath: string): Promise<CompositionAnalysis> {
    const content = await this.readFile(componentPath)
    
    const features = await this.extractFeatureDependencies(content)
    const entities = await this.extractEntityDependencies(content)
    const sharedComponents = await this.extractSharedComponentDependencies(content)
    const stateManagement = this.detectStateManagement(content)
    const migrationStrategy = this.determineMigrationStrategy(features, entities, stateManagement)

    return {
      features,
      entities,
      sharedComponents,
      stateManagement,
      migrationStrategy
    }
  }

  /**
   * Assess widget complexity
   */
  async assessComplexity(componentPath: string): Promise<WidgetComplexityAssessment> {
    const content = await this.readFile(componentPath)
    const composition = await this.analyzeComposition(componentPath)

    let complexityScore = 0

    // Factor 1: Number of feature dependencies
    complexityScore += composition.features.length * 3

    // Factor 2: Number of entity dependencies
    complexityScore += composition.entities.length * 2

    // Factor 3: Number of shared components
    complexityScore += composition.sharedComponents.length

    // Factor 4: State management complexity
    if (composition.stateManagement === 'zustand') complexityScore += 3
    else if (composition.stateManagement === 'context') complexityScore += 2
    else if (composition.stateManagement === 'local') complexityScore += 1

    // Factor 5: Component size (lines of code)
    const lineCount = content.split('\n').length
    if (lineCount > 500) complexityScore += 5
    else if (lineCount > 300) complexityScore += 3
    else if (lineCount > 150) complexityScore += 2

    // Factor 6: Number of props
    const propsCount = this.countProps(content)
    if (propsCount > 10) complexityScore += 3
    else if (propsCount > 5) complexityScore += 2
    else if (propsCount > 2) complexityScore += 1

    const complexity = this.scoreToComplexity(complexityScore)
    const migrationEffort = this.estimateMigrationEffort(complexity, composition)

    return {
      complexity,
      score: complexityScore,
      featureDependencies: composition.features.length,
      entityDependencies: composition.entities.length,
      stateManagement: composition.stateManagement,
      lineCount,
      propsCount,
      migrationEffort
    }
  }

  /**
   * Determine if a component is a widget candidate
   */
  async isWidgetCandidate(componentPath: string): Promise<boolean> {
    const composition = await this.analyzeComposition(componentPath)
    
    // A component is a widget candidate if:
    // 1. It uses multiple features (2+)
    // 2. OR it uses features + entities
    // 3. OR it's a complex composition with state management
    
    const usesMultipleFeatures = composition.features.length >= 2
    const usesFeaturesAndEntities = composition.features.length >= 1 && composition.entities.length >= 1
    const isComplexComposition = (
      composition.features.length >= 1 && 
      composition.stateManagement !== 'none'
    )

    return usesMultipleFeatures || usesFeaturesAndEntities || isComplexComposition
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * Scan directory for widget candidates
   */
  private async scanDirectoryForWidgets(dirPath: string): Promise<WidgetCandidate[]> {
    const candidates: WidgetCandidate[] = []

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          const subCandidates = await this.scanDirectoryForWidgets(fullPath)
          candidates.push(...subCandidates)
        } else if (entry.isFile() && this.isComponentFile(entry.name)) {
          // Analyze component file
          if (await this.isWidgetCandidate(fullPath)) {
            const candidate = await this.createWidgetCandidate(fullPath)
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
   * Create widget candidate from component file
   */
  private async createWidgetCandidate(componentPath: string): Promise<WidgetCandidate> {
    const composition = await this.analyzeComposition(componentPath)
    const complexity = await this.assessComplexity(componentPath)
    const componentName = this.extractComponentName(componentPath)

    return {
      name: componentName,
      sourceFile: componentPath,
      featureDependencies: composition.features,
      entityDependencies: composition.entities,
      complexity: complexity.score,
      isComposite: composition.features.length > 0 || composition.entities.length > 0,
      stateManagement: composition.stateManagement,
      migrationStrategy: composition.migrationStrategy
    }
  }

  /**
   * Extract feature dependencies from component content
   */
  private async extractFeatureDependencies(content: string): Promise<string[]> {
    const features = new Set<string>()
    
    // Look for imports from @/features/
    const featureImportRegex = /from\s+['"]@\/features\/([^\/'"]+)/g
    let match

    while ((match = featureImportRegex.exec(content)) !== null) {
      features.add(match[1])
    }

    return Array.from(features)
  }

  /**
   * Extract entity dependencies from component content
   */
  private async extractEntityDependencies(content: string): Promise<string[]> {
    const entities = new Set<string>()
    
    // Look for imports from @/entities/
    const entityImportRegex = /from\s+['"]@\/entities\/([^\/'"]+)/g
    let match

    while ((match = entityImportRegex.exec(content)) !== null) {
      entities.add(match[1])
    }

    return Array.from(entities)
  }

  /**
   * Extract shared component dependencies from component content
   */
  private async extractSharedComponentDependencies(content: string): Promise<string[]> {
    const shared = new Set<string>()
    
    // Look for imports from @/shared/
    const sharedImportRegex = /from\s+['"]@\/shared\/([^\/'"]+)/g
    let match

    while ((match = sharedImportRegex.exec(content)) !== null) {
      shared.add(match[1])
    }

    return Array.from(shared)
  }

  /**
   * Detect state management type
   */
  private detectStateManagement(content: string): StateManagementType {
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
    features: string[],
    entities: string[],
    stateManagement: StateManagementType
  ): 'direct' | 'refactor' | 'split' {
    // Direct: Simple migration, no refactoring needed
    // Refactor: Needs some refactoring to fit widget pattern
    // Split: Too complex, should be split into multiple widgets

    const totalDependencies = features.length + entities.length

    if (totalDependencies <= 3 && stateManagement !== 'zustand') {
      return 'direct'
    }

    if (totalDependencies > 6 || (totalDependencies > 4 && stateManagement === 'zustand')) {
      return 'split'
    }

    return 'refactor'
  }

  /**
   * Count component props
   */
  private countProps(content: string): number {
    // Look for interface/type definitions for props
    const propsInterfaceRegex = /interface\s+\w+Props\s*{([^}]+)}/
    const match = propsInterfaceRegex.exec(content)

    if (match) {
      const propsBody = match[1]
      // Count property definitions (lines with : )
      const propLines = propsBody.split('\n').filter(line => line.includes(':'))
      return propLines.length
    }

    return 0
  }

  /**
   * Convert complexity score to category
   */
  private scoreToComplexity(score: number): 'simple' | 'moderate' | 'complex' {
    if (score < 10) return 'simple'
    if (score < 20) return 'moderate'
    return 'complex'
  }

  /**
   * Estimate migration effort
   */
  private estimateMigrationEffort(
    complexity: 'simple' | 'moderate' | 'complex',
    composition: CompositionAnalysis
  ): 'small' | 'medium' | 'large' {
    if (complexity === 'simple' && composition.migrationStrategy === 'direct') {
      return 'small'
    }

    if (complexity === 'complex' || composition.migrationStrategy === 'split') {
      return 'large'
    }

    return 'medium'
  }

  /**
   * Rank widget candidates by priority
   */
  private rankCandidates(candidates: WidgetCandidate[]): WidgetCandidate[] {
    return candidates.sort((a, b) => {
      // Prioritize by:
      // 1. Number of feature dependencies (more = higher priority)
      // 2. Complexity (higher = higher priority)
      // 3. Is composite (true = higher priority)

      const aScore = a.featureDependencies.length * 3 + a.complexity + (a.isComposite ? 10 : 0)
      const bScore = b.featureDependencies.length * 3 + b.complexity + (b.isComposite ? 10 : 0)

      return bScore - aScore
    })
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
    // Convert PascalCase to kebab-case
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
