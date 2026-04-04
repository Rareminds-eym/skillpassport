import {
  APIFunction,
  StandardizationResult,
  StandardizationReport,
  StandardizationChange,
  StandardizationError
} from '@/features/student-profile/model';
import { APIPatternStandardizerImpl } from './APIPatternStandardizer';
import { PatternValidator } from './PatternValidator';
import { CodeTransformer } from './CodeTransformer';
import { MigrationLogger } from '../logging/MigrationLogger';

export class StandardizationOrchestrator {
  private standardizer: APIPatternStandardizerImpl;
  private validator: PatternValidator;
  private transformer: CodeTransformer;
  private logger: MigrationLogger;

  constructor(logger: MigrationLogger) {
    this.logger = logger;
    this.standardizer = new APIPatternStandardizerImpl(logger);
    this.validator = new PatternValidator(logger);
    this.transformer = new CodeTransformer(logger);
  }

  async standardizeAllPatterns(functions: APIFunction[]): Promise<StandardizationResult> {
    this.logger.info('Starting comprehensive API pattern standardization');

    try {
      // Step 1: Validate current patterns and identify violations
      await this.validateCurrentPatterns(functions);

      // Step 2: Apply naming standardization
      const namingResult = await this.standardizer.standardizeNaming(functions);
      if (!namingResult.success) {
        this.logger.warn('Naming standardization had errors', { errors: namingResult.errors });
      }

      // Step 3: Apply signature standardization
      const signatureResult = await this.standardizer.standardizeSignatures(namingResult.standardizedFunctions);
      if (!signatureResult.success) {
        this.logger.warn('Signature standardization had errors', { errors: signatureResult.errors });
      }

      // Step 4: Apply error handling standardization
      const errorHandlingResult = await this.standardizer.standardizeErrorHandling(signatureResult.standardizedFunctions);
      if (!errorHandlingResult.success) {
        this.logger.warn('Error handling standardization had errors', { errors: errorHandlingResult.errors });
      }

      // Step 5: Apply response type standardization
      const responseTypeResult = await this.standardizer.standardizeResponseTypes(errorHandlingResult.standardizedFunctions);
      if (!responseTypeResult.success) {
        this.logger.warn('Response type standardization had errors', { errors: responseTypeResult.errors });
      }

      // Step 6: Apply request pattern standardization
      const requestPatternResult = await this.standardizer.standardizeRequestPatterns(responseTypeResult.standardizedFunctions);
      if (!requestPatternResult.success) {
        this.logger.warn('Request pattern standardization had errors', { errors: requestPatternResult.errors });
      }

      // Step 7: Apply all transformations to code
      await this.applyTransformations(functions, [
        ...namingResult.changes,
        ...signatureResult.changes,
        ...errorHandlingResult.changes,
        ...responseTypeResult.changes,
        ...requestPatternResult.changes
      ]);

      // Step 8: Generate standardized types
      await this.transformer.generateStandardizedTypes();
      await this.standardizer.typeStandardizer.generateTypeDefinitions();

      // Combine all results
      const combinedResult = this.combineResults([
        namingResult,
        signatureResult,
        errorHandlingResult,
        responseTypeResult,
        requestPatternResult
      ]);

      this.logger.info('API pattern standardization completed', {
        totalChanges: combinedResult.changes.length,
        totalErrors: combinedResult.errors.length
      });

      return combinedResult;

    } catch (error) {
      this.logger.error('Standardization orchestration failed', { error });
      throw error;
    }
  }

  async standardizeNamingOnly(functions: APIFunction[]): Promise<StandardizationResult> {
    this.logger.info('Starting naming-only standardization');

    const result = await this.standardizer.standardizeNaming(functions);
    
    if (result.success && result.changes.length > 0) {
      await this.transformer.applyNamingStandardization(functions, result.changes);
    }

    return result;
  }

  async standardizeSignaturesOnly(functions: APIFunction[]): Promise<StandardizationResult> {
    this.logger.info('Starting signature-only standardization');

    const result = await this.standardizer.standardizeSignatures(functions);
    
    if (result.success && result.changes.length > 0) {
      await this.transformer.applySignatureStandardization(functions, result.changes);
    }

    return result;
  }

