# Decision Record — User → School-Internal-Role Mapping (Task 19.1)

**Spec**: `rbac-architecture-violations-fix`
**Task**: 19.1 — "Decide (and implement) whether to derive from `teachers`/`school_educators` records or add a `user_school_role` assignment table/view"
**Date**: 2026-06-07
**Status**: Decided + interim seam implemented (non-destructive, no DB change)

---

## 1. Context

After `users.role` is dropped in Phase P4, the kept college/school permission
lookup (`college_role_module_permissions.role_type` join in
`user/handlers/actions.ts` `get-permissions`) and the school-internal scoping
reads in `educator/dashboard/[[path]].ts`, `messaging/actions.ts`,
`school-admin/actions.ts` (`handleFetchCommunicationSchoolData`) can no longer
resolve a user's **school-internal** role from `users.role`.

`resolveSchoolRole(userId, orgId)` (task 19.2) must supply that role. Per
design.md clause 8.5:

```
resolveSchoolRole(userId, orgId):
  1. ssoRoles ← JWT.roles
  2. if an SSO role maps to a permission role_code → use it
  3. else look up the user's school-internal assignment
     (from teachers/school_educators record, surfaced as role_code)
  4. query college_role_module_permissions by role_code
```

This record decides the SOURCE for step 3 and implements the data-access seam
that 19.2 will compose. It does **not** implement `resolveSchoolRole` itself.

---

## 2. Evidence (schema + current readers)

### 2.1 `school_educators` — REAL table, suitable source

`supabase/migrations/20260526000000_schema.sql`:

| Column      | Type           | Notes |
|-------------|----------------|-------|
| `user_id`   | `uuid` NOT NULL | FK → `users(id)` (`school_educators_user_id_fkey`) |
| `school_id` | `uuid` NOT NULL | FK → `organizations(id)` (`school_educators_school_id_fkey`) |
| `role`      | `varchar(20)` DEFAULT `'subject_teacher'` | CHECK ∈ {`school_admin`, `principal`, `it_admin`, `class_teacher`, `subject_teacher`} |
| `email`     | `varchar(255)` | secondary key used by some readers |

- Keyed by **both** `user_id` (→ user) and `school_id` (→ org). Because
  `school_id` FKs to `organizations(id)`, **for schools `orgId === school_id`**,
  so the `(userId, orgId)` signature maps cleanly onto `(user_id, school_id)`.
- The `role` CHECK values ARE exactly the school-internal taxonomy
  (`SchoolInternalRole`), not SSO roles.
- Already the source the deferred readers use:
  - `school-admin/actions.ts` → `.eq('role','school_admin')` to find the school.
  - `messaging/actions.ts` → `.eq('role','school_admin').eq('school_id', …)`.
  - `educator/dashboard/[[path]].ts` → `select('id, school_id, role')` for scope.

### 2.2 `teachers` — PHANTOM table (no `CREATE TABLE`)

- No `CREATE TABLE ... teachers` exists in `supabase/migrations/**`.
- Queried at runtime in only two places, **by `email`**:
  - `user/handlers/actions.ts` (`get-teacher-role` action) → `select('role')`.
  - `explorer/actions.ts` (debug) → `select('*')`.
- Same status as `user_roles` (design.md "Existing state to reconcile"): a
  query target with no schema definition — either created by an out-of-tree
  migration or absent (queries error / return null at runtime). It **cannot be
  relied upon** as the authoritative source.

### 2.3 `college_role_module_permissions.role_type`

- Currently typed `public.user_role` (SSO-ish enum: `school_admin`,
  `college_admin`, `college_educator`, `school_educator`, …).
- Task 20 (P4) re-types it to `role_code TEXT REFERENCES school_internal_roles`.
- This is why step 2 of `resolveSchoolRole` matters: SSO roles that are also
  valid `role_type`/`role_code` values (e.g. `school_admin`, `college_admin`)
  resolve **directly from the JWT** with no `school_educators` read at all.

### 2.4 College educators

- College-internal designation lives in `college_lecturers`
  (`collegeId`, `department`), NOT `school_educators`. The dashboard derives
  `admin` vs `lecturer` from `department === 'Administration'`.
- For the kept permission lookup, the **SSO role** (`college_admin` /
  `college_educator`) is what matches `role_type`, so college users are handled
  by step 2 (JWT) — they do not need a `school_educators` row.

---

## 3. Decision

**Derive the school-internal role from the EXISTING `school_educators` record
(keyed by `user_id`, scoped by `school_id === orgId`), with a best-effort
`teachers`-by-email fallback. DO NOT introduce a new `user_school_role`
table now.**

