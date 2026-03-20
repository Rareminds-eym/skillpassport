/**
 * API Analyzer - Main implementation of the APIAnalyzer interface
 * 
 * Coordinates service directory scanning, function extraction, feature mapping,
 * and dependency analysis as defined in the design document.
 */

import { 
  APIAnalyzer as IAPIAnalyzer,
  ServiceFile, 
  APIFunction, 
  FeatureMapping, 
  DependencyGraph
} from '../types/index.js'
import { ServiceDirectoryScanner } from './ServiceDirectoryScanner.js'
import { APIFunctionExtractor } from './APIFunctionExtractor.js'
import { FeatureMapper } from './FeatureMapper.js'
import { CrossFeatureDependencyDetector } from './CrossFeatureDependencyDetector.js'

export class APIAnalyzer implements IAPIAnalyzer {
  private scanner: ServiceDirectoryScanner
  private extractor: APIFunctionExtractor
  private featureMapper: FeatureMapper
  private dependencyDetector: CrossFeatureDependencyDetector

  constructor(
    servicesPath?: string,
    excludePatterns?: string[],
    confidenceThreshold: number = 0.7
  ) {
    this.scanner = new ServiceDirectoryScanner(servicesPath, excludePatterns)
    this.extractor = new APIFunctionExtractor()
    this.featureMapper = new FeatureMapper(confidenceThreshold)
    this.dependencyDetector = new CrossFeatureDependencyDetector()
  }

  /**
   * Scan the /services/ directory and catalog all service files
   * Implements Requirements 1.1
   */
  async scanServices(): Promise<ServiceFile[]> {
    const serviceFiles = await this.scanner.scanServices()
    
    // Populate functions for each service file
    for (const file of serviceFiles) {
      file.functions = await this.extractor.extractFunctions(file)
    }

    return serviceFiles
  }

  /**
   * Extract API functions from a service file
   * Implements Requirements 1.2
   */
  async extractFunctions(file: ServiceFile): Promise<APIFunction[]> {
    return await this.extractor.extractFunctions(file)
  }

  /**
   * Map API functions to their corresponding FSD features
   * Implements Requirements 1.3, 1.5
   */
  async mapToFeatures(functions: APIFunction[]): Promise<FeatureMapping[]> {
    return await this.featureMapper.mapToFeatures(functions)
  }

  /**
   * Identify dependencies between API functions
   * Implements Requirements 1.4, 9.1, 9.3
   */
  async identifyDependencies(functions: APIFunction[]): Promise<DependencyGraph> {
    const mappings = await this.mapToFeatures(functions)
    const analysisResult = await this.dependencyDetector.analyzeDependencies(functions, mappings)
    
    return {
      nodes: this.buildDependencyNodes(functions),
      edges: this.buildDependencyEdges(functions),
      circularDependencies: analysisResult.circularDependencies
    }
  }

  /**
   * Build dependency nodes from functions
   */
  private buildDependencyNodes(functions: APIFunction[]) {
    return functions.map(func => ({
      id: `${func.sourceFile}:${func.name}`,
      functionName: func.name,
      filePath: func.sourceFile,
      type: (func.isShared ? 'shared' : (func.feature ? 'api' : 'utility')) as 'shared' | 'api' | 'utility'
    }))
  }

  /**
   * Build dependency edges from functions
   */
  private buildDependencyEdges(functions: APIFunction[]) {
    const edges = []
    
    for (const func of functions) {
      const fromId = `${func.sourceFile}:${func.name}`
      
      for (const dep of func.dependencies) {
        const dependentFunctions = functions.filter(f => 
          f.name.toLowerCase().includes(dep.toLowerCase()) ||
          f.sourceFile.includes(dep)
        )

        for (const depFunc of dependentFunctions) {
          const toId = `${depFunc.sourceFile}:${depFunc.name}`
          
          if (fromId !== toId) {
            edges.push({
              from: fromId,
              to: toId,
              type: 'import' as const,
              strength: this.calculateDependencyStrength(func, depFunc)
            })
          }
        }
      }
    }
    
    return edges
  }

  /**
   * Calculate dependency strength between two functions
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
    
    return Math.min(strength, 1.0)
  }

  /**
   * Get cross-feature dependency analysis
   * Implements Requirements 1.4, 1.5, 9.1
   */
  async getCrossFeatureDependencyAnalysis(functions: APIFunction[]) {
    const mappings = await this.mapToFeatures(functions)
    return await this.dependencyDetector.analyzeDependencies(functions, mappings)
  }

  /**
   * Get analysis statistics
   */
  async getAnalysisStatistics() {
    const serviceFiles = await this.scanServices()
    const allFunctions = serviceFiles.flatMap(file => file.functions)
    const mappings = await this.mapToFeatures(allFunctions)
    const dependencies = await this.identifyDependencies(allFunctions)

    return {
      totalFiles: serviceFiles.length,
      totalFunctions: allFunctions.length,
      featureMappings: mappings.length,
      sharedFunctions: allFunctions.filter(f => f.isShared).length,
      storeIntegrations: allFunctions.reduce((sum, f) => sum + f.storeIntegrations.length, 0),
      circularDependencies: dependencies.circularDependencies.length,
      averageConfidence: mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length
    }
  }
}

/**
 * Create a new API analyzer
 */
export function createAPIAnalyzer(
  servicesPath?: string,
  excludePatterns?: string[],
  confidenceThreshold?: number
): APIAnalyzer {
  return new APIAnalyzer(servicesPath, excludePatterns, confidenceThreshold)
}