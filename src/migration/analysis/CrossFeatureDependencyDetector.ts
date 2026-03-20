/**
 * Cross-Feature Dependency Detector - Identifies API functions used by multiple features
 * 
 * This component implements dependency detection as specified in Requirements 1.4, 1.5, 9.1
 * Classifies functions as shared utilities vs feature-specific and identifies cross-feature usage patterns.
 */

import { 
  APIFunction, 
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  CircularDependency,
  FeatureMapping
} from '../types/index.js'

export interface CrossFeatureDependency {
  functionName: string
  sourceFeature: string
  targetFeatures: string[]
  dependencyType: 'import' | 'call' | 'reference'
  strength: number
  recommendation: 'move-to-shared' | 'keep-feature-specific' | 'refactor' | 'document'
  reason: string
}

export interface DependencyAnalysisResult {
  crossFeatureDependencies: CrossFeatureDependency[]
  sharedUtilities: APIFunction[]
  featureSpecificFunctions: APIFunction[]
  circularDependencies: CircularDependency[]
  recommendations: DependencyRecommendation[]
}

export interface DependencyRecommendation {
  type: 'architectural' | 'refactoring' | 'documentation'
  priority: 'high' | 'medium' | 'low'
  description: string
  affectedFunctions: string[]
  suggestedAction: string
}

export class CrossFeatureDependencyDetector {
  private usageThreshold: number
  private strengthThreshold: number

  constructor(usageThreshold: number = 2, strengthThreshold: number = 0.5) {
    this.usageThreshold = usageThreshold
    this.strengthThreshold = strengthThreshold
  }

  /**
   * Analyze cross-feature dependencies and classify functions
   * Implements Requirements 1.4, 1.5, 9.1
   */
  async analyzeDependencies(
    functions: APIFunction[], 
    mappings: FeatureMapping[]
  ): Promise<DependencyAnalysisResult> {
    
    // Build dependency graph
    const dependencyGraph = await this.buildDependencyGraph(functions)
    
    // Identify cross-feature dependencies
    const crossFeatureDependencies = this.identifyCrossFeatureDependencies(functions, mappings)
    
    // Classify functions
    const { sharedUtilities, featureSpecificFunctions } = this.classifyFunctions(
      functions, 
      crossFeatureDependencies
    )
    
    // Detect circular dependencies
    const circularDependencies = this.detectCircularDependencies(dependencyGraph)
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      crossFeatureDependencies,
      circularDependencies,
      sharedUtilities
    )

