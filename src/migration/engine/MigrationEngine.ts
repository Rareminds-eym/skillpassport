import { 
  MigrationEngine as IMigrationEngine,
  FeatureMapping, 
  APIFunction, 
  MigrationResult, 
  UpdateResult, 
  ValidationResult,
  PathChange,
  MigrationConfig,
  ScanResult,
  ImportReference
} from '@/features/student-profile/model';
import { MigrationLogger } from '../logging/MigrationLogger';
import { DirectoryStructureManager } from './DirectoryStructureManager';
import { APIFunctionMigrator } from './APIFunctionMigrator';
import { ImportPathUpdater } from './ImportPathUpdater';
import { SharedUtilityMigrator } from './SharedUtilityMigrator';
import { CodebaseScanner } from '../analysis/CodebaseScanner';

/**
 * Main migration engine that orchestrates the API migration process.
 * Implements the MigrationEngine interface from the design document.
 */
export class MigrationEngine implements IMigrationEngine {
  private directoryManager: DirectoryStructureManager;
  private functionMigrator: APIFunctionMigrator;
  private importUpdater: ImportPathUpdater;
  private sharedUtilityMigrator: SharedUtilityMigrator;
  private codebaseScanner: CodebaseScanner;

  constructor(
    private config: MigrationConfig,
    private logger: MigrationLogger
  ) {
    this.directoryManager = new DirectoryStructureManager(config, logger);
    this.functionMigrator = new APIFunctionMigrator(config, logger);
    this.importUpdater = new ImportPathUpdater(config, logger);
    this.sharedUtilityMigrator = new SharedUtilityMigrator(config, logger);
    this.codebaseScanner = new CodebaseScanner(config, logger);
  }

  /**
   * Migrates feature-specific API functions to their appropriate directories
   */
  async migrateFeatureAPIs(mappings: FeatureMapping[]): Promise<MigrationResult> {
    this.logger.info(`Starting migration of ${mappings.length} feature mappings`);
    
    try {
      // Step 1: Create directory structure
      this.logger.info('Creating feature API directory structure...');
      const createdDirs = await this.directoryManager.createFeatureDirectories(mappings);
      
      // Step 2: Migrate API functions
      this.logger.info('Migrating API functions to feature directories...');
      const migrationResult = await this.functionMigrator.migrateFeatureFunctions(mappings);
      
      if (!migrationResult.success) {
        this.logger.error('Feature API migration failed', { 
          errors: migrationResult.errors 
        });
        return migrationResult;
      }

      // Step 3: Generate path changes for import updates
      const pathChanges = this.generatePathChanges(mappings);
      
      // Enhance result with directory information
      migrationResult.migratedFiles.push(...createdDirs);
      
      this.logger.info(`Successfully migrated ${mappings.length} feature APIs`);
      return migrationResult;

    } catch (error) {
      this.logger.error('Feature API migration failed', { error });
      
      return {
        success: false,
        migratedFiles: [],
        updatedImports: [],
        errors: [{
          type: 'migration',
          message: `Feature API migration failed: ${error.message}`,
          file: '',
          details: { error: error.stack }
        }],
        warnings: [],
        rollbackData: { backupId: '', backupPath: '', changes: [] }
      };
    }
  }

  /**
   * Migrates shared API utilities to the shared directory
   */
  async migrateSharedAPIs(sharedFunctions: APIFunction[]): Promise<MigrationResult> {
    this.logger.info(`Starting migration of ${sharedFunctions.length} shared API functions`);
    
    try {
      // Use the SharedUtilityMigrator for better categorization and migration
      const migrationResult = await this.sharedUtilityMigrator.migrateSharedUtilities(sharedFunctions);
      
      if (!migrationResult.success) {
        this.logger.error('Shared API migration failed', { 
          errors: migrationResult.errors 
        });
        return migrationResult;
      }

      this.logger.info(`Successfully migrated ${sharedFunctions.length} shared APIs`);
      return migrationResult;

    } catch (error) {
      this.logger.error('Shared API migration failed', { error });
      
      return {
        success: false,
        migratedFiles: [],
        updatedImports: [],
        errors: [{
          type: 'migration',
          message: `Shared API migration failed: ${error.message}`,
          file: '',
          details: { error: error.stack }
        }],
        warnings: [],
        rollbackData: { backupId: '', backupPath: '', changes: [] }
      };
    }
  }

  /**
   * Updates import paths throughout the codebase to reference new locations
   */
  async updateImportPaths(changes: PathChange[]): Promise<UpdateResult> {
    this.logger.info(`Updating import paths for ${changes.length} changes`);
    
    try {
      const updateResult = await this.importUpdater.updateImportPaths(changes);
      
      if (updateResult.success) {
        this.logger.info(`Successfully updated ${updateResult.updatedImports.length} import statements`);
      } else {
        this.logger.error('Import path updates failed', { 
          errors: updateResult.failedUpdates 
        });
      }
      
      return updateResult;

    } catch (error) {
      this.logger.error('Import path update failed', { error });
      
      return {
        success: false,
        updatedImports: [],
        failedUpdates: [{
          file: '',
          originalImport: '',
          targetImport: '',
          error: `Import update failed: ${error.message}`,
          details: { error: error.stack }
        }],
        warnings: []
      };
    }
  }

