# Phase 8 — FSD Architecture Migration Plan

**Date**: 2026-05-28  
**Status**: Planned (awaiting batch execution)

---

## Overview

Migrate SkillPassport frontend from direct `supabase.from()` calls to Pages Function–backed `apiClient` endpoints, and apply FSD naming conventions.

**Actual scope** (from codebase audit):
- **124** direct `supabase.from()` calls across **46 files** in `src/`
- **0** duplicate files in `functions/` that need migration
- The `apiClient.ts` target already exists (`apiGet`/`apiPost`/etc.)

---

## T-068: Plan Per-Feature Migration of 124 `supabase.from()` Calls

### Strategy: Feature-by-Feature, Bottom-Up

Group by table/feature, not by file. Each feature gets a Pages Function endpoint; the frontend switches to `apiClient`.

### Batch 1 — Simple Read-Only (lowest risk)

| Feature | Files | Calls | Endpoints Needed |
|---------|-------|-------|-----------------|
| **notifications** | `useNotifications.ts`, `useAdminNotifications.ts` | 4 | `GET /api/notifications` |
| **messages** | `MessageModal.tsx` (x2) | 6 | `GET/POST /api/messages` |
| **settings** | `settingsService.ts` | 1 | `GET/PUT /api/settings` |

**Est**: 8 new endpoints to write (3 new Pages Function files)  
**Risk**: Very low (read-only, no cascading effects)

### Batch 2 — Learner Profile (medium complexity)

| Feature | Files | Calls | Endpoints Needed |
|---------|-------|-------|-----------------|
| **learner profile** | `useLearnerAchievements.ts`, `useLearnerActivity.ts`, `useLearnerActions.ts` (x2) | 14 | `GET /api/learners/:id/achievements`, `GET /api/learners/:id/activity`, `POST /api/learners/:id/actions` |
| **skills** | `learnerService.ts`, `resumeDataService.ts`, `SkillTrackerExpanded.jsx`, `AddLearningCourseModal.jsx` | 9 | `GET /api/learners/:id/skills` |
| **certificates** | `learnerService.ts`, `certificateService.ts`, `resumeDataService.ts`, `dashboardApi.ts`, `AddLearningCourseModal.jsx` | 6 | `GET /api/learners/:id/certificates` |

**Est**: 6 new endpoints  
**Risk**: Low (read-heavy, authenticated user context)

### Batch 3 — Digital Portfolio (medium complexity)

| Feature | Files | Calls | Endpoints Needed |
|---------|-------|-------|-----------------|
| **resume data** | `resumeDataService.ts` | 6 | `GET /api/portfolio/:id/resume` |
| **trainings** | `useLearnerAchievements.ts`, `resumeDataService.ts`, `dashboardApi.ts`, `useLearnerActivity.ts` | 5 | `GET /api/learners/:id/trainings` |
| **education/experience** | `useLearnerAchievements.ts`, `resumeDataService.ts`, `useLearnerActivity.ts` | 6 | `GET /api/learners/:id/education`, `GET /api/learners/:id/experience` |

**Est**: 4 endpoints  
**Risk**: Low

### Batch 4 — Library (identical duplicate)

| Feature | Files | Calls | Endpoints Needed |
|---------|-------|-------|-----------------|
| **library** | `libraryService.ts` (x2), `libraryService.ts` (x2) — identical | 10 | `GET/POST /api/library/books`, `GET /api/library/history`, `GET/POST /api/library/issued` |

**Est**: 3 endpoints + deduplicate frontend services  
**Risk**: Medium (affects both library + college-admin)

### Batch 5 — Educator Copilot (heaviest, 15 calls)

| Feature | Files | Calls | Endpoints Needed |
|---------|-------|-------|-----------------|
| **educator dashboard** | `dashboardApi.ts` | 15 | `GET /api/educator/dashboard/*` (multiple) |

**Est**: 1 endpoint consolidating all queries  
**Risk**: Medium (complex aggregation query)

### Batch 6 — College Admin (14 calls, reports-heavy)

