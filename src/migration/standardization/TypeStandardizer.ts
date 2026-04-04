import {
  APIFunction,
  ResponseTypeStandard,
  RequestPatternStandard,
  StandardizationChange,
  StandardizationError
} from '@/features/student-profile/model';
import { StandardizationConfig } from './StandardizationConfig';
import { MigrationLogger } from '../logging/MigrationLogger';
import * as fs from 'fs/promises';
import * as path from 'path';

export class TypeStandardizer {
  private logger: MigrationLogger;

  constructor(logger: MigrationLogger) {
    this.logger = logger;
  }

  async standardizeResponseTypes(functions: APIFunction[]): Promise<{
    changes: StandardizationChange[];
    errors: StandardizationError[];
  }> {
    this.logger.info('Standardizing response types');
    
    const changes: StandardizationChange[] = [];
    const errors: StandardizationError[] = [];
    const responseStandard = StandardizationConfig.getResponseTypeStandards();

    for (const func of functions) {
      try {
        const standardizedType = this.getStandardizedResponseType(func, responseStandard);
        
        if (standardizedType !== func.returnType) {
          changes.push({
            functionName: func.name,
            changeType: 'response-type',
            oldValue: func.returnType || 'unknown',
            newValue: standardizedType,
            reason: 'Applied standard ApiResponse<T> wrapper',
            filePath: func.filePath || ''
          });
        }
      } catch (error) {
        errors.push({
          functionName: func.name,
          errorType: 'response_type_error',
          message: `Failed to standardize response type: ${error}`,
          filePath: func.filePath || '',
          suggestion: 'Manually review and update response type'
        });
      }
    }

    return { changes, errors };
  }

  async standardizeRequestPatterns(functions: APIFunction[]): Promise<{
    changes: StandardizationChange[];
    errors: StandardizationError[];
  }> {
    this.logger.info('Standardizing request patterns');
    
    const changes: StandardizationChange[] = [];
    const errors: StandardizationError[] = [];
    const requestStandard = StandardizationConfig.getRequestPatternStandards();

    for (const func of functions) {
      try {
        const needsStandardization = this.needsRequestPatternStandardization(func, requestStandard);
        
        if (needsStandardization) {
          changes.push({
            functionName: func.name,
            changeType: 'request-pattern',
            oldValue: 'Non-standard request pattern',
            newValue: 'Standard parameter validation and headers',
            reason: 'Applied consistent request validation and header patterns',
            filePath: func.filePath || ''
          });
        }
      } catch (error) {
        errors.push({
          functionName: func.name,
          errorType: 'request_pattern_error',
          message: `Failed to standardize request pattern: ${error}`,
          filePath: func.filePath || '',
          suggestion: 'Manually review and update request handling'
        });
      }
    }

    return { changes, errors };
  }

  async generateTypeDefinitions(): Promise<void> {
    this.logger.info('Generating standardized type definitions');
    
    const typesDir = 'src/shared/types';
    await fs.mkdir(typesDir, { recursive: true });

    // Generate API response types
    await this.generateApiResponseTypes(typesDir);
    
    // Generate error types
    await this.generateErrorTypes(typesDir);
    
    // Generate request types
    await this.generateRequestTypes(typesDir);
    
    // Generate utility types
    await this.generateUtilityTypes(typesDir);
    
    // Generate index file
    await this.generateTypesIndex(typesDir);
  }

  private getStandardizedResponseType(func: APIFunction, standard: ResponseTypeStandard): string {
    // If already using standard response type, return as-is
    if (func.returnType?.includes('ApiResponse')) {
      return func.returnType;
    }

    // Extract the data type from existing return type
    const dataType = this.extractDataType(func);
    
    // Apply standard wrapper
    return `Promise<ApiResponse<${dataType}>>`;
  }

  private extractDataType(func: APIFunction): string {
    if (!func.returnType) {
      return this.inferDataTypeFromFunction(func);
    }

    // Extract from Promise<T>
    const promiseMatch = func.returnType.match(/Promise<(.+)>/);
    if (promiseMatch) {
      return promiseMatch[1];
    }

    // If not a Promise, wrap it
    return func.returnType;
  }

  private inferDataTypeFromFunction(func: APIFunction): string {
    const functionType = this.getFunctionType(func.name);
    const feature = func.feature || 'unknown';

    // Infer based on function type and feature
    const typeMap: Record<string, Record<string, string>> = {
      'authentication': {
        'get': 'User',
        'create': 'AuthResponse',
        'update': 'User',
        'delete': 'boolean',
        'list': 'User[]'
      },
      'subscription': {
        'get': 'Subscription',
        'create': 'Subscription',
        'update': 'Subscription',
        'delete': 'boolean',
        'list': 'Subscription[]'
      },
      'search': {
        'get': 'SearchResult',
        'create': 'SearchResult',
        'update': 'SearchResult',
        'delete': 'boolean',
        'list': 'SearchResult[]'
      },
      'portfolio': {
        'get': 'Portfolio',
        'create': 'Portfolio',
        'update': 'Portfolio',
        'delete': 'boolean',
        'list': 'Portfolio[]'
      }
    };

    return typeMap[feature]?.[functionType] || 'any';
  }