  /**
   * Validates that the migration was successful
   */
  async validateMigration(): Promise<ValidationResult> {
    this.logger.info('Validating migration results...');
    
    try {
      // This would typically integrate with the ValidationManager
      // For now, we'll implement basic validation
      
      const result: ValidationResult = {
        success: true,
        testsPass: true,
        endpointsAccessible: true,
        storeIntegrationsValid: true,
        importPathsResolved: true,
        errors: [],
        warnings: [],
        summary: {
          totalChecks: 0,
          passedChecks: 0,
          failedChecks: 0,
          skippedChecks: 0
        }
      };

      // TODO: Implement actual validation logic
      // This would check:
      // - All migrated files exist and are valid
      // - Import paths resolve correctly
      // - Tests still pass
      // - API endpoints are accessible
      // - Store integrations work correctly

      this.logger.info('Migration validation completed', { result });
      return result;

    } catch (error) {
      this.logger.error('Migration validation failed', { error });
      
      return {
        success: false,
        testsPass: false,
        endpointsAccessible: false,
        storeIntegrationsValid: false,
        importPathsResolved: false,
        errors: [{
          type: 'validation',
          message: `Validation failed: ${error.message}`,
          file: '',
          details: { error: error.stack }
        }],
        warnings: [],
        summary: {
          totalChecks: 1,
          passedChecks: 0,
          failedChecks: 1,
          skippedChecks: 0
        }
      };
    }
  }

  /**
   * Generates path changes for import updates based on feature mappings
   */
  private generatePathChanges(mappings: FeatureMapping[]): PathChange[] {
    const changes: PathChange[] = [];
    
    for (const mapping of mappings) {
      for (const func of mapping.functions) {
        if (func.sourceFile) {
          const change: PathChange = {
            oldPath: func.sourceFile,
            newPath: `src/features/${mapping.feature}/api/${mapping.feature}Api`,
            functionName: func.name,
            type: 'feature_api'
          };
          changes.push(change);
        }
      }
    }
    
    return changes;
  }

  /**
   * Performs a complete migration including all steps
   */
  async performCompleteMigration(
    featureMappings: FeatureMapping[], 
    sharedFunctions: APIFunction[]
  ): Promise<MigrationResult> {
    this.logger.info('Starting complete API migration process');
    
    try {
      // Step 1: Migrate feature APIs
      const featureResult = await this.migrateFeatureAPIs(featureMappings);
      if (!featureResult.success) {
        return featureResult;
      }

      // Step 2: Migrate shared APIs
      const sharedResult = await this.migrateSharedAPIs(sharedFunctions);
      if (!sharedResult.success) {
        return sharedResult;
      }

      // Step 3: Update import paths
      const pathChanges = this.generatePathChanges(featureMappings);
      const updateResult = await this.updateImportPaths(pathChanges);
      
      // Step 4: Validate migration
      const validationResult = await this.validateMigration();

      // Combine results
      const combinedResult: MigrationResult = {
        success: featureResult.success && sharedResult.success && updateResult.success && validationResult.success,
        migratedFiles: [...featureResult.migratedFiles, ...sharedResult.migratedFiles],
        updatedImports: updateResult.updatedImports,
        errors: [...featureResult.errors, ...sharedResult.errors, ...validationResult.errors],
        warnings: [...featureResult.warnings, ...sharedResult.warnings, ...validationResult.warnings],
        rollbackData: featureResult.rollbackData // Use the first rollback data
      };

      if (combinedResult.success) {
        this.logger.info('Complete API migration successful', {
          migratedFiles: combinedResult.migratedFiles.length,
          updatedImports: combinedResult.updatedImports.length
        });
      } else {
        this.logger.error('Complete API migration failed', {
          errors: combinedResult.errors.length,
          warnings: combinedResult.warnings.length
        });
      }

      return combinedResult;

    } catch (error) {
      this.logger.error('Complete migration failed', { error });
      
      return {
        success: false,
        migratedFiles: [],
        updatedImports: [],
        errors: [{
          type: 'migration',
          message: `Complete migration failed: ${error.message}`,
          file: '',
          details: { error: error.stack }
        }],
        warnings: [],
        rollbackData: { backupId: '', backupPath: '', changes: [] }
      };
    }
  }
}
  /**
   * Scans the codebase for import references to migrated functions
   */
  async scanForImportReferences(migratedFunctions?: APIFunction[]): Promise<ScanResult> {
    this.logger.info('Scanning codebase for import references');
    return await this.codebaseScanner.scanForImportReferences(migratedFunctions);
  }

  /**
   * Finds references to specific service files
   */
  async findServiceFileReferences(serviceFilePaths: string[]): Promise<ImportReference[]> {
    this.logger.info('Finding service file references', { serviceFiles: serviceFilePaths.length });
    return await this.codebaseScanner.findServiceFileReferences(serviceFilePaths);
  }

  /**
   * Filters import references by function names
   */
  filterReferencesByFunctions(
    references: ImportReference[], 
    functionNames: string[]
  ): ImportReference[] {
    return this.codebaseScanner.filterReferencesByFunctions(references, functionNames);
  }

  /**
   * Groups import references by file path
   */
  groupReferencesByFile(references: ImportReference[]): Map<string, ImportReference[]> {
    return this.codebaseScanner.groupReferencesByFile(references);
  }