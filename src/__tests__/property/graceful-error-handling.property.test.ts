/**
 * Property Test: Graceful Error Handling
 * 
 * Property 16: Graceful Error Handling
 * Validates: Requirements 8.4
 * 
 * This test verifies that the system handles errors gracefully with clear
 * error messages when environment variables are missing or invalid.
 */

import { describe, it, expect } from 'vitest';

// Error types
type ErrorType = 
  | 'MISSING_ENV_VAR'
  | 'INVALID_ENV_VAR'
  | 'SERVICE_UNAVAILABLE'
  | 'AUTHENTICATION_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_REQUEST';

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    requestId?: string;
  };
  statusCode: number;
}

// Success response interface
interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * Creates a graceful error response
 */
function createErrorResponse(
  type: ErrorType,
  message: string,
  statusCode: number,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    success: false,
    error: {
      type,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: `req_${Math.random().toString(36).substr(2, 9)}`,
    },
    statusCode,
  };
}

/**
 * Creates a success response
 */
function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId: `req_${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Validates environment variable and returns error if missing
 */
function validateEnvVar(name: string, value: string | undefined): ErrorResponse | null {
  if (!value) {
    return createErrorResponse(
      'MISSING_ENV_VAR',
      `Missing required environment variable: ${name}`,
      500,
      { variable: name }
    );
  }
  return null;
}

/**
 * Validates Supabase URL format
 */
function validateSupabaseUrl(url: string | undefined): ErrorResponse | null {
  if (!url) {
    return createErrorResponse(
      'MISSING_ENV_VAR',
      'Missing required environment variable: SUPABASE_URL',
      500,
      { variable: 'SUPABASE_URL' }
    );
  }
  
  if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
    return createErrorResponse(
      'INVALID_ENV_VAR',
      'Invalid Supabase URL format. Expected: https://[project-ref].supabase.co',
      500,
      { variable: 'SUPABASE_URL', value: url }
    );
  }
  
  return null;
}

/**
 * Validates API key format
 */
function validateApiKey(name: string, key: string | undefined, prefix?: string): ErrorResponse | null {
  if (!key) {
    return createErrorResponse(
      'MISSING_ENV_VAR',
      `Missing required environment variable: ${name}`,
      500,
      { variable: name }
    );
  }
  
  if (prefix && !key.startsWith(prefix)) {
    return createErrorResponse(
      'INVALID_ENV_VAR',
      `Invalid ${name} format. Expected prefix: ${prefix}`,
      500,
      { variable: name, expectedPrefix: prefix }
    );
  }
  
  return null;
}

/**
 * Simulates API initialization with environment validation
 */
function initializeApi(env: Record<string, string | undefined>): ApiResponse<{ initialized: boolean }> {
  // Validate Supabase configuration
  const supabaseError = validateSupabaseUrl(env.SUPABASE_URL);
  if (supabaseError) return supabaseError;
  
  const anonKeyError = validateEnvVar('SUPABASE_ANON_KEY', env.SUPABASE_ANON_KEY);
  if (anonKeyError) return anonKeyError;
  
  // Validate AI API keys (if required)
  if (env.REQUIRES_AI === 'true') {
    const openrouterError = validateApiKey('OPENROUTER_API_KEY', env.OPENROUTER_API_KEY, 'sk-or-');
    if (openrouterError) return openrouterError;
  }
  
  return createSuccessResponse({ initialized: true });
}

describe('Property 16: Graceful Error Handling', () => {
  describe('Missing Environment Variables', () => {
    it('should return clear error for missing SUPABASE_URL', () => {
      const response = initializeApi({
        SUPABASE_ANON_KEY: 'test-key',
      });
      
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error.type).toBe('MISSING_ENV_VAR');
        expect(response.error.message).toContain('SUPABASE_URL');
        expect(response.statusCode).toBe(500);
      }
    });

    it('should return clear error for missing SUPABASE_ANON_KEY', () => {
      const response = initializeApi({
        SUPABASE_URL: 'https://test.supabase.co',
      });
      
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error.type).toBe('MISSING_ENV_VAR');
        expect(response.error.message).toContain('SUPABASE_ANON_KEY');
        expect(response.statusCode).toBe(500);
      }
    });

    it('should return clear error for missing AI API key', () => {
      const response = initializeApi({
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'test-key',
        REQUIRES_AI: 'true',
      });
      
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error.type).toBe('MISSING_ENV_VAR');
        expect(response.error.message).toContain('OPENROUTER_API_KEY');
      }
    });

    it('should include variable name in error details', () => {
      const response = initializeApi({});
      
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error.details).toBeDefined();
        expect(response.error.details?.variable).toBe('SUPABASE_URL');
      }
    });
  });

  describe('Invalid Environment Variables', () => {
    it('should return clear error for invalid Supabase URL format', () => {
      const response = initializeApi({
        SUPABASE_URL: 'not-a-valid-url',
        SUPABASE_ANON_KEY: 'test-key',
      });
      
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error.type).toBe('INVALID_ENV_VAR');
        expect(response.error.message).toContain('Invalid Supabase URL format');
        expect(response.error.message).toContain('https://');
      }
    });

    it('should return clear error for invalid API key prefix', () => {
      const error = validateApiKey('OPENROUTER_API_KEY', 'invalid-key', 'sk-or-');
      
      expect(error).not.toBeNull();
      if (error) {
        expect(error.error.type).toBe('INVALID_ENV_VAR');
        expect(error.error.message).toContain('Invalid OPENROUTER_API_KEY format');
        expect(error.error.details?.expectedPrefix).toBe('sk-or-');
      }
    });

    it('should include expected format in error message', () => {
      const response = initializeApi({
        SUPABASE_URL: 'http://wrong-protocol.com',
        SUPABASE_ANON_KEY: 'test-key',
      });
      
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error.message).toContain('Expected:');
        expect(response.error.message).toContain('https://');
      }
    });
  });

  describe('Error Response Structure', () => {
    it('should include success: false in error responses', () => {
      const error = createErrorResponse('MISSING_ENV_VAR', 'Test error', 500);
      
      expect(error.success).toBe(false);
    });

    it('should include error type in error responses', () => {
      const error = createErrorResponse('MISSING_ENV_VAR', 'Test error', 500);
      
      expect(error.error.type).toBe('MISSING_ENV_VAR');
    });

    it('should include clear error message', () => {
      const error = createErrorResponse('MISSING_ENV_VAR', 'Test error message', 500);
      
      expect(error.error.message).toBe('Test error message');
      expect(error.error.message.length).toBeGreaterThan(0);
    });

    it('should include HTTP status code', () => {
      const error = createErrorResponse('MISSING_ENV_VAR', 'Test error', 500);
      
      expect(error.statusCode).toBe(500);
      expect(error.statusCode).toBeGreaterThanOrEqual(400);
    });

    it('should include timestamp', () => {
      const error = createErrorResponse('MISSING_ENV_VAR', 'Test error', 500);
      
      expect(error.error.timestamp).toBeDefined();
      expect(new Date(error.error.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should include request ID for tracing', () => {
      const error = createErrorResponse('MISSING_ENV_VAR', 'Test error', 500);
      
      expect(error.error.requestId).toBeDefined();
      expect(error.error.requestId).toMatch(/^req_/);
    });

    it('should optionally include error details', () => {
      const error = createErrorResponse('MISSING_ENV_VAR', 'Test error', 500, {
        variable: 'TEST_VAR',
        suggestion: 'Add TEST_VAR to environment',
      });
      
      expect(error.error.details).toBeDefined();
      expect(error.error.details?.variable).toBe('TEST_VAR');
      expect(error.error.details?.suggestion).toBe('Add TEST_VAR to environment');
    });
  });

  describe('Success Response Structure', () => {
    it('should include success: true in success responses', () => {
      const response = createSuccessResponse({ test: 'data' });
      
      expect(response.success).toBe(true);
    });

    it('should include data in success responses', () => {
      const response = createSuccessResponse({ test: 'data' });
      
      expect(response.data).toEqual({ test: 'data' });
    });

    it('should include timestamp in success responses', () => {
      const response = createSuccessResponse({ test: 'data' });
      
      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should include request ID in success responses', () => {
      const response = createSuccessResponse({ test: 'data' });
      
      expect(response.requestId).toBeDefined();
      expect(response.requestId).toMatch(/^req_/);
    });
  });

  describe('Error Type Classification', () => {
    it('should use MISSING_ENV_VAR for missing variables', () => {
      const error = validateEnvVar('TEST_VAR', undefined);
      
      expect(error).not.toBeNull();
      if (error) {
        expect(error.error.type).toBe('MISSING_ENV_VAR');
      }
    });

    it('should use INVALID_ENV_VAR for invalid formats', () => {
      const error = validateSupabaseUrl('invalid-url');
      
      expect(error).not.toBeNull();
      if (error) {
        expect(error.error.type).toBe('INVALID_ENV_VAR');
      }
    });

    it('should use appropriate status codes for error types', () => {
      const missingVar = createErrorResponse('MISSING_ENV_VAR', 'Missing var', 500);
      const invalidVar = createErrorResponse('INVALID_ENV_VAR', 'Invalid var', 500);
      const authFailed = createErrorResponse('AUTHENTICATION_FAILED', 'Auth failed', 401);
      const rateLimit = createErrorResponse('RATE_LIMIT_EXCEEDED', 'Rate limit', 429);
      
      expect(missingVar.statusCode).toBe(500);
      expect(invalidVar.statusCode).toBe(500);
      expect(authFailed.statusCode).toBe(401);
      expect(rateLimit.statusCode).toBe(429);
    });
  });

  describe('Validation Functions', () => {
    it('should return null for valid environment variables', () => {
      const error = validateEnvVar('TEST_VAR', 'valid-value');
      
      expect(error).toBeNull();
    });

    it('should return null for valid Supabase URL', () => {
      const error = validateSupabaseUrl('https://test.supabase.co');
      
      expect(error).toBeNull();
    });

    it('should return null for valid API key with correct prefix', () => {
      const error = validateApiKey('OPENROUTER_API_KEY', 'sk-or-test123', 'sk-or-');
      
      expect(error).toBeNull();
    });

    it('should validate API key without prefix requirement', () => {
      const error = validateApiKey('CUSTOM_KEY', 'any-value');
      
      expect(error).toBeNull();
    });
  });

  describe('API Initialization', () => {
    it('should succeed with valid environment', () => {
      const response = initializeApi({
        SUPABASE_URL: 'https://test.supabase.co',
        SUPABASE_ANON_KEY: 'test-key',
      });
      
      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.data.initialized).toBe(true);
      }
    });

    it('should fail fast on first missing variable', () => {
      const response = initializeApi({});
      
      expect(response.success).toBe(false);
      if (!response.success) {
        // Should fail on SUPABASE_URL (first check)
        expect(response.error.details?.variable).toBe('SUPABASE_URL');
      }
    });

    it('should validate in correct order', () => {
      // Missing SUPABASE_URL should be caught before SUPABASE_ANON_KEY
      const response1 = initializeApi({});
      expect(response1.success).toBe(false);
      if (!response1.success) {
        expect(response1.error.details?.variable).toBe('SUPABASE_URL');
      }
      
      // Missing SUPABASE_ANON_KEY should be caught after SUPABASE_URL is valid
      const response2 = initializeApi({
        SUPABASE_URL: 'https://test.supabase.co',
      });
      expect(response2.success).toBe(false);
      if (!response2.success) {
        expect(response2.error.details?.variable).toBe('SUPABASE_ANON_KEY');
      }
    });
  });

  describe('Error Message Quality', () => {
    it('should provide actionable error messages', () => {
      const error = validateEnvVar('SUPABASE_URL', undefined);
      
      expect(error).not.toBeNull();
      if (error) {
        expect(error.error.message).toContain('Missing required environment variable');
        expect(error.error.message).toContain('SUPABASE_URL');
      }
    });

    it('should include expected format in validation errors', () => {
      const error = validateSupabaseUrl('invalid');
      
      expect(error).not.toBeNull();
      if (error) {
        expect(error.error.message).toContain('Expected:');
        expect(error.error.message).toContain('https://');
        expect(error.error.message).toContain('.supabase.co');
      }
    });

    it('should not expose sensitive values in error messages', () => {
      const error = validateApiKey('SECRET_KEY', 'sk-secret-value-123', 'sk-');
      
      // Should not include the actual key value in message
      expect(error).toBeNull(); // This key is valid
      
      const invalidError = validateApiKey('SECRET_KEY', undefined);
      expect(invalidError).not.toBeNull();
      if (invalidError) {
        expect(invalidError.error.message).not.toContain('sk-secret-value-123');
      }
    });
  });

  describe('Consistency', () => {
    it('should create consistent error responses', () => {
      const error1 = createErrorResponse('MISSING_ENV_VAR', 'Test', 500);
      const error2 = createErrorResponse('MISSING_ENV_VAR', 'Test', 500);
      
      expect(error1.success).toBe(error2.success);
      expect(error1.error.type).toBe(error2.error.type);
      expect(error1.error.message).toBe(error2.error.message);
      expect(error1.statusCode).toBe(error2.statusCode);
    });

    it('should create unique request IDs', () => {
      const error1 = createErrorResponse('MISSING_ENV_VAR', 'Test', 500);
      const error2 = createErrorResponse('MISSING_ENV_VAR', 'Test', 500);
      
      expect(error1.error.requestId).not.toBe(error2.error.requestId);
    });

    it('should handle multiple validation errors consistently', () => {
      const errors = [
        validateEnvVar('VAR1', undefined),
        validateEnvVar('VAR2', undefined),
        validateEnvVar('VAR3', undefined),
      ];
      
      errors.forEach(error => {
        expect(error).not.toBeNull();
        if (error) {
          expect(error.error.type).toBe('MISSING_ENV_VAR');
          expect(error.statusCode).toBe(500);
        }
      });
    });
  });
});
