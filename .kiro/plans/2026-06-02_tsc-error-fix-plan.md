# TSC Error Fix Plan — All Pre-existing Errors

**Created**: 2026-06-02
**Total**: 8,651 errors (8,271 app + 380 functions)
**Files**: ~817 files across ~230 directories

---

## Classification

### App Errors (tsconfig.app.json) — 8,271 errors in 763 files

| Code | Category | Count | Fix Strategy |
|------|----------|------:|-------------|
| TS2339 | Property does not exist on type | 1,880 | Add type assertion `as any` or fix type defs |
| TS7006 | Parameter implicitly has 'any' | 1,647 | Add `: any` to fix `strict: true` |
| TS6133 | Declared but never read | 929 | Remove unused declarations |
| TS18046 | Variable is of type 'unknown' | 716 | Add `as Type` or `if (typeof)` guard |
| TS2304 | Cannot find name | 587 | Add missing imports (supabase, useAuthStore, local vars) |
| TS2345 | Argument type not assignable | 515 | Fix type cast or parameter type |
| TS2305 | Module has no exported member | 353 | Fix re-exports or add missing exports |
| TS7031 | Binding element implicit 'any' | 340 | Add `: any` to destructured params |
| TS2322 | Type not assignable | 180 | Fix type variance |
| TS2353 | Object literal extra property | 149 | Remove extra props or add to type |
| TS7053 | Index type 'any' | 140 | Add index signature or cast |
| TS18048 | Variable possibly 'undefined' | 138 | Add `?.` or `!` assertion |
| TS18047 | Variable possibly 'null' | 120 | Add null check |
| Other | Various smaller categories | ~877 | Mixed strategies |

### Functions Errors (tsconfig.functions.json) — 380 errors in 54 files

| Code | Category | Count | Fix Strategy |
|------|----------|------:|-------------|
| TS2339 | Property does not exist on type | 155 | Fix PostgrestBuilder chaining |
| TS6133 | Declared but never read | 102 | Remove unused vars |
| TS2345 | Argument type not assignable | 48 | Fix Supabase query builder types |
| TS18046 | Variable is 'unknown' | 22 | Add type assertions |
| TS2307 | Cannot find module | 10 | Fix import paths |
| TS18047 | Possibly 'null' | 10 | Add null checks |
| TS7053 | Index 'any' type | 9 | Add index signature |
| Other | Various | ~24 | Mixed |

---

## Phase 1: Automated Batch Fixes (Script-based)

### Batch A1: Remove unused declarations (TS6133) — 929 + 102 = 1,031 errors
**Strategy**: Use `sed` to remove unused variable declarations identified by tsc.
**Files affected**: ~200 files across app + functions
**Approach**: 
- For each file with TS6133 errors, identify the unused variable by name and remove its declaration.
- Be careful: some unused vars might be intentionally kept for future use or side effects.
- **Risk**: Some unused vars may have side effects (top-level calls, class registrations).
- **Safety check**: Only remove `const`/`let`/`import` statements — never remove function calls or class expressions with side effects.

### Batch A2: Add `: any` to implicit 'any' parameters (TS7006 + TS7031) — 1,987 errors
**Strategy**: Find function parameters without types and add `: any`.
**Files affected**: ~250 files
**Approach**:
- TS7006: `(param)` → `(param: any)` for callback parameters
- TS7031: `{ destructured }` → `({ destructured }: any)` for component props
- **Risk**: `any` masks real type issues but is safe for runtime.
- **Alternative**: Could set `strict: false` in tsconfig — faster but removes all type safety.

### Batch A3: Fix 'unknown' type variables (TS18046) — 716 + 22 = 738 errors
**Strategy**: Add `as any` cast where `unknown` variables are accessed.
**Files affected**: ~100 files
**Approach**:
- `err.message` → `(err as any).message`
- `data.map(...)` → `(data as any[]).map(...)`

