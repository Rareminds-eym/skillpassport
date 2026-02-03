# Frontend Service Migration Guide

This document provides guidance for migrating frontend service files to use Pages Functions with fallback to Original Workers.

## Migration Status

### ✅ Completed Services (4/7)

1. **careerApiService** - Migrated to TypeScript with fallback
2. **streakApiService** - Migrated to TypeScript with fallback
3. **otpService** - Migrated to TypeScript with fallback
4. **apiFallback utility** - Created shared fallback utility

### ⏳ Remaining Services (3/7)

5. **courseApiService** - Needs migration
6. **storageApiService** - Needs migration
7. **userApiService** - Needs migration (large file, 700+ lines)

## Migration Pattern

All services follow the same pattern:

### 1. Import the Fallback Utility

```typescript
import { createAndRegisterApi, getPagesUrl } from '../utils/apiFallback';
```

### 2. Configure Primary and Fallback URLs

```typescript
const FALLBACK_URL = import.meta.env.VITE_SERVICE_API_URL || 'https://service-api-dev.workers.dev';
const PRIMARY_URL = `${getPagesUrl()}/api/service`;

const api = createAndRegisterApi('service-name', {
  primary: PRIMARY_URL,
  fallback: FALLBACK_URL,
  timeout: 10000,
  enableLogging: true,
});
```

### 3. Replace Direct fetch() Calls

**Before:**
```javascript
const response = await fetch(`${getBaseUrl()}/endpoint`, {
  method: 'POST',
  headers: getAuthHeaders(token),
  body: JSON.stringify(data),
});
```

**After:**
```typescript
const response = await api.fetch('/endpoint', {
  method: 'POST',
  headers: getAuthHeaders(token),
  body: JSON.stringify(data),
});
```

### 4. Convert to TypeScript

- Add proper type annotations
- Define interfaces for parameters and responses
- Use TypeScript strict mode

## Example: Complete Migration

### Before (JavaScript)

```javascript
// src/services/exampleApiService.js
const WORKER_URL = import.meta.env.VITE_EXAMPLE_API_URL;

const getBaseUrl = () => {
  if (!WORKER_URL) {
    throw new Error('VITE_EXAMPLE_API_URL environment variable is required');
  }
  return WORKER_URL;
};

export async function getData(id, token) {
  const response = await fetch(`${getBaseUrl()}/data/${id}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get data');
  }

  return response.json();
}
```

### After (TypeScript with Fallback)

```typescript
// src/services/exampleApiService.ts
import { createAndRegisterApi, getPagesUrl } from '../utils/apiFallback';

const FALLBACK_URL = import.meta.env.VITE_EXAMPLE_API_URL || 'https://example-api-dev.workers.dev';
const PRIMARY_URL = `${getPagesUrl()}/api/example`;

const api = createAndRegisterApi('example', {
  primary: PRIMARY_URL,
  fallback: FALLBACK_URL,
  timeout: 10000,
  enableLogging: true,
});

