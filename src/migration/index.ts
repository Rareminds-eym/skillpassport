/**
 * FSD Phase 5 Service API Migration System
 * 
 * Main entry point for the migration infrastructure providing all necessary
 * components for migrating API functions from /services/ to feature-specific
 * /api/ directories following FSD methodology.
 */

// Core types and interfaces
export * from './types/index.js'

// Analysis components
export * from './analysis/index.js'

// Migration engine components
export * from './engine/index.js'

// Store integration components
export * from './integration/index.js'

// Logging system
export { 
  MigrationLogger, 
  createMigrationLogger, 
  generateMigrationId 
} from './logging/MigrationLogger.js'

// Backup and rollback system
export { 
  BackupManager, 
  createBackupManager 
} from './backup/BackupManager.js'

// Validation system
export { 
  ValidationManager, 
  createValidationManager 
} from './validation/ValidationManager.js'

// Migration orchestrator
export { 
  MigrationOrchestrator, 
  createMigrationOrchestrator 
} from './core/MigrationOrchestrator.js'

// Configuration
export { 
  defaultMigrationConfig, 
  createMigrationConfig 
} from './config/defaultConfig.js'

// Entity migration system (Phase 6)
export * from './entity/index.js'

// Widget migration system (Phase 6)
export * from './widget/index.js'

// Duplicate code consolidation system (Phase 6)
export * from './duplicate/index.js'

// Utility functions for creating migration system instances
import { 
  MigrationConfig,
  APIAnalyzer,
  MigrationEngine,
  StoreIntegrator
} from './types/index.js'
import { MigrationOrchestrator } from './core/MigrationOrchestrator.js'
import { defaultMigrationConfig } from './config/defaultConfig.js'

/**
 * Create a complete migration system with all components
 */
export function createMigrationSystem(
  apiAnalyzer: APIAnalyzer,
  migrationEngine: MigrationEngine,
  storeIntegrator: StoreIntegrator,
  config: Partial<MigrationConfig> = {}
): MigrationOrchestrator {
  const finalConfig = { ...defaultMigrationConfig, ...config }
  
  return new MigrationOrchestrator(
    finalConfig,
    apiAnalyzer,
    migrationEngine,
    storeIntegrator
  )
}

/**
 * Migration system version
 */
export const VERSION = '1.0.0'

/**
 * Migration system metadata
 */
export const MIGRATION_METADATA = {
  name: 'FSD Phase 5 Service API Migration',
  version: VERSION,
  description: 'Automated migration system for moving API functions from centralized /services/ to feature-specific /api/ directories',
  author: 'FSD Migration Team',
  phase: 5,
  dependencies: ['Phase 4 Zustand Stores'],
  features: [
    'Automated API discovery and cataloging',
    'Feature-based classification and mapping', 
    'Zustand store integration',
    'Import path updates',
    'Comprehensive backup and rollback',
    'Pre and post-migration validation',
    'Detailed logging and reporting',
    'Dry-run capability',
    'Error handling and recovery'
  ]
}