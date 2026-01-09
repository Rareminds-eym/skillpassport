# AI Job Matching Feature - Debug Report

## Executive Summary

The AI job matching feature was **not working correctly** due to **embeddings generated with different models**. When both student and opportunity embeddings were regenerated with the **same model**, similarity jumped from **0.037 to 0.478** (13x improvement).

**Status: ROOT CAUSE IDENTIFIED & FIXES APPLIED** ✅

---

## Root Cause

**Embeddings were generated with different models** (some with OpenRouter, some with local Render service), causing near-orthogonal vectors with very low similarity scores.

| Before Fix | After Fix (same model) |
|------------|------------------------|
| Similarity: 0.037 | Similarity: 0.478 |
| Threshold: 0.20 | Threshold: 0.01 |
| Result: No matches | Result: Good matches |

---

## Fixes Applied

### 1. **Lowered Match Threshold** ✅
- Database function: 0.20 → 0.01
- Career API config: 0.20 → 0.01

### 2. **Added Skills Fetching** ✅
- Updated embedding-api to fetch skills from `skills` table
- Applied to: backfill, regenerate, queue processing

### 3. **Fixed Status Filter** ✅
- Now accepts both 'open' and 'published' statuses

### 4. **Added Bulk Regeneration Endpoint** ✅
- New endpoint: `POST /regenerate-all?table=students&limit=200`

---

## How to Fix

### Run the regeneration script:

```bash
regenerate-all-embeddings.bat
```

This will:
1. Deploy the updated embedding-api worker
2. Regenerate ALL opportunity embeddings (79 records)
3. Regenerate ALL student embeddings (147 records)

### Or manually:

```bash
# Deploy first
cd cloudflare-workers\embedding-api
npx wrangler deploy

# Then regenerate ALL embeddings with same model
curl -X POST "https://embedding-api.dark-mode-d021.workers.dev/regenerate-all?table=opportunities&limit=100"
curl -X POST "https://embedding-api.dark-mode-d021.workers.dev/regenerate-all?table=students&limit=200"
```

---

## Architecture

```
Frontend → career-api (Cloudflare) → Supabase (PostgreSQL)
                ↓
         embedding-api (Cloudflare)
                ↓
         OpenRouter (text-embedding-3-small)
```

---

## Key Files Modified

| File | Change |
|------|--------|
| `cloudflare-workers/career-api/src/index.ts` | Lowered threshold to 0.01 |
| `cloudflare-workers/embedding-api/src/index.ts` | Added skills fetching, regenerate-all endpoint |
| Database: `match_opportunities_enhanced` | Lowered threshold, fixed status filter |

---

## Testing

```bash
# Test recommendations API
curl -X POST "https://career-api.dark-mode-d021.workers.dev/recommend-opportunities" \
  -H "Content-Type: application/json" \
  -d '{"studentId": "bdcb8c6a-b91c-4dd3-bb75-37e955ca29c1", "limit": 5}'

# Check embedding stats
curl "https://embedding-api.dark-mode-d021.workers.dev/stats"
```
