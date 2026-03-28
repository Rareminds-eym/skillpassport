/**
 * Default Migration Configuration
 * 
 * Provides sensible defaults for the FSD Phase 5 migration system
 */

import { MigrationConfig } from '@/shared/types/index.js'

export const defaultMigrationConfig: MigrationConfig = {
  // Execution options
  dryRun: false,
  backupEnabled: true,
  validateAfterMigration: true,
  rollbackOnFailure: true,
  
  // Logging configuration
  logLevel: 'info',
  
  // File patterns
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**',
    '**/coverage/**',
    '**/*.test.{ts,js}',
    '**/*.spec.{ts,js}',
    '**/__tests__/**'
  ],
  
  includePatterns: [
    'src/services/**/*.{ts,js}',
    'src/**/*.{ts,tsx,js,jsx}'
  ],
  
  // Feature mappings based on FSD structure
  featureMappings: {
    // Authentication related
    'auth': 'authentication',
    'login': 'authentication', 
    'user': 'authentication',
    'session': 'authentication',
    'token': 'authentication',
    
    // Subscription related
    'subscription': 'subscription',
    'payment': 'subscription',
    'billing': 'subscription',
    'plan': 'subscription',
    'addon': 'subscription',
    
    // Search related
    'search': 'search',
    'filter': 'search',
    'query': 'search',
    
    // Portfolio related
    'portfolio': 'portfolio',
    'profile': 'student-profile',
    'resume': 'student-profile',
    
    // Assessment related
    'assessment': 'assessment',
    'test': 'assessment',
    'quiz': 'assessment',
    'evaluation': 'assessment',
    
    // Course related
    'course': 'courses',
    'lesson': 'courses',
    'curriculum': 'courses',
    'enrollment': 'courses',
    
    // Messaging related
    'message': 'messaging',
    'notification': 'messaging',
    'chat': 'messaging',
    
    // Career assistant related
    'career': 'career-assistant',
    'recommendation': 'career-assistant',
    'counselling': 'career-assistant',
    
    // University AI related
    'university': 'university-ai',
    'college': 'university-ai',
    'academic': 'university-ai',
    
    // Educator copilot related
    'educator': 'educator-copilot',
    'teacher': 'educator-copilot',
    'faculty': 'educator-copilot',
    
    // Recruiter copilot related
    'recruiter': 'recruiter-copilot',
    'hiring': 'recruiter-copilot',
    'interview': 'recruiter-copilot'
  },
  
  // Store integration rules
  storeIntegrationRules: [
    {
      pattern: '(auth|login|user|session|token)',
      storeName: 'authStore',
      actions: ['setUser', 'setToken', 'logout', 'updateProfile'],
      condition: 'function modifies user state'
    },
    {
      pattern: '(subscription|payment|billing|plan|addon)',
      storeName: 'subscriptionStore', 
      actions: ['updatePlan', 'setStatus', 'addAddon', 'updatePayment'],
      condition: 'function modifies subscription state'
    },
    {
      pattern: '(search|filter|query)',
      storeName: 'searchStore',
      actions: ['setQuery', 'setResults', 'addFilter', 'clearSearch'],
      condition: 'function modifies search state'
    },
    {
      pattern: '(portfolio|profile|resume)',
      storeName: 'portfolioStore',
      actions: ['updatePortfolio', 'addSkill', 'updateExperience'],
      condition: 'function modifies portfolio state'
    },
    {
      pattern: '(assessment|test|quiz|evaluation)',
      storeName: 'assessmentStore',
      actions: ['startAssessment', 'submitAnswer', 'completeAssessment'],
      condition: 'function modifies assessment state'
    },
    {
      pattern: '(career|recommendation|counselling)',
      storeName: 'careerAssistantStore',
      actions: ['addRecommendation', 'updateCareerPath', 'setGoals'],
      condition: 'function modifies career assistant state'
    },
    {
      pattern: '(message|notification|chat)',
      storeName: 'messageStore',
      actions: ['addMessage', 'markAsRead', 'updateConversation'],
      condition: 'function modifies messaging state'
    }
  ]
}

/**
 * Create a migration config with custom overrides
 */
export function createMigrationConfig(overrides: Partial<MigrationConfig> = {}): MigrationConfig {
  return {
    ...defaultMigrationConfig,
    ...overrides,
    // Merge arrays instead of replacing them
    excludePatterns: [
      ...defaultMigrationConfig.excludePatterns,
      ...(overrides.excludePatterns || [])
    ],
    includePatterns: [
      ...defaultMigrationConfig.includePatterns,
      ...(overrides.includePatterns || [])
    ],
    featureMappings: {
      ...defaultMigrationConfig.featureMappings,
      ...(overrides.featureMappings || {})
    },
    storeIntegrationRules: [
      ...defaultMigrationConfig.storeIntegrationRules,
      ...(overrides.storeIntegrationRules || [])
    ]
  }
}