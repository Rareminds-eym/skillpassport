# Pages environments

Pages supports only `production` and `preview` environment sections. Our separate
Pages projects use separate configuration files:

| Project | Branch | Build command | Configuration |
| --- | --- | --- | --- |
| skillpassport | production | `npm run build:pages:production` | [wrangler.toml](../wrangler.toml) |
| skillpassport-dev | dev | `npm run build:pages:dev` | [wrangler.dev.toml](../wrangler.dev.toml) |
| skillpassport-qa | qa-environment | `npm run build:pages:qa` | [wrangler.qa.toml](../wrangler.qa.toml) |

Set the corresponding build command and production branch in each Cloudflare
Pages project. A QA build from `main` is rejected. The build writes an ignored
`.wrangler/deploy/config.json` adapter redirect which Pages uses to select the
correct TOML file. Tracked configuration files are never rewritten.

Each file defines that project's database, service entrypoints, queues, R2 bucket,
realtime namespace, and matching model. QA/dev cookies are host-only. Environment
identity `qa` is the application identity, even though Pages calls a project's
primary deployment its “production” environment.

## Build variables and secrets

Configure these in each project's **Settings → Variables and Secrets**. Secrets
are not inherited between projects and must never be committed:

- `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY`: the selected database's public key.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only database access.
- `EMAIL_API_KEY`, `SIGNING_SECRET`, `LTE_INTERNAL_SECRET`, `INTERNAL_WEBHOOK_SECRET`:
  the corresponding shared service secrets.
- `GOOGLE_CLIENT_SECRET` when Google OAuth is enabled; optionally `OAUTH_STATE_SECRET`.
- `OPENROUTER_API_KEY` when the app's AI features are enabled.
- `NPM_TOKEN`: a valid GitHub Packages read token for private dependencies.

The build sets `VITE_SUPABASE_URL` from the selected runtime database and rejects
a conflicting supplied URL. Never configure `VITE_SUPABASE_SERVICE_ROLE_KEY`;
remove that variable from existing project settings. Only public keys belong in
frontend variables. Build-time credentials and runtime credentials are distinct.

For a manual QA upload, first build with `npm run build:pages:qa`, then run:

```sh
CLOUDFLARE_ACCOUNT_ID=d10c2b1a3d702c710a036bc5a6d0902e npx wrangler pages deploy dist --project-name skillpassport-qa --branch qa-environment
```

Dev uses the same Cloudflare account, project `skillpassport-dev`, and branch `dev`.
Production uses account `ad91abcd16cd9e9c569d83d9ef46e398`, project `skillpassport`,
and branch `production`. Always build the target immediately before uploading;
the adapter redirect identifies the most recently built target. The existing
`build:dev` remains the local Vite build. `pages:dev` and `pages:start` clear the
remote-build redirect before starting the local runtime.

## Zoho connection

OAuth credentials belong to the **dashboard Worker**, not the Pages app. See the
secret checklist in [the dashboard Wrangler file](../../sp-dash/wrangler.toml).
The OAuth callback and processing controls are configured in
[the dashboard policy](../../sp-dash/lib/zoho/config.js). Adding the Pages bindings
does not enable imports, approvals, or account creation by itself.