  private getFunctionType(functionName: string): string {
    if (/^(get|fetch|retrieve|find|load)/.test(functionName)) return 'get';
    if (/^(create|add|post|new|insert)/.test(functionName)) return 'create';
    if (/^(update|modify|put|patch|edit|change)/.test(functionName)) return 'update';
    if (/^(delete|remove|destroy|clear)/.test(functionName)) return 'delete';
    if (/^(list|getAll|fetchAll|search)/.test(functionName)) return 'list';
    return 'get';
  }

  private needsRequestPatternStandardization(func: APIFunction, standard: RequestPatternStandard): boolean {
    // This would analyze the function implementation
    // For now, assume all functions need standardization
    return true;
  }

  private async generateApiResponseTypes(typesDir: string): Promise<void> {
    const content = `/**
 * Standard API Response Types
 * Generated automatically - do not modify manually
 */

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  meta?: ApiResponseMeta;
}

export interface ApiResponseMeta {
  timestamp: string;
  requestId: string;
  version: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiListResponse<T = any> extends ApiResponse<T[]> {
  meta: ApiResponseMeta & {
    pagination: PaginationMeta;
  };
}

// Success response helpers
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: Partial<ApiResponseMeta>
): ApiResponse<T> {
  return {
    data,
    status: 200,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      version: '1.0',
      ...meta
    }
  };
}

export function createListResponse<T>(
  data: T[],
  pagination: PaginationMeta,
  message?: string
): ApiListResponse<T> {
  return {
    data,
    status: 200,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      version: '1.0',
      pagination
    }
  };
}

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}
`;

    await fs.writeFile(path.join(typesDir, 'apiResponse.ts'), content);
  }

  private async generateErrorTypes(typesDir: string): Promise<void> {
    const content = `/**
 * Standard API Error Types
 * Generated automatically - do not modify manually
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code: string = 'API_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    
    // Ensure proper prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details
    };
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required', details?: any) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Access denied', details?: any) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, 'NOT_FOUND_ERROR', details);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded', details?: any) {
    super(message, 429, 'RATE_LIMIT_ERROR', details);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = 'Network error', details?: any) {
    super(message, 0, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

// Error factory functions
export function createApiError(
  status: number,
  message: string,
  code?: string,
  details?: any
): ApiError {
  switch (status) {
    case 400:
      return new ValidationError(message, details);
    case 401:
      return new AuthenticationError(message, details);
    case 403:
      return new AuthorizationError(message, details);
    case 404:
      return new NotFoundError(message, details);
    case 409:
      return new ConflictError(message, details);
    case 429:
      return new RateLimitError(message, details);
    default:
      return new ApiError(message, status, code, details);
  }
}

export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}
`;

    await fs.writeFile(path.join(typesDir, 'apiError.ts'), content);
  }

  private async generateRequestTypes(typesDir: string): Promise<void> {
    const content = `/**
 * Standard API Request Types
 * Generated automatically - do not modify manually
 */

export interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  validateResponse?: boolean;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: any;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  tags?: string[];
}

export interface RequestConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  validateStatus?: (status: number) => boolean;
}

// Standard parameter validation schemas
export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    custom?: (value: any) => boolean | string;
  };
}

// Request builder helpers
export function buildPaginatedRequest(
  baseOptions: ApiRequestOptions = {},
  pagination: PaginationOptions = {}
): ApiRequestOptions & { params: PaginationOptions } {
  return {
    ...baseOptions,
    params: {
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      ...pagination
    }
  };
}

export function buildFilteredRequest(
  baseOptions: ApiRequestOptions = {},
  filters: FilterOptions = {}
): ApiRequestOptions & { params: FilterOptions } {
  // Remove empty/undefined values
  const cleanFilters = Object.entries(filters)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

  return {
    ...baseOptions,
    params: cleanFilters
  };
}

export function validateRequestParameters(
  params: any,
  schema: ValidationSchema
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = params[key];

    // Check required
    if (rules.required && (value === undefined || value === null)) {
      errors.push(\`\${key} is required\`);
      continue;
    }

    // Skip validation if value is not provided and not required
    if (value === undefined || value === null) {
      continue;
    }

    // Type validation
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== rules.type) {
      errors.push(\`\${key} must be of type \${rules.type}\`);
      continue;
    }

    // String/Array length validation
    if ((rules.type === 'string' || rules.type === 'array') && typeof value.length === 'number') {
      if (rules.min !== undefined && value.length < rules.min) {
        errors.push(\`\${key} must have at least \${rules.min} characters/items\`);
      }
      if (rules.max !== undefined && value.length > rules.max) {
        errors.push(\`\${key} must have at most \${rules.max} characters/items\`);
      }
    }

    // Number range validation
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(\`\${key} must be at least \${rules.min}\`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(\`\${key} must be at most \${rules.max}\`);
      }
    }

    // Pattern validation
    if (rules.pattern && rules.type === 'string' && !rules.pattern.test(value)) {
      errors.push(\`\${key} format is invalid\`);
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(\`\${key} must be one of: \${rules.enum.join(', ')}\`);
    }

    // Custom validation
    if (rules.custom) {
      const customResult = rules.custom(value);
      if (customResult !== true) {
        errors.push(typeof customResult === 'string' ? customResult : \`\${key} is invalid\`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
`;

    await fs.writeFile(path.join(typesDir, 'apiRequest.ts'), content);
  }

