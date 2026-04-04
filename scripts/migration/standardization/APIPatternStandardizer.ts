import {
  APIFunction,
  APIPatternStandardizer,
  StandardizationResult,
  StandardizationChange,
  StandardizationError,
  StandardizationReport,
  StandardizationPattern,
  PatternViolation,
  NamingConvention,
  SignatureStandard,
  ErrorHandlingPattern,
  ResponseTypeStandard,
  RequestPatternStandard
} from '../types';
import { MigrationLogger } from '../logging/MigrationLogger';
import { TypeStandardizer } from './TypeStandardizer';

export class APIPatternStandardizerImpl implements APIPatternStandardizer {
  private logger: MigrationLogger;
  public typeStandardizer: TypeStandardizer;
  private changes: StandardizationChange[] = [];
  private errors: StandardizationError[] = [];
  private patterns: StandardizationPattern[] = [];

  constructor(logger: MigrationLogger) {
    this.logger = logger;
    this.typeStandardizer = new TypeStandardizer(logger);
  }

  async standardizeNaming(functions: APIFunction[]): Promise<StandardizationResult> {
    this.logger.info('Starting API function naming standardization');
    
    const namingConventions = this.getNamingConventions();
    const standardizedFunctions: APIFunction[] = [];
    const changes: StandardizationChange[] = [];
    const errors: StandardizationError[] = [];

    for (const func of functions) {
      try {
        const standardizedName = this.standardizeFunctionName(func.name, func.feature);
        
        if (standardizedName !== func.name) {
          changes.push({
            functionName: func.name,
            changeType: 'naming',
            oldValue: func.name,
            newValue: standardizedName,
            reason: 'Applied consistent naming convention',
            filePath: func.filePath || ''
          });

          standardizedFunctions.push({
            ...func,
            name: standardizedName
          });
        } else {
          standardizedFunctions.push(func);
        }
      } catch (error) {
        errors.push({
          functionName: func.name,
          errorType: 'naming_standardization_error',
          message: `Failed to standardize function name: ${error}`,
          filePath: func.filePath || '',
          suggestion: 'Review function name manually'
        });
        standardizedFunctions.push(func);
      }
    }

    this.changes.push(...changes);
    this.errors.push(...errors);

    this.logger.info(`Naming standardization complete: ${changes.length} changes, ${errors.length} errors`);

    return {
      success: errors.length === 0,
      standardizedFunctions,
      changes,
      errors,
      warnings: []
    };
  }

  async standardizeSignatures(functions: APIFunction[]): Promise<StandardizationResult> {
    this.logger.info('Starting API function signature standardization');
    
    const standardizedFunctions: APIFunction[] = [];
    const changes: StandardizationChange[] = [];
    const errors: StandardizationError[] = [];

    for (const func of functions) {
      try {
        const standardizedSignature = this.standardizeFunctionSignature(func);
        
        if (standardizedSignature !== func.signature) {
          changes.push({
            functionName: func.name,
            changeType: 'signature',
            oldValue: func.signature,
            newValue: standardizedSignature,
            reason: 'Applied consistent signature pattern',
            filePath: func.filePath || ''
          });

          standardizedFunctions.push({
            ...func,
            signature: standardizedSignature
          });
        } else {
          standardizedFunctions.push(func);
        }
      } catch (error) {
        errors.push({
          functionName: func.name,
          errorType: 'signature_standardization_error',
          message: `Failed to standardize function signature: ${error}`,
          filePath: func.filePath || '',
          suggestion: 'Review function signature manually'
        });
        standardizedFunctions.push(func);
      }
    }

    this.changes.push(...changes);
    this.errors.push(...errors);

    this.logger.info(`Signature standardization complete: ${changes.length} changes, ${errors.length} errors`);

    return {
      success: errors.length === 0,
      standardizedFunctions,
      changes,
      errors,
      warnings: []
    };
  }

  async standardizeErrorHandling(functions: APIFunction[]): Promise<StandardizationResult> {
    this.logger.info('Starting error handling pattern standardization');
    
    const standardizedFunctions: APIFunction[] = [];
    const changes: StandardizationChange[] = [];
    const errors: StandardizationError[] = [];

    const errorHandlingPattern = this.getStandardErrorHandlingPattern();

    for (const func of functions) {
      try {
        const hasStandardErrorHandling = this.validateErrorHandlingPattern(func, errorHandlingPattern);
        
        if (!hasStandardErrorHandling) {
          const standardizedImplementation = this.generateStandardErrorHandling(func, errorHandlingPattern);
          
          changes.push({
            functionName: func.name,
            changeType: 'error-handling',
            oldValue: 'Non-standard error handling',
            newValue: 'Standard try-catch with consistent error response',
            reason: 'Applied consistent error handling pattern',
            filePath: func.filePath || ''
          });

          standardizedFunctions.push({
            ...func,
            implementation: standardizedImplementation
          });
        } else {
          standardizedFunctions.push(func);
        }
      } catch (error) {
        errors.push({
          functionName: func.name,
          errorType: 'error_handling_standardization_error',
          message: `Failed to standardize error handling: ${error}`,
          filePath: func.filePath || '',
          suggestion: 'Review error handling pattern manually'
        });
        standardizedFunctions.push(func);
      }
    }

    this.changes.push(...changes);
    this.errors.push(...errors);

    this.logger.info(`Error handling standardization complete: ${changes.length} changes, ${errors.length} errors`);

    return {
      success: errors.length === 0,
      standardizedFunctions,
      changes,
      errors,
      warnings: []
    };
  }

  async standardizeResponseTypes(functions: APIFunction[]): Promise<StandardizationResult> {
    this.logger.info('Starting response type standardization');
    
    const result = await this.typeStandardizer.standardizeResponseTypes(functions);
    const standardizedFunctions: APIFunction[] = [];

    for (const func of functions) {
      const change = result.changes.find(c => c.functionName === func.name);
      if (change) {
        standardizedFunctions.push({
          ...func,
          returnType: change.newValue
        });
      } else {
        standardizedFunctions.push(func);
      }
    }

    this.changes.push(...result.changes);
    this.errors.push(...result.errors);

    this.logger.info(`Response type standardization complete: ${result.changes.length} changes, ${result.errors.length} errors`);

    return {
      success: result.errors.length === 0,
      standardizedFunctions,
      changes: result.changes,
      errors: result.errors,
      warnings: []
    };
  }

  async standardizeRequestPatterns(functions: APIFunction[]): Promise<StandardizationResult> {
    this.logger.info('Starting request pattern standardization');
    
    const result = await this.typeStandardizer.standardizeRequestPatterns(functions);
    const standardizedFunctions: APIFunction[] = [...functions]; // Request patterns don't change function signatures

    this.changes.push(...result.changes);
    this.errors.push(...result.errors);

    this.logger.info(`Request pattern standardization complete: ${result.changes.length} changes, ${result.errors.length} errors`);

    return {
      success: result.errors.length === 0,
      standardizedFunctions,
      changes: result.changes,
      errors: result.errors,
      warnings: []
    };
  }

  generateStandardizationReport(): StandardizationReport {
    const totalFunctions = new Set(this.changes.map(c => c.functionName)).size;
    const standardizedFunctions = this.changes.length;

    const recommendations = this.generateRecommendations();

    return {
      totalFunctions,
      standardizedFunctions,
      changes: this.changes,
      errors: this.errors,
      patterns: this.patterns,
      recommendations
    };
  }

  private getNamingConventions(): NamingConvention[] {
    return [
      {
        pattern: /^(get|fetch|retrieve)(.+)$/,
        description: 'Data retrieval functions should start with get, fetch, or retrieve',
        examples: ['getUser', 'fetchSubscription', 'retrievePortfolio'],
        replacement: (name: string) => {
          if (name.startsWith('load')) {
            return name.replace('load', 'get');
          }
          return name;
        }
      },
      {
        pattern: /^(create|add|post)(.+)$/,
        description: 'Data creation functions should start with create, add, or post',
        examples: ['createUser', 'addSubscription', 'postPortfolio'],
      },
      {
        pattern: /^(update|modify|put|patch)(.+)$/,
        description: 'Data update functions should start with update, modify, put, or patch',
        examples: ['updateUser', 'modifySubscription', 'patchPortfolio'],
      },
      {
        pattern: /^(delete|remove|destroy)(.+)$/,
        description: 'Data deletion functions should start with delete, remove, or destroy',
        examples: ['deleteUser', 'removeSubscription', 'destroyPortfolio'],
      }
    ];
  }

  private standardizeFunctionName(name: string, feature?: string): string {
    // Remove common prefixes that don't follow conventions
    let standardizedName = name;
    
    // Handle common anti-patterns
    if (name.startsWith('load') && !name.startsWith('loadMore')) {
      standardizedName = name.replace('load', 'get');
    }
    
    if (name.includes('API') || name.includes('Api')) {
      standardizedName = standardizedName.replace(/API|Api/g, '');
    }
    
    // Ensure camelCase
    standardizedName = this.toCamelCase(standardizedName);
    
    return standardizedName;
  }

  private standardizeFunctionSignature(func: APIFunction): string {
    // Extract parameters and return type from signature
    const signatureMatch = func.signature.match(/\(([^)]*)\):\s*(.+)/);
    if (!signatureMatch) return func.signature;
    
    const [, params, returnType] = signatureMatch;
    
    // Standardize parameter order: (data, options, config)
    const standardizedParams = this.standardizeParameterOrder(params);
    const standardizedReturnType = this.standardizeReturnTypeSignature(returnType);
    
    return `(${standardizedParams}): ${standardizedReturnType}`;
  }

  private standardizeParameterOrder(params: string): string {
    // This is a simplified implementation
    // In practice, this would parse TypeScript parameters and reorder them
    return params;
  }

  private standardizeReturnTypeSignature(returnType: string): string {
    // Ensure all API functions return Promise<ApiResponse<T>>
    if (!returnType.startsWith('Promise<')) {
      return `Promise<ApiResponse<${returnType}>>`;
    }
    
    if (!returnType.includes('ApiResponse')) {
      const innerType = returnType.match(/Promise<(.+)>/)?.[1] || 'unknown';
      return `Promise<ApiResponse<${innerType}>>`;
    }
    
    return returnType;
  }

  private getStandardErrorHandlingPattern(): ErrorHandlingPattern {
    return {
      pattern: 'try-catch',
      implementation: `
        try {
          // API call implementation
        } catch (error) {
          this.logger.error('API call failed', { error, functionName: '{{functionName}}' });
          throw new ApiError(error.message, error.status || 500);
        }
      `,
      errorTypes: ['ApiError', 'NetworkError', 'ValidationError'],
      standardResponse: 'ApiResponse<T>'
    };
  }

  private validateErrorHandlingPattern(func: APIFunction, pattern: ErrorHandlingPattern): boolean {
    // This would analyze the function implementation to check for standard error handling
    // For now, return false to trigger standardization
    return false;
  }

  private generateStandardErrorHandling(func: APIFunction, pattern: ErrorHandlingPattern): string {
    return pattern.implementation.replace('{{functionName}}', func.name);
  }

  private getStandardResponseType(): ResponseTypeStandard {
    return {
      successType: 'ApiResponse<T>',
      errorType: 'ApiError',
      dataWrapper: 'data',
      statusField: 'status',
      messageField: 'message'
    };
  }

  private standardizeReturnType(returnType: string | undefined, standard: ResponseTypeStandard): string {
    if (!returnType) return `Promise<${standard.successType}>`;
    
    // If already standardized, return as-is
    if (returnType.includes('ApiResponse')) return returnType;
    
    // Extract the data type from Promise<T>
    const dataTypeMatch = returnType.match(/Promise<(.+)>/);
    const dataType = dataTypeMatch ? dataTypeMatch[1] : returnType;
    
    return `Promise<ApiResponse<${dataType}>>`;
  }

  private getStandardRequestPattern(): RequestPatternStandard {
    return {
      parameterValidation: 'joi',
      headerStandards: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      bodyFormat: 'json',
      authenticationPattern: 'Bearer token'
    };
  }

  private validateRequestPattern(func: APIFunction, standard: RequestPatternStandard): boolean {
    // This would analyze the function implementation to check for standard request patterns
    // For now, return false to trigger standardization
    return false;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.errors.length > 0) {
      recommendations.push('Review functions with standardization errors manually');
    }
    
    if (this.changes.some(c => c.changeType === 'naming')) {
      recommendations.push('Consider updating function names in documentation and tests');
    }
    
    if (this.changes.some(c => c.changeType === 'signature')) {
      recommendations.push('Update function calls to match new signatures');
    }
    
    recommendations.push('Run tests after applying standardization changes');
    recommendations.push('Update API documentation to reflect standardized patterns');
    
    return recommendations;
  }

  private toCamelCase(str: string): string {
    return str.replace(/[-_](.)/g, (_, char) => char.toUpperCase());
  }
}