### Batch A4: Fix possibly undefined/null (TS18048 + TS18047) — 258 + 10 = 268 errors
**Strategy**: Add optional chaining `?.` or nullish coalescing `??`
**Files affected**: ~80 files
**Approach**:
- `obj.prop` → `obj?.prop` or `obj!.prop`
- Automatic for simple cases

**Estimated time for Phase 1**: ~1-2 hours (with scripts). Many can be batched.

---

## Phase 2: Missing Imports (Manual)

### Batch B1: Cannot find name 'supabase' (TS2304 subset) — ~60 errors
**Files**: `src/pages/recruiter/Requisitions.tsx`, `src/pages/teacher/MyTimetable.tsx`, etc.
**Fix**: Add `import { supabase } from '@/shared/api/supabaseClient';`
**Note**: These pages still use direct supabase calls (not migrated). Need to keep the import.
**Files**: ~6 page files

### Batch B2: Cannot find name 'useAuthStore' (TS2304 subset) — ~20 errors
**Files**: Various page files and shared utilities
**Fix**: Add `import { useAuthStore } from '@/shared/model/authStore';`
**Files**: ~8 files

### Batch B3: Other missing names (TS2304) — ~500 errors
**Files**: Various features (assessment API services, type names, utility functions)
**Fix per type**:
- Type names (e.g., `ValidationError`, `LearnerProfile`): Either import from correct module or use inline type
- Local variables (`data`, `error`, `setLoading`): Likely missing `const`/`let` declarations — add them
- Function names (`toast`, `logger`, `jsPDF`): Either import or declare
- Component names (`Toaster`): Import from correct package

### Batch B4: Module export mismatches (TS2305 + TS2307) — ~413 errors
**Fix**:
- Missing exports: Add to barrel files (`index.ts`)
- Wrong paths: Fix import paths
- Wrong module: Update to correct module

**Estimated time for Phase 2**: ~3-5 hours (mostly manual, per-file)

---

## Phase 3: Type Fixes (Manual + Semi-automated)

### Batch C1: Property doesn't exist (TS2339) — 1,880 + 155 = 2,035 errors
**Strategy**: Three-tier approach:
1. If property exists at runtime but not in types: Add `as any` cast
2. If property should exist: Extend the type definition
3. If property is wrong: Fix to the correct property name

**Most common patterns**:
- `data.id` on type `never` → need to fix the chain return type
- `user.school_id` on `User` type → extend the User interface
- `response.property` on `unknown` → add type assertion

### Batch C2: Argument/type not assignable (TS2345 + TS2322) — 695 + 48 = 743 errors
**Strategy**:
- Most are `catch (err)` where `err` is `unknown` → `(err as Error)`
- Supabase query builder type mismatch → cast with `as any`
- String vs number mismatches → use `String()` or `Number()`

### Batch C3: Index signature missing (TS7053) — 140 + 9 = 149 errors
**Strategy**: Add `[key: string]: any` to affected types or use `Record<string, any>`

### Batch C4: Object literal extra properties (TS2353) — 149 errors
**Strategy**: Either add the extra props to the type definition or use `as any`

**Estimated time for Phase 3**: ~4-8 hours (mostly manual)

---

## Phase 4: Functions Backend (Targeted)

### Batch D1: PostgrestBuilder chaining (functions) — ~155 TS2339 + ~48 TS2345
**Strategy**: Fix Supabase query builder chains that lose type context
**Pattern**: `.select('*', { count: 'exact' })` without terminating with `.then()` or `await`
**Fix**: Ensure proper type assertions on builder chains

### Batch D2: onRequestPost export (TS2724) — 4 files
**Files**: `events/[[path]].ts`, `receipts/[[path]].ts`, `subscription/[[path]].ts`, `teacher/[[path]].ts`
**Fix**: These files export `onRequestHandler` but the actions module exports `onRequestPost` — rename or re-export correctly.