  private async generateUtilityTypes(typesDir: string): Promise<void> {
    const content = `/**
 * API Utility Types and Helpers
 * Generated automatically - do not modify manually
 */

import { ApiResponse, ApiListResponse } from './apiResponse';
import { ApiError } from './apiError';
import { ApiRequestOptions } from './apiRequest';

// Function type definitions
export type ApiFunction<T = any> = (...args: any[]) => Promise<ApiResponse<T>>;
export type ApiListFunction<T = any> = (...args: any[]) => Promise<ApiListResponse<T>>;
export type ApiErrorHandler = (error: ApiError) => void;
export type ApiSuccessHandler<T> = (response: ApiResponse<T>) => void;

// Result type for operations that might fail
export type ApiResult<T, E = ApiError> = 
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

// Helper to create success result
export function createSuccessResult<T>(data: T): ApiResult<T> {
  return { success: true, data };
}

// Helper to create error result
export function createErrorResult<E extends ApiError>(error: E): ApiResult<never, E> {
  return { success: false, error };
}

// Async result wrapper
export async function wrapApiCall<T>(
  apiCall: () => Promise<ApiResponse<T>>
): Promise<ApiResult<T>> {
  try {
    const response = await apiCall();
    return createSuccessResult(response.data);
  } catch (error) {
    if (error instanceof ApiError) {
      return createErrorResult(error);
    }
    return createErrorResult(new ApiError(error.message || 'Unknown error'));
  }
}

// Type guards
export function isSuccessResult<T>(result: ApiResult<T>): result is { success: true; data: T } {
  return result.success;
}

export function isErrorResult<T>(result: ApiResult<T>): result is { success: false; error: ApiError } {
  return !result.success;
}

// Standard HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

// Standard headers
export const STANDARD_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  AUTHORIZATION: 'Authorization',
  X_REQUESTED_WITH: 'X-Requested-With',
  X_REQUEST_ID: 'X-Request-ID'
} as const;

export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain'
} as const;

// Default request options
export const DEFAULT_REQUEST_OPTIONS: ApiRequestOptions = {
  timeout: 30000,
  retries: 3,
  cache: false,
  headers: {
    [STANDARD_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON,
    [STANDARD_HEADERS.ACCEPT]: CONTENT_TYPES.JSON,
    [STANDARD_HEADERS.X_REQUESTED_WITH]: 'XMLHttpRequest'
  },
  validateResponse: true
};
`;

    await fs.writeFile(path.join(typesDir, 'apiUtils.ts'), content);
  }

  private async generateTypesIndex(typesDir: string): Promise<void> {
    const content = `/**
 * API Types Index
 * Generated automatically - do not modify manually
 */

// Response types
export * from './apiResponse';

// Error types
export * from './apiError';

// Request types
export * from './apiRequest';

// Utility types
export * from './apiUtils';

// Re-export commonly used types
export type {
  ApiResponse,
  ApiListResponse,
  ApiResponseMeta,
  PaginationMeta
} from './apiResponse';

export type {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  NetworkError
} from './apiError';

export type {
  ApiRequestOptions,
  PaginationOptions,
  FilterOptions,
  RequestConfig,
  ValidationSchema
} from './apiRequest';

export type {
  ApiFunction,
  ApiListFunction,
  ApiErrorHandler,
  ApiSuccessHandler,
  ApiResult
} from './apiUtils';
`;

    await fs.writeFile(path.join(typesDir, 'index.ts'), content);
  }
}