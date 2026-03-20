import {
  NamingConvention,
  SignatureStandard,
  ErrorHandlingPattern,
  ResponseTypeStandard,
  RequestPatternStandard
} from '../types';

export class StandardizationConfig {
  static getNamingConventions(): NamingConvention[] {
    return [
      {
        pattern: /^(get|fetch|retrieve)([A-Z].*)$/,
        description: 'Data retrieval functions should use get/fetch/retrieve prefix',
        examples: ['getUser', 'fetchSubscription', 'retrievePortfolio'],
        replacement: (name: string) => {
          // Convert load* to get*
          if (name.startsWith('load') && !name.startsWith('loadMore')) {
            return name.replace(/^load/, 'get');
          }
          // Convert find* to get*
          if (name.startsWith('find')) {
            return name.replace(/^find/, 'get');
          }
          return name;
        }
      },
      {
        pattern: /^(create|add|post)([A-Z].*)$/,
        description: 'Data creation functions should use create/add/post prefix',
        examples: ['createUser', 'addSubscription', 'postPortfolio'],
        replacement: (name: string) => {
          if (name.startsWith('new')) {
            return name.replace(/^new/, 'create');
          }
          if (name.startsWith('insert')) {
            return name.replace(/^insert/, 'create');
          }
          return name;
        }
      },
      {
        pattern: /^(update|modify|put|patch)([A-Z].*)$/,
        description: 'Data update functions should use update/modify/put/patch prefix',
        examples: ['updateUser', 'modifySubscription', 'patchPortfolio'],
        replacement: (name: string) => {
          if (name.startsWith('edit')) {
            return name.replace(/^edit/, 'update');
          }
          if (name.startsWith('change')) {
            return name.replace(/^change/, 'update');
          }
          return name;
        }
      },
      {
        pattern: /^(delete|remove|destroy)([A-Z].*)$/,
        description: 'Data deletion functions should use delete/remove/destroy prefix',
        examples: ['deleteUser', 'removeSubscription', 'destroyPortfolio'],
        replacement: (name: string) => {
          if (name.startsWith('clear')) {
            return name.replace(/^clear/, 'delete');
          }
          return name;
        }
      }
    ];
  }

  static getSignatureStandards(): Record<string, SignatureStandard> {
    return {
      'get': {
        parameterOrder: ['id', 'options', 'config'],
        requiredParameters: ['id'],
        optionalParameters: ['options', 'config'],
        returnType: 'Promise<ApiResponse<T>>',
        asyncPattern: true
      },
      'create': {
        parameterOrder: ['data', 'options', 'config'],
        requiredParameters: ['data'],
        optionalParameters: ['options', 'config'],
        returnType: 'Promise<ApiResponse<T>>',
        asyncPattern: true
      },
      'update': {
        parameterOrder: ['id', 'data', 'options', 'config'],
        requiredParameters: ['id', 'data'],
        optionalParameters: ['options', 'config'],
        returnType: 'Promise<ApiResponse<T>>',
        asyncPattern: true
      },
      'delete': {
        parameterOrder: ['id', 'options', 'config'],
        requiredParameters: ['id'],
        optionalParameters: ['options', 'config'],
        returnType: 'Promise<ApiResponse<boolean>>',
        asyncPattern: true
      },
      'list': {
        parameterOrder: ['filters', 'pagination', 'options', 'config'],
        requiredParameters: [],
        optionalParameters: ['filters', 'pagination', 'options', 'config'],
        returnType: 'Promise<ApiResponse<T[]>>',
        asyncPattern: true
      }
    };
  }

