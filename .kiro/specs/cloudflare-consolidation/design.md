# Cloudflare Consolidation Design Document

## Overview

This design document outlines the architecture and implementation strategy for consolidating 15 separate Cloudflare Workers into a hybrid architecture consisting of 3 standalone workers and Cloudflare Pages Functions.

### Current Architecture

Currently, the system consists of 15 independent Cloudflare Workers, each deployed separately with its own configuration and deployment pipeline.

### Target Architecture

The new architecture will consist of:

**3 Standalone Workers** (with special requirements):
1. **payments-api**: Requires stable webhook URL for Razorpay + cron for entitlement lifecycle
2. **email-api**: Requires cron for scheduled countdown emails
3. **embedding-api**: Requires cron for queue processing

**12 Pages Functions** (consolidated into Cloudflare Pages):
- assessment-api, career-api, course-api, fetch-certificate, otp-api, storage-api
- streak-api, user-api, adaptive-aptitude-api, analyze-assessment-api
- question-generation-api, role-overview-api

## Architecture

### High-Level Architecture Diagram

```
Cloudflare Pages
├── Frontend Application
└── Pages Functions (12 APIs)
    ├── assessment, career, course, fetch-certificate
    ├── otp, storage, streak, user
    └── adaptive-aptitude, analyze-assessment, question-generation, role-overview

Standalone Workers (3)
├── payments-api (webhook + cron)
├── email-api (cron)
└── embedding-api (cron)
```

### Pages Functions File Structure

```
/
├── functions/
│   ├── api/
│   │   ├── assessment/[[path]].ts
│   │   ├── career/[[path]].ts
│   │   ├── course/[[path]].ts
│   │   └── ... (9 more APIs)
│   └── _middleware.ts
├── src/
│   ├── functions-lib/
│   │   ├── supabase.ts
│   │   ├── cors.ts
│   │   ├── response.ts
│   │   └── types.ts
│   └── ... (frontend code)
└── cloudflare-workers/
    ├── payments-api/
    ├── email-api/
    └── embedding-api/
```

## Components and Interfaces

### 1. Pages Functions Router

Each Pages Function uses Cloudflare's file-based routing with catch-all routes.

### 2. Shared Utilities Library

Location: `src/functions-lib/`

Provides common functionality to all Pages Functions including CORS handling, response formatting, and Supabase client creation.

### 3. Standalone Workers Configuration

Each standalone worker maintains its own wrangler.toml with cron triggers and service bindings as needed.

### 4. Frontend Service Layer

Location: `src/services/`

Each service will be updated to use Pages Function endpoints with fallback to standalone workers.

## Data Models

### Environment Configuration

All environment variables will be configured in Cloudflare Pages dashboard and standalone worker configurations.

### Migration State Tracking

Track migration progress for each worker including status, traffic percentage, and error rates.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: API Endpoint Parity

*For any* API request that was handled by an Original Worker, when the same request is sent to the corresponding Pages Function, the response format and status code should be equivalent.

**Validates: Requirements 1.2, 4.2**

### Property 2: Environment Variable Accessibility

*For any* Pages Function that requires an environment variable, that variable should be accessible through the context.env object.

**Validates: Requirements 1.4, 8.1**

### Property 3: Shared Module Consistency

*For any* utility function in the shared library, all Pages Functions that import it should receive the same implementation and behavior.

**Validates: Requirements 1.3**

### Property 4: Cron Job Execution

*For any* standalone worker with a configured cron trigger, the scheduled task should execute at the specified interval without affecting other worker operations.

**Validates: Requirements 2.1, 2.5**

### Property 5: Webhook URL Stability

*For any* redeployment of the payments-api standalone worker, the webhook URL should remain unchanged.

**Validates: Requirements 3.1, 3.3**

### Property 6: Service Binding Communication

*For any* service binding invocation, the system should communicate directly without HTTP overhead, and if the binding fails, fall back to HTTP requests.

**Validates: Requirements 3.4, 6.1, 6.2, 6.3, 6.4**

### Property 7: Route Consistency

