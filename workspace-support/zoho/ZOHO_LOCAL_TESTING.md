# Zoho integration local testing

## Current persistent local setup — 4 November 2026

**Latest update — revision 59:** [Section 76](./ZOHO_RECRUIT_INTEGRATION_PLAN.md#76-dev-merge-compatibility-and-database-validation--revision-59)
preserves upstream specialization and session/owner boundaries during the dev merge. Local
acceptance passes 772 automated tests and all six disposable SQL suites. The
[current inventory](./sp-dash/lib/zoho/ENVIRONMENT.md) lists six remaining
credential/key names and separates shared infrastructure settings and bindings.
Retired Zoho flags, callback, environment, preview and cron variables are no
longer read. Historical instructions below naming those flags are superseded.

Local preparation selects the disabled `local-review` profile. The existing enable
command validates loopback database/service wiring before selecting the code-owned
local profile through the platform's existing `ENVIRONMENT` context. Restart
runtimes after configuration changes, then run verification. Mandatory approval,
source pause and no-email policy remain enforced. Production/dev/QA profiles stay
disabled; their callback constants need confirmed deployment origins before remote
OAuth can work. The local callback is already defined in code.

Mobile review now retains the selected candidate after dismissal and offers
a direct route to candidate administration. Record refresh revalidates loaded
pages and search shows an explicit loading state. The console-controls
application migration is applied locally after backup; reviewed pending migrations
remain zero. The latest private backup is under ignored
`sp-dash/.wrangler/zoho-local/db-backups/20261103T100538425Z-2743999/`.

Use **Pause discovery** in the progress panel with a reason to retain the checkpoint
without pausing the connection or invalidating approvals. **Resume discovery**
continues that same run. **Cancel discovery** asks for confirmation and retains
staged records/history. The live control-test scan was left cancelled and the real
source remains connected. No destination decisions were submitted by this audit.
Shared navigation labels unavailable legacy review sources explicitly; the local
university/student schemas remain unavailable, rather than showing invented zeros.

The earlier checkpoint below is retained as history:

**Revision 51:** The four findings from [section 67](./ZOHO_RECRUIT_INTEGRATION_PLAN.md#67-post-implementation-audit--revision-50)
are fixed and verified in [section 68](./ZOHO_RECRUIT_INTEGRATION_PLAN.md#68-section-67-fixes-and-local-acceptance--revision-51).
The latest full acceptance passed **712 tests across 57 files**, plus all disposable
SQL suites. One additional SSO migration and two additional application migrations
are applied locally, on top of revision 49's nine. Both databases were backed up
first; the successful private manifest is under the ignored
`sp-dash/.wrangler/zoho-local/db-backups/20261103T065451931Z-2291465/` directory.
The read-only migration plan reports zero pending reviewed migrations.

`verify` and `tick` passed after the upgrade. A fresh browser login discovered the
historical canonical `erase_connector` action for synthetic source 999000000000002
without using a saved request ID. Clicking its canonical recovery control upgraded
application progress to administration version 1, confirmed application/artifact
completion and acknowledged the canonical receipt. The pending entry disappeared;
the synthetic application's user and learner profile remain present. This recovered
an existing action; it did not create another canonical administration operation.

Pending source decisions, application cleanup and canonical recovery now have
independent bounded cursor pages. Completed history cannot hide pending work.
Active platform super-admins may finish already committed work from another
approver; original approval attribution is preserved separately from recovery.
New opposite privacy actions remain blocked until prior application and artifact
confirmation is acknowledged. Old receipts cannot change newer source state or
invalidate newer export archives. Legacy partial erasures retain their saved cursor.

Zoho consent now requests bulk-read permission. Existing real connections must
re-consent before using bulk creation. The local stack still has no real OAuth
credentials and performs no provider discovery; live provider/no-email acceptance
and release exclusions remain as documented below.

Revision 49 adds **one SSO and eight application migrations** on top of the earlier
setup below. All nine are applied and tracked locally; a new read-only plan reports
zero pending reviewed migrations. Production was not changed. The final combined
acceptance passed **682 tests across 55 files**, all disposable SQL suites and real
concurrency checks. Local frontend and Pages Functions builds passed. Runtime
`verify` and `tick` both passed after restart with the corrected JSON-keyring
configuration. No mail service, email queue or provider credential was introduced.

The local upgrade tool defaults to inspection and applies only its explicit
allowlist. It rejects remote Docker transport and unreviewed pending migrations,
backs up both databases before DDL, and commits DDL plus ledger entries together
per database. The two databases cannot share one PostgreSQL transaction. A failure
therefore records partial state; never automatically restore over newer data.

```sh
node scripts/zoho-local-migrations.mjs plan
# Only after acceptance, for a fresh copy of this reviewed upgrade:
node scripts/zoho-local-migrations.mjs --apply
```

Current private dumps and manifests are under the ignored
`sp-dash/.wrangler/zoho-local/db-backups/` directory, with restricted permissions.
The successful application upgrade manifest is in `20261103T052258668Z-2068967/`;
the preceding manifest records the initial application rollback while SSO had
committed. The corrected migration supports both actual text roles and historical
enum roles. Do not commit, upload or automatically restore these backups.

The browser verified the real operator panel against persistent local storage:
saved shared budget 1000/concurrency 2, previewed and separately approved connector
erasure for **synthetic source 999000000000002**. Application completion and artifact
confirmation are true. Its canonical user, active subscription and application
learner profile remain present. Its connector payload is erased and its source
suppressed; erasure does not restore old data. The first synthetic candidate
999000000000001 remains intact. No real candidate was used.

Source export/deletion controls remain disabled without configured Zoho OAuth.
Actual provider discovery, bulk exports, live Google activation and the complete
real-provider browser flow still require credentials, owner consent and a test
tenant with verified no-email behavior. Local synthetic acceptance is not that proof.
Existing unrelated dashboard counters still call absent `students`/`universities`
tables and can log 500 responses; the Zoho console and operator endpoints pass.
Whole-dashboard legacy cleanup and production packaging remain outside this release-
excluded scope. B1 environment isolation remains deferred.

### Earlier local setup checkpoint — 2 November 2026

The existing local SkillPassport and SSO databases have now been backed up and
migrated. All 20 pending application migrations, seven Zoho SSO migrations, the
previously pending SSO password-reset migration, and the development approval
upgrade seed were applied locally. Production databases and the production seed
were not changed. Both database candidate-readiness probes return true.

Protected identity/profile tables and their dependent views now use server-only
local grants. Browser access to privileged SECURITY DEFINER functions (including
extension-owned network/GraphQL helpers) and browser job-write grants were revoked;
service-role access was preserved. This is a local permission change: older browser
code that accesses those protected tables directly will be denied. No RLS was added;
all 22 Zoho tables were checked with RLS disabled. The original database dumps are
in `/tmp/vscode-agent-codex-sandbox-JE4QfW/zoho-db-backup-20261102132140/`, mode 0600
inside a private directory. Do not commit or upload these dumps.

Use [the local runtime launcher](./scripts/zoho-local-runtime.mjs) from the workspace
root. It starts the existing source entrypoints under local aliases so they cannot
attach to an already running mail-enabled development stack. These aliases are not
new deployed services and do not implement the deferred environment-isolation work.

```sh
# Separate terminals; these runtimes are already running after the setup session.
node scripts/zoho-local-runtime.mjs workers
node scripts/zoho-local-runtime.mjs pages
node scripts/zoho-local-runtime.mjs dashboard

# Wrangler does not automatically tick local cron schedules.
node scripts/zoho-local-runtime.mjs tick
```

Dashboard: <http://localhost:3010/integrations/zoho-recruit>. SkillPassport:
<http://localhost:8898>. The background dashboard runtime listens on IPv4 port 8896;
SSO remains a private RPC service and has no public HTTP health/login route.
Local generated configurations and matching sync secrets are inside each existing
repository's ignored `.wrangler/zoho-local/` directory. No mail provider, mail queue,
or email runtime is bound. The setup does not stop your pre-existing development
services, including any independently running email service.

To regenerate configuration, stop these three runtimes first. `prepare` verifies
loopback database targets, creates a restricted seven-day reader JWT using the
local Supabase JWKS symmetric key, preserves the token-vault/sync secrets and resets
integration flags off. It does not apply migrations or permissions. Then build and
start the runtimes; run `enable` after they are available, and restart them to load
the flags. `enable` checks both database probes, real SSO/policy bindings, queue
bindings, an authenticated read-only projection dependency endpoint, reader
authentication and matching local secrets. The GET probe on `/sync/zoho-candidate`
uses the existing transport secret and checks the actual Pages-to-SSO policy binding
and application readiness RPC. It works with delivery disabled and never requests a
projection or confirmation. An unauthenticated 401 or flags-off 503 is not readiness
evidence. The existing POST write route still requires delivery enabled.
After restart, `verify` requires authenticated positive Pages dependency evidence,
enabled delivery and the canonical runtime capability. Changing a vars file alone
does not prove the running process loaded it; use an explicit restart.
All four configurations are validated before probes or writes. Flag files are staged
and replaced individually, with rollback of earlier files if replacement fails;
this is not a multi-file filesystem transaction. Restart only after success. Missing
Zoho credentials keep discovery off, and unrelated Google OAuth flags are preserved.

`build-dashboard` prepares an ignored local adapter for the existing dashboard runtime
and approval-authority export. It reuses the actual queue and scheduled handlers;
HTTP requests forward only to the Next development server on port 3010, without
following redirects. It also upgrades older ignored local configurations to remove
the OpenNext asset dependency. Background startup checks that adapter exists and gives
the preparation command if missing. There is no OpenNext bundle/build prerequisite
for this local stack and no additional deployed Worker. Production entrypoints are
unchanged. The installed Next/OpenNext production packaging combination currently
fails on native Sharp resolution (and Next is outside the adapter support window);
production packaging/framework compatibility remains an explicit release gate.

```sh
node scripts/zoho-local-runtime.mjs prepare
node scripts/zoho-local-runtime.mjs build-dashboard
node scripts/zoho-local-runtime.mjs build-pages
# Start workers, pages and dashboard as above, then:
node scripts/zoho-local-runtime.mjs enable
# Restart those runtimes, then verify actual loaded dependencies and flags:
node scripts/zoho-local-runtime.mjs verify
node scripts/zoho-local-runtime.mjs tick
```

The Pages launcher runs the existing compiled Pages Functions bundle with an
explicit local Wrangler config. This avoids automatic Pages config discovery
loading the repository's default mail-enabled configuration. The Next.js UI uses a
separate build directory and proxy alias, which prevents build collisions and
prevents its binding proxy from shadowing the actual dashboard readback authority.
Production Wrangler configuration is unchanged.

### Verified against persistent local databases

A flags-off runtime check explicitly restarted only the session's Pages process:
authenticated GET readiness returned 200 while the POST write route returned 503.
The original local configuration was restored and restarted afterward. The temporary
private backup was removed; no projection or database write was requested.

The repaired local stack was rechecked: enabling passed actual database/service/
reader/projection probes, both candidate probes return true, recovery returns 200,
and four persisted operations remain completed. Browser login and Integrations →
Open review console display the synthetic source, completed candidates and all four
execution receipts. Direct navigation showed a transient return to the dashboard;
normal in-app navigation succeeded, so no authorization weakening was introduced or
unsupported redirect fix claimed. The unrelated legacy badge-table errors remain.

- Real dashboard login using a synthetic local super administrator, followed by
  authenticated browser requests to the normal integration preview/approval routes.
  The ignored [fixture login file](./sp-dash/.wrangler/zoho-local/browser-fixture.json)
  contains the local-only operator credentials. No real administrator was changed.
- Synthetic source `999000202611020001`, connection
  `70ab93ce-990a-420b-8631-d100a6839656`, is labeled **LOCAL SYNTHETIC ONLY — no Zoho
  OAuth**. Its source records were staged through the actual SQL staging function;
  its fixture connection state was set locally. It is not an OAuth-connected tenant.
- Two approved synthetic candidates produced exactly two canonical users, two
  active `freemium` subscriptions and two private application learner projections.
  Both receipts and control-plane operations completed. Two further deliveries of the
  completed queue candidate returned HTTP 200 while retaining exactly two learners.
  Addresses remain unverified,
  activation pending, and all six learner notification preferences are false.
- The first candidate's projection was delivered directly through the authenticated
  reference-only handler while diagnosing runtime transport. The second traversed
  the actual existing sync queue and completed after normal durable recovery.
- A synthetic draft job was created, then its title and closure were approved as a
  separate revision. Both operations completed and the same single job was updated
  to closed/inactive. No learning-job notification work was created for it. Actual
  open-job tenant entitlements were not invented; quota/open-job cases remain covered
  by the disposable SQL suites.
- Real Workers execution exposed unsupported `redirect: 'error'` in both source
  HTTP and candidate delivery. Both now use `manual`, reject non-OK redirect
  responses, and never follow a Location with credentials. Regression tests cover
  301/302/307/308. The temporary transport diagnostic was removed.
- Expanded acceptance: **455 tests across 35 files**, plus all approver/candidate/
  control-plane/job SQL suites pass. The runner now includes the existing auth-sync
  transport tests and eighteen permanent launcher/dashboard regressions. The full expanded
  runner passed after these fixes. Previously verified frontend and Pages Functions
  builds remain separate from the unresolved production OpenNext packaging gate.
- Approval now immediately refreshes execution history and starts background polling
  from idle. Polling updates staged records as operations complete, preserves unchanged
  selections/reviews and clears stale revisions. Partial summary/records failures do
  not skip history refresh, and failed history starts a retry loop even from idle.
  Component tests execute the actual React page and candidate-review panel, including
  canonical checking, mandatory human acknowledgement, reviewed-hash submission and
  completion polling. These synthetic API tests do not assert live Zoho connectivity
  or real provider activation.

Some unrelated dashboard badge requests still return 500 because the local schema
has no legacy `students`/`universities` tables. Those failures do not establish that
the Zoho routes failed; the authenticated integration requests and durable outcomes
above were checked separately. This was browser login/API acceptance, not exhaustive
click-by-click UI, Google activation, full repository CI or provider acceptance.

### Required input before live Zoho acceptance

Zoho OAuth credentials were absent from the existing local files. Live discovery
therefore remains off; no actual Recruit account has been connected or contacted.
Provide the local secret-file location for the test organization's OAuth client,
its data center and immutable organization ID. The configured callback is
`http://localhost:3010/api/integrations/zoho-recruit/oauth/callback` and must match
that client. An authorized account owner must complete Zoho's consent screen.

The launcher reads `ZOHO_CLIENT_ID` and `ZOHO_CLIENT_SECRET` from the existing ignored
[dashboard development variables](./sp-dash/.dev.vars). Add credentials there without
committing or pasting them into reports; regenerate with services stopped, then use
the verified enable/restart sequence. Register the actual source separately in the
dashboard; never rename the synthetic source as evidence of provider authorization.
Keep the fixture organization distinct. Real discovery, tenant automations/no-email,
Google activation and actual open-job publisher access still require controlled
provider acceptance. Google OAuth is disabled in the isolated test configuration.

The repeatable automated suite uses existing services' source, synthetic identities,
mocked transport/service bindings and two real disposable PostgreSQL databases.
It does not import real candidates, contact Zoho, send email, deploy, reset either
project database, apply persistent migrations/seeds, or change enable flags.
Passing this suite establishes local component/SQL acceptance; it does not establish
authenticated browser, live provider, deployment or production acceptance.

## Run the synthetic acceptance suite

Prerequisites: install the repositories' existing dependencies and start the existing
SkillPassport and SSO local Supabase stacks. Their database containers must be named
`supabase_db_skillpassport` and `supabase_db_sso-auth`. Docker must use a local Unix or
named-pipe socket. Do not point this suite at a remote Docker daemon.

From [SkillPassport](./skillpassport):

```sh
node scripts/checks/test-zoho-local-acceptance.mjs
```

The equivalent package command is `npm run test:zoho:local`.

For the command inventory without running tests:

```sh
node scripts/checks/test-zoho-local-acceptance.mjs --list
```

Without local databases, run only module contracts:

```sh
node scripts/checks/test-zoho-local-acceptance.mjs --unit
```

The full run sequences dashboard approval/review/discovery/execution tests, SSO
canonical contracts, application privacy/projection contracts, two-database delivery,
subscription DTO compatibility, and approver/candidate/control-plane/job SQL suites.
Database tests exercise source migrations in uniquely named temporary databases,
including concurrency, replay, stale approvals, quota conflicts and recovery.
Transport/email traps in the two-database suite reject unexpected external calls.
Tests stop on failure; skipped SQL cases in `--unit` are not full acceptance.

The runner forwards no application credentials or feature flags and loads no env
files itself. Existing SQL fixtures may temporarily create the restricted
`zoho_discovery` cluster role and restore its original membership afterwards. Run
this suite serially against dedicated local development containers. Let database
tests finish so their cleanup blocks can drop fixture databases. An interrupted
process may leave databases whose names start with `zoho_`; inspect these manually
before removing anything. Never drop the main `postgres` database.

## Manual integrated acceptance

This is a separate test phase; the runner intentionally does not enable an import.
Use the existing sp-dash Worker, SSO Worker, auth-sync consumer and SkillPassport
Pages runtime. Do not add a Zoho Worker or use a generic startup command that starts
an email Worker. First configure the approved local database roles/migrations,
independent authority/readback bindings, queue routing and matching internal sync
secrets. Check configuration presence without displaying secret values. The
candidate capability must report actual readiness; do not bypass a failed check.

Use synthetic candidates and jobs in a controlled Zoho test organization. Configure
notification suppression and verify tenant/provider automations separately. Keep
all production flags off. Run these checks with an authenticated authorized operator:

| Action | Required observation |
| --- | --- |
| Discover candidates and jobs | Records appear only in staging; no canonical account or job exists yet. |
| Hold/reject a record | No canonical effect and no email. |
| Preview a candidate | Identity/access outcome and blockers reflect canonical SSO state. |
| Approve one eligible new candidate | One independent learner identity, free Discover access and one private application projection; receipt completes only after readback. |
| Retry the same operation/delivery | Same identity, subscription and job; no duplicates. |
| Change source or policy after preview | Stale approval is rejected; fresh review required. |
| Approve an existing supported learner | Existing credentials, paid/org access and preferences survive. |
| Interrupt projection confirmation | Recovery completes from actual projection evidence without recreating the identity. |
| Sign in through Google with the imported address | Only a trusted provider-verified address activates the same imported identity; Discover is retained and no email is sent. |
| Import a supported canonical learner with missing application mirrors | Missing private mirrors are created; canonical credentials/subscriptions and existing app-user preferences remain unchanged. |
| Break a protected database grant or required binding | Candidate readiness becomes unavailable; enabling flags does not bypass it. |
| Sign in again after Google activation | Durable provenance keeps recovery on canonical references; no generic user/membership reconstruction. |
| Deliver an old generic user/membership event | Imported/private/tombstoned identities are not reconstructed; unavailable required authority causes retry. |
| Approve source data beyond retention before cleanup | Approval is rejected; an identical-content fresh fetch requires a new review generation. |
| Claim work near payload expiry | The lease ends no later than the payload deadline; expired work cannot authorize a new effect. |
| Refresh a source with completed historical revisions | Old approved payload copies expire independently; the current fresh payload and unknown effects survive. |
| Suppress a source record | Further discovery does not restore it; unclaimed approvals are revoked and uncertain effects remain recoverable. |
| Remove suppression | No payload/approval/access is restored automatically; fresh discovery and review are required. |
| Set retention and clean expired payloads | Staged and deferred payload copies expire; active/unknown operations remain intact for reconciliation. |
| Pause/disconnect a connection | Queued approvals become invalid; started operations remain recoverable. Disconnect removes local credentials without deleting accounts/jobs. |
| Approve/update/close a job | Only the reviewed job changes; local edits, unknown mappings and quota failures are blocked. |
| Encounter a proven pre-write job rejection | Fresh review is required; ambiguous network failures are not mislabeled as safe retries. |
| Inspect public/recruiter views | Private imported candidate data stays unavailable until the required visibility conditions are met. |
| Inspect notification evidence | No application queue, database notification route or provider automation sent an email. |

Account creation and successful sign-in are separate assertions. New imports retain
an unusable password sentinel and pending activation until the candidate signs in
through the existing Google flow with the same provider-verified address. This
user-initiated path activates the existing identity without email, password issuance,
or a second account. Other non-email activation methods are not implemented. Do not
mark an address verified merely because Zoho supplied it.

Privacy controls are on the Zoho dashboard. Review payload retention defaults to 30
days and can be configured from 1 to 365 days. The existing discovery recovery schedule
cleans expired payloads; `ZOHO_PRIVACY_CLEANUP_ENABLED=true` also permits cleanup while
new discovery/execution are disabled, provided the existing background/environment/
preview guards and restricted database configuration allow it. The flag defaults off.
Manual cleanup is available to the platform super administrator. Expired canonical
preview contexts are cleaned in the existing SSO schedule. Suppression is scoped by
source organization, module and external record ID and survives reconnect. It is not
canonical erasure, source-side OAuth revocation, or a backup deletion mechanism.

Saved-record discovery now resumes page checkpoints, overlaps clean incremental
watermarks by ten minutes and performs daily full reconciliation for enrolled modules.
Runs with exceptions do not advance the clean watermark. Only explicitly inventoried
modules are scheduled, using the existing Worker schedule. Missing records are never
treated as deletion. Dedicated bulk exports and provider deletion streams are not part
of this runner or the current saved-record discovery implementation.

Install the new provenance, retention-fence and generic-identity policy migrations
before the updated bundles. Keep the existing candidate-source service binding configured
during pauses: it must expose `getSubjectSyncPolicy` on the updated SSO entrypoint.
Local private/tombstone checks and required canonical policy prevent generic replay
when delivery is disabled. Missing required authority causes retry, not reconstruction.
The acceptance command also runs existing educator and subscription sync regressions.

Record the exact commit/source versions, checks run, capability output, operation
IDs, receipt outcomes and notification evidence without copying candidate contact
data or secrets. The current implementation/release gaps remain tracked in the
[integration plan](./ZOHO_RECRUIT_INTEGRATION_PLAN.md).

### Live OAuth scope correction (2026-11-03)

The India authorization endpoint rejected the plural module scope names shown in
some Recruit documentation. The connector now requests
`ZohoRecruit.modules.candidate.READ`, `ZohoRecruit.modules.jobopening.READ`,
`ZohoRecruit.bulk.read`, `ZohoRecruit.org.READ`, and
`ZohoRecruit.settings.fields.read`. Organization access is read-only; the previous
`org.all` request also granted organization write access. Nine OAuth regression
tests pass, including the exact scope set and rejection of write/ALL permissions.

Live checks reproduced the plural-scope errors and reached consent for bulk,
organization read and field metadata. The singular module requests did not display
the scope error, but the subsequent combined request hit Zoho's account request
limit. Full combined consent and token/organization verification remain pending.
Stop retrying while Zoho shows its request-limit message; after its cooldown, start
a fresh connection from the local console so the OAuth state is current. Discovery
remains disabled, and no real candidate or job has been imported.

The subsequent real token exchange and organization lookup both returned HTTP 200.
Recruit's India response supplied `zgid: "60005982380"` with no `id` field. The
validator now compares the exact string `zgid` to the registered organization ID;
it supports legacy `id` only when `zgid` is absent. A conflicting or numeric `zgid`
cannot be overridden by an `id` match. Nineteen OAuth tests cover success,
mismatches, numeric rejection, and encrypted credential storage. Next development
request logging excludes the callback URL to keep authorization codes out of logs.
The earlier temporary identifier diagnostic has been removed. A fresh owner consent
is needed because the earlier failed callback consumed its one-use state and did
not save credentials; do not replay its callback URL.

After fresh owner consent, local verification confirmed `Rareminds Zoho Recruit`
(India, organization `60005982380`) is `connected`, credential generation is `1`,
and an encrypted credential row exists. No token values were read for this check.
The source has zero staged records and `ZOHO_DISCOVERY_ENABLED` remains `false`.
Real discovery, reviewed approvals and destination creation are subsequent
acceptance steps; connection success alone does not prove them.


### Live discovery and progress verification (3 November 2026)

Discovery is now enabled in the ignored local dashboard runtime configuration.
Local wiring/readiness verification passed after restart. Real Recruit reads
reproduced HTTP 400 for `converted=both`; explicit true/false streams both worked.
The tenant's system modification field was verified through metadata as
`Updated_On` (“Modified Time”, datetime, noncustom). The implementation resolves
that schema name rather than inventing timestamps or dropping records.

The affected scan was stopped without deleting its history and a fresh candidate
scan was started from page one. Its first verified progress checkpoint was 60
received / 60 staged / zero deferred / zero not staged; it remained active. No
real destination approvals were recorded. The browser showed “Starting discovery”
immediately, then an automatically updating batch/count panel and disabled repeat
button. The activity indicator has no fabricated percentage. All 324 dashboard
Zoho tests in 23 files passed, including both-stream atomicity, source-version
selection, schema metadata validation and context-isolated progress.

A completed inventory is still pending; review records before any account/job
creation. Earlier zero-record/disabled observations above describe prior checkpoints.


## Dev merge upgrade note — revision 59

The new assessment-specialization context migration is reviewed and included in
the local migration planner; this merge task does not apply it to persistent or
shared databases. Before testing that new context field against a persistent local
DB, run the existing backed-up local migration procedure. Apply the SSO
`20270218010000_seed_zoho_administration_recovery.sql` and application
`20270218020000_seed_zoho_operator_history.sql` upgrade seeds after schema migrations
and before enabling processing. These seeds are idempotent for existing upgraded
rows and are supplied separately for dev and production. No remote configuration
or database change is implied by merging source branches into dev.
