/**
 * Property-Based Tests for Shared Utilities
 * Feature: cloudflare-consolidation, Property 3: Shared Module Consistency
 * Validates: Requirements 1.3
 * 
 * Tests that all Pages Functions importing shared utilities receive
 * the same implementation and behavior.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  corsHeaders,
  getCorsHeaders,
  handleCorsPreflightRequest,
  addCorsHeaders,
  apiSuccess,
  apiError,
  apiDbError,
  apiValidationError,
  apiMethodNotAllowed,
  apiNotFound,
  createSupabaseClient,
  createSupabaseAdminClient,
  PagesEnv,
} from '../../../functions/lib';

describe('Property 3: Shared Module Consistency', () => {
  /**
   * Property: CORS headers should be consistent across all response types
   * For any response created by shared utilities, the CORS headers should match
   * the defined corsHeaders constant
   */
  it('should provide consistent CORS headers across all response utilities', () => {
    fc.assert(
      fc.property(
        fc.record({
          data: fc.oneof(fc.constant(null), fc.string(), fc.integer(), fc.boolean()),
          status: fc.oneof(
            fc.integer({ min: 200, max: 203 }),
            fc.integer({ min: 206, max: 299 }),
            fc.integer({ min: 400, max: 599 })
          ),
          message: fc.string(),
          code: fc.constant('TEST_ERROR'),
        }),
        ({ data, status, message, code }) => {
          // Test apiSuccess (uses default 200 if no status explicitly set)
          const successResp = apiSuccess(data);
          expect(successResp.headers.get('Access-Control-Allow-Origin')).toBe(corsHeaders['Access-Control-Allow-Origin']);
          expect(successResp.headers.get('Access-Control-Allow-Headers')).toBe(corsHeaders['Access-Control-Allow-Headers']);
          expect(successResp.headers.get('Access-Control-Allow-Methods')).toBe(corsHeaders['Access-Control-Allow-Methods']);

          // Test apiError
          const errResp = apiError(status, code, message);
          expect(errResp.headers.get('Access-Control-Allow-Origin')).toBe(corsHeaders['Access-Control-Allow-Origin']);
          expect(errResp.headers.get('Access-Control-Allow-Headers')).toBe(corsHeaders['Access-Control-Allow-Headers']);
          expect(errResp.headers.get('Access-Control-Allow-Methods')).toBe(corsHeaders['Access-Control-Allow-Methods']);

          // Test apiDbError (maps to a safe response)
          const dbErrResp = apiDbError({ code: 'PGRST116' });
          expect(dbErrResp.headers.get('Access-Control-Allow-Origin')).toBe(corsHeaders['Access-Control-Allow-Origin']);
          expect(dbErrResp.headers.get('Access-Control-Allow-Headers')).toBe(corsHeaders['Access-Control-Allow-Headers']);
          expect(dbErrResp.headers.get('Access-Control-Allow-Methods')).toBe(corsHeaders['Access-Control-Allow-Methods']);

          // Test apiValidationError
          const validationResp = apiValidationError([{ path: 'field', message }]);
          expect(validationResp.headers.get('Access-Control-Allow-Origin')).toBe(corsHeaders['Access-Control-Allow-Origin']);
          expect(validationResp.headers.get('Access-Control-Allow-Headers')).toBe(corsHeaders['Access-Control-Allow-Headers']);
          expect(validationResp.headers.get('Access-Control-Allow-Methods')).toBe(corsHeaders['Access-Control-Allow-Methods']);

          // Test handleCorsPreflightRequest
          const preflightResp = handleCorsPreflightRequest();
          expect(preflightResp.headers.get('Access-Control-Allow-Origin')).toBe(corsHeaders['Access-Control-Allow-Origin']);
          expect(preflightResp.headers.get('Access-Control-Allow-Headers')).toBe(corsHeaders['Access-Control-Allow-Headers']);
          expect(preflightResp.headers.get('Access-Control-Allow-Methods')).toBe(corsHeaders['Access-Control-Allow-Methods']);

          // Test apiMethodNotAllowed
          const methodResp = apiMethodNotAllowed();
          expect(methodResp.headers.get('Access-Control-Allow-Origin')).toBe(corsHeaders['Access-Control-Allow-Origin']);
          expect(methodResp.headers.get('Access-Control-Allow-Headers')).toBe(corsHeaders['Access-Control-Allow-Headers']);
          expect(methodResp.headers.get('Access-Control-Allow-Methods')).toBe(corsHeaders['Access-Control-Allow-Methods']);

          // Test apiNotFound
          const notFoundResp = apiNotFound(message);
          expect(notFoundResp.headers.get('Access-Control-Allow-Origin')).toBe(corsHeaders['Access-Control-Allow-Origin']);
          expect(notFoundResp.headers.get('Access-Control-Allow-Headers')).toBe(corsHeaders['Access-Control-Allow-Headers']);
          expect(notFoundResp.headers.get('Access-Control-Allow-Methods')).toBe(corsHeaders['Access-Control-Allow-Methods']);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: JSON responses should always be valid JSON
   * For any data input, apiSuccess should produce parseable JSON
   */
  it('should always produce valid JSON responses', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          data: fc.oneof(
            fc.string(),
            fc.integer(),
            fc.boolean(),
            fc.array(fc.string()),
            fc.dictionary(fc.string(), fc.string()),
            fc.constant(null),
          ),
        }),
        async ({ data }) => {
          // Test apiSuccess JSON output
          const response = apiSuccess(data);
          const text = await response.text();
          
          expect(() => JSON.parse(text)).not.toThrow();
          
          const parsed = JSON.parse(text);
          expect(parsed.success).toBe(true);
          expect(parsed.data).toEqual(data);
          expect(parsed.error).toBeNull();
          expect(parsed.meta).toHaveProperty('requestId');
          expect(parsed.meta).toHaveProperty('timestamp');
          expect(response.status).toBe(200);
          expect(response.headers.get('Content-Type')).toBe('application/json');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error responses should always have error field
   * For any error code and message, apiError should follow the { success, data, error, meta } envelope
   */
  it('should always include error field in error responses', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          code: fc.string({ minLength: 1 }),
          message: fc.string({ minLength: 1 }),
          status: fc.integer({ min: 400, max: 599 }),
        }),
        async ({ code, message, status }) => {
          const response = apiError(status, code, message);
          const data = await response.json();
          
          expect(data).toHaveProperty('error');
          expect(data.error).toHaveProperty('code', code);
          expect(data.error).toHaveProperty('message', message);
          expect(data.success).toBe(false);
          expect(data.data).toBeNull();
          expect(data.meta).toHaveProperty('requestId');
          expect(data.meta).toHaveProperty('timestamp');
          expect(response.status).toBe(status);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Success responses should always have success: true
   * For any data input, apiSuccess should include success: true
   */
  it('should always include success: true in success responses', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          data: fc.dictionary(fc.string(), fc.jsonValue()),
        }),
        async ({ data }) => {
          const response = apiSuccess(data);
          const responseData = await response.json();
          
          expect(responseData.success).toBe(true);
          expect(responseData.error).toBeNull();
          expect(responseData.meta).toHaveProperty('requestId');
          expect(responseData.meta).toHaveProperty('timestamp');
          
          Object.keys(data).forEach(key => {
            expect(responseData.data).toHaveProperty(key);
            const expectedValue = JSON.parse(JSON.stringify(data[key]));
            expect(responseData.data[key]).toEqual(expectedValue);
          });
          
          expect(response.status).toBe(200);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: addCorsHeaders should preserve response body and status
   * For any response, adding CORS headers should not modify body or status
   */
  it('should preserve response body and status when adding CORS headers', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          body: fc.string(),
          status: fc.oneof(
            fc.integer({ min: 200, max: 203 }),
            fc.integer({ min: 206, max: 299 }),
            fc.integer({ min: 400, max: 599 })
          ),
        }),
        async ({ body, status }) => {
          const originalResponse = new Response(body, { status });
          const originalText = await originalResponse.clone().text();
          
          const corsResponse = addCorsHeaders(originalResponse);
          const corsText = await corsResponse.text();
          
          expect(corsText).toBe(originalText);
          expect(corsResponse.status).toBe(status);
          expect(corsResponse.headers.get('Access-Control-Allow-Origin')).toBe(corsHeaders['Access-Control-Allow-Origin']);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Validation errors should include detail array
   * For any validation issues, the response should have proper structure
   */
  it('should include detail array in validation error responses', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            path: fc.string({ minLength: 1 }),
            message: fc.string({ minLength: 1 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (issues) => {
          const response = apiValidationError(issues);
          const data = await response.json();
          
          expect(data.success).toBe(false);
          expect(data.error).toHaveProperty('code', 'VALIDATION_ERROR');
          expect(data.error).toHaveProperty('message', 'Request validation failed');
          expect(data.error).toHaveProperty('details');
          expect(data.error.details).toEqual(issues);
          expect(response.status).toBe(400);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Convenience error builders should return correct status codes
   */
  it('should return correct status codes for convenience error builders', () => {
    expect(apiMethodNotAllowed().status).toBe(405);
    expect(apiNotFound().status).toBe(404);
    expect(apiNotFound('Custom message').status).toBe(404);
  });

  /**
   * Property: apiDbError should map known error codes safely
   */
  it('should safely map database errors without leaking internals', async () => {
    const knownErrors = [
      { code: 'PGRST116', expectedStatus: 404, expectedCode: 'NOT_FOUND' },
      { code: '42501', expectedStatus: 403, expectedCode: 'PERMISSION_DENIED' },
      { code: '23505', expectedStatus: 409, expectedCode: 'DUPLICATE' },
      { code: '23503', expectedStatus: 400, expectedCode: 'REFERENCE_ERROR' },
      { code: 'UNKNOWN_CODE', expectedStatus: 500, expectedCode: 'INTERNAL_ERROR' },
      { code: null, expectedStatus: 500, expectedCode: 'UNKNOWN' },
    ];

    for (const { code, expectedStatus, expectedCode } of knownErrors) {
      const response = apiDbError(code ? { code } : null);
      const data = await response.json();
      
      expect(response.status).toBe(expectedStatus);
      expect(data.error.code).toBe(expectedCode);
      expect(data.error).not.toHaveProperty('details');
      expect(data.error).not.toHaveProperty('stack');
      expect(data.error).not.toHaveProperty('message');
      expect(data.success).toBe(false);
    }
  });

  /**
   * Property: Supabase client creation should validate required env vars
   * For any environment missing required variables, client creation should throw
   */
  it('should validate required environment variables for Supabase clients', () => {
    fc.assert(
      fc.property(
        fc.record({
          hasUrl: fc.boolean(),
          hasAnonKey: fc.boolean(),
          hasServiceKey: fc.boolean(),
        }),
        ({ hasUrl, hasAnonKey, hasServiceKey }) => {
          const env: Partial<PagesEnv> = {
            VITE_SUPABASE_URL: hasUrl ? 'https://test.supabase.co' : undefined,
            VITE_SUPABASE_ANON_KEY: hasAnonKey ? 'test-anon-key' : undefined,
            SUPABASE_SERVICE_ROLE_KEY: hasServiceKey ? 'test-service-key' : undefined,
          };

          if (hasUrl && hasAnonKey) {
            expect(() => createSupabaseClient(env as PagesEnv)).not.toThrow();
          } else {
            expect(() => createSupabaseClient(env as PagesEnv)).toThrow();
          }

          if (hasUrl && hasServiceKey) {
            expect(() => createSupabaseAdminClient(env as PagesEnv)).not.toThrow();
          } else {
            expect(() => createSupabaseAdminClient(env as PagesEnv)).toThrow();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: getCorsHeaders should always return consistent set of headers
   */
  it('should return consistent CORS headers for any origin', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(null), fc.constant('https://example.com'), fc.constant('*')),
        (origin) => {
          const headers = getCorsHeaders(origin);
          
          expect(headers).toHaveProperty('Access-Control-Allow-Origin');
          expect(headers).toHaveProperty('Access-Control-Allow-Headers');
          expect(headers).toHaveProperty('Access-Control-Allow-Methods');
          expect(Object.keys(headers).length).toBe(3);
          
          if (origin === null) {
            expect(headers['Access-Control-Allow-Origin']).toBe('*');
          } else {
            expect(headers['Access-Control-Allow-Origin']).toBe(origin);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