| Feature | Files | Calls | Endpoints Needed |
|---------|-------|-------|-----------------|
| **college admin reports** | `reportsService.ts` | 14 | `POST /api/college-admin/reports` (generic query endpoint) |

**Est**: 1-2 endpoints  
**Risk**: High (complex joins, aggregation)

### Batch 7 — Remaining Features

| Feature | Files | Calls | Endpoints Needed |
|---------|-------|-------|-----------------|
| **opportunities** | `opportunitiesService.ts` | 3 | `GET /api/opportunities` |
| **competitions** | miscellaneous | 3 | `GET/POST /api/competitions` |
| **analytics** | `useAnalytics.ts`, `optimizedQueryService.ts` | 4 | `POST /api/analytics/query` (dynamic table) |
| **admin** | `migrationService.ts` (568 lines) | — | Move orchestration to Pages Function (T-069) |
| **all others** | 28 tables with 1 call each | 28 | Generic or per-table endpoint |

---

## T-069: Move `migrationService.ts` Orchestration to Backend

**File**: `src/features/admin/api/migrationService.ts` (568 lines)

The subscription migration orchestration logic lives entirely in the frontend, making 428+ Supabase admin-client calls. Move it to a Pages Function:

1. Create `functions/api/admin/migration/[[path]].ts` — wraps with `withAuth` + `requireRole('admin')`
2. Move all migration logic there using `getServiceClient(env)` (service_role)
3. Frontend: replace with `apiPost('/admin/migration/start', { ... })` + polling

Note: Re-examine whether this 568-line service is still needed given SSO subscription consolidation (Phase 3). If `createSubscription` RPC already exists on SSO, the migration service may be largely obsolete.

---

## T-070: Remove Frontend Orchestration from `migrationService.ts`

After T-069 creates the backend endpoint:
1. Delete frontend `migrationService.ts` 
2. Replace all callsites with `apiPost('/admin/migration/...')`
3. Update any polling logic (use `setInterval` vs Pages Function `waitUntil`)

---

## T-071 to T-075: Naming & Restructuring

These are pure directory/file renames. Strategy:

**T-071** — `components/` → `ui/`:
- All directories named `components/` inside features → `ui/`
- Impact: update all `@/features/*/components/*` imports
- Can be done per-feature with codemod

**T-072** — `hooks/` → `lib/`:
- All directories named `hooks/` inside features → `lib/`
- E.g., `features/notifications/hooks/` → `features/notifications/lib/`
- Update imports

**T-073** — Extract business logic from `pages/`:
- `pages/*.tsx` files often contain inline business logic
- Extract to `features/*/lib/` or `features/*/model/`
- Only for files with >100 lines of non-rendering logic

**T-074** — Standardize `shared/ui` naming:
- Rename 27 PascalCase files in `shared/ui/` to kebab-case
- Or the reverse: ensure all components are PascalCase consistently
- Need user preference on naming convention

**T-075** — Flatten deeply nested component trees:
- Components like `features/learner-profile/ui/LearnerProfileDrawer/hooks/` (4 levels deep)
- Flatten to `features/learner-profile/ui/hooks/` — remove intermediate dirs
- Do this as part of each feature migration

---

## Execution Order

```
Batch 1 (notifications, messages, settings)   → Week 1
Batch 2 (learner profile, skills, certs)       → Week 1
Batch 3 (portfolio, trainings, education)      → Week 2
Batch 4 (library dedup)                        → Week 2
Batch 5 (educator copilot)                     → Week 3
Batch 6 (college admin)                        → Week 3
Batch 7 (remaining 28 single-call tables)      → Week 3
T-069/T-070 (migration service)                → Week 2-3
T-071/T-072 (components->ui, hooks->lib)       → Week 4
T-073 (extract from pages/)                    → Week 4
T-074/T-075 (naming, flatten)                  → Week 4
```

## Risk Mitigation

- **Feature flags**: Each batch behind a flag (localStorage or env var)
- **Parallel run**: Keep `supabase.from()` calls until `apiClient` is verified
- **Rollback**: Revert the Pages Function; frontend falls back to direct Supabase
- **Testing per batch**: `apiClient` endpoints use existing Pages Function test patterns