*For any* Pages Function, its API routes should match the routes that were available in the Original Worker.

**Validates: Requirements 4.2**

### Property 8: Frontend Routing

*For any* API call from the frontend, the request should be routed to the appropriate Pages Function endpoint.

**Validates: Requirements 4.3, 7.1**

### Property 9: Internal Function Calls

*For any* Pages Function that needs to call another Pages Function, the system should use internal function calls instead of HTTP requests.

**Validates: Requirements 4.4**

### Property 10: Atomic Deployment

*For any* deployment of the Pages Application, all consolidated Pages Functions should deploy together with the frontend in a single atomic operation.

**Validates: Requirements 4.5**

### Property 11: Migration Fallback

*For any* error that occurs in a Pages Function during migration, the system should automatically fall back to the Original Worker.

**Validates: Requirements 5.3, 7.2**

### Property 12: Gradual Traffic Shifting

*For any* migration in progress, traffic should be gradually shifted from Original Workers to Pages Functions in controlled increments.

**Validates: Requirements 5.2**

### Property 13: File-Based Routing

*For any* Pages Function file created at path `functions/api/{service}/[[path]].ts`, the function should be automatically accessible at route `/api/{service}/*`.

**Validates: Requirements 9.1, 9.4**

### Property 14: Backward Compatibility During Migration

*For any* API response format, the frontend service should handle both old and new formats during the migration process.

**Validates: Requirements 7.4**

### Property 15: Environment-Specific Configuration

*For any* environment (development or production), the system should use the configuration specific to that environment.

**Validates: Requirements 8.5**

### Property 16: Graceful Error Handling

*For any* missing environment variable, the system should fail gracefully with a clear error message indicating which variable is missing.

**Validates: Requirements 8.4**

### Property 17: Secret Isolation

*For any* standalone worker, it should only have access to its own specific secrets and not secrets from other workers.

**Validates: Requirements 8.2**

## Error Handling

### 1. Pages Function Error Handling

All Pages Functions will implement consistent error handling:
- Validate required environment variables on startup
- Return appropriate HTTP status codes (400 for client errors, 500 for server errors)
- Log errors with structured logging for debugging
- Provide clear error messages without exposing sensitive information

### 2. Service Binding Fallback

When service bindings fail, the system will automatically fall back to HTTP requests:
- Attempt service binding first
- On failure, log the error and attempt HTTP request
- Track fallback occurrences for monitoring

### 3. Frontend Error Handling

Frontend services will implement multi-tier fallback:
- Try Pages Function endpoint first
- On failure, try standalone worker URL if configured
- Provide user-friendly error messages
- Log all failures for debugging

### 4. Migration Error Handling

During migration, errors will be carefully monitored:
- Log all errors with migration context
- Track error rates for both Pages Functions and Original Workers
- Automatically rollback if error rate exceeds threshold
- Alert on critical failures

## Testing Strategy

### Unit Testing

Unit tests will verify specific functionality of individual components:

1. **Shared Utilities Tests**
   - Test CORS header generation
   - Test JSON response formatting
   - Test Supabase client creation
   - Test error response formatting

2. **Router Tests**
   - Test route matching for each Pages Function
   - Test parameter extraction from URLs
   - Test method validation (GET, POST, etc.)

3. **Service Binding Tests**
   - Test service binding invocation
   - Test fallback to HTTP on binding failure
   - Test error handling in service communication

### Property-Based Testing

Property-based tests will verify universal properties across all inputs using fast-check for TypeScript. All property-based tests will be configured to run a minimum of 100 iterations.

Each property-based test will be tagged with a comment explicitly referencing the correctness property and requirement:

