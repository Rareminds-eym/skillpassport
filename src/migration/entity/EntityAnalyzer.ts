/**
 * EntityAnalyzer - Analyzes entity complexity and migration requirements
 * 
 * Provides detailed analysis of entities including complexity assessment,
 * dependency analysis, and migration risk evaluation.
 */

import {
  EntityDefinition,
  EntityAnalysis,
  SourceLocation
} from '@/shared/types/entity-migration'
import { EntityScanner } from './EntityScanner'
import { RelationshipAnalyzer } from './RelationshipAnalyzer'

export class EntityAnalyzer {
  private scanner: EntityScanner
  private relationshipAnalyzer: RelationshipAnalyzer

  constructor(projectRoot: string = process.cwd()) {
    this.scanner = new EntityScanner(projectRoot)
    this.relationshipAnalyzer = new RelationshipAnalyzer()
  }

  /**
   * Analyze a specific entity
   */
  async analyzeEntity(entity: EntityDefinition): Promise<EntityAnalysis> {
    const usageAnalysis = await this.scanner.analyzeEntityUsage(entity.name)
    const sourceLocations = await this.scanner.identifyEntityFiles(entity.name)
    
    const complexity = this.assessComplexity(entity, sourceLocations)
    const dependencies = this.extractDependencies(entity)
    const migrationRisk = this.assessMigrationRisk(complexity, usageAnalysis.totalReferences, dependencies.length)
    const estimatedEffort = this.estimateEffort(complexity, sourceLocations.length)

    return {
      entity: entity.name,
      type: entity.type,
      complexity,
      dependencies,
      usageCount: usageAnalysis.totalReferences,
      migrationRisk,
      sourceLocations,
      estimatedEffort
    }
  }

  /**
   * Analyze all entities in a list
   */
  async analyzeEntities(entities: EntityDefinition[]): Promise<EntityAnalysis[]> {
    const analyses: EntityAnalysis[] = []

    for (const entity of entities) {
      const analysis = await this.analyzeEntity(entity)
      analyses.push(analysis)
    }

    return analyses
  }

  /**
   * Analyze relationships between entities
   */
  async analyzeEntityRelationships(entities: EntityDefinition[]) {
    return await this.relationshipAnalyzer.analyzeRelationships(entities)
  }

  /**
   * Validate entity relationships
   */
  async validateEntityRelationships(entities: EntityDefinition[]) {
    const allRelationships = entities.flatMap(e => e.relationships)
    return await this.relationshipAnalyzer.validateRelationships(allRelationships)
  }

  /**
   * Generate relationship diagram
   */
  async generateRelationshipDiagram(entities: EntityDefinition[]): Promise<string> {
    const graph = await this.relationshipAnalyzer.analyzeRelationships(entities)
    return await this.relationshipAnalyzer.generateRelationshipDiagram(graph)
  }

  /**
   * Assess entity complexity
   */
  private assessComplexity(
    entity: EntityDefinition,
    locations: SourceLocation[]
  ): 'simple' | 'moderate' | 'complex' {
    let complexityScore = 0

    // Factor 1: Number of source files
    complexityScore += locations.length * 2

    // Factor 2: Number of relationships
    complexityScore += entity.relationships.length * 3

    // Factor 3: Number of UI components
    complexityScore += entity.uiComponents.length * 2

    // Factor 4: Number of API methods
    complexityScore += entity.apiMethods.length * 2

    // Factor 5: Total code complexity from locations
    const totalCodeComplexity = locations.reduce((sum, loc) => sum + loc.complexity, 0)
    complexityScore += totalCodeComplexity / 10

    if (complexityScore < 20) return 'simple'
    if (complexityScore < 50) return 'moderate'
    return 'complex'
  }

  /**
   * Extract entity dependencies
   */
  private extractDependencies(entity: EntityDefinition): string[] {
    const dependencies = new Set<string>()

    // Add relationship targets as dependencies
    for (const relationship of entity.relationships) {
      dependencies.add(relationship.target)
    }

    // Add dependencies from UI components
    for (const component of entity.uiComponents) {
      for (const dep of component.dependencies) {
        if (this.isEntityDependency(dep)) {
          dependencies.add(dep)
        }
      }
    }

    // Add dependencies from API methods
    for (const apiFile of entity.apiMethods) {
      for (const dep of apiFile.dependencies) {
        if (this.isEntityDependency(dep)) {
          dependencies.add(dep)
        }
      }
    }

    return Array.from(dependencies)
  }

  /**
   * Check if dependency is an entity dependency
   */
  private isEntityDependency(dep: string): boolean {
    const entityTypes = [
      'User', 'Student', 'Educator', 'Recruiter', 'Admin',
      'Course', 'Organization', 'Subscription', 'Message',
      'Assessment', 'Project', 'Certificate'
    ]

    return entityTypes.some(type => dep.includes(type))
  }

  /**
   * Assess migration risk
   */
  private assessMigrationRisk(
    complexity: 'simple' | 'moderate' | 'complex',
    usageCount: number,
    dependencyCount: number
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0

    // Factor 1: Complexity
    if (complexity === 'simple') riskScore += 1
    else if (complexity === 'moderate') riskScore += 2
    else riskScore += 3

    // Factor 2: Usage count
    if (usageCount > 50) riskScore += 3
    else if (usageCount > 20) riskScore += 2
    else riskScore += 1

    // Factor 3: Dependencies
    if (dependencyCount > 5) riskScore += 2
    else if (dependencyCount > 2) riskScore += 1

    if (riskScore <= 3) return 'low'
    if (riskScore <= 6) return 'medium'
    return 'high'
  }

  /**
   * Estimate migration effort
   */
  private estimateEffort(
    complexity: 'simple' | 'moderate' | 'complex',
    fileCount: number
  ): 'small' | 'medium' | 'large' {
    let effortScore = 0

    // Factor 1: Complexity
    if (complexity === 'simple') effortScore += 1
    else if (complexity === 'moderate') effortScore += 2
    else effortScore += 3

    // Factor 2: File count
    if (fileCount > 20) effortScore += 3
    else if (fileCount > 10) effortScore += 2
    else effortScore += 1

    if (effortScore <= 2) return 'small'
    if (effortScore <= 4) return 'medium'
    return 'large'
  }
}
