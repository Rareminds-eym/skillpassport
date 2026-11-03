# Environment seed configuration

Following LTE, environment seeds belong in `seed/dev` and `seed/production`. Both `seed/dev` and `seed/production` hold SQL seed files; legacy seed paths and archived SQL are excluded.

From `skillpassport`:

```sh
npm run db:reset:dev
npm run db:reset:prod
```

Both commands reset the local database. The prod command selects production seed files for the local database. Neither command targets a remote database. Automatic seeding is disabled; plain `supabase db reset` applies migrations only.

Each environment loads only SQL files directly inside its folder, matching LTE. Nested folders are excluded.

## Local role checks

Both environment seed folders include the canonical role shadow and category bootstrap. Existing synced rows are preserved. After a reset, run `npm run check:roles` to compare the generated TypeScript module with the local database. Use `npm run generate:roles` when an intentional taxonomy change requires regeneration.

The pre-commit hook runs `check:roles:precommit` when SQL or role-generation files change. It skips with a warning only when the database is unreachable; actual drift fails. Enable the hook with `git config core.hooksPath .githooks`. Role checks run locally.


## Local auth (GoTrue is disabled)
Credentials are owned by the custom SSO worker, so GoTrue / Supabase Auth is disabled for the local stack (`[auth] enabled = false` in `config.toml`). `supabase start` and `supabase db reset` therefore never create any auth container, not even the short-lived GoTrue migration container. `npm run supabase:start` is a plain `supabase start` (no `-x gotrue`).

Supabase Storage and the built-in email server are also explicitly disabled. Authentication uses SSO, email uses the email worker, and files use Cloudflare R2. Unused signup, OTP, MFA, OAuth, and Supabase Storage configuration has been removed. The disabled tables remain in the config to prevent the CLI from enabling its defaults.

Database clients supply their existing anon or service API key through the SDK's `accessToken` option, which skips GoTrue client initialization. Browser database queries retain anon permissions; authenticated app requests use SSO verification in the Pages Functions.

- `supabase/roles.sql` is a local-only bootstrap that the CLI runs before migrations. It creates `auth.jwt()` (same body as GoTrue's), which the baseline RLS policies use and the Postgres image does not ship. It is guarded and idempotent: it does nothing when `auth.jwt()` already exists. Never run `supabase db push --include-roles`.
- The image itself provides `auth.uid()`, `auth.role()`, `auth.email()`, a minimal `auth.users` and `auth.refresh_tokens_id_seq`.
- `npm run db:reset:prod` runs `scripts/db-reset-prod-local.mjs`. It streams the production seed into a temporary filtered copy (`supabase/.temp/seed-prod-filtered/`) that drops only the three `auth.*` INSERTs (`audit_log_entries`, `users`, `identities`), resets the local database with it, and deletes the copy. The original seed file is not modified, and `public.users` rows are kept. It fails loudly if the expected statements are not found.
- With Auth disabled the CLI does not issue local API keys, so `supabase status` prints no anon or service keys and Kong does not require an `apikey` header locally.

The `20261014090000_replace_gotrue_user_lookups.sql` migration moves training notification recipients, approver emails, and invitation lookups to the SSO-synced `public.users` shadow. Run `supabase/tests/gotrue-removal.sql` with `psql -v ON_ERROR_STOP=1` against a migrated local database to verify notification and lookup behavior; its fixtures are rolled back.