### Rationale
- `school_educators` is a real, FK-backed table keyed by exactly `(user_id,
  school_id=orgId)` and its `role` CHECK values ARE the `SchoolInternalRole`
  taxonomy. It genuinely supplies the mapping for the school path.
- Non-destructive: no `CREATE TABLE`, no migration, no Supabase command (which
  would require separate approval).
- Matches what the current deferred readers already do — minimal behavior risk.
- SSO roles that are also permission `role_code`s (`school_admin`,
  `college_admin`, `college_educator`, `school_educator`) resolve directly from
  the JWT (step 2), so the DB read is only needed for the genuinely
  school-internal sub-roles (`principal`, `it_admin`, `class_teacher`,
  `subject_teacher`).

### Exact lookup
```
lookupSchoolInternalRole(supabase, userId, { orgId? }):
  1. q = school_educators.select('role, school_id').eq('user_id', userId)
     if orgId: q = q.eq('school_id', orgId)
  2. row ← q.maybeSingle()  (or first active row if orgId omitted)
     if row?.role ∈ SCHOOL_INTERNAL_ROLE_CODES → return row.role
  3. fallback (best-effort, never throws): teachers.select('role').eq('email', email)
     if present and valid → return it
  4. else → return null   (caller decides default; no `subject_teacher` default here)
```

### How SSO-that-are-also-permission-roles are handled
NOT in this helper. They are handled by `resolveSchoolRole` (task 19.2) step 2,
straight from `JWT.roles`, BEFORE calling this DB helper. This helper covers
only step 3 (the school-internal assignment), keeping the JWT-vs-DB boundary
crisp (Property 7 / FC-10: no authz resolution from shadow stores — this is a
school-FEATURE-permission read, not an authz decision).

---

## 4. Gaps & interim handling

| Gap | Impact | Interim handling |
|-----|--------|------------------|
| `school_educators.role` CHECK has only 5 codes (`school_admin`, `principal`, `it_admin`, `class_teacher`, `subject_teacher`); `SchoolInternalRole` also has `vice_principal`, `accountant`, `librarian`, `parent`, `career_counselor`. | Those extra roles can't be stored in `school_educators` today. | Helper returns whatever the DB holds; unknown/absent → `null`. If those roles become needed, widen the CHECK (migration, approval-gated) — not a new table. |
| `teachers` is a phantom table. | Fallback query may error or return nothing. | Wrapped in try/catch, **fails soft to `null`** — never throws, never blocks. |
| A user may have multiple `school_educators` rows (multi-school). | Ambiguity when `orgId` is omitted. | `orgId` SHOULD be passed (it scopes to one school). Without it, the helper returns the first active row and logs an ambiguity warning. |
| College internal sub-roles beyond admin/lecturer. | Not in `school_educators`. | Out of scope for this helper; college users resolve via the SSO role (step 2). |

### Future recommendation (approval-gated, NOT done now)
If a future requirement needs school-internal roles that `school_educators`
cannot express (e.g. multiple internal roles per user per school, or the extra
`SchoolInternalRole` codes), introduce a dedicated `user_school_role`
assignment table:

```sql
-- PROPOSAL ONLY — requires explicit approval (Expand-Migrate-Contract, P4-style)
CREATE TABLE public.user_school_role (
  user_id    uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  school_id  uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_code  text NOT NULL REFERENCES public.school_internal_roles(code),
  PRIMARY KEY (user_id, school_id, role_code)
);
```
Until then, the `school_educators`-derived seam below is the interim source.

---

## 5. Implemented seam (this task)

`functions/lib/schoolRole.ts` (new, NOT wired into handlers — that is task 12.2):

- `SCHOOL_INTERNAL_ROLE_CODES` / `SchoolInternalRoleCode` — functions-side mirror
  of the frontend `SchoolInternalRole` union (`src/shared/types/permissions.ts`),
  with a KEEP-IN-SYNC comment (functions/ cannot import from src/, per task 10.1).
- `lookupSchoolInternalRole(supabase, userId, opts?)` → `Promise<SchoolInternalRoleCode | null>`
  reading `school_educators` (scoped by `orgId`→`school_id` when provided), with
  the best-effort `teachers`-by-email fallback. Fails soft to `null`.

Task 19.2 will compose: JWT SSO-role mapping (steps 1–2) → this helper (step 3)
→ `college_role_module_permissions` query (step 4) inside `resolveSchoolRole`.

**Confirmed: no DB table created, no migration written, no Supabase command run.**
