# Legacy AI worksheet retirement ? 6 November 2026

## Issue
The older download-only worksheet flow still used three tables while the intended design uses seven current course-index and saved-assignment tables. The unpublished legacy migrations also contained shared teaching functions needed by the current flow.

## Logic
Remove the legacy publication/download UI and API actions. Keep only teaching context on the existing worksheets endpoint, returning HTTP 410 for retired actions. Chat delivery evidence now comes from current learner allocations, scoped by educator and course. Preserve shared scope/mapping/context functions in a table-free migration.

## Files

### Implementation and migration
- [ai_teaching_context migration](../../supabase/migrations/20270219020700_ai_teaching_context.sql): preserves educator scope, mapped learners and teaching context without legacy tables or enums.
- [worksheets handler](../../functions/api/ai-tutor/handlers/worksheets.ts): keeps context, rejects retired operations without table access.
- [chat handler](../../functions/api/ai-tutor/handlers/ai-tutor-chat.ts): uses current assignments/allocations for verified delivery counts.
- [worksheetService](../../src/features/ai-tutor/api/worksheetService.ts): context-only API contract.
- [worksheetQueries](../../src/features/ai-tutor/model/worksheetQueries.ts): context-only query hook.
- [AITutorPanel](../../src/features/ai-tutor/ui/AITutorPanel.tsx): removes old publication fallback.
- [SaveGeneratedMaterial](../../src/features/ai-tutor/ui/SaveGeneratedMaterial.tsx): removes obsolete fallback prop and rendering.
- [SavedMaterialWorkspace](../../src/features/ai-tutor/ui/SavedMaterialWorkspace.tsx): removes Previous worksheets and disabled-feature fallback.

### Validation and supporting scripts
- [worksheet handler tests](../../functions/api/ai-tutor/handlers/__tests__/worksheets.test.ts): verifies context permissions and HTTP 410 retirement without database queries.
- [chat tests](../../functions/api/ai-tutor/handlers/__tests__/ai-tutor-chat.test.ts): verifies counts come from current allocations.
- [context hook tests](../../src/features/ai-tutor/model/__tests__/worksheetQueries.test.tsx): verifies query sharing and disabled/anonymous behavior.
- [panel tests](../../src/features/ai-tutor/ui/__tests__/AITutorPanel.test.tsx): verifies current assignment navigation and save/assign controls.
- [workspace tests](../../src/features/ai-tutor/ui/__tests__/SavedMaterialWorkspace.test.tsx): verifies retired worksheet UI is absent; isolates shared dropdown imports to avoid unrelated animation timers.
- [local teaching SQL checks](../../supabase/tests/ai-worksheet-mapping.sql): verifies scope, learner membership, permissions and absence of old tables in a rollback-only transaction.
- [course DB test runner](../../scripts/test-course-ai-db.mjs): updates the renamed course-index migration path.
- [saved-assignment DB test runner](../../scripts/test-saved-assignments-db.mjs): updates renamed migration paths and removes obsolete worksheet fixture tables.

### Deleted legacy files
These files were removed, not replaced with empty files:
- `supabase/migrations/20270219020700_ai_worksheet_assignments.sql`
- `supabase/migrations/20270219020800_scope_ai_worksheet_recipients.sql`
- `supabase/migrations/20270219020900_worksheet_mixed_difficulty.sql`
- `supabase/migrations/20270219021000_worksheet_combined_assignment.sql`
- `functions/api/ai-tutor/utils/worksheet-deferral.ts` and its corresponding test.
- `src/features/ai-tutor/ui/AssignWorksheetButton.tsx` and its corresponding test.
- `src/features/ai-tutor/ui/LearnerWorksheets.tsx` and its corresponding test.
- `supabase/tests/ai-worksheet-publication.sql`
- `supabase/tests/ai-worksheet-bundle.sql`

## Applied locally
Confirmed `.dev.vars` points to `http://127.0.0.1:54321` and executed SQL only in Docker container `supabase_db_skillpassport`. Applied the preserved teaching helper definitions. Dropped `ai_worksheet_sets`, `ai_worksheet_solutions`, `ai_worksheet_recipients`, their three publication functions and two unused enums without CASCADE. This deleted the authorized local legacy data: 13 worksheet rows, 13 solution rows, and 84 recipient rows. No remote database was accessed or changed.

## Validation
- Eight focused Vitest suites: 104 tests passed.
- Confirmed all seven current tables still exist.
- Current records unchanged: 3 assignments, 16 learner allocations, 2 submissions and 2 results.
- Local rollback-only teaching mapping and permission checks passed.
- Current allocation function verified for 8 learners in a rollback-only transaction after the drop.
- No active implementation references to the three retired tables remain; SQL tests reference them only to assert absence.
- Browser visual verification and fresh remote migration application were not performed. Disposable DB runner scripts were updated but not executed in this task.
