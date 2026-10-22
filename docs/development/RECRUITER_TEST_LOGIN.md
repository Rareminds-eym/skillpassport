# Local recruiter test login

Development only. Never run these known-password fixtures against staging or
production, and never copy them into production seeds.

- Email: recruiter.dev@example.com
- Password: the test password supplied for this fixture (stored only as a
  bcrypt cost-12 hash in the SSO dev seed).
- Select **Recruiter** on the login screen.
- Company: **Dev Recruiter Test Company**
- SSO role: recruiter only. App organization membership: member, mapped by
  the existing recruitment mapping to recruiter. No owner/admin grants.

## Apply without resetting either development database

From the parent skill-echosystem workspace, with the local Supabase stacks
running and their normal initial dev seeds already applied:

```bash
docker exec -i supabase_db_sso-auth sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1' < sso-worker/supabase/seed/dev/20261016090000_seed_recruiter_test_login.sql
docker exec -i supabase_db_skillpassport sh -c 'PGPASSWORD="$POSTGRES_PASSWORD" psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1' < skillpassport/supabase/seed/dev/20261016090000_seed_recruiter_test_login.sql
```

Apply **SSO first, app second**. Each file is independently transactional, uses
short lock/statement timeouts, and is safe to rerun for its own fixture. There is
no cross-database transaction: fix an app-side failure and rerun that file.
The scripts refuse conflicting IDs/emails/company records and unexpected roles
instead of taking over another account. A rerun resets this fixture's SSO
password to the requested test password and restores verified/active status.

Both files participate in their repository's explicit db:reset:dev seed glob;
neither is included by db:reset:prod. Do not reset a database just to add this
account. Development-only placement is not a substitute for checking which
database connection you use.

## What is and is not provisioned

SSO gets the verified login, active company membership, authoritative recruiter
claim and SkillPassport product links. The app gets matching user/shadow rows,
company/organization records, an approved recruiter profile and recruitment
settings, so testing does not depend on a queue delivery to create those rows.
Passwords are not copied to the app database.

No subscription, entitlement override, jobs, candidates, or applications are
created. Subscription-gated features retain their normal restrictions. Use
the local SSO worker and local app configuration; a production login will not
see these fixtures.

Fixture IDs:

| Record | UUID |
|---|---|
| User | c90dd3d7-48da-4736-968d-3c796ecbb63d |
| Organization/company | 83b535de-4f65-43c3-926b-2bf209c068b1 |
| SSO membership | a242a91b-0697-4870-8ae7-9c03477a8dcf |
| Recruiter profile | 1942b799-4b6f-4f70-bc1c-f4b39eef243f |

## Validation

The stored bcrypt hash was verified with the same bcryptjs implementation and
cost used by SSO login; an incorrect password was rejected. Both actual seed
files were applied repeatedly in separate disposable PostgreSQL 17 databases
against representative table fixtures, using the checked-in JWT-claims and
recruiter-context SQL functions. Checks covered recruiter-only claims,
SkillPassport product access, verified/active status, profile/company links,
enabled recruitment context, idempotency, collision rejection and refusal to
silently rewrite elevated roles. Matching app rows created by SSO sync without
fixture metadata were accepted. This is not a live HTTP/browser login test.

The current app and SSO databases were not seeded during that disposable-database
validation. Supabase/
Postgres guidance informed short transactions, bounded locks and least-privilege
fixture membership.

## Applied to local development — 2026-10-16

The paired recruiter seeds have now been applied to the running local SSO and
SkillPassport databases, after creating private custom-format backups in
`/tmp/dev-migrate-seed-backup.UIqJ2E/`. These backups are local and temporary;
they are not committed or a durable backup service.

SkillPassport migrations `20261014090000` and `20261015090000` were applied using
the bundled Supabase CLI. Migration histories match all checked-in files:
SkillPassport 87, SSO 23, LTE 56. No databases were reset. LTE's catalog seeds
were not replayed as part of this recruiter/app setup.

Baseline snapshot coverage was checked in temporary tables and rolled back:
no missing baseline fixture keys across 63 SkillPassport tables and 15 SSO
tables. Generated-ID recruitment settings and role mappings were compared by
their unique natural keys. Existing baseline values were preserved, not
overwritten. The incremental learner seeds, assessment response-scale seed,
RBAC bootstrap, and recruiter seeds were applied to their respective databases.

Post-application checks passed:

- Stored SSO bcrypt hash accepts the requested password, rejects an incorrect
  password, and uses cost 12. Account is verified and unblocked.
- Actual JWT-claims RPC returns only `recruiter`, product `skillpassport`, and
  an active membership. No paid recruiter subscription was created.
- Actual app organization-context RPC returns active `member` membership,
  recruitment role `recruiter`, and enabled recruitment; company and recruiter
  profile are active and approved.
- All four new recommendation RPCs are executable by `service_role`, not by
  `anon` or `authenticated`. Both recommendation tables have RLS enabled and
  client access remains restricted; all 12 recommendation triggers are present.
- Existing 1,049 opportunities remain present. `npm run check:roles` passes.

These are local database/password checks, not an HTTP or browser login test.
No staging or production databases were changed, and recommendation rollout
flags were not enabled.
