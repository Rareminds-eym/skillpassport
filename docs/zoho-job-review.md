# Zoho job publisher review scope

Job publishing still requires a current operator-reviewed policy, live approval,
current approver authority, destination ownership, available posting capacity and
a transactional receipt. This change does not approve jobs or enable publishing.

## Why readiness used to expire

The original fingerprint included executable objects from every application
schema. A migration for an unrelated feature could therefore invalidate the
job-publisher review and report Job creation as unavailable.

The scoped implementation starts from the approved job writer and opportunities,
then follows their dependencies. It includes job-related routines, tables,
triggers and their firing modes, defaults, generated expressions, indexes,
constraints, rules, policies, types, operators, casts and extension versions.
Read-only lookups do not bring the lookup table's unrelated write triggers into
the scope. Cascades, partition routing and writes from transitive helpers do.
The review machinery itself is also fingerprinted.

PostgreSQL does not record body dependencies for PL/pgSQL or string-defined SQL.
The implementation supplements pg_depend with conservative identifier and call
references from those bodies, across schemas and overloads. This is an
approximation that favors including an ambiguous dependency over omitting one;
an executable identifier or overload can require review even if a particular branch
is not taken. Custom operator overloads and casts affecting built-in types are
also conservatively included because they can change expression behavior.
Comments and ordinary text literals are excluded from reference matching.
Constant catalog references and sequence names remain dependencies. Escaped
catalog-reference literals require static SQL and fail review explicitly rather
than being silently omitted. Unicode-escaped identifiers are normalized,
including custom UESCAPE characters, six-digit escapes and surrogate pairs.
It does not claim to infer arbitrary dynamically constructed SQL.

Dynamic statements in the reachable PL/pgSQL path cause review to fail closed.
The code-token scanner distinguishes those statements from comments, quoted
identifiers, ordinary literals and dollar-quoted literals. Nonstandard string
semantics are unsupported. A failed or oversized dependency analysis never
substitutes an old fingerprint or a partial success result.

## Rollout

The migration was applied to local SkillPassport and SkillPassport QA
(`qidmndjtlbajwswufghf`) with policy attestations and the existing writer preserved.
Post-deployment QA measurements found an outstanding performance gap: fingerprint
calculation took 8.76 seconds, and dependency traversal took 10.55 seconds for
1,287 objects. Both exceed the application's five-second dependency deadline.
Do not treat passing fixture timings as proof of QA readiness. A separately
reviewed performance follow-up is required before enabling job publishing.

1. Obtain explicit approval to apply only
   [the scoped-review migration](../supabase/migrations/20270314000000_zoho_scoped_job_review.sql)
   to the selected environment. The existing dashboard and RPC response contracts
   remain compatible; no Worker deployment is required for this migration.
2. Review the current job-writing effects in Integration settings → Job publication
   policy. Save the reviewed policy once through the existing audited action.
   Applying the migration does not automatically refresh this attestation.
3. Run fresh job discovery and inspect the proposals before approving them.
   Saving policy increments the configuration revision, invalidating old reviews.
4. After resolving the QA runtime gap above, confirm job readiness. Confirm actual creation separately through approved
   execution history and its destination receipt.

The migration is schema-only and transactional. It does not delete staging,
change mappings or entitlements, create destination records, send messages, or
change any stored policy fingerprint. It intentionally invalidates the previous
review format once. Future unrelated migrations no longer invalidate the review
unless they intersect the conservative job dependency scope.

Rollback requires a separately approved forward migration restoring the previous
surface implementation from the operator-audit migration, followed by explicit
policy review again. Do not edit migration history or silently attest the changed
surface during either rollout or rollback.

## Verification

Run `node scripts/checks/test-zoho-job-publisher-sql.mjs` from SkillPassport.
For runners with a per-check time limit, run the same harness separately with
`--publisher` and `--scope`. Each mode creates and removes its own database;
the default command still runs both suites together.
The harness creates a uniquely named disposable database and removes it in
finally; it does not migrate the running application's database. Fixtures cover
unrelated tables, functions, enums, indexes, grants and lookup-table triggers;
transitive and cross-schema helpers; defaults, rules, trigger drift, expression
indexes, index support functions, identity sequences, multiple write targets and
dynamic statements, comment/literal-only references and Unicode-escaped helper
calls with default and custom escape characters. A scale fixture adds 400 unrelated writers and checks that
fingerprinting remains within the existing five-second dependency timeout. Existing approval, receipt, quota race,
Platform-only ownership, no-email and browser-write safeguards run through the
scoped implementation too.
