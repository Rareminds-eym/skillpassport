# Environment seed configuration

Following LTE, environment seeds belong in `seed/dev` and `seed/production`. Both `seed/dev` and `seed/production` hold SQL seed files; legacy seed paths and archived SQL are excluded.

From `skillpassport`:

```sh
npm run db:reset:dev
npm run db:reset:prod
```

Both commands reset the local database. The prod command selects production seed files for the local database. Neither command targets a remote database. Automatic seeding is disabled; plain `supabase db reset` applies migrations only.

Each environment loads only SQL files directly inside its folder, matching LTE. Nested folders are excluded.


## Local auth (GoTrue is disabled)
Credentials are owned by the custom SSO worker, so GoTrue / Supabase Auth is disabled for the local stack (`[auth] enabled = false` in `config.toml`). `supabase start` and `supabase db reset` therefore never create any auth container, not even the short-lived GoTrue migration container. `npm run supabase:start` is a plain `supabase start` (no `-x gotrue`).

- `supabase/roles.sql` is a local-only bootstrap that the CLI runs before migrations. It creates `auth.jwt()` (same body as GoTrue's), which the baseline RLS policies use and the Postgres image does not ship. It is guarded and idempotent: it does nothing when `auth.jwt()` already exists. Never run `supabase db push --include-roles`.
- The image itself provides `auth.uid()`, `auth.role()`, `auth.email()`, a minimal `auth.users` and `auth.refresh_tokens_id_seq`.
- `npm run db:reset:prod` runs `scripts/db-reset-prod-local.mjs`. It streams the production seed into a temporary filtered copy (`supabase/.temp/seed-prod-filtered/`) that drops only the three `auth.*` INSERTs (`audit_log_entries`, `users`, `identities`), resets the local database with it, and deletes the copy. The original seed file is not modified, and `public.users` rows are kept. It fails loudly if the expected statements are not found.
- With Auth disabled the CLI does not issue local API keys, so `supabase status` prints no anon or service keys and Kong does not require an `apikey` header locally.