```typescript
/**
 * Feature: cloudflare-consolidation, Property 1: API Endpoint Parity
 * Validates: Requirements 1.2, 4.2
 */
test('API responses match between worker and Pages Function', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        endpoint: fc.constantFrom('/generate', '/evaluate', '/chat'),
        method: fc.constantFrom('GET', 'POST'),
        body: fc.object(),
      }),
      async (request) => {
        const workerResponse = await callWorker(request);
        const pagesResponse = await callPagesFunction(request);
        
        expect(pagesResponse.status).toBe(workerResponse.status);
        expect(pagesResponse.body).toEqual(workerResponse.body);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests will verify end-to-end functionality:

1. **Frontend to Pages Function Integration**
   - Test all API calls from frontend services
   - Verify correct routing and response handling
   - Test fallback behavior

2. **Service Binding Integration**
   - Test payments-api calling email-api via binding
   - Test payments-api calling storage-api via binding
   - Verify fallback to HTTP works

3. **Cron Job Integration**
   - Verify cron triggers execute on schedule
   - Test cron job functionality
   - Verify error handling in cron jobs

### Migration Testing

Specific tests for the migration process:

1. **Parallel Operation Test**
   - Run both Original Workers and Pages Functions
   - Send traffic to both
   - Verify both handle requests correctly

2. **Traffic Shifting Test**
   - Gradually shift traffic from 0% to 100%
   - Monitor error rates at each percentage
   - Verify no service interruption

3. **Rollback Test**
   - Simulate Pages Function failure
   - Verify automatic fallback to Original Worker
   - Test manual rollback procedure

## Deployment Strategy

### Phase 1: Preparation (Week 1)

1. Create Pages Functions directory structure
2. Migrate shared utilities to `src/functions-lib/`
3. Set up environment variables in Cloudflare Pages
4. Configure standalone workers with service bindings

### Phase 2: Migration (Week 2-3)

For each of the 12 workers being migrated:

1. **Create Pages Function**
   - Copy worker code to `functions/api/{service}/[[path]].ts`
   - Update imports to use shared utilities
   - Test locally with `wrangler pages dev`

2. **Deploy to Staging**
   - Deploy Pages Application to staging environment
   - Run integration tests
   - Verify functionality

3. **Gradual Traffic Shift**
   - Deploy to production with 0% traffic
   - Shift 10% traffic, monitor for 24 hours
   - Shift 25% traffic, monitor for 24 hours
   - Shift 50% traffic, monitor for 24 hours
   - Shift 100% traffic, monitor for 48 hours

4. **Verification**
   - Monitor error rates
   - Check performance metrics
   - Verify all endpoints working

### Phase 3: Cleanup (Week 4)

1. Decommission Original Workers
2. Remove worker directories and configuration files
3. Update GitHub workflows
4. Update documentation
5. Remove fallback URLs from frontend services

### Rollback Plan

If issues are detected during migration:

1. **Immediate Rollback**
   - Shift traffic back to Original Worker
   - Investigate issue in Pages Function
   - Fix and redeploy

2. **Monitoring Triggers**
   - Error rate > 1% compared to Original Worker
   - Response time > 2x Original Worker
   - Any 5xx errors in critical endpoints

## Security Considerations

1. **Environment Variable Security**: All secrets stored in Cloudflare dashboard, never in code
2. **CORS Configuration**: Restrict origins in production, validate request headers
3. **Service Binding Security**: Service bindings provide secure worker-to-worker communication
4. **Webhook Security**: Verify Razorpay webhook signatures, use HTTPS only

## Monitoring and Observability

### Logging

Implement structured logging for all Pages Functions with timestamps, request details, and response status.

### Metrics

Track key metrics:
- Request count per endpoint
- Error rate per endpoint
- Response time (p50, p95, p99)
- Cold start frequency and duration

### Alerting

Set up alerts for:
- Error rate > 1%
- Response time > 2 seconds
- Cron job failures
- Service binding failures

## Documentation Updates

1. **README Updates**: Update architecture diagrams, deployment instructions, local development setup
2. **API Documentation**: Update endpoint URLs, document fallback behavior
3. **Developer Guide**: Pages Functions development guide, shared utilities documentation

## Conclusion

This design provides a comprehensive plan for consolidating 15 Cloudflare Workers into a hybrid architecture with 3 standalone workers and 12 Pages Functions. The approach prioritizes zero-downtime migration, maintains all existing functionality, and improves code maintainability through shared utilities and simplified deployment.
