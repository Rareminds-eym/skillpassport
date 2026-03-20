/**
 * Integration tests for API classification and mapping system
 * Tests the complete flow from analysis to feature mapping and dependency detection
 */

import { APIAnalyzer } from '../APIAnalyzer.js'
import { APIFunction, ServiceFile } from '../../types/index.js'

describe('API Classification and Mapping Integration', () => {
  let analyzer: APIAnalyzer

  beforeEach(() => {
    analyzer = new APIAnalyzer()
  })

  describe('Feature Mapping Algorithm', () => {
    it('should map authentication functions to authentication feature', async () => {
      const mockFunctions: APIFunction[] = [
        {
          name: 'loginUser',
          signature: 'async loginUser(credentials: LoginCredentials): Promise<User>',
          feature: null,
          isShared: false,
          dependencies: ['supabase.auth'],
          usageCount: 5,
          storeIntegrations: [{ storeName: 'authStore', actions: ['setUser'], selectors: ['getUser'], integrationPattern: 'direct' }],
          sourceFile: 'services/authService.ts',
          lineNumber: 10,
          isAsync: true,
          returnType: 'Promise<User>',
          parameters: [{ name: 'credentials', type: 'LoginCredentials', optional: false }]
        },
        {
          name: 'logoutUser',
          signature: 'async logoutUser(): Promise<void>',
          feature: null,
          isShared: false,
          dependencies: ['supabase.auth'],
          usageCount: 3,
          storeIntegrations: [{ storeName: 'authStore', actions: ['clearUser'], selectors: [], integrationPattern: 'direct' }],
          sourceFile: 'services/authService.ts',
          lineNumber: 25,
          isAsync: true,
          returnType: 'Promise<void>',
          parameters: []
        }
      ]

      const mappings = await analyzer.mapToFeatures(mockFunctions)
      
      expect(mappings).toHaveLength(1)
      expect(mappings[0].feature).toBe('authentication')
      expect(mappings[0].functions).toHaveLength(2)
      expect(mappings[0].targetPath).toBe('src/features/authentication/api')
      expect(mappings[0].confidence).toBeGreaterThan(0.5)
    })

    it('should map subscription functions to subscription feature', async () => {
      const mockFunctions: APIFunction[] = [
        {
          name: 'updateSubscription',
          signature: 'async updateSubscription(planId: string): Promise<Subscription>',
          feature: null,
          isShared: false,
          dependencies: ['stripe'],
          usageCount: 4,
          storeIntegrations: [{ storeName: 'subscriptionStore', actions: ['updatePlan'], selectors: [], integrationPattern: 'direct' }],
          sourceFile: 'services/subscriptionService.ts',
          lineNumber: 15,
          isAsync: true,
          returnType: 'Promise<Subscription>',
          parameters: [{ name: 'planId', type: 'string', optional: false }]
        }
      ]

      const mappings = await analyzer.mapToFeatures(mockFunctions)
      
      expect(mappings).toHaveLength(1)
      expect(mappings[0].feature).toBe('subscription')
      expect(mappings[0].functions).toHaveLength(1)
      expect(mappings[0].targetPath).toBe('src/features/subscription/api')
    })

    it('should identify shared utilities', async () => {
      const mockFunctions: APIFunction[] = [
        {
          name: 'httpClient',
          signature: 'httpClient(config: RequestConfig): Promise<Response>',
          feature: null,
          isShared: false,
          dependencies: ['axios'],
          usageCount: 15,
          storeIntegrations: [],
          sourceFile: 'services/httpUtils.ts',
          lineNumber: 5,
          isAsync: false,
          returnType: 'Promise<Response>',
          parameters: [{ name: 'config', type: 'RequestConfig', optional: false }]
        },
        {
          name: 'validateApiResponse',
          signature: 'validateApiResponse(response: any): boolean',
          feature: null,
          isShared: false,
          dependencies: [],
          usageCount: 8,
          storeIntegrations: [],
          sourceFile: 'services/validationUtils.ts',
          lineNumber: 12,
          isAsync: false,
          returnType: 'boolean',
          parameters: [{ name: 'response', type: 'any', optional: false }]
        }
      ]

      const mappings = await analyzer.mapToFeatures(mockFunctions)
      
      expect(mappings).toHaveLength(1)
      expect(mappings[0].feature).toBe('shared')
      expect(mappings[0].functions).toHaveLength(2)
      expect(mappings[0].targetPath).toBe('src/shared/api')
      expect(mappings[0].confidence).toBe(1.0)
    })
  })

  describe('Cross-Feature Dependency Detection', () => {
    it('should identify cross-feature dependencies', async () => {
      const mockFunctions: APIFunction[] = [
        {
          name: 'getUserProfile',
          signature: 'async getUserProfile(userId: string): Promise<UserProfile>',
          feature: 'authentication',
          isShared: false,
          dependencies: [],
          usageCount: 10,
          storeIntegrations: [{ storeName: 'authStore', actions: [], selectors: ['getUser'], integrationPattern: 'direct' }],
          sourceFile: 'services/authService.ts',
          lineNumber: 30,
          isAsync: true,
          returnType: 'Promise<UserProfile>',
          parameters: [{ name: 'userId', type: 'string', optional: false }]
        },
        {
          name: 'getPortfolioForUser',
          signature: 'async getPortfolioForUser(userId: string): Promise<Portfolio>',
          feature: 'portfolio',
          isShared: false,
          dependencies: ['getUserProfile'], // Cross-feature dependency
          usageCount: 5,
          storeIntegrations: [{ storeName: 'portfolioStore', actions: ['setPortfolio'], selectors: [], integrationPattern: 'direct' }],
          sourceFile: 'services/portfolioService.ts',
          lineNumber: 20,
          isAsync: true,
          returnType: 'Promise<Portfolio>',
          parameters: [{ name: 'userId', type: 'string', optional: false }]
        }
      ]

      const mappings = await analyzer.mapToFeatures(mockFunctions)
      const dependencyAnalysis = await analyzer.getCrossFeatureDependencyAnalysis(mockFunctions)
      
      expect(dependencyAnalysis.crossFeatureDependencies.length).toBeGreaterThan(0)
      
      const crossDep = dependencyAnalysis.crossFeatureDependencies.find(
        cd => cd.functionName === 'getUserProfile'
      )
      
      expect(crossDep).toBeDefined()
      expect(crossDep?.targetFeatures).toContain('portfolio')
    })

    it('should classify functions correctly based on usage patterns', async () => {
      const mockFunctions: APIFunction[] = [
        {
          name: 'apiLogger',
          signature: 'apiLogger(message: string, level: LogLevel): void',
          feature: null,
          isShared: false,
          dependencies: [],
          usageCount: 20, // High usage across features
          storeIntegrations: [],
          sourceFile: 'services/loggerService.ts',
          lineNumber: 8,
          isAsync: false,
          returnType: 'void',
          parameters: [
            { name: 'message', type: 'string', optional: false },
            { name: 'level', type: 'LogLevel', optional: false }
          ]
        }
      ]

      const dependencyAnalysis = await analyzer.getCrossFeatureDependencyAnalysis(mockFunctions)
      
      expect(dependencyAnalysis.sharedUtilities).toHaveLength(1)
      expect(dependencyAnalysis.sharedUtilities[0].name).toBe('apiLogger')
      expect(dependencyAnalysis.sharedUtilities[0].isShared).toBe(true)
    })
  })

  describe('Integration Statistics', () => {
    it('should provide comprehensive analysis statistics', async () => {
      // Mock the scanner to return test data
      const mockServiceFiles: ServiceFile[] = [
        {
          path: 'services/authService.ts',
          name: 'authService.ts',
          functions: [],
          dependencies: [],
          exports: [],
          size: 1024,
          lastModified: new Date()
        }
      ]

      // Mock the scanServices method
      jest.spyOn(analyzer, 'scanServices').mockResolvedValue(mockServiceFiles)

      const stats = await analyzer.getAnalysisStatistics()
      
      expect(stats).toHaveProperty('totalFiles')
      expect(stats).toHaveProperty('totalFunctions')
      expect(stats).toHaveProperty('featureMappings')
      expect(stats).toHaveProperty('sharedFunctions')
      expect(stats).toHaveProperty('storeIntegrations')
      expect(stats).toHaveProperty('circularDependencies')
      expect(stats).toHaveProperty('averageConfidence')
    })
  })
})