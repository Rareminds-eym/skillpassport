# Cloudflare Pages Functions

This directory contains Cloudflare Pages Functions that consolidate 12 separate Cloudflare Workers into a single deployment.

## Directory Structure

```
functions/
├── _middleware.ts              # Global CORS middleware
└── api/                        # API endpoints
    ├── assessment/             # Assessment API
    ├── career/                 # Career API
    ├── course/                 # Course API
    ├── fetch-certificate/      # Certificate fetching API
    ├── otp/                    # OTP (One-Time Password) API
    ├── storage/                # Storage API
    ├── streak/                 # Streak tracking API
    ├── user/                   # User management API
    ├── adaptive-aptitude/      # Adaptive aptitude assessment API
    ├── analyze-assessment/     # Assessment analysis API
    ├── question-generation/    # Question generation API
    └── role-overview/          # Role overview API
```

## File-Based Routing

Cloudflare Pages Functions use file-based routing. Each function is automatically mapped to a URL based on its file path:

- `functions/api/assessment/[[path]].ts` → `/api/assessment/*`
- `functions/api/career/[[path]].ts` → `/api/career/*`
- `functions/api/course/[[path]].ts` → `/api/course/*`
- etc.

The `[[path]]` syntax creates a catch-all route that captures all paths under that endpoint.

## Middleware

The `_middleware.ts` file runs before all Pages Functions and handles:
- CORS preflight requests (OPTIONS)
- Adding CORS headers to all responses
- Global error handling (if needed)

## Shared Utilities

All Pages Functions use shared utilities from `src/functions-lib/`:
- `cors.ts` - CORS headers and handling
- `response.ts` - Response formatting helpers
- `supabase.ts` - Supabase client creation
- `types.ts` - Shared TypeScript types

## Migration Status

| API | Status | Original Worker |
|-----|--------|----------------|
| assessment | ⏳ Pending | cloudflare-workers/assessment-api |
| career | ⏳ Pending | cloudflare-workers/career-api |
| course | ⏳ Pending | cloudflare-workers/course-api |
| fetch-certificate | ⏳ Pending | cloudflare-workers/fetch-certificate |
| otp | ⏳ Pending | cloudflare-workers/otp-api |
| storage | ⏳ Pending | cloudflare-workers/storage-api |
| streak | ⏳ Pending | cloudflare-workers/streak-api |
| user | ⏳ Pending | cloudflare-workers/user-api |
| adaptive-aptitude | ⏳ Pending | cloudflare-workers/adaptive-aptitude-api |
| analyze-assessment | ⏳ Pending | cloudflare-workers/analyze-assessment-api |
| question-generation | ⏳ Pending | cloudflare-workers/question-generation-api |
| role-overview | ⏳ Pending | cloudflare-workers/role-overview-api |

## Local Development

To test Pages Functions locally:

```bash
# Install Wrangler CLI if not already installed
npm install -g wrangler

# Run local development server
wrangler pages dev

# Or with specific port
wrangler pages dev --port 8788
```

## Deployment

Pages Functions are deployed automatically with the Cloudflare Pages application. They deploy atomically with the frontend, ensuring consistency.

## Environment Variables

Environment variables are configured in the Cloudflare Pages dashboard and are accessible via `context.env` in each function.

Required environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- Additional API-specific variables as needed

## Next Steps

1. Migrate each worker's logic to its corresponding Pages Function
2. Update imports to use shared utilities
3. Test locally with `wrangler pages dev`
4. Deploy to staging for integration testing
5. Gradually shift traffic from original workers to Pages Functions
