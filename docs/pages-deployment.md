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
- `SIGNING_SECRET`, `LTE_INTERNAL_SECRET`, `INTERNAL_WEBHOOK_SECRET`:
  the corresponding media, LTE, and internal callback secrets.
- `GOOGLE_CLIENT_SECRET` when Google OAuth is enabled; optionally `OAUTH_STATE_SECRET`.
- `OPENROUTER_API_KEY` when the app's AI features are enabled.
- `NPM_TOKEN`: a valid GitHub Packages read token for private dependencies.

The build sets `VITE_SUPABASE_URL` from the selected runtime database and rejects
a conflicting supplied URL. Never configure `VITE_SUPABASE_SERVICE_ROLE_KEY`;
remove that variable from existing project settings. Only public keys belong in
frontend variables. Build-time credentials and runtime credentials are distinct.

### Subscription identities and integration settings

The identities below are shared code constants; URLs and operational settings are
server-side Wrangler variables. None of these values are secrets.

| Setting | Requirement and source |
| --- | --- |
| `SKILLPASSPORT_PRODUCT_ID` | Required by subscription APIs and access checks. UUID of the SkillPassport row in SSO `products`. The target database must match this canonical identity. |
| `HYBRID_PLAN_ID` | Canonical Hybrid plan UUID from SSO `subscription_hybrid_offer_adoptions.receipt.plan.id`, used to identify the opaque-code offer during authentication and feature checks. |
| `SP_DASH_CATALOG_URL` | Required dashboard HTTPS origin for the managed LTE catalogue action; the handler appends `/api/internal/lte/catalog`. |
| `SALES_ENQUIRY_EMAIL`, `SALES_ENQUIRY_PHONE` | Required by sales enquiries. Use the owner's approved destination for that environment. Do not route test messages to production recipients by assumption. |
| `CLOUDFLARE_ACCOUNT_ID` | Account authorized by the PDF rendering token. Required by PDF generation, distinct from the CLI deployment account selector. |
| `ADMIN_EMAIL` | Event registration notification recipient when configured. |
| `AI_RESOURCE_ALLOWED_HOSTS` | Optional extra approved resource-download hostnames, comma-separated; not arbitrary URLs. |

`SKILLPASSPORT_PRODUCT_ID` and `HYBRID_PLAN_ID` are plain named exports in
[the server constants module](../functions/lib/subscription-config.ts). Both the
SSO dev and production catalog seeds declare these same canonical identities.
Every deployment uses the same constants; there is no environment selector and
external variables cannot override these identities. Each target database must
contain the corresponding canonical records before deployment. Repository seeds
establish that contract, not proof that a remote database has applied them.

Service URLs remain Wrangler variables. In particular, `SP_DASH_CATALOG_URL` is
read directly from the request environment and has no code default or alternate
URL. QA's Wrangler file declares its verified dashboard origin, recorded in the
[dashboard environment inventory](../../sp-dash/lib/zoho/ENVIRONMENT.md).
Dev and production catalogue origins remain external provisioning requirements
until their exact targets are verified; do not copy QA URLs into them. Missing
URL configuration retains the existing catalogue-unavailable response. Local
changes do not update any active remote deployment.

### Feature-specific secrets

| Secret | Required when |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Generating PDFs through Cloudflare Browser Rendering. Use an account-scoped token authorized for that API. Never reuse an agent's local OAuth token as application configuration. |
| `CRON_SECRET` | Invoking subscription reconciliation. It must match the invoking SSO worker; requests fail closed when absent. |
| `DEEPGRAM_API_KEY` | Using the existing course transcription provider. |
| `GROQ_API_KEY` | Using the existing alternate transcription provider. Do not add or enable an alternate provider without explicit approval. |

`GOOGLE_CLIENT_SECRET` is required in all three checked-in environments because
`GOOGLE_OAUTH_ENABLED` is true. `OAUTH_STATE_SECRET` is an optional dedicated key
for the existing OAuth state-signing implementation. `LTE_INTERNAL_SECRET` must
be at least 32 characters for the managed catalogue HMAC and match its peer.
Presence alone does not prove a credential is valid or matches another service.

### Bindings, rollout controls, and false positives

The configurations already declare `SSO_SERVICE`, `ZOHO_CANDIDATE_SOURCE`,
`PAYMENT_WORKER`, `EMBEDDING_SERVICE`, `JOB_INDEX_SERVICE`, `EMAIL_SERVICE`,
`REALTIME_HUB`, `REALTIME_EVENTS_QUEUE`, `SSO_REVERSE_SYNC_QUEUE`, and `R2_BUCKET`.
Their target resources must exist. Service bindings are separate from plain vars.
`REALTIME_WORKER` is a local RPC option; the deployed ticket endpoint already uses
`REALTIME_HUB`. `FLAGS` is optional and remains unprovisioned.

`MATCHING_EMBEDDING_MODEL` must match the embedding worker. `MATCHING_CATALOG_MODEL`
and `MATCHING_VECTOR_PIPELINE_VERIFIED` are rollout attestations, not missing-secret
defects. Enable them only after verifying the vector writers. `JOB_MATCHING_ENABLED`
is the existing kill switch. `HEAL_MODE` and `HEAL_CATEGORIES` are existing healing
controls; this configuration update does not change their behavior.

`ENVIRONMENT`, `APP_URL`, `SUPABASE_URL`, `LTE_APP_URL`, `GOOGLE_CLIENT_ID`,
`GOOGLE_OAUTH_ENABLED`, `CLOUDFLARE_R2_PUBLIC_URL`, and `REALTIME_PARTITIONS` are
already specified in each TOML. `COOKIE_DOMAIN` is set only for production;
pages.dev projects require host-only cookies. `NODE_ENV` belongs to the toolchain.
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are existing public configuration
aliases; they do not authorize exposing a service-role key.

The Pages Functions use the R2 binding and email RPC, so
`CLOUDFLARE_R2_ACCESS_KEY_ID`, `CLOUDFLARE_R2_SECRET_ACCESS_KEY`, `EMAIL_API_KEY`,
`SMTP_*`, `FROM_EMAIL`, `FROM_NAME`, and `CLAUDE_API_KEY` are not required by their
current runtime. Email provider credentials belong to the email worker. Removed
checklist entries do not delete any existing remote secrets.

Any remote configuration update, build upload, retry deployment, or automatic
deployment triggered by a push requires explicit approval for its target first.

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

All Zoho-imported jobs are owned by **SkillPassport Platform**
(`00000000-0000-0000-0000-000000000001`). The registration API fixes this owner;
operators do not enter a publisher UUID. Database constraints and ownership
triggers enforce the same rule. The displayed company remains the Zoho client
name. Ownership changes invalidate old approvals and require publisher policy
review and fresh discovery before new execution. Existing non-Zoho jobs are not
reassigned by the ownership migration.
