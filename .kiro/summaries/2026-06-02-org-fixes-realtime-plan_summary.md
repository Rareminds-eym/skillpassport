# Summary: org_id fixes + realtime DO hub plan + updated_at migrations

## Goal
- Fix all `org_id`/`organization_id` column references that fail because target tables don't have those columns.
- Add `updated_at` to 3 realtime-polled tables missing it.
- Migrate `/api/realtime-stream` from polling-based SSE to DO hub pattern (planned).

## Done
- Verified DB schema for all affected tables.
- Fixed 21 org column references across `college-admin/[[path]].ts`, `reports.ts`, `transcripts.ts`, `assessments.ts`, `admissions.ts`, `marks.ts`.
- Fixed `learners/index.ts`: `.eq('id', learnerId)` → `.or('id.eq.X,user_id.eq.X')` to handle both DB PK (`learners.id` — used by LearnerPublicViewer QR/links) and auth UUID (`user.id` — used by ModernLearningCard). Added `.maybeSingle()`.
- Fixed `learners/ai-recommendations.ts`: `proficiency` → `proficiency_level`.
- Fixed `courses/[[path]].ts`: `.single()` → `.maybeSingle()` on learners email lookup.
- Removed stale `.eq('org_id', ...)` from `educator/index.ts`, `analytics/speed.ts`, `analytics/kpis.ts`, `analytics/activities.ts`, `recruiter/offers.ts`.
- Removed stale `.eq('organization_id', ...)` on `license_assignments` (no such column) from `subscription/actions.ts` and `payments/handlers/organization-queries.ts`.
- Created migration `supabase/migrations/20260602000200_add_updated_at_realtime_tables.sql` adding `updated_at` to `shortlist_candidates`, `pipeline_activities`, `placements` with triggers. `placements` reuses existing `update_placements_timestamp` trigger; `shortlist_candidates` and `pipeline_activities` get new triggers.
- Verified `tsc --noEmit` compiles clean.
- Ran `npm run pages:dev` — all realtime calls return 200 OK.
- Created DO hub migration plan at `skillpassport/.kiro/plans/2026-06-02-realtime-do-hub-migration-plan.md`.
- Found and fixed 4 bugs in the plan (DO stub import, filter prefix stripping, SSE client design, stale query params).

## Key Insight: Two ID Systems
`learners` table has `id` (PK) and `user_id` (auth UUID). Callers pass either:
- `user?.id` (auth UUID) from `ModernLearningCard` → needs `user_id` match
- `learners.id` (DB PK) from LearnerPublicViewer QR codes/share links → needs `id` match
Fixed with `.or('id.eq.X,user_id.eq.X')`.

## Key Decisions
- Tables with `college_id` → use `.eq('college_id', ...)`
- Tables without any org column → remove `.eq()` filter entirely
- `license_pools`, `subscription_cache`, `organization_invitations` DO have `organization_id` — left unchanged
- Payment RPCs pass `org_id` as metadata — left unchanged
- DO hub pattern chosen over direct Supabase Realtime WebSocket per user requirement
- `placements` already had `updatedAt` + `update_placements_timestamp` trigger — migration adds `updated_at` column and the existing trigger auto-populates it

## Pre-existing Issues (not introduced by us)
- Tables `admissions`, `marks`, `educators`, `analytics_speed`, `analytics_kpis`, `activities`, `organization_users` don't exist in DB — "relation does not exist" at runtime
- `placement_offers` table doesn't exist (crash in `reports.ts`)
- `offers` has no `recruiter_id` column (crash in `recruiter/offers.ts`)
- `LearnerPublicViewer.jsx` references undefined `authLoading` variable

## Next Steps
- Begin Phase 1 of DO hub migration: create `realtime-worker/`, rewrite `realtime-stream/index.ts` as thin proxy, create `functions/lib/realtime.ts`, update wrangler config.