export async function getData(id: string, token: string): Promise<unknown> {
  const response = await api.fetch(`/data/${id}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to get data');
  }

  return response.json();
}
```

## Fallback Behavior

The `apiFallback` utility provides automatic fallback with the following behavior:

1. **Primary First**: Always tries the Pages Function endpoint first
2. **Timeout**: Waits up to 10 seconds (configurable) for response
3. **Automatic Fallback**: Falls back to Original Worker on:
   - Network errors
   - Timeouts
   - HTTP error status codes (4xx, 5xx)
4. **Metrics**: Tracks success/failure rates for monitoring
5. **Logging**: Logs all fallback events for debugging

## Environment Variables

### Development (.env)

```env
# Pages Function URL (local development)
VITE_PAGES_URL=http://localhost:8788

# Fallback URLs (Original Workers)
VITE_CAREER_API_URL=https://career-api-dev.dark-mode-d021.workers.dev
VITE_STREAK_API_URL=https://streak-api-dev.dark-mode-d021.workers.dev
VITE_OTP_API_URL=https://otp-api-dev.dark-mode-d021.workers.dev
VITE_COURSE_API_URL=https://course-api-dev.dark-mode-d021.workers.dev
VITE_STORAGE_API_URL=https://storage-api-dev.dark-mode-d021.workers.dev
VITE_USER_API_URL=https://user-api-dev.dark-mode-d021.workers.dev
```

### Production

```env
# Pages Function URL (production)
# Automatically detected from window.location in production

# Fallback URLs (Original Workers - production)
VITE_CAREER_API_URL=https://career-api.dark-mode-d021.workers.dev
VITE_STREAK_API_URL=https://streak-api.dark-mode-d021.workers.dev
VITE_OTP_API_URL=https://otp-api.dark-mode-d021.workers.dev
VITE_COURSE_API_URL=https://course-api.dark-mode-d021.workers.dev
VITE_STORAGE_API_URL=https://storage-api.dark-mode-d021.workers.dev
VITE_USER_API_URL=https://user-api.dark-mode-d021.workers.dev
```

## Monitoring Fallback Usage

### Get Metrics for a Single Service

```typescript
import careerApiService from './services/careerApiService';

// Access the API instance (if exported)
const metrics = api.getMetrics();
console.log('Career API Metrics:', metrics);
```

### Get Global Metrics

```typescript
import { globalMetrics } from './utils/apiFallback';

// Get metrics for all services
const allMetrics = globalMetrics.getAggregatedMetrics();
console.log('All Service Metrics:', allMetrics);

// Get total metrics across all services
const totalMetrics = globalMetrics.getTotalMetrics();
console.log('Total Metrics:', totalMetrics);
```

### Metrics Structure

```typescript
interface FallbackMetrics {
  totalRequests: number;          // Total API requests
  primarySuccesses: number;       // Successful Pages Function requests
  primaryFailures: number;        // Failed Pages Function requests
  fallbackSuccesses: number;      // Successful fallback requests
  fallbackFailures: number;       // Failed fallback requests
  averageResponseTime: number;    // Average response time in ms
}
```

## Testing

### Test Fallback Behavior

1. **Test Primary Success**:
   - Start Pages dev server: `npm run pages:dev`
   - Make API calls - should use Pages Functions

2. **Test Fallback**:
   - Stop Pages dev server
   - Make API calls - should automatically fall back to Original Workers

3. **Test Timeout**:
   - Add artificial delay to Pages Function
   - Verify fallback triggers after timeout

### Test in Different Environments

```bash
# Development (local Pages dev)
npm run dev

# Preview (Cloudflare Pages preview)
# Set VITE_PAGES_URL to preview URL

# Production
# Automatically uses production domain
```

## Gradual Migration Strategy

### Phase 1: Dual Operation (Current)
- Both Pages Functions and Original Workers running
- Frontend uses Pages Functions with fallback
- Monitor metrics to ensure stability

### Phase 2: Traffic Shift
- Gradually increase traffic to Pages Functions
- Monitor error rates and performance
- Keep fallback active

### Phase 3: Pages Functions Only
- Remove fallback logic once Pages Functions are stable
- Decommission Original Workers
- Update environment variables

## Troubleshooting

### Issue: Fallback Always Triggered

**Symptoms**: All requests fall back to Original Workers

**Solutions**:
1. Check Pages dev server is running: `npm run pages:dev`
2. Verify VITE_PAGES_URL is correct
3. Check browser console for CORS errors
4. Verify Pages Function endpoints are deployed

### Issue: Both Primary and Fallback Fail

**Symptoms**: All API requests fail

**Solutions**:
1. Check network connectivity
2. Verify environment variables are set
3. Check Cloudflare Worker status
4. Review browser console for errors

### Issue: Slow Response Times

**Symptoms**: API calls take longer than expected

**Solutions**:
1. Check fallback timeout setting (default: 10s)
2. Monitor metrics for fallback usage
3. Optimize Pages Function performance
4. Consider increasing timeout for slow endpoints

## Next Steps

1. ✅ Complete migration of remaining services:
   - courseApiService
   - storageApiService
   - userApiService

2. ✅ Add property tests for fallback behavior

3. ✅ Deploy Pages Functions to staging

4. ✅ Monitor metrics in production

5. ✅ Remove fallback logic after successful migration

## Related Files

- `src/utils/apiFallback.ts` - Fallback utility
- `src/services/careerApiService.ts` - Example migrated service
- `src/services/streakApiService.ts` - Example migrated service
- `src/services/otpService.ts` - Example migrated service
- `.env` - Environment variables
- `CLOUDFLARE_PAGES_ENV_CONFIG.md` - Environment configuration guide