  async generateStandardizationReport(functions: APIFunction[]): Promise<StandardizationReport> {
    this.logger.info('Generating standardization report');

    // Validate all patterns to identify violations
    const namingViolations = this.validator.validateNamingConventions(functions);
    const signatureViolations = this.validator.validateSignatureStandards(functions);
    const errorHandlingViolations = this.validator.validateErrorHandlingPatterns(functions);
    const responseTypeViolations = this.validator.validateResponseTypes(functions);
    const requestPatternViolations = this.validator.validateRequestPatterns(functions);

    // Run standardization to get potential changes
    const standardizationResult = await this.standardizer.standardizeNaming(functions);
    
    const report = this.standardizer.generateStandardizationReport();
    
    // Add violation information to the report
    report.patterns = [
      {
        patternType: 'naming',
        pattern: 'Standard CRUD naming conventions',
        description: 'Functions should follow get/create/update/delete naming patterns',
        examples: ['getUser', 'createSubscription', 'updatePortfolio', 'deleteItem'],
        violations: namingViolations
      },
      {
        patternType: 'signature',
        pattern: 'Consistent parameter ordering',
        description: 'Parameters should follow (id, data, options, config) pattern',
        examples: ['getUser(id, options)', 'createUser(data, options)', 'updateUser(id, data, options)'],
        violations: signatureViolations
      },
      {
        patternType: 'error-handling',
        pattern: 'Standard try-catch with logging',
        description: 'All API functions should use consistent error handling',
        examples: ['try-catch with ApiError throwing', 'Consistent error logging'],
        violations: errorHandlingViolations
      },
      {
        patternType: 'response-type',
        pattern: 'ApiResponse<T> wrapper',
        description: 'All API functions should return Promise<ApiResponse<T>>',
        examples: ['Promise<ApiResponse<User>>', 'Promise<ApiResponse<Subscription[]>>'],
        violations: responseTypeViolations
      },
      {
        patternType: 'request-pattern',
        pattern: 'Parameter validation and standard headers',
        description: 'Requests should validate parameters and use standard headers',
        examples: ['Joi validation', 'Standard Content-Type headers'],
        violations: requestPatternViolations
      }
    ];

    this.logger.info('Standardization report generated', {
      totalViolations: report.patterns.reduce((sum, p) => sum + p.violations.length, 0)
    });

    return report;
  }

  private async validateCurrentPatterns(functions: APIFunction[]): Promise<void> {
    this.logger.info('Validating current API patterns');

    const violations = [
      ...this.validator.validateNamingConventions(functions),
      ...this.validator.validateSignatureStandards(functions),
      ...this.validator.validateErrorHandlingPatterns(functions),
      ...this.validator.validateResponseTypes(functions),
      ...this.validator.validateRequestPatterns(functions)
    ];

    this.logger.info(`Found ${violations.length} pattern violations`, {
      errors: violations.filter(v => v.severity === 'error').length,
      warnings: violations.filter(v => v.severity === 'warning').length,
      info: violations.filter(v => v.severity === 'info').length
    });
  }

  private async applyTransformations(functions: APIFunction[], changes: StandardizationChange[]): Promise<void> {
    this.logger.info(`Applying ${changes.length} standardization transformations`);

    // Group changes by type for efficient processing
    const changesByType = this.groupChangesByType(changes);

    // Apply transformations in order
    if (changesByType.naming.length > 0) {
      await this.transformer.applyNamingStandardization(functions, changesByType.naming);
    }

    if (changesByType.signature.length > 0) {
      await this.transformer.applySignatureStandardization(functions, changesByType.signature);
    }

    if (changesByType.errorHandling.length > 0) {
      await this.transformer.applyErrorHandlingStandardization(functions, changesByType.errorHandling);
    }

    if (changesByType.responseType.length > 0) {
      await this.transformer.applyResponseTypeStandardization(functions, changesByType.responseType);
    }

    if (changesByType.requestPattern.length > 0) {
      await this.transformer.applyRequestPatternStandardization(functions, changesByType.requestPattern);
    }

    // Ensure all files have the necessary imports
    const uniqueFiles = [...new Set(changes.map(c => c.filePath))];
    for (const filePath of uniqueFiles) {
      await this.transformer.ensureImportsAreUpdated(filePath, [
        'ApiResponse',
        'ApiError',
        'ValidationError',
        'ApiRequestOptions'
      ]);
    }

    this.logger.info('All transformations applied successfully');
  }

  private groupChangesByType(changes: StandardizationChange[]): Record<string, StandardizationChange[]> {
    return {
      naming: changes.filter(c => c.changeType === 'naming'),
      signature: changes.filter(c => c.changeType === 'signature'),
      errorHandling: changes.filter(c => c.changeType === 'error-handling'),
      responseType: changes.filter(c => c.changeType === 'response-type'),
      requestPattern: changes.filter(c => c.changeType === 'request-pattern')
    };
  }

  private combineResults(results: StandardizationResult[]): StandardizationResult {
    const allChanges: StandardizationChange[] = [];
    const allErrors: StandardizationError[] = [];
    const allWarnings: string[] = [];
    let finalFunctions: APIFunction[] = [];

    for (const result of results) {
      allChanges.push(...result.changes);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
      finalFunctions = result.standardizedFunctions; // Use the last result's functions
    }

    return {
      success: allErrors.length === 0,
      standardizedFunctions: finalFunctions,
      changes: allChanges,
      errors: allErrors,
      warnings: allWarnings
    };
  }
}