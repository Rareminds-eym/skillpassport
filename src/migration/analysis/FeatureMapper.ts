/**
 * Feature Mapper - Maps API functions to FSD features based on usage patterns and naming conventions
 * 
 * This component implements the feature mapping algorithm as specified in Requirements 1.3, 2.1
 * Maps API functions to appropriate FSD feature directories:
 * - authentication → features/authentication/api/
 * - subscription → features/subscription/api/
 * - search → features/search/api/
 * - portfolio → features/portfolio/api/
 */

import { 
  APIFunction, 
  FeatureMapping, 
  FeatureType,
  StoreIntegration 
} from '../types/index.js'

export interface FeatureMappingRule {
  feature: FeatureType
  patterns: string[]
  storeNames: string[]
  weight: number
}

export class FeatureMapper {
  private mappingRules: FeatureMappingRule[]
  private confidenceThreshold: number

  constructor(confidenceThreshold: number = 0.7) {
    this.confidenceThreshold = confidenceThreshold
    this.mappingRules = this.initializeMappingRules()
  }

  /**
   * Map API functions to their corresponding FSD features
   * Implements Requirements 1.3, 2.1
   */
  async mapToFeatures(functions: APIFunction[]): Promise<FeatureMapping[]> {
    const featureMap = new Map<string, APIFunction[]>()
    const sharedFunctions: APIFunction[] = []

    // First pass: Apply mapping rules to classify functions
    for (const func of functions) {
      const classification = this.classifyFunction(func)
      
      if (classification.isShared || classification.feature === 'shared') {
        func.isShared = true
        func.feature = 'shared'
        sharedFunctions.push(func)
      } else if (classification.feature && classification.confidence >= this.confidenceThreshold) {
        func.feature = classification.feature
        func.isShared = false
        
        if (!featureMap.has(classification.feature)) {
          featureMap.set(classification.feature, [])
        }
        featureMap.get(classification.feature)!.push(func)
      } else {
        // Low confidence - treat as shared for safety
        func.isShared = true
        func.feature = 'shared'
        sharedFunctions.push(func)
      }
    }

    const mappings: FeatureMapping[] = []

    // Create feature mappings for each identified feature
    for (const [feature, funcs] of featureMap) {
      const confidence = this.calculateMappingConfidence(funcs, feature)
      
      mappings.push({
        feature,
        functions: funcs,
        targetPath: `src/features/${feature}/api`,
        storeIntegrations: this.consolidateStoreIntegrations(funcs),
        confidence
      })
    }

    // Add shared functions mapping if any exist
    if (sharedFunctions.length > 0) {
      mappings.push({
        feature: 'shared',
        functions: sharedFunctions,
        targetPath: 'src/shared/api',
        storeIntegrations: this.consolidateStoreIntegrations(sharedFunctions),
        confidence: 1.0
      })
    }

    return mappings.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Classify a single function to determine its feature and confidence
   */
  private classifyFunction(func: APIFunction): { feature: string; confidence: number; isShared: boolean } {
    let bestMatch: { feature: string; confidence: number; isShared: boolean } = {
      feature: 'shared',
      confidence: 0,
      isShared: true
    }

    // Check against each mapping rule
    for (const rule of this.mappingRules) {
      const confidence = this.calculateRuleConfidence(func, rule)
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          feature: rule.feature,
          confidence,
          isShared: false
        }
      }
    }

    // Additional checks for shared utilities
    if (this.isSharedUtility(func)) {
      return {
        feature: 'shared',
        confidence: 0.9,
        isShared: true
      }
    }

