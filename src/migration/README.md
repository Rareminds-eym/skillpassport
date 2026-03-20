# FSD Phase 5 Service API Migration System

A comprehensive migration system for moving API functions from the centralized `/services/` directory to feature-specific `/api/` directories following Feature-Sliced Design (FSD) methodology.

## Overview

This migration system provides automated tools for:

- **API Discovery**: Scanning and cataloging all API functions in `/services/`
- **Feature Mapping**: Classifying functions by feature and identifying shared utilities
- **Store Integration**: Connecting APIs with Zustand stores from Phase 4
- **File Migration**: Moving files to appropriate FSD locations
- **Import Updates**: Updating all import statements across the codebase
- **Validation**: Pre and post-migration validation with rollback capability
- **Logging & Backup**: Comprehensive logging and backup systems

## Architecture

### Core Components

- **APIAnalyzer**: Scans services directory and extracts API functions
- **MigrationEngine**: Handles file movement and import path updates
- **StoreIntegrator**: Connects APIs with Zustand stores
- **MigrationOrchestrator**: Coordinates the entire migration process
- **BackupManager**: Creates backups and handles rollback operations
- **ValidationManager**: Validates migration results
- **MigrationLogger**: Provides structured logging

### Migration Flow

1. **Analysis Phase**: Discover and catalog all API functions
2. **Classification Phase**: Map functions to features and identify dependencies
3. **Migration Phase**: Move files and update import paths
4. **Integration Phase**: Connect APIs with Zustand stores
5. **Validation Phase**: Verify migration success
6. **Cleanup Phase**: Remove empty service files

## Usage

### Programmatic API

```typescript
import { 
  createMigrationSystem,
  createMigrationConfig,
  APIAnalyzer,
  MigrationEngine,
  StoreIntegrator
} from './migration'

// Create migration system
const migrationSystem = createMigrationSystem(
  apiAnalyzer,
  migrationEngine,
  storeIntegrator,
  {
    dryRun: false,
    backupEnabled: true,
    validateAfterMigration: true,
    rollbackOnFailure: true
  }
)

// Execute migration
const result = await migrationSystem.executeMigration()

if (result.success) {
  console.log('Migration completed successfully!')
} else {
  console.log('Migration failed:', result.errors)
}
```

### CLI Usage

```bash
# Run migration
npx tsx src/migration/cli/migrationCli.ts migrate

# Dry run (no changes made)
npx tsx src/migration/cli/migrationCli.ts migrate --dry-run

# Rollback a migration
npx tsx src/migration/cli/migrationCli.ts rollback <migrationId>

# Check status
npx tsx src/migration/cli/migrationCli.ts status

# Validate without migrating
npx tsx src/migration/cli/migrationCli.ts validate
```

## Configuration

The migration system uses a comprehensive configuration system:

```typescript
interface MigrationConfig {
  dryRun: boolean
  backupEnabled: boolean
  validateAfterMigration: boolean
  rollbackOnFailure: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  excludePatterns: string[]
  includePatterns: string[]
  featureMappings: Record<string, string>
  storeIntegrationRules: StoreIntegrationRule[]
}
```

## Feature Mappings

The system automatically maps API functions to FSD features based on naming patterns:

- `auth*`, `login*`, `user*` → `authentication`
- `subscription*`, `payment*` → `subscription`
- `search*`, `filter*` → `search`
- `portfolio*`, `profile*` → `student-profile`
- `assessment*`, `test*` → `assessment`
- `course*`, `lesson*` → `courses`
- `message*`, `notification*` → `messaging`

## Store Integration

APIs are automatically integrated with appropriate Zustand stores:

- Authentication APIs → `authStore`
- Subscription APIs → `subscriptionStore`
- Search APIs → `searchStore`
- Portfolio APIs → `portfolioStore`
- Assessment APIs → `assessmentStore`

## Error Handling

The system provides comprehensive error handling with:

- **Automatic Rollback**: On validation failure
- **Detailed Error Messages**: With suggestions for resolution
- **Backup System**: Complete file backup before migration
- **Validation Checks**: Pre and post-migration validation

## Logging

Structured logging with multiple levels:

- **Debug**: Detailed operation information
- **Info**: General progress updates
- **Warn**: Non-critical issues
- **Error**: Critical failures

## Backup & Rollback

- **Automatic Backup**: All modified files backed up before migration
- **Checksum Validation**: File integrity verification
- **Complete Rollback**: Restore to exact pre-migration state
- **Change Tracking**: Detailed record of all modifications

## Requirements Addressed

This infrastructure addresses the following requirements from the design document:

- **8.1**: Create backup of all modified files before migration
- **8.2**: Maintain detailed change logs
- **13.1**: Generate migration report listing all moved files and functions

## Next Steps

With this infrastructure in place, the next tasks involve:

1. Implementing the actual API discovery and cataloging system
2. Building the classification and mapping algorithms
3. Creating the file migration engine
4. Developing store integration logic
5. Adding comprehensive validation

The infrastructure provides a solid foundation for the complete migration system with proper error handling, logging, backup, and validation capabilities.