### Batch D3: Unused vars in functions (TS6133) — 102 errors
**Strategy**: Same as Batch A1 but for functions code.

### Batch D4: Unknown data (TS18046) — 22 errors
**Strategy**: Same as Batch A3 but for functions code.

**Estimated time for Phase 4**: ~1-2 hours

---

## Total Estimated Effort

| Phase | Description | Errors | Files | Est. Time |
|-------|-------------|-------:|------:|----------:|
| 1 | Automated batch fixes | ~4,000 | ~500 | 1-2 hrs |
| 2 | Missing imports | ~1,000 | ~80 | 3-5 hrs |
| 3 | Type fixes | ~3,200 | ~150 | 4-8 hrs |
| 4 | Functions backend | ~380 | ~54 | 1-2 hrs |
| | **Total** | **~8,651** | **~817** | **9-17 hrs** |

---

## Recommended Order

1. **Phase 1 (Batches A1-A4)** — Highest impact, lowest risk. Automated scripts fix ~50% of errors.
2. **Phase 4 (Batches D1-D4)** — Functions backend is smaller scope (380 errors, 54 files). Quick to finish.
3. **Phase 2 (Batches B1-B4)** — Missing imports block subsequent type analysis. Must do before Phase 3.
4. **Phase 3 (Batches C1-C4)** — Most complex fixes, saved for last.

---

## Risk Assessment

- **Low risk**: Removing genuinely unused vars (Batch A1). If a var is truly unused, removing it won't break anything.
- **Medium risk**: Adding `: any` (Batch A2) — masks type errors but doesn't change runtime behavior.
- **High risk**: Module export changes (Batch B4) — changing exports could break imports across the codebase. Need careful verification.
- **Very high risk**: Property/type fixes (Phase 3) — changing type definitions could reveal new errors elsewhere.

**Safety net**: Run `npx tsc --noEmit -p tsconfig.app.json` after each batch to verify no regressions.

---

## Files Most Affected (Top 20)

These files account for ~40% of all errors. Fixing them first gives the biggest impact:

| File | Approx. Errors |
|------|---------------:|
| `src/pages/recruiter/TalentPool.tsx` | ~200 |
| `src/pages/recruiter/Shortlists.tsx` | ~100 |
| `src/pages/recruiter/Requisitions.tsx` | ~80 |
| `src/pages/learner/UnifiedDashboard.jsx` | ~50 |
| `src/pages/learner/AssessmentTest.jsx` | ~50 |
| `src/shared/lib/hooks/useRealtimeProgress.ts` | ~40 |
| `src/pages/teacher/MyTimetable.tsx` | ~40 |
| `src/shared/api/realtimeService.ts` | ~30 |
| `src/features/assessment/ui/AssessmentTestPage.tsx` | ~30 |
| `src/shared/api/httpClient.ts` | ~20 |
| `src/shared/api/storageService.ts` | ~20 |
| `src/entities/learner/ui/LearnerProfileDrawer` | ~60 |
| `src/pages/subscription/*` | ~50 |
| `functions/api/educator/dashboard/[[path]].ts` | ~30 |
| `functions/api/college-admin/school-admin.ts` | ~20 |
| `functions/api/organization/handler.ts` | ~15 |
| `functions/api/settings/[[path]].ts` | ~12 |
| `functions/api/learner-pages/[[path]].ts` | ~10 |

---

## Quick Win: tsconfig Relaxation

If the user approves, we can eliminate ~929 + 380/6133 (~1,100) errors immediately by changing:

```json
// tsconfig.app.json
"noUnusedLocals": false,
"noUnusedParameters": false,
```

And remove `strict: true` for another ~3,500 implicit-any/unknown errors. **However**, this reduces type safety and should not be the default choice.

---

**Next step**: User should confirm they want to proceed with the full plan and specify any preferences (e.g., prefer tsconfig relaxation vs. code fixes).
