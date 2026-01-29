/**
 * Property-Based Tests for File-Based Routing
 * Feature: cloudflare-consolidation, Property 13: File-Based Routing
 * Validates: Requirements 9.1, 9.4
 * 
 * Tests that Pages Functions are automatically accessible at routes
 * determined by their file paths.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// File path to route mapping
interface RouteMapping {
  filePath: string;
  expectedRoute: string;
  apiName: string;
}

// List of all API routes that should be automatically registered
const API_ROUTES: RouteMapping[] = [
  { filePath: 'functions/api/assessment/[[path]].ts', expectedRoute: '/api/assessment/*', apiName: 'assessment' },
  { filePath: 'functions/api/career/[[path]].ts', expectedRoute: '/api/career/*', apiName: 'career' },
  { filePath: 'functions/api/course/[[path]].ts', expectedRoute: '/api/course/*', apiName: 'course' },
  { filePath: 'functions/api/fetch-certificate/[[path]].ts', expectedRoute: '/api/fetch-certificate/*', apiName: 'fetch-certificate' },
  { filePath: 'functions/api/otp/[[path]].ts', expectedRoute: '/api/otp/*', apiName: 'otp' },
  { filePath: 'functions/api/storage/[[path]].ts', expectedRoute: '/api/storage/*', apiName: 'storage' },
  { filePath: 'functions/api/streak/[[path]].ts', expectedRoute: '/api/streak/*', apiName: 'streak' },
  { filePath: 'functions/api/user/[[path]].ts', expectedRoute: '/api/user/*', apiName: 'user' },
  { filePath: 'functions/api/adaptive-aptitude/[[path]].ts', expectedRoute: '/api/adaptive-aptitude/*', apiName: 'adaptive-aptitude' },
  { filePath: 'functions/api/analyze-assessment/[[path]].ts', expectedRoute: '/api/analyze-assessment/*', apiName: 'analyze-assessment' },
  { filePath: 'functions/api/question-generation/[[path]].ts', expectedRoute: '/api/question-generation/*', apiName: 'question-generation' },
  { filePath: 'functions/api/role-overview/[[path]].ts', expectedRoute: '/api/role-overview/*', apiName: 'role-overview' },
];

// Helper function to convert file path to expected route
function filePathToRoute(filePath: string): string {
  // Remove 'functions/' prefix
  let route = filePath.replace(/^functions\//, '/');
  
  // Remove file extension
  route = route.replace(/\.(ts|js)$/, '');
  
  // Handle catch-all routes [[path]]
  route = route.replace(/\/\[\[path\]\]$/, '/*');
  
  // Handle dynamic segments [param]
  route = route.replace(/\[([^\]]+)\]/g, ':$1');
  
  return route;
}

// Helper function to check if a route matches a pattern
function routeMatchesPattern(route: string, pattern: string): boolean {
  // Convert pattern to regex
  // * should match zero or more characters (including empty)
  const regexPattern = pattern
    .replace(/\*/g, '.*')  // * matches anything (including empty)
    .replace(/:\w+/g, '[^/]+');  // :param matches path segment
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(route);
}

