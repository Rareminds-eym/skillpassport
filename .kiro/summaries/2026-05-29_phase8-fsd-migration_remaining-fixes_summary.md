# Phase 8 FSD Migration — Remaining Fixes

**Date**: 2026-05-29
**Status**: Complete

## What Was Done

### 3 Remaining Fixes + 1 Cleanup

1. **`useLearnerProfile.ts`** — Replaced `supabase` import with `apiPost`; `fetchEducation`/`fetchExperience`/`fetchSkills` now call `apiPost('/learners/profile', { action: 'get-education|experience|skills' })` instead of `supabase.from()`.

2. **`MainSettings.jsx`** + **`Dashboard.jsx`** — Replaced dynamic `import('@supabase/supabase-js')` (creating new client with anon key) with `apiPost('/learners/profile', { action: 'toggle-skill-visibility', skillId, enabled })`.

3. **Backend `profile.ts`** — Added 4 new actions:
   - `get-education` — reads from `education` table by `learner.id`
   - `get-experience` — reads from `experience` table by `learner.id`
   - `get-skills` — reads from `skills` table by `learner.id` (filtered `training_id IS NULL`)
   - `toggle-skill-visibility` — updates `skills.enabled` by `id`

4. **`api.js`** — Dead legacy file deleted from `src/shared/api/`.

### Bugs Found & Fixed During Session

- **Duplicate `handleToggleSoftSkillEnabled`** in `Dashboard.jsx`: The file had two copies of the same handler function. One was using `logger.error()`, the other `console.error()` and the old dynamic import pattern. Removed the duplicate.
- **Double-wrapping bug** in `profile.ts` new actions: `apiSuccess({ data: eduData })` creates an extra nesting level. Frontend expects `response.data` to be the data directly, not `response.data.data`. Fixed to `apiSuccess(eduData, ...)`.
- **`toggle-skill-visibility`** had the same double-wrap pattern: `apiSuccess({ data: { success: true } })` → `apiSuccess({ success: true })`.

### Session Scope

This session focused on the 3 remaining items from the previous session's deep audit, plus `api.js` cleanup. The broader Phase 8 migration (~73 remaining `supabase.from()` calls across 33 files, ~200+ files still importing `supabase`) is untouched.

## Build Verification

- Vite frontend build: 0 errors ✅
- Backend tsc: no new errors ✅