    return {
      crossFeatureDependencies,
      sharedUtilities,
      featureSpecificFunctions,
      circularDependencies,
      recommendations
    }
  }

  /**
   * Build a comprehensive dependency graph
   */
  private async buildDependencyGraph(functions: APIFunction[]): Promise<DependencyGraph> {
    const nodes: DependencyNode[] = []
    const edges: DependencyEdge[] = []
    const nodeMap = new Map<string, DependencyNode>()

    // Create nodes for each function
    for (const func of functions) {
      const node: DependencyNode = {
        id: `${func.sourceFile}:${func.name}`,
        functionName: func.name,
        filePath: func.sourceFile,
        type: func.isShared ? 'shared' : (func.feature ? 'api' : 'utility')
      }
      
      nodes.push(node)
      nodeMap.set(node.id, node)
    }

    // Create edges based on dependencies
    for (const func of functions) {
      const fromId = `${func.sourceFile}:${func.name}`
      
      // Analyze function dependencies
      const dependencies = await this.analyzeFunctionDependencies(func, functions)
      
      for (const dep of dependencies) {
        const toId = `${dep.sourceFile}:${dep.name}`
        
        if (fromId !== toId && nodeMap.has(toId)) {
          edges.push({
            from: fromId,
            to: toId,
            type: this.determineDependencyType(func, dep),
            strength: this.calculateDependencyStrength(func, dep)
          })
        }
      }
    }

    return {
      nodes,
      edges,
      circularDependencies: [] // Will be populated by detectCircularDependencies
    }
  }

  /**
   * Analyze dependencies for a specific function
   */
  private async analyzeFunctionDependencies(
    func: APIFunction, 
    allFunctions: APIFunction[]
  ): Promise<APIFunction[]> {
    const dependencies: APIFunction[] = []

    // Check explicit dependencies from function analysis
    for (const depName of func.dependencies) {
      const matchingFunctions = allFunctions.filter(f => 
        f.name.toLowerCase().includes(depName.toLowerCase()) ||
        f.sourceFile.includes(depName) ||
        this.isRelatedFunction(func, f)
      )
      dependencies.push(...matchingFunctions)
    }

    // Check store integration dependencies
    for (const integration of func.storeIntegrations) {
      const storeFunctions = allFunctions.filter(f =>
        f.storeIntegrations.some(si => si.storeName === integration.storeName)
      )
      dependencies.push(...storeFunctions)
    }

    // Remove duplicates and self-references
    return [...new Set(dependencies)].filter(dep => dep !== func)
  }

  /**
   * Check if two functions are related based on various criteria
   */
  private isRelatedFunction(func1: APIFunction, func2: APIFunction): boolean {
    // Same feature
    if (func1.feature && func2.feature && func1.feature === func2.feature) {
      return true
    }

    // Similar naming patterns
    const name1 = func1.name.toLowerCase()
    const name2 = func2.name.toLowerCase()
    
    if (name1.includes(name2) || name2.includes(name1)) {
      return true
    }

    // Shared store integrations
    const stores1 = new Set(func1.storeIntegrations.map(s => s.storeName))
    const stores2 = new Set(func2.storeIntegrations.map(s => s.storeName))
    const commonStores = new Set([...stores1].filter(x => stores2.has(x)))
    
    return commonStores.size > 0
  }

  /**
   * Determine the type of dependency between two functions
   */
  private determineDependencyType(from: APIFunction, to: APIFunction): 'import' | 'call' | 'reference' {
    // Check if it's an import dependency
    if (from.dependencies.some(dep => dep.includes(to.name))) {
      return 'import'
    }

    // Check if it's a function call (based on naming patterns)
    if (from.name.toLowerCase().includes('call') || from.name.toLowerCase().includes('invoke')) {
      return 'call'
    }

    // Default to reference
    return 'reference'
  }

  /**
   * Calculate the strength of dependency between two functions
   */
  private calculateDependencyStrength(from: APIFunction, to: APIFunction): number {
    let strength = 0.1 // Base strength

    // Same feature increases strength
    if (from.feature === to.feature) {
      strength += 0.3
    }

    // Direct name reference increases strength
    if (from.dependencies.some(dep => dep.includes(to.name))) {
      strength += 0.4
    }

    // Store integration overlap increases strength
    const fromStores = new Set(from.storeIntegrations.map(s => s.storeName))
    const toStores = new Set(to.storeIntegrations.map(s => s.storeName))
    const overlap = new Set([...fromStores].filter(x => toStores.has(x)))
    
    if (overlap.size > 0) {
      strength += 0.2
    }

    // Usage count correlation
    if (from.usageCount > 0 && to.usageCount > 0) {
      const usageRatio = Math.min(from.usageCount, to.usageCount) / Math.max(from.usageCount, to.usageCount)
      strength += usageRatio * 0.1
    }

    return Math.min(strength, 1.0)
  }

  /**
   * Identify cross-feature dependencies
   */
  private identifyCrossFeatureDependencies(
    functions: APIFunction[], 
    mappings: FeatureMapping[]
  ): CrossFeatureDependency[] {
    const crossDependencies: CrossFeatureDependency[] = []
    const featureMap = new Map<string, string[]>()

    // Build feature to function mapping
    for (const mapping of mappings) {
      featureMap.set(mapping.feature, mapping.functions.map(f => f.name))
    }

    // Analyze each function for cross-feature usage
    for (const func of functions) {
      if (!func.feature || func.isShared) continue

      const targetFeatures: string[] = []
      
      // Check which other features use this function
      for (const [feature, functionNames] of featureMap) {
        if (feature !== func.feature && feature !== 'shared') {
          // Check if any function in this feature depends on our function
          const hasUsage = functions
            .filter(f => f.feature === feature)
            .some(f => f.dependencies.some(dep => dep.includes(func.name)))

          if (hasUsage) {
            targetFeatures.push(feature)
          }
        }
      }

      // If function is used by multiple features, it's a cross-feature dependency
      if (targetFeatures.length > 0) {
        const strength = this.calculateCrossFeatureStrength(func, targetFeatures, functions)
        const recommendation = this.recommendAction(func, targetFeatures, strength)

        crossDependencies.push({
          functionName: func.name,
          sourceFeature: func.feature,
          targetFeatures,
          dependencyType: 'reference', // Simplified for now
          strength,
          recommendation: recommendation.action,
          reason: recommendation.reason
        })
      }
    }

    return crossDependencies
  }

  /**
   * Calculate strength of cross-feature dependency
   */
  private calculateCrossFeatureStrength(
    func: APIFunction, 
    targetFeatures: string[], 
    allFunctions: APIFunction[]
  ): number {
    let strength = 0

    // More target features = higher strength
    strength += Math.min(targetFeatures.length * 0.2, 0.6)

    // Usage count across features
    const crossFeatureUsage = allFunctions
      .filter(f => targetFeatures.includes(f.feature || ''))
      .filter(f => f.dependencies.some(dep => dep.includes(func.name)))
      .length

    strength += Math.min(crossFeatureUsage * 0.1, 0.3)

    // Store integration complexity
    if (func.storeIntegrations.length > 1) {
      strength += 0.1
    }

    return Math.min(strength, 1.0)
  }

  /**
   * Recommend action for cross-feature dependency
   */
  private recommendAction(
    func: APIFunction, 
    targetFeatures: string[], 
    strength: number
  ): { action: 'move-to-shared' | 'keep-feature-specific' | 'refactor' | 'document'; reason: string } {
    
    if (strength > 0.7 && targetFeatures.length > 2) {
      return {
        action: 'move-to-shared',
        reason: `Function is heavily used by ${targetFeatures.length} features with high coupling`
      }
    }

    if (strength > 0.5 && targetFeatures.length > 1) {
      return {
        action: 'move-to-shared',
        reason: `Function is moderately used by multiple features`
      }
    }

    if (targetFeatures.length === 1 && strength < 0.3) {
      return {
        action: 'document',
        reason: `Low-strength dependency can be documented as architectural decision`
      }
    }

    if (func.storeIntegrations.length > 1) {
      return {
        action: 'refactor',
        reason: `Function integrates with multiple stores, consider refactoring for better separation`
      }
    }

    return {
      action: 'keep-feature-specific',
      reason: `Dependency strength is manageable within current feature`
    }
  }

  /**
   * Classify functions as shared utilities vs feature-specific
   */
  private classifyFunctions(
    functions: APIFunction[], 
    crossDependencies: CrossFeatureDependency[]
  ): { sharedUtilities: APIFunction[]; featureSpecificFunctions: APIFunction[] } {
    
    const sharedUtilities: APIFunction[] = []
    const featureSpecificFunctions: APIFunction[] = []
    const crossDepFunctionNames = new Set(crossDependencies.map(cd => cd.functionName))

    for (const func of functions) {
      // Already marked as shared
      if (func.isShared) {
        sharedUtilities.push(func)
        continue
      }

      // Has cross-feature dependencies with recommendation to move to shared
      const crossDep = crossDependencies.find(cd => cd.functionName === func.name)
      if (crossDep && crossDep.recommendation === 'move-to-shared') {
        func.isShared = true
        func.feature = 'shared'
        sharedUtilities.push(func)
        continue
      }

      // Utility function patterns
      if (this.isUtilityFunction(func)) {
        func.isShared = true
        func.feature = 'shared'
        sharedUtilities.push(func)
        continue
      }

      // Default to feature-specific
      featureSpecificFunctions.push(func)
    }

    return { sharedUtilities, featureSpecificFunctions }
  }

  /**
   * Check if a function should be classified as a utility
   */
  private isUtilityFunction(func: APIFunction): boolean {
    const name = func.name.toLowerCase()
    const path = func.sourceFile.toLowerCase()

    // Common utility patterns
    const utilityPatterns = [
      'util', 'helper', 'common', 'shared', 'config', 'constant',
      'validate', 'format', 'parse', 'transform', 'convert',
      'http', 'api', 'client', 'request', 'response', 'interceptor',
      'error', 'logger', 'debug', 'cache', 'storage', 'crypto'
    ]

    // Check function name
    if (utilityPatterns.some(pattern => name.includes(pattern))) {
      return true
    }

    // Check file path
    if (path.includes('util') || path.includes('helper') || path.includes('common')) {
      return true
    }

    // Check if function has no specific feature but high usage
    if (!func.feature && func.usageCount > this.usageThreshold) {
      return true
    }

    return false
  }

  /**
   * Detect circular dependencies in the dependency graph
   */
  private detectCircularDependencies(graph: DependencyGraph): CircularDependency[] {
    const circularDeps: CircularDependency[] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    const adjacencyList = new Map<string, string[]>()

    // Build adjacency list
    for (const edge of graph.edges) {
      if (!adjacencyList.has(edge.from)) {
        adjacencyList.set(edge.from, [])
      }
      adjacencyList.get(edge.from)!.push(edge.to)
    }

    // DFS to detect cycles
    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId)
      recursionStack.add(nodeId)
      path.push(nodeId)

      const neighbors = adjacencyList.get(nodeId) || []
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path])
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor)
          const cycle = path.slice(cycleStart)
          cycle.push(neighbor) // Complete the cycle
          
          circularDeps.push({
            cycle,
            severity: this.assessCycleSeverity(cycle),
            suggestion: this.generateCycleSuggestion(cycle)
          })
        }
      }

      recursionStack.delete(nodeId)
    }

    // Check each node
    for (const node of graph.nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, [])
      }
    }

    return circularDeps
  }

  /**
   * Assess the severity of a circular dependency
   */
  private assessCycleSeverity(cycle: string[]): 'low' | 'medium' | 'high' {
    if (cycle.length <= 2) return 'low'
    if (cycle.length <= 4) return 'medium'
    return 'high'
  }

  /**
   * Generate suggestion for resolving circular dependency
   */
  private generateCycleSuggestion(cycle: string[]): string {
    if (cycle.length <= 2) {
      return 'Consider extracting shared functionality to a separate utility module'
    } else if (cycle.length <= 4) {
      return 'Consider refactoring to use dependency injection or event-driven patterns'
    } else {
      return 'Consider significant architectural refactoring to break complex dependency chains'
    }
  }

  /**
   * Generate architectural and refactoring recommendations
   */
  private generateRecommendations(
    crossDependencies: CrossFeatureDependency[],
    circularDependencies: CircularDependency[],
    sharedUtilities: APIFunction[]
  ): DependencyRecommendation[] {
    const recommendations: DependencyRecommendation[] = []

    // Recommendations for cross-feature dependencies
    const moveToShared = crossDependencies.filter(cd => cd.recommendation === 'move-to-shared')
    if (moveToShared.length > 0) {
      recommendations.push({
        type: 'architectural',
        priority: 'high',
        description: `${moveToShared.length} functions should be moved to shared utilities`,
        affectedFunctions: moveToShared.map(cd => cd.functionName),
        suggestedAction: 'Move these functions to src/shared/api/ and update all imports'
      })
    }

    const needRefactoring = crossDependencies.filter(cd => cd.recommendation === 'refactor')
    if (needRefactoring.length > 0) {
      recommendations.push({
        type: 'refactoring',
        priority: 'medium',
        description: `${needRefactoring.length} functions need refactoring for better separation`,
        affectedFunctions: needRefactoring.map(cd => cd.functionName),
        suggestedAction: 'Refactor these functions to reduce cross-feature coupling'
      })
    }

    // Recommendations for circular dependencies
    const highSeverityCircular = circularDependencies.filter(cd => cd.severity === 'high')
    if (highSeverityCircular.length > 0) {
      recommendations.push({
        type: 'architectural',
        priority: 'high',
        description: `${highSeverityCircular.length} high-severity circular dependencies detected`,
        affectedFunctions: highSeverityCircular.flatMap(cd => cd.cycle),
        suggestedAction: 'Significant architectural refactoring required to break dependency chains'
      })
    }

    // Recommendations for shared utilities organization
    if (sharedUtilities.length > 10) {
      recommendations.push({
        type: 'architectural',
        priority: 'low',
        description: `Large number of shared utilities (${sharedUtilities.length}) may need organization`,
        affectedFunctions: sharedUtilities.map(su => su.name),
        suggestedAction: 'Consider organizing shared utilities into subcategories'
      })
    }

    return recommendations
  }

  /**
   * Get dependency analysis statistics
   */
  getStatistics(result: DependencyAnalysisResult) {
    return {
      totalFunctions: result.sharedUtilities.length + result.featureSpecificFunctions.length,
      sharedUtilities: result.sharedUtilities.length,
      featureSpecificFunctions: result.featureSpecificFunctions.length,
      crossFeatureDependencies: result.crossFeatureDependencies.length,
      circularDependencies: result.circularDependencies.length,
      highPriorityRecommendations: result.recommendations.filter(r => r.priority === 'high').length,
      mediumPriorityRecommendations: result.recommendations.filter(r => r.priority === 'medium').length,
      lowPriorityRecommendations: result.recommendations.filter(r => r.priority === 'low').length
    }
  }
}

/**
 * Create a new cross-feature dependency detector
 */
export function createCrossFeatureDependencyDetector(
  usageThreshold?: number,
  strengthThreshold?: number
): CrossFeatureDependencyDetector {
  return new CrossFeatureDependencyDetector(usageThreshold, strengthThreshold)
}