  static getErrorHandlingPatterns(): Record<string, ErrorHandlingPattern> {
    return {
      'standard': {
        pattern: 'try-catch',
        implementation: `
async function {{functionName}}({{parameters}}): {{returnType}} {
  try {
    this.logger.debug('{{functionName}} called', { {{logParameters}} });
    
    {{functionBody}}
    
    this.logger.debug('{{functionName}} completed successfully');
    return response;
  } catch (error) {
    this.logger.error('{{functionName}} failed', { 
      error: error.message, 
      stack: error.stack,
      {{logParameters}}
    });
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      error.message || 'An unexpected error occurred',
      error.status || 500,
      error.code || 'INTERNAL_ERROR'
    );
  }
}`,
        errorTypes: ['ApiError', 'NetworkError', 'ValidationError'],
        standardResponse: 'ApiResponse<T>'
      },
      'authentication': {
        pattern: 'try-catch',
        implementation: `
async function {{functionName}}({{parameters}}): {{returnType}} {
  try {
    this.logger.debug('{{functionName}} called', { {{logParameters}} });
    
    {{functionBody}}
    
    this.logger.debug('{{functionName}} completed successfully');
    return response;
  } catch (error) {
    this.logger.error('{{functionName}} failed', { 
      error: error.message,
      {{logParameters}}
    });
    
    if (error.status === 401) {
      throw new AuthenticationError('Authentication failed', error);
    }
    
    if (error.status === 403) {
      throw new AuthorizationError('Access denied', error);
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      error.message || 'Authentication request failed',
      error.status || 500,
      error.code || 'AUTH_ERROR'
    );
  }
}`,
        errorTypes: ['AuthenticationError', 'AuthorizationError', 'ApiError'],
        standardResponse: 'ApiResponse<T>'
      }
    };
  }

  static getResponseTypeStandards(): ResponseTypeStandard {
    return {
      successType: 'ApiResponse<T>',
      errorType: 'ApiError',
      dataWrapper: 'data',
      statusField: 'status',
      messageField: 'message'
    };
  }

  static getRequestPatternStandards(): RequestPatternStandard {
    return {
      parameterValidation: `
// Parameter validation using Joi or similar
const schema = Joi.object({
  {{validationSchema}}
});

const { error, value } = schema.validate({{parameters}});
if (error) {
  throw new ValidationError(error.details[0].message);
}`,
      headerStandards: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      bodyFormat: 'json',
      authenticationPattern: `
// Standard authentication header
const headers = {
  ...defaultHeaders,
  'Authorization': \`Bearer \${token}\`
};`
    };
  }

  static getFeatureSpecificPatterns(): Record<string, Partial<StandardizationConfig>> {
    return {
      'authentication': {
        errorHandling: 'authentication',
        requiredHeaders: ['Authorization'],
        responseTypes: ['User', 'AuthToken', 'AuthResponse']
      },
      'subscription': {
        errorHandling: 'standard',
        requiredHeaders: ['Authorization'],
        responseTypes: ['Subscription', 'Plan', 'PaymentMethod']
      },
      'search': {
        errorHandling: 'standard',
        requiredHeaders: [],
        responseTypes: ['SearchResult', 'SearchResponse', 'SearchFilters']
      },
      'portfolio': {
        errorHandling: 'standard',
        requiredHeaders: ['Authorization'],
        responseTypes: ['Portfolio', 'PortfolioItem', 'PortfolioStats']
      }
    };
  }

  static getTypeScriptTypeStandards(): Record<string, string> {
    return {
      // Standard API response wrapper
      'ApiResponse': `
interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}`,
      
      // Standard error types
      'ApiError': `
class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code: string = 'API_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}`,
      
      'ValidationError': `
class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}`,
      
      'AuthenticationError': `
class AuthenticationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}`,
      
      'AuthorizationError': `
class AuthorizationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
    this.name = 'AuthorizationError';
  }
}`,
      
      // Standard request options
      'ApiRequestOptions': `
interface ApiRequestOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}`,
      
      // Standard pagination
      'PaginationOptions': `
interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}`,
      
      // Standard filters
      'FilterOptions': `
interface FilterOptions {
  [key: string]: any;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}`
    };
  }
}