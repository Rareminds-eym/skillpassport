# Cache Setup Guide

This guide explains how to set up Cloudflare KV for caching subscription and feature access data.

## Overview

The caching implementation uses Cloudflare KV (Key-Value storage) as a distributed cache layer. KV provides:
- Low-latency reads (< 10ms globally)
- Automatic TTL expiration
- Global distribution
- No infrastructure management

## Setup Steps

### 1. Create KV Namespaces

You need to create two KV namespaces: one for production and one for preview/development.

#### Using Cloudflare Dashboard:
1. Go to Cloudflare Dashboard → Workers & Pages → KV
2. Click "Create namespace"
3. Name it `skill-passport-cache` (production)
4. Click "Create namespace" again
5. Name it `skill-passport-cache-preview` (preview/dev)
6. Copy the namespace IDs

#### Using Wrangler CLI:
```bash
# Create production namespace
npx wrangler kv:namespace create "CACHE_KV"

# Create preview namespace
npx wrangler kv:namespace create "CACHE_KV" --preview
```

### 2. Update wrangler.toml

Replace the placeholder IDs in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CACHE_KV"
id = "abc123..."  # Your production KV namespace ID
preview_id = "xyz789..."  # Your preview KV namespace ID
```

### 3. Configure Pages Project

Add the KV binding to your Cloudflare Pages project:

1. Go to Cloudflare Dashboard → Pages → Your Project
2. Click "Settings" → "Functions"
3. Scroll to "KV namespace bindings"
4. Click "Add binding"
5. Variable name: `CACHE_KV`
6. KV namespace: Select `skill-passport-cache`
7. Click "Save"

### 4. Local Development

For local development with `wrangler pages dev`:

```bash
# The KV binding will use the preview_id from wrangler.toml
npm run dev
```

## Cache Keys and TTLs

The implementation uses the following cache structure:

### Subscription Data
- **Key**: `subscription:{userId}`
- **TTL**: 5 minutes (300 seconds)
- **Invalidated on**: Subscription create, update, cancel, pause, resume

### Plan Data
- **Key**: `plans:{businessType}:{entityType}:{roleType}`
- **TTL**: 1 hour (3600 seconds)
- **Invalidated on**: Plan configuration changes (manual)

### Feature Access
- **Key**: `feature:{userId}:{feature}`
- **TTL**: 1 minute (60 seconds)
- **Invalidated on**: Subscription changes

## Cache Utilities

The cache utilities are located in `src/shared/lib/cache.ts`:

```typescript
import {
  getCached,
  setCached,
  deleteCached,
  invalidateUserSubscriptionCache,
  getSubscriptionCacheKey,
  getPlanCacheKey,
  getFeatureCacheKey,
  CACHE_TTL
} from '@/shared/lib/cache';

// Get cached subscription
const subscription = await getCached(env.CACHE_KV, getSubscriptionCacheKey(userId));

// Set cached subscription
await setCached(env.CACHE_KV, getSubscriptionCacheKey(userId), subscriptionData, CACHE_TTL.SUBSCRIPTION);

// Invalidate user's subscription cache
await invalidateUserSubscriptionCache(env.CACHE_KV, userId);
```

## Monitoring

### View Cache Contents (Development)

```bash
# List all keys
npx wrangler kv:key list --namespace-id=YOUR_NAMESPACE_ID

# Get a specific key
npx wrangler kv:key get "subscription:user-id-here" --namespace-id=YOUR_NAMESPACE_ID

# Delete a specific key
npx wrangler kv:key delete "subscription:user-id-here" --namespace-id=YOUR_NAMESPACE_ID
```

### Cache Metrics

Monitor cache performance in Cloudflare Dashboard:
1. Go to Workers & Pages → KV
2. Select your namespace
3. View metrics: Read operations, Write operations, Storage usage

## Testing

### Test Cache Operations

```typescript
// In your test file
import { getCached, setCached } from '@/shared/lib/cache';

// Mock KV namespace
const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  list: vi.fn(),
};

// Test caching
await setCached(mockKV, 'test-key', { data: 'value' }, 60);
const cached = await getCached(mockKV, 'test-key');
```

## Troubleshooting

### Cache Not Working
- Verify KV namespace is bound in Cloudflare Pages settings
- Check wrangler.toml has correct namespace IDs
- Ensure CACHE_KV is passed to handlers

### Cache Not Invalidating
- Check that invalidation is called after subscription changes
- Verify userId matches between cache key and invalidation call
- Check KV namespace permissions

### High Cache Miss Rate
- Increase TTL values if data doesn't change frequently
- Check if cache keys are consistent
- Monitor KV read/write operations in dashboard

## Cost Considerations

Cloudflare KV pricing (as of 2024):
- **Reads**: $0.50 per million reads
- **Writes**: $5.00 per million writes
- **Storage**: $0.50 per GB per month
- **Free tier**: 100,000 reads/day, 1,000 writes/day, 1 GB storage

For typical usage:
- Subscription cache: ~1M reads/month = $0.50/month
- Feature access cache: ~5M reads/month = $2.50/month
- Total estimated cost: ~$3-5/month

## Alternative: Redis (Future Enhancement)

If you need more advanced caching features, consider migrating to Upstash Redis:

1. Create Upstash Redis database
2. Add REST API credentials to environment variables
3. Update cache utilities to use Redis REST API
4. Benefits: More data structures, pub/sub, transactions

Note: Current implementation uses KV as it's simpler and sufficient for the use case.