    return bestMatch
  }

  /**
   * Calculate confidence score for a function against a specific rule
   */
  private calculateRuleConfidence(func: APIFunction, rule: FeatureMappingRule): number {
    let confidence = 0

    // Check function name patterns
    const nameScore = this.calculateNamePatternScore(func.name, rule.patterns)
    confidence += nameScore * 0.4

    // Check file path patterns
    const pathScore = this.calculatePathPatternScore(func.sourceFile, rule.patterns)
    confidence += pathScore * 0.2

    // Check store integration patterns
    const storeScore = this.calculateStoreIntegrationScore(func.storeIntegrations, rule.storeNames)
    confidence += storeScore * 0.3

    // Check usage patterns (if available)
    const usageScore = this.calculateUsagePatternScore(func, rule)
    confidence += usageScore * 0.1

    return Math.min(confidence * rule.weight, 1.0)
  }

  /**
   * Calculate score based on function name patterns
   */
  private calculateNamePatternScore(functionName: string, patterns: string[]): number {
    const name = functionName.toLowerCase()
    let score = 0
    let matches = 0

    for (const pattern of patterns) {
      if (name.includes(pattern.toLowerCase())) {
        matches++
        // Exact matches get higher scores
        if (name === pattern.toLowerCase() || name.startsWith(pattern.toLowerCase())) {
          score += 1.0
        } else {
          score += 0.5
        }
      }
    }

    return matches > 0 ? Math.min(score / patterns.length, 1.0) : 0
  }

  /**
   * Calculate score based on file path patterns
   */
  private calculatePathPatternScore(filePath: string, patterns: string[]): number {
    const path = filePath.toLowerCase()
    let score = 0

    for (const pattern of patterns) {
      if (path.includes(pattern.toLowerCase())) {
        score += 0.5
      }
    }

    return Math.min(score, 1.0)
  }

  /**
   * Calculate score based on store integration patterns
   */
  private calculateStoreIntegrationScore(integrations: StoreIntegration[], storeNames: string[]): number {
    if (integrations.length === 0 || storeNames.length === 0) return 0

    let matches = 0
    for (const integration of integrations) {
      for (const storeName of storeNames) {
        if (integration.storeName.toLowerCase().includes(storeName.toLowerCase())) {
          matches++
        }
      }
    }

    return matches > 0 ? Math.min(matches / storeNames.length, 1.0) : 0
  }

  /**
   * Calculate score based on usage patterns
   */
  private calculateUsagePatternScore(func: APIFunction, rule: FeatureMappingRule): number {
    // Higher usage count within the same feature context increases confidence
    if (func.usageCount > 5) {
      return 0.8
    } else if (func.usageCount > 2) {
      return 0.5
    } else if (func.usageCount > 0) {
      return 0.2
    }
    return 0
  }

  /**
   * Check if a function should be classified as a shared utility
   */
  private isSharedUtility(func: APIFunction): boolean {
    const name = func.name.toLowerCase()
    const path = func.sourceFile.toLowerCase()

    // Common utility patterns
    const utilityPatterns = [
      'util', 'helper', 'common', 'shared', 'config', 'constant',
      'validate', 'format', 'parse', 'transform', 'convert',
      'http', 'api', 'client', 'request', 'response', 'interceptor',
      'error', 'logger', 'debug', 'cache', 'storage'
    ]

    // Check if function name matches utility patterns
    if (utilityPatterns.some(pattern => name.includes(pattern))) {
      return true
    }

    // Check if file path suggests utility
    if (path.includes('util') || path.includes('helper') || path.includes('common')) {
      return true
    }

    // Check if function is used by multiple features (cross-feature dependency)
    if (func.storeIntegrations.length > 1) {
      const uniqueStores = new Set(func.storeIntegrations.map(s => s.storeName))
      if (uniqueStores.size > 1) {
        return true
      }
    }

    return false
  }

  /**
   * Calculate overall confidence for a feature mapping
   */
  private calculateMappingConfidence(functions: APIFunction[], feature: string): number {
    if (functions.length === 0) return 0

    let totalConfidence = 0
    
    for (const func of functions) {
      let confidence = 0.5 // Base confidence
      
      // Increase confidence based on naming patterns
      if (func.feature === feature && func.name.toLowerCase().includes(feature)) {
        confidence += 0.3
      }
      
      // Increase confidence based on store integrations
      if (func.storeIntegrations.length > 0) {
        const relevantIntegrations = func.storeIntegrations.filter(integration =>
          integration.storeName.toLowerCase().includes(feature)
        )
        if (relevantIntegrations.length > 0) {
          confidence += 0.2
        }
      }
      
      // Increase confidence based on usage patterns
      if (func.usageCount > 5) {
        confidence += 0.1
      }
      
      totalConfidence += Math.min(confidence, 1.0)
    }

    return totalConfidence / functions.length
  }

  /**
   * Consolidate store integrations from multiple functions
   */
  private consolidateStoreIntegrations(functions: APIFunction[]): StoreIntegration[] {
    const integrationMap = new Map<string, {
      storeName: string
      actions: Set<string>
      selectors: Set<string>
      integrationPattern: string
    }>()
    
    for (const func of functions) {
      for (const integration of func.storeIntegrations) {
        const key = integration.storeName
        
        if (!integrationMap.has(key)) {
          integrationMap.set(key, {
            storeName: integration.storeName,
            actions: new Set(integration.actions),
            selectors: new Set(integration.selectors),
            integrationPattern: integration.integrationPattern
          })
        } else {
          const existing = integrationMap.get(key)!
          integration.actions.forEach(action => existing.actions.add(action))
          integration.selectors.forEach(selector => existing.selectors.add(selector))
        }
      }
    }

    return Array.from(integrationMap.values()).map(integration => ({
      storeName: integration.storeName,
      actions: Array.from(integration.actions),
      selectors: Array.from(integration.selectors),
      integrationPattern: integration.integrationPattern as 'direct' | 'event-driven' | 'callback'
    }))
  }

  /**
   * Initialize the feature mapping rules
   */
  private initializeMappingRules(): FeatureMappingRule[] {
    return [
      {
        feature: 'authentication',
        patterns: [
          'auth', 'login', 'logout', 'register', 'signin', 'signout', 'signup',
          'user', 'session', 'token', 'jwt', 'credential', 'password',
          'authenticate', 'authorize', 'permission', 'role', 'access'
        ],
        storeNames: ['auth', 'user', 'session'],
        weight: 1.0
      },
      {
        feature: 'subscription',
        patterns: [
          'subscription', 'subscribe', 'unsubscribe', 'payment', 'billing',
          'plan', 'upgrade', 'downgrade', 'invoice', 'charge', 'stripe',
          'paypal', 'checkout', 'purchase', 'premium', 'tier'
        ],
        storeNames: ['subscription', 'billing', 'payment'],
        weight: 1.0
      },
      {
        feature: 'search',
        patterns: [
          'search', 'query', 'find', 'filter', 'lookup', 'discover',
          'browse', 'explore', 'index', 'elasticsearch', 'algolia',
          'autocomplete', 'suggest', 'recommendation'
        ],
        storeNames: ['search', 'query', 'filter'],
        weight: 1.0
      },
      {
        feature: 'portfolio',
        patterns: [
          'portfolio', 'project', 'skill', 'experience', 'achievement',
          'resume', 'cv', 'profile', 'showcase', 'work', 'employment',
          'education', 'certification', 'award', 'accomplishment'
        ],
        storeNames: ['portfolio', 'profile', 'skill'],
        weight: 1.0
      },
      {
        feature: 'assessment',
        patterns: [
          'assessment', 'test', 'exam', 'quiz', 'evaluation', 'score',
          'grade', 'result', 'feedback', 'review', 'rating', 'benchmark'
        ],
        storeNames: ['assessment', 'test', 'evaluation'],
        weight: 1.0
      },
      {
        feature: 'courses',
        patterns: [
          'course', 'lesson', 'curriculum', 'module', 'chapter', 'content',
          'learning', 'education', 'tutorial', 'training', 'material',
          'progress', 'completion', 'enrollment'
        ],
        storeNames: ['course', 'learning', 'progress'],
        weight: 1.0
      },
      {
        feature: 'messaging',
        patterns: [
          'message', 'chat', 'notification', 'email', 'sms', 'push',
          'alert', 'communication', 'conversation', 'thread', 'reply',
          'send', 'receive', 'inbox', 'outbox'
        ],
        storeNames: ['message', 'notification', 'chat'],
        weight: 1.0
      },
      {
        feature: 'career-assistant',
        patterns: [
          'career', 'job', 'opportunity', 'position', 'role', 'hiring',
          'recruitment', 'application', 'interview', 'offer', 'salary',
          'company', 'employer', 'candidate', 'match', 'recommendation'
        ],
        storeNames: ['career', 'job', 'opportunity'],
        weight: 1.0
      }
    ]
  }

  /**
   * Get mapping statistics
   */
  getStatistics(mappings: FeatureMapping[]) {
    const stats = {
      totalMappings: mappings.length,
      totalFunctions: mappings.reduce((sum, m) => sum + m.functions.length, 0),
      averageConfidence: mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length,
      featureDistribution: {} as Record<string, number>,
      sharedFunctions: 0,
      storeIntegrations: mappings.reduce((sum, m) => sum + m.storeIntegrations.length, 0)
    }

    for (const mapping of mappings) {
      stats.featureDistribution[mapping.feature] = mapping.functions.length
      if (mapping.feature === 'shared') {
        stats.sharedFunctions = mapping.functions.length
      }
    }

    return stats
  }
}

/**
 * Create a new feature mapper
 */
export function createFeatureMapper(confidenceThreshold?: number): FeatureMapper {
  return new FeatureMapper(confidenceThreshold)
}