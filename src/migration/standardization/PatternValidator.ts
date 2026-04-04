import {
  APIFunction,
  PatternViolation,
  NamingConvention,
  SignatureStandard,
  ErrorHandlingPattern,
  ResponseTypeStandard,
  RequestPatternStandard
} from '@/features/student-profile/model';
import { StandardizationConfig } from './StandardizationConfig';
import { MigrationLogger } from '../logging/MigrationLogger';

export class PatternValidator {
  private logger: MigrationLogger;

  constructor(logger: MigrationLogger) {
    this.logger = logger;
  }

  validateNamingConventions(functions: APIFunction[]): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const conventions = StandardizationConfig.getNamingConventions();

    for (const func of functions) {
      const violation = this.checkNamingConvention(func, conventions);
      if (violation) {
        violations.push(violation);
      }
    }

    return violations;
  }

  validateSignatureStandards(functions: APIFunction[]): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const standards = StandardizationConfig.getSignatureStandards();

    for (const func of functions) {
      const violation = this.checkSignatureStandard(func, standards);
      if (violation) {
        violations.push(violation);
      }
    }

    return violations;
  }

  validateErrorHandlingPatterns(functions: APIFunction[]): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const patterns = StandardizationConfig.getErrorHandlingPatterns();

    for (const func of functions) {
      const violation = this.checkErrorHandlingPattern(func, patterns);
      if (violation) {
        violations.push(violation);
      }
    }

    return violations;
  }

  validateResponseTypes(functions: APIFunction[]): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const standard = StandardizationConfig.getResponseTypeStandards();

    for (const func of functions) {
      const violation = this.checkResponseType(func, standard);
      if (violation) {
        violations.push(violation);
      }
    }

    return violations;
  }

  validateRequestPatterns(functions: APIFunction[]): PatternViolation[] {
    const violations: PatternViolation[] = [];
    const standard = StandardizationConfig.getRequestPatternStandards();

    for (const func of functions) {
      const violation = this.checkRequestPattern(func, standard);
      if (violation) {
        violations.push(violation);
      }
    }

    return violations;
  }

  private checkNamingConvention(func: APIFunction, conventions: NamingConvention[]): PatternViolation | null {
    const functionType = this.getFunctionType(func.name);
    const expectedConvention = conventions.find(c => c.pattern.test(func.name));

    if (!expectedConvention) {
      // Check if function name follows any standard pattern
      const hasStandardPrefix = conventions.some(c => {
        const prefixPattern = new RegExp(`^(${c.pattern.source.split('|').join('|')})`);
        return prefixPattern.test(func.name);
      });

      if (!hasStandardPrefix) {
        return {
          functionName: func.name,
          filePath: func.filePath || '',
          currentPattern: func.name,
          expectedPattern: this.suggestNamingPattern(func.name, functionType),
          severity: 'warning'
        };
      }
    }

    return null;
  }

  private checkSignatureStandard(func: APIFunction, standards: Record<string, SignatureStandard>): PatternViolation | null {
    const functionType = this.getFunctionType(func.name);
    const standard = standards[functionType];

    if (!standard) {
      return null; // No standard defined for this function type
    }

    // Parse current signature
    const currentParams = this.parseSignatureParameters(func.signature);
    const expectedParams = standard.parameterOrder;

    // Check parameter order
    const parameterOrderCorrect = this.checkParameterOrder(currentParams, expectedParams);
    if (!parameterOrderCorrect) {
      return {
        functionName: func.name,
        filePath: func.filePath || '',
        currentPattern: func.signature,
        expectedPattern: this.generateExpectedSignature(func.name, standard),
        severity: 'error'
      };
    }

    // Check return type
    const returnTypeCorrect = this.checkReturnType(func.returnType, standard.returnType);
    if (!returnTypeCorrect) {
      return {
        functionName: func.name,
        filePath: func.filePath || '',
        currentPattern: func.returnType || 'unknown',
        expectedPattern: standard.returnType,
        severity: 'error'
      };
    }

    return null;
  }

  private checkErrorHandlingPattern(func: APIFunction, patterns: Record<string, ErrorHandlingPattern>): PatternViolation | null {
    const featurePattern = this.getFeatureErrorHandlingPattern(func.feature);
    const pattern = patterns[featurePattern] || patterns['standard'];

    // This would analyze the function implementation for error handling
    // For now, we'll assume non-standard error handling needs to be fixed
    const hasStandardErrorHandling = this.hasStandardErrorHandling(func, pattern);

    if (!hasStandardErrorHandling) {
      return {
        functionName: func.name,
        filePath: func.filePath || '',
        currentPattern: 'Non-standard error handling',
        expectedPattern: pattern.pattern,
        severity: 'warning'
      };
    }

    return null;
  }

  private checkResponseType(func: APIFunction, standard: ResponseTypeStandard): PatternViolation | null {
    if (!func.returnType) {
      return {
        functionName: func.name,
        filePath: func.filePath || '',
        currentPattern: 'No return type specified',
        expectedPattern: standard.successType,
        severity: 'error'
      };
    }

    // Check if return type follows standard pattern
    const followsStandard = func.returnType.includes('ApiResponse') || 
                           func.returnType.includes(standard.successType);

    if (!followsStandard) {
      return {
        functionName: func.name,
        filePath: func.filePath || '',
        currentPattern: func.returnType,
        expectedPattern: `Promise<${standard.successType}>`,
        severity: 'warning'
      };
    }

    return null;
  }

  private checkRequestPattern(func: APIFunction, standard: RequestPatternStandard): PatternViolation | null {
    // This would analyze the function implementation for request patterns
    // For now, we'll check basic patterns
    const hasParameterValidation = this.hasParameterValidation(func);
    const hasStandardHeaders = this.hasStandardHeaders(func, standard.headerStandards);

    if (!hasParameterValidation || !hasStandardHeaders) {
      return {
        functionName: func.name,
        filePath: func.filePath || '',
        currentPattern: 'Non-standard request pattern',
        expectedPattern: 'Standard parameter validation and headers',
        severity: 'info'
      };
    }

    return null;
  }

  private getFunctionType(functionName: string): string {
    if (/^(get|fetch|retrieve|find|load)/.test(functionName)) return 'get';
    if (/^(create|add|post|new|insert)/.test(functionName)) return 'create';
    if (/^(update|modify|put|patch|edit|change)/.test(functionName)) return 'update';
    if (/^(delete|remove|destroy|clear)/.test(functionName)) return 'delete';
    if (/^(list|getAll|fetchAll|search)/.test(functionName)) return 'list';
    return 'unknown';
  }

  private suggestNamingPattern(functionName: string, functionType: string): string {
    const suggestions = {
      'get': 'get[Resource]',
      'create': 'create[Resource]',
      'update': 'update[Resource]',
      'delete': 'delete[Resource]',
      'list': 'list[Resources]',
      'unknown': 'follow standard CRUD naming'
    };

    return suggestions[functionType] || suggestions['unknown'];
  }

  private parseSignatureParameters(signature: string): string[] {
    const match = signature.match(/\(([^)]*)\)/);
    if (!match) return [];

    const params = match[1].split(',').map(p => p.trim());
    return params.filter(p => p.length > 0).map(p => {
      // Extract parameter name (before colon if TypeScript)
      const colonIndex = p.indexOf(':');
      return colonIndex > 0 ? p.substring(0, colonIndex).trim() : p;
    });
  }

  private checkParameterOrder(currentParams: string[], expectedParams: string[]): boolean {
    // Simplified check - in practice would be more sophisticated
    if (currentParams.length === 0) return true;
    
    // Check if required parameters are present and in correct order
    const requiredParams = expectedParams.slice(0, 2); // Assume first 2 are required
    for (let i = 0; i < Math.min(requiredParams.length, currentParams.length); i++) {
      if (!currentParams[i].includes(requiredParams[i])) {
        return false;
      }
    }

    return true;
  }

  private checkReturnType(currentReturnType: string | undefined, expectedReturnType: string): boolean {
    if (!currentReturnType) return false;
    
    // Check if return type is compatible with expected type
    return currentReturnType.includes('Promise') && 
           (currentReturnType.includes('ApiResponse') || expectedReturnType.includes('ApiResponse'));
  }

  private generateExpectedSignature(functionName: string, standard: SignatureStandard): string {
    const params = standard.parameterOrder.map((param, index) => {
      const isOptional = !standard.requiredParameters.includes(param);
      const paramType = this.getParameterType(param);
      return `${param}${isOptional ? '?' : ''}: ${paramType}`;
    }).join(', ');

    return `${functionName}(${params}): ${standard.returnType}`;
  }

  private getParameterType(paramName: string): string {
    const typeMap: Record<string, string> = {
      'id': 'string',
      'data': 'any',
      'options': 'ApiRequestOptions',
      'config': 'RequestConfig',
      'filters': 'FilterOptions',
      'pagination': 'PaginationOptions'
    };

    return typeMap[paramName] || 'any';
  }

  private getFeatureErrorHandlingPattern(feature?: string): string {
    if (feature === 'authentication') return 'authentication';
    return 'standard';
  }

  private hasStandardErrorHandling(func: APIFunction, pattern: ErrorHandlingPattern): boolean {
    // This would analyze the actual function implementation
    // For now, return false to trigger standardization
    return false;
  }

  private hasParameterValidation(func: APIFunction): boolean {
    // This would check if the function validates its parameters
    // For now, return false to trigger standardization
    return false;
  }

  private hasStandardHeaders(func: APIFunction, standardHeaders: Record<string, string>): boolean {
    // This would check if the function uses standard headers
    // For now, return false to trigger standardization
    return false;
  }
}