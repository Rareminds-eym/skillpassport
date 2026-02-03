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
  handleCorsPreflightRequest,
  addCorsHeaders,
  jsonResponse,
  errorResponse,
  successResponse,
  streamResponse,
  createSupabaseClient,
  createSupabaseAdminClient,
  getAuthToken,
  PagesEnv,
} from '../../functions-lib';

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
          data: fc.anything(),
          // Only use status codes that allow bodies (exclude 1xx, 204, 205, 304)
          status: fc.oneof(
            fc.integer({ min: 200, max: 203 }),
            fc.integer({ min: 206, max: 299 }),
            fc.integer({ min: 400, max: 599 })
          ),
          message: fc.string(),
        }),
        ({ data, status, message }) => {
          // Test jsonResponse
          const jsonResp = jsonResponse(data, status);
          expect(jsonResp.headers.get('Access-Control-Allow-Origin')).toBe(corsHeaders['Access-Control-Allow-Origin']);
          expect(jsonResp.headers.get('Access-Control-Allow-Headers')).toBe(corsHeaders['Access-Control-Allow-Headers']);
          expect(jsonResp.headers.get('Access-Control-Allow-Methods')).toBe(corsHeaders['Access-Control-Allow-Methods']);

          // Test errorResponse
          const errResp = errorResponse(message, status);
          expect(errResp.headers.get('Access-Control-Allow-Origin')).toBe(corsHeaders['Access-Control-Allow-Origin']);
          expect(errResp.headers.get('Access-Control-Allow-Headers')).toBe(corsHeaders['Access-Control-Allow-Headers']);
          expect(errResp.headers.get('Access-Control-Allow-Methods')).toBe(corsHeaders['Access-Control-Allow-Methods']);

          // Test successResponse
          const successResp = successResponse(data, status);
          expect(successResp.headers.get('Access-Control-Allow-Origin')).toBe(corsHeaders['Access-Control-Allow-Origin']);
          expect(successResp.headers.get('Access-Control-Allow-Headers')).toBe(corsHeaders['Access-Control-Allow-Headers']);
          expect(successResp.headers.get('Access-Control-Allow-Methods')).toBe(corsHeaders['Access-Control-Allow-Methods']);

          // Test handleCorsPreflightRequest
          const preflightResp = handleCorsPreflightRequest();
          expect(preflightResp.headers.get('Access-Control-Allow-Origin')).toBe(corsHeaders['Access-Control-Allow-Origin']);
          expect(preflightResp.headers.get('Access-Control-Allow-Headers')).toBe(corsHeaders['Access-Control-Allow-Headers']);
          expect(preflightResp.headers.get('Access-Control-Allow-Methods')).toBe(corsHeaders['Access-Control-Allow-Methods']);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: JSON responses should always be valid JSON
   * For any data input, jsonResponse should produce parseable JSON
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
          // Only use status codes that allow bodies
          status: fc.oneof(
            fc.integer({ min: 200, max: 203 }),
            fc.integer({ min: 206, max: 299 }),
            fc.integer({ min: 400, max: 599 })
          ),
        }),
        async ({ data, status }) => {
          const response = jsonResponse(data, status);
          const text = await response.text();
          
          // Should be parseable JSON
          expect(() => JSON.parse(text)).not.toThrow();
          
          // Parsed data should match original
          const parsed = JSON.parse(text);
          expect(parsed).toEqual(data);
          
          // Status should match
          expect(response.status).toBe(status);
          
          // Content-Type should be JSON
          expect(response.headers.get('Content-Type')).toBe('application/json');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Error responses should always have error field
   * For any error message, errorResponse should include an error field
   */
  it('should always include error field in error responses', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          message: fc.string({ minLength: 1 }),
          status: fc.integer({ min: 400, max: 599 }),
        }),
        async ({ message, status }) => {
          const response = errorResponse(message, status);
          const data = await response.json();
          
          // Should have error field
          expect(data).toHaveProperty('error');
          expect(data.error).toBe(message);
          
          // Status should be in error range
          expect(response.status).toBeGreaterThanOrEqual(400);
          expect(response.status).toBeLessThan(600);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Success responses should always have success: true
   * For any data input, successResponse should include success: true
   */
  it('should always include success: true in success responses', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          data: fc.dictionary(fc.string(), fc.jsonValue()),
          // Only use status codes that can have a body (200, 201, 202, 203)
          status: fc.constantFrom(200, 201, 202, 203),
        }),
        async ({ data, status }) => {
          const response = successResponse(data, status);
          const responseData = await response.json();
          
          // Should have success: true
          expect(responseData).toHaveProperty('success');
          expect(responseData.success).toBe(true);
          
          // Should include all data fields (after JSON serialization)
          Object.keys(data).forEach(key => {
            expect(responseData).toHaveProperty(key);
            // Use JSON.parse(JSON.stringify()) to normalize undefined to null
            const expectedValue = JSON.parse(JSON.stringify(data[key]));
            expect(responseData[key]).toEqual(expectedValue);
          });
          
          // Status should be in success range
          expect(response.status).toBeGreaterThanOrEqual(200);
          expect(response.status).toBeLessThan(300);
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
          // Only use status codes that allow bodies
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
          
          // Body should be unchanged
          expect(corsText).toBe(originalText);
          
          // Status should be unchanged
          expect(corsResponse.status).toBe(status);
          
          // CORS headers should be present
          expect(corsResponse.headers.get('Access-Control-Allow-Origin')).toBe(corsHeaders['Access-Control-Allow-Origin']);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Auth token extraction should handle various header formats
   * For any valid Bearer token format, getAuthToken should extract the token
   */
  it('should correctly extract auth tokens from various header formats', () => {
    fc.assert(
      fc.property(
        // Generate tokens with no whitespace at all (typical JWT format)
        fc.string({ minLength: 10, maxLength: 100 })
          .filter(s => s.trim().length > 0 && !/\s/.test(s)),
        (token) => {
          // Valid Bearer token format
          const validRequest = new Request('https://example.com', {
            headers: { authorization: `Bearer ${token}` },
          });
          expect(getAuthToken(validRequest)).toBe(token);
          
          // Case insensitive Bearer
          const caseRequest = new Request('https://example.com', {
            headers: { authorization: `bearer ${token}` },
          });
          expect(getAuthToken(caseRequest)).toBe(token);
          
          // No authorization header
          const noAuthRequest = new Request('https://example.com');
          expect(getAuthToken(noAuthRequest)).toBeNull();
          
          // Invalid format (no Bearer prefix)
          const invalidRequest = new Request('https://example.com', {
            headers: { authorization: token },
          });
          expect(getAuthToken(invalidRequest)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
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

          // Regular client requires URL and anon key
          if (hasUrl && hasAnonKey) {
            expect(() => createSupabaseClient(env as PagesEnv)).not.toThrow();
          } else {
            expect(() => createSupabaseClient(env as PagesEnv)).toThrow();
          }

          // Admin client requires URL and service key
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
   * Property: Stream responses should have correct headers
   * For any readable stream, streamResponse should set proper streaming headers
   */
  it('should set correct headers for streaming responses', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (content) => {
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(content));
              controller.close();
            },
          });

          const response = streamResponse(stream);

          // Should have streaming headers
          expect(response.headers.get('Content-Type')).toBe('text/event-stream');
          expect(response.headers.get('Cache-Control')).toBe('no-cache');
          expect(response.headers.get('Connection')).toBe('keep-alive');

          // Should have CORS headers
          expect(response.headers.get('Access-Control-Allow-Origin')).toBe(corsHeaders['Access-Control-Allow-Origin']);
        }
      ),
      { numRuns: 100 }
    );
  });
});