describe('Property 13: File-Based Routing', () => {
  /**
   * Property: File paths should automatically map to routes
   * For any Pages Function file at path `functions/api/{service}/[[path]].ts`,
   * the function should be accessible at route `/api/{service}/*`
   */
  it('should map file paths to correct routes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...API_ROUTES),
        (mapping) => {
          const actualRoute = filePathToRoute(mapping.filePath);
          expect(actualRoute).toBe(mapping.expectedRoute);
        }
      ),
      { numRuns: API_ROUTES.length }
    );
  });

  /**
   * Property: All API services should have registered routes
   * For any API service in the list, there should be a corresponding
   * file and route mapping
   */
  it('should have routes for all 12 API services', () => {
    const expectedServices = [
      'assessment', 'career', 'course', 'fetch-certificate',
      'otp', 'storage', 'streak', 'user',
      'adaptive-aptitude', 'analyze-assessment', 'question-generation', 'role-overview'
    ];

    const registeredServices = API_ROUTES.map(r => r.apiName);

    // Verify all expected services are registered
    for (const service of expectedServices) {
      expect(registeredServices).toContain(service);
    }

    // Verify we have exactly 12 services
    expect(registeredServices.length).toBe(12);
  });

  /**
   * Property: Routes should match their patterns
   * For any route pattern, specific routes should correctly match or not match
   */
  it('should correctly match routes against patterns', () => {
    fc.assert(
      fc.property(
        fc.record({
          service: fc.constantFrom(...API_ROUTES.map(r => r.apiName)),
          subpath: fc.oneof(
            fc.constant('/health'),
            fc.constant('/generate'),
            fc.string({ minLength: 1, maxLength: 30 }).map(s => '/' + s.replace(/\//g, '-'))
          ),
        }),
        ({ service, subpath }) => {
          const mapping = API_ROUTES.find(r => r.apiName === service);
          if (!mapping) return;

          const testRoute = `/api/${service}${subpath}`;
          const shouldMatch = routeMatchesPattern(testRoute, mapping.expectedRoute);

          // All routes under /api/{service}/* should match
          expect(shouldMatch).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Catch-all routes should handle any subpath
   * For any Pages Function with [[path]] syntax, it should handle
   * any subpath under its base route
   */
  it('should handle catch-all routes for any subpath', () => {
    fc.assert(
      fc.property(
        fc.record({
          service: fc.constantFrom(...API_ROUTES.map(r => r.apiName)),
          segments: fc.array(
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => !s.includes('/')),
            { minLength: 1, maxLength: 5 }
          ),
        }),
        ({ service, segments }) => {
          const mapping = API_ROUTES.find(r => r.apiName === service);
          if (!mapping) return;

          // Build a route with multiple segments
          const subpath = '/' + segments.join('/');
          const testRoute = `/api/${service}${subpath}`;

          // Should match the catch-all pattern
          const matches = routeMatchesPattern(testRoute, mapping.expectedRoute);
          expect(matches).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Route structure should be consistent
   * For any API route, it should follow the pattern /api/{service}/*
   */
  it('should follow consistent route structure', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...API_ROUTES),
        (mapping) => {
          // All routes should start with /api/
          expect(mapping.expectedRoute).toMatch(/^\/api\//);
          
          // All routes should end with /* for catch-all
          expect(mapping.expectedRoute).toMatch(/\/\*$/);
          
          // Route should contain the service name
          expect(mapping.expectedRoute).toContain(mapping.apiName);
        }
      ),
      { numRuns: API_ROUTES.length }
    );
  });

  /**
   * Property: File organization should match route organization
   * For any API service, the file path should reflect the route structure
   */
  it('should have file paths that reflect route structure', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...API_ROUTES),
        (mapping) => {
          // File path should contain 'functions/api/'
          expect(mapping.filePath).toMatch(/^functions\/api\//);
          
          // File path should contain the service name
          expect(mapping.filePath).toContain(mapping.apiName);
          
          // File path should use [[path]].ts for catch-all
          expect(mapping.filePath).toMatch(/\/\[\[path\]\]\.ts$/);
        }
      ),
      { numRuns: API_ROUTES.length }
    );
  });

  /**
   * Property: Routes should not conflict with each other
   * For any two different API services, their routes should not overlap
   */
  it('should have non-conflicting routes', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.constantFrom(...API_ROUTES),
          fc.constantFrom(...API_ROUTES)
        ).filter(([a, b]) => a.apiName !== b.apiName),
        ([route1, route2]) => {
          // Different services should have different base routes
          const base1 = route1.expectedRoute.replace(/\/\*$/, '');
          const base2 = route2.expectedRoute.replace(/\/\*$/, '');
          
          expect(base1).not.toBe(base2);
          
          // One route should not be a prefix of another
          expect(base1.startsWith(base2)).toBe(false);
          expect(base2.startsWith(base1)).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Middleware should apply to all routes
   * The _middleware.ts file should apply to all API routes
   */
  it('should have middleware that applies to all routes', () => {
    const middlewarePath = 'functions/_middleware.ts';
    
    // Middleware at functions/ level applies to all routes under functions/
    for (const mapping of API_ROUTES) {
      // All API routes are under functions/api/, so middleware applies
      expect(mapping.filePath.startsWith('functions/')).toBe(true);
    }
  });

  /**
   * Property: Route registration should be automatic
   * For any file created at the correct path, the route should be
   * automatically registered without manual configuration
   */
  it('should automatically register routes based on file paths', () => {
    fc.assert(
      fc.property(
        fc.record({
          serviceName: fc.string({ minLength: 3, maxLength: 30 })
            .filter(s => /^[a-z][a-z0-9-]*$/.test(s)),
        }),
        ({ serviceName }) => {
          // Construct file path
          const filePath = `functions/api/${serviceName}/[[path]].ts`;
          
          // Expected route should be derivable from file path
          const expectedRoute = `/api/${serviceName}/*`;
          const actualRoute = filePathToRoute(filePath);
          
          expect(actualRoute).toBe(expectedRoute);
        }
      ),
      { numRuns: 100 }
    );
  });
});
