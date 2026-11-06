# Zoho Recruit → Skill Ecosystem Integration Plan

**Date:** 4 November 2026 (initial plan: 29 October)\
**Revision:** 59 — section 76 records dev merge compatibility and database CI corrections.\
**Status:** Local OAuth and real candidate discovery are verified against the India tenant. The full local acceptance passes 772 automated tests plus all disposable SQL suites. Console controls were verified in the browser, including pause/resume of the same discovery run and cancellation without destination effects. Reviewed additive migrations were backed up and applied locally. Real destination approvals, job/provider export acceptance and tenant no-email evidence remain separate checks. Release, production changes and B1 environment isolation are excluded.\
**Scope:** Zoho Recruit → private staging → explicit approval in sp-dash → candidate learner accounts with Discover access / SkillPassport job postings. Ongoing changes are staged for approval as well.\
**Architecture:** Existing sp-dash runtime for background discovery/staging and approval dispatch; existing SSO for identity/Discover; existing auth-sync transport and SkillPassport for projections/jobs. One-way, tenant-scoped, version-bound, approval-gated, with no email side effects and no new Worker deployment. Authorization uses the existing server-side SSO/RBAC model and explicit data-access controls; this integration must not introduce a dependency on Supabase RLS.

## 1. Explicit operating requirements

The user has specified three mandatory rules:

1. **No email may be sent to anyone in this entire integration process.** This is a hard prohibition, not a default-off option. It includes candidate/recruiter/admin email, account invitations, verification/password-setup messages, welcome emails, subscription notifications, job notifications, exception reports, and operational alert emails. No retry, approval, replay, schedule or downstream handler may enable them.
2. **Sp-dash approval is required before candidate accounts or job postings are created.** Connecting Zoho, importing, validating, previewing, scheduling and reconciling only create/update private staging and operational state. They do not create SSO identities, learner profiles, subscriptions or opportunities.

3. **Do not introduce a new Worker service or standalone Worker deployment for this integration.** Extend existing services and their queue/scheduled handlers. New internal modules or narrow methods on an existing deployment are allowed; no additional deployable Worker/service is introduced. The ignored local aliases in section 61 reuse existing entrypoints and are not deployed.

Apply the approval boundary to subsequent source-driven candidate changes/linking and job updates, publication, reopening, closures and deletions too. There is no implicit “approve all future records” switch. Bulk approval is permitted only for an explicit, reviewable set of record IDs and versions.

- New approved eligible candidates receive a real canonical SSO identity, the permitted learner context, a SkillPassport learner profile and Discover access. Account creation is distinct from proving mailbox ownership or establishing login credentials.
- Existing users retain credentials, verified state, paid/organization-sponsored access, memberships and explicit preferences. A source match must not downgrade them or change their primary role.
- Approved job records are written into canonical opportunities, with publication constrained by source visibility, ownership, quota, required fields and expiry. Approval does not override those checks.
- Invalid/ambiguous/missing-email candidates and incomplete/confidential/over-quota jobs remain counted exceptions. Never invent email addresses or silently skip records to inflate success counts.
- Use immutable source keys and idempotent operations. A retry may complete the same approved action; it cannot authorize a different record, revision, mapping or target.
- Source recruiting data is authoritative only for source-owned fields. SSO owns identity/access; SkillPassport owns learning evidence, platform applications and activity.

Execution stack: extend the existing [sp-dash runtime](./sp-dash/workers/sp-dash-worker.js) for background queue processing and scheduled recovery, backed by durable queues and Postgres integration state. Reuse existing private storage, SSO/import interfaces and auth-sync transport. Sp-dash remains the required approval/control surface. Keep background work outside LTE and browser effects. No dedicated connector, staging-authority or approval-executor Worker is introduced.

## 2. Verified repository findings and implementation implications

These initial repository observations informed the design before local implementation. Section 22 supersedes historical UI descriptions; section 23 records the latest audit. Production catalog values, deployed versions, and configuration still require preflight verification.

| Existing behavior | Evidence | Required decision/change |
| --- | --- | --- |
| Initial inspection found an Integrations route with a static Zoho card and inactive action | [integrations screen](sp-dash/components/pages/IntegrationsPage.js), [route](sp-dash/app/(dashboard)/integrations/page.js) | The local card now reads real API status and opens the review console. This corrects the initial UI gap; complete canonical execution/live connection is still not operational. |
| SSO owns identity and exposes service methods | [SSO entry point](sso-worker/src/index.ts), [authority](sso-worker/src/rpc/authority.ts), [contracts](sso-worker/src/rpc/contracts.ts) | Provision through a restricted SSO service method, never write SSO tables from the connector. |
| The free-plan method selects `plans.plan_code = freemium`; current catalog seeds label it Discover | [SSO free-plan method](sso-worker/src/index.ts), [development catalog seed](sso-worker/supabase/seed/dev/20261006090000_seed_initial_dev_data.sql) | Resolve the active catalog entry by stable code `freemium`, validate display name/features/product mapping in the target environment. Do not invent a `discover` plan or hardcode a plan UUID. |
| The free-plan method performs a lookup then insert; existing SSO migrations already enforce active/pending personal-subscription uniqueness and include a duplicate-active trigger | [SSO entry point](sso-worker/src/index.ts), [SSO schema guards](sso-worker/supabase/migrations/20260526000000_schema.sql) | Reuse the existing guards and resolve concurrent uniqueness conflicts by reading the winning result. Add the import operation/outbox transaction and effective-entitlement checks; do not claim duplicate subscriptions are currently unguarded or create redundant indexes. |
| Existing learner admission requires `organization_id`, creates credentials and includes an invitation path | [learner admission](sso-worker/src/routes/learner-admission.ts), [helpers](sso-worker/src/lib/learner-helpers.ts) | Do not call it unchanged. Add an approval-gated provisioning path that emits no email and does not fabricate academic membership. |
| Identity events already flow through a consumer into signed SkillPassport sync endpoints | [consumer topology](auth-sync-consumer/README.md), [user sync endpoint](skillpassport/functions/sync/user.ts) | Reuse the transport and existing mirrors; extend event contracts for independent learner provisioning. |
| `user.created` mirrors the user; the inspected learner-creation helper is membership-driven | [sync service](skillpassport/functions/lib/sync-service.ts) | Explicitly implement and test an independent learner projection. A mirrored user alone is not a complete learner account. |
| Current SSO event publication uses `waitUntil(queue.send(...))` and logs send failures | [sync publisher](sso-worker/src/lib/sync-queue.ts) | This is not a transactional outbox. Add durable event publication for this integration rather than assuming guaranteed delivery. |
| Job recommendations read `opportunities`; eligibility requires open + active + unexpired | [recommendation contracts](skillpassport/functions/lib/job-recommendations.ts), [opportunity types](skillpassport/src/features/opportunities/api/opportunitiesService.ts) | Import into canonical opportunities, preserve eligibility semantics, and invalidate downstream search/recommendation projections on material changes. |
| The action named `import-requisitions` already inserts directly into `opportunities`, scopes organization/recruiter ownership, checks active-job-post quota, and notifies for open rows | [recruiter backend action](skillpassport/functions/api/recruiter/actions.ts), [client import service](skillpassport/src/features/recruiter/api/requisitionService.ts) | Reuse/extract its existing opportunity-writing rules; add source-ID upsert/versioning, execution approval and permanent email suppression. Do not build a second publishing pipeline on the mistaken assumption that this action only creates separate requisitions. |
| External application links and honest “Application Recorded” UI already exist | [external navigation](skillpassport/src/features/opportunities/lib/externalApplication.ts), [learner apply flow](skillpassport/src/pages/learner/Opportunities.jsx), [regression tests](skillpassport/src/features/opportunities/lib/__tests__/externalApplication.test.tsx) | Reuse these paths and verify import-specific routing/backend semantics. Local tracking is not proof of submission in Zoho; do not remove existing tracking merely because it uses the application API. |
| Subscription mirrors already have stale-timestamp/seat-preservation guards | [shadow sync](skillpassport/functions/lib/sync-shadow.ts), [regression tests](skillpassport/functions/__tests__/subscription-sync-regression.test.ts) | Reuse and test these guards. Extend only missing import/projection contracts; do not characterize all stale-event protection as absent. |
| SSO contains email-sending helpers | [email helper](sso-worker/src/lib/email.ts) | These are forbidden dependencies for the integration. Do not call them, queue them, or invoke a legacy flow that calls them indirectly. |
| Job creation can trigger learner notification fan-out | [notification helper](skillpassport/functions/lib/newOpportunityNotifications.ts) | Suppress integration-triggered notification fan-out by default in both bootstrap and ongoing execution. No downstream email is permitted. Any later in-app-only channel is separately scoped and must not bridge into email. |
| Some payment handlers contain learner-category-specific plan restrictions | [subscription plan handler](skillpassport/functions/api/payments/handlers/subscription-plans.ts) | Resolve the Discover/free-code alias and cohort rules consistently. Do not classify every imported adult candidate as a college learner to bypass onboarding. |

**Evidence labels:** The table records inspected source behavior, not reproduced production defects. Existing constraints, triggers, and helpers must be checked in the deployed environment before changing them. Proposed integration requirements below are not proof that current code is broken or missing every related capability.

**New capabilities described below are proposals, not claims that these APIs or tables already exist.**

## 3. Source discovery and Zoho API contract

### 3.1 Preflight inventory

An authorized integration administrator must record:

1. Zoho Recruit organization ID, actual data center, edition, licensed users, available API credits, permitted modules, and integration service-user permissions.
2. Counts of all candidates/openings, including archived/converted/unapproved/draft variants where applicable; define inclusions explicitly. Defaults must not silently exclude candidates.
3. Module and field **API names**, picklist values, custom layouts, mandatory fields, public-posting flags, client confidentiality fields, deletion visibility, and candidate merge behavior.
4. Counts of missing/invalid/shared/duplicate emails, existing platform matches, closed jobs, missing application URLs, and incomplete required job fields.
5. Approved organization/employer mappings, publication policy, approval responsibilities, zero-email enforcement, and data-retention policy.

Discover modules through Recruit metadata, then export a versioned mapping manifest. Example module API names are `Candidates` and `Job_Openings`; confirm them against the connected account. Field labels and invented CRM equivalents are not an API contract. [Z1, Z2]

Record saved/draft coverage explicitly. The documented regular Get Records API returns saved records when `$state` is omitted; `approved=both` and `converted=both` do not select drafts. If drafts are in the agreed inventory, enumerate the supported draft stream separately and reconcile IDs across streams. If excluded, disclose that exclusion and its counts. A completed page stream is not proof that every required source scope was enumerated. [Z2]

### 3.2 Verified API building blocks

| Purpose | Recruit API contract | Design use |
| --- | --- | --- |
| Authorization | OAuth 2.0; offline access and region-specific Accounts endpoints | Server-side connection flow; encrypted refresh-token storage; refresh according to returned expiry. [Z3, Z4] |
| Initial large import | `POST /recruit/bulk/v2/read`, job status, result download | Asynchronous export, bounded streaming parse, resumable import. [Z5] |
| Bulk constraints | Up to 200,000 records per export job; ZIP/CSV; additional pages; download availability one day; download throttling | Enumerate every page using job metadata; download promptly; renew expired exports. Do not assume the first file is the entire inventory. [Z6] |
| Current record and changes | `GET /recruit/v2/{module}` and `/{id}`; `If-Modified-Since`; page/per-page | Fetch latest authoritative data; overlapping delta windows. [Z2] |
| Deletions | `GET /recruit/v2/{module}/deleted` with deletion-time filtering | Separate delete cursor and tombstones. [Z7] |
| Low-latency events | Recruit workflow webhooks | Optional acceleration; minimal record-ID hints followed by authenticated API fetch. [Z8] |
| Quotas | Credit-based rolling window, per-edition concurrency/sub-concurrency | Persisted per-connection budget and distributed scheduler; validate actual allowance. [Z9] |

Recruit webhook documentation describes limited retry behavior and daily caps. Reconciliation is mandatory. Do not import Zoho CRM Notification API assumptions, callback signatures, channel expiry rules, or endpoint paths into Recruit without account-specific proof. If a Recruit notification-subscription API is selected later, validate its supported contract and add renewal monitoring. [Z8]

OAuth documentation examples and dedicated Recruit host documentation are not entirely uniform about API hosts. Persist an approved region/host mapping, verify actual Recruit calls during connection setup, and allowlist accounts/API/download hosts. Do not blindly concatenate an arbitrary `api_domain`, assume India from user location, or follow authenticated redirects to arbitrary hosts. [Z4, Z10]

### 3.3 Minimum privileges

Start with candidate/job-opening READ access and required metadata READ access; add bulk READ when using bulk export. Read-only describes access to Recruit business records: creating a bulk export job legitimately uses POST with the bulk-read scope. Add client READ only if approved public employer data cannot be obtained otherwise. Verify exact scope spellings against Recruit and the tenant; documentation contains singular/plural examples. Avoid module-wide ALL permissions. Do not request write scopes in phase one.

The OAuth flow requires an admin session, authorization permission, single-use state bound to that session, exact redirect URI, CSRF protection, and a least-privileged organization-owned service account. Do not bind production synchronization to an employee's personal account.

## 4. Service boundaries and trust model

| Component | Responsibility | Prohibited behavior |
| --- | --- | --- |
| Sp-dash | Connection, inventory review, record diffs, explicit approvals/rejections, approved execution, audit and operations | Browser writes to identity/job tables; email sending; treating a hidden button as authorization. |
| Connector modules inside existing sp-dash runtime | OAuth, source reads, bulk/list/delete discovery, staging, command processing and reconciliation | Destination creation/update without a valid record/version approval; mailer calls. |
| SSO provisioning authority in existing SSO deployment | Validate trusted approval evidence and allowed target; atomically create/link identity, learner context, effective Discover access and outbox | Arbitrary role/plan/org changes, fabricated email verification, login-token issuance or automatic account email. |
| Existing auth sync consumer | Idempotent user/profile/entitlement projections belonging to an approved operation | Provision unrelated records, send welcome/verification messages or treat queue acceptance as completed provisioning. |
| Import handlers in existing SkillPassport deployment | Approved source-aware opportunity changes; ownership, quotas, current-version checks and derived-data outbox | Unapproved create/update/publish/close/delete or automatic email/notification fan-out. |

Reuse existing deployments, adding narrow typed Service Binding RPC entrypoints where supported. A named entrypoint on an existing deployment does not require another Worker service. Do not create standalone Zoho Worker configurations. Use a narrow import/admin entrypoint. A binding grants access to its public methods; it does not automatically identify the original browser administrator or restrict a broad entrypoint to one method. Pass server-verified scoped execution context, not an arbitrary browser-supplied actor ID. [C1]

For Pages Functions, use a deployment-supported binding fetch adapter or a signed internal HTTPS endpoint. Validate method/path/body/timestamp, request size, correlation and operation identity. Do not assume Pages exposes WorkerEntrypoint RPC.

A valid grant binds source organization, record ID, exact source hash/version, action, mapping/config version, target and reviewed destination diff, approver, expiry and revocation state. The destination service verifies trusted execution authorization. An operation-level `approved=true` boolean supplied by the browser is never sufficient.

The connector modules receive no email capability or provider credentials. The existing sp-dash/SSO services already have mail bindings for unrelated workflows; shared-runtime placement does not remove those bindings or create a security sandbox. Do not remove unrelated email functionality. Enforce the trusted integration origin's zero-email policy independently at every handler, outbox, projection and trigger; omission of a browser flag cannot opt into email. Deny discovery database roles approval/execution writes, and validate human approval independently at canonical boundaries. Passing a smaller environment object is defense in depth, not credential isolation.

## 5. Candidate staging, approval and account creation

### 5.1 Discovery has no account side effects

1. Read an authorized candidate snapshot from bulk/list responses; use a fresh detail read where versions, identity conflicts or sensitive decisions require it. Store external IDs as strings.
2. Validate an allowlisted subset and resolve immutable source linkage first. For an unmapped candidate, use SSO's canonical email normalization; never strip dots/plus tags or merge people by name/phone.
3. Stage the normalized snapshot, source timestamp/hash, mapping version, intended target and proposed create/link/update diff. Any lookup of SSO is read-only.
4. Display it in sp-dash with duplicate/conflict findings, target identity, planned learner context, Discover/effective-access result and validation reasons.
5. An authorized operator explicitly approves selected records and versions. Rejected/held items remain staged; no provisioning occurs merely because a dry run or source sync completed.

### 5.2 Approved execution

1. Persist the approval and immutable selected-record manifest. Revalidate actor permission, source and destination scope, mapping/config revision and source version.
2. Queue one idempotent operation per approved item. No account, subscription or learner profile is created before this point.
3. SSO's proposed `provisionImportedLearner` operation validates its trusted grant and current target state. In one transaction, resolve/create the canonical identity, record external-link/idempotency ownership, establish the approved learner context, preserve/ensure entitlement, and insert required outbox records.
4. Reuse existing user/subscription uniqueness constraints; recover a concurrent uniqueness conflict by reading the winning canonical result. Do not add redundant indexes or redesign existing billing scopes.
5. Deliver user, independent learner profile and entitlement projections through the existing transport with durable outbox publication, subject versions and idempotent dependency-aware consumers. No downstream email or automatically generated welcome/verification message.
6. Mark `provisioned` only after user, learner and effective-entitlement mirrors are confirmed. Show source ID, SSO ID, learner ID and effective plan in sp-dash. A queue ACK alone is not readiness.
7. Display login readiness separately; account creation never claims that credentials have been delivered or identity ownership has been verified.

### 5.3 Identity decision matrix

| Situation | Approval-time outcome |
| --- | --- |
| New unique valid email | Create the approved SSO learner, private profile and Discover grant; no mail; show activation readiness separately. |
| Existing verified learner | Link approved source provenance; retain credentials/profile ownership; no duplicate account/subscription. |
| Existing paid or organization-sponsored learner | Preserve effective access and memberships; record `existing_access_preserved`. |
| Existing non-learner | Require an approved supported learner context; never replace teacher/recruiter/admin primary role. |
| Existing unverified identity | Preserve identity security and handle activation through an approved non-email path; no automatic verification message. |
| Duplicate/shared email or inconsistent identity | One canonical identity at most; hold/review conflicting people; never silently merge. |
| Missing/invalid email | `blocked_missing_email`; no fabricated address or success status. |
| Changed source email | Stage proposal for approval; do not silently change verified SSO email or bypass ownership verification. |
| Source merge/delete | Stage linkage/lifecycle action for approval; no automatic platform account deletion or loss of paid/learning/application history. |

### 5.4 Discover and login readiness

Discover is resolved through active SSO plan code `freemium`; validate zero price, intended learner/product scope and catalog features. Approval does not select arbitrary premium plans. Preserve effective individual/organization-sponsored access, respect existing personal-subscription uniqueness, and test import racing with purchase/cancellation. Reuse mirror stale-timestamp guards; an older free event cannot replace newer paid access.

Independent candidates must not be enrolled in fabricated schools/colleges. Reuse a supported individual/private personal-organization context only where required by the canonical model. Category-specific commercial rules must be resolved consistently, not bypassed in the importer.

New identity creation does not prove ownership of an email address. Never set `is_email_verified=true` solely because an operator approved a Recruit record. Do not assign predictable/shared credentials, email passwords, create login sessions, or expose raw passwords in logs/exports.

Existing users keep their current sign-in. New users can later establish access using a supported trusted provider that proves the same identity, or an explicitly approved assisted **non-email** credential-activation procedure. Do not assume either mechanism already exists; validate it during preflight. Do not silently replace email with automated SMS or another outbound message. If no permitted mechanism is available yet, retain the real provisioned account as `activation_pending` and show that fact in sp-dash; do not misreport `login_ready` or enable email as a workaround.

No invitation/claim-email workflow is part of this integration. Candidate-initiated future authentication behavior belongs to its separately defined account lifecycle; it must not be used as an automatic import-side email escape hatch.

### 5.5 Approval and processing states

`discovered → staged → pending_approval → approved → queued → provisioning → projection_pending → provisioned`.

Separate outcomes include `held`, `rejected`, `blocked`, `approval_stale`, `approval_expired`, `retry_due`, `failed` and `activation_pending`. Existing linked users retain their current authentication state.

A changed source/destination diff or mapping/config version invalidates the unexecuted approval and returns the item to review. Retry only the same still-valid approved operation. No approval authorizes future records or unrelated field changes.

## 6. Field mapping and ownership

All source field API names below are examples to validate against metadata. Store a signed-off, versioned mapping manifest with types, null behavior, transformations, status aliases, and publication rules.

### 6.1 Candidate mapping

| Source concept | Target/handling | Authority |
| --- | --- | --- |
| Candidate ID and source organization | Private external identity link, source revision | Integration/SSO; immutable linkage. |
| Primary email | Identity resolution or staged change proposal | SSO owns verified login email. |
| Name | Initial profile; later edits only if field remains source-managed | Existing learner edits remain authoritative unless the reviewed field policy explicitly allows the approved source update. |
| Phone/location | Minimal private profile prefill; normalize with known country | Never infer identity from phone without verification. |
| Skills/experience/education | Optional later profile prefill with `source=zoho_recruit` and unverified provenance | Not verified skill evidence, credentials, or LTE achievements. |
| Recruiter notes, salary history, interview feedback, attachments | Excluded from phase one | Separate approved purpose and access model required. |
| Candidate status | Source lifecycle metadata | Must not set academic status, learner readiness, or employment eligibility. |
| Source privacy/communication fields | Import policy inputs where valid | No fabricated consent or verification flags. |

Do not replace a complete existing learner profile with a sparse Recruit record. Distinguish absent fields from explicit permitted clears; sensitive clears and identity changes require dedicated handling. Never import an assessment score or resume statement as evaluated LTE evidence.

### 6.2 Job mapping

| Source concept | SkillPassport target/handling |
| --- | --- |
| Job opening ID + source organization | Unique external mapping to one opportunity UUID; retain across title changes and reopening. |
| Posting title | Populate canonical `title` and `job_title` consistently. |
| Client/employer | Public `company_name` from an approved source field; publisher organization comes from the server-side integration configuration. A source client need not have its own platform organization/account. Create a separate client-to-platform mapping only when that relationship is actually needed; preserve confidentiality. |
| Description | Sanitized supported rich text/plain text; bounded length; remove scripts, trackers, unsafe links. |
| Employment type/work mode/location | Explicit canonical mappings; no default that misrepresents an unknown value. |
| Department | Required target field: controlled approved fallback such as “Unspecified” only if product approves it; otherwise stage. |
| Skills/requirements/experience | Structured values with provenance; preserve source text where lossy conversion would invent facts. |
| Compensation | Currency, period, numeric range, confidentiality, and conversion policy explicitly mapped. Do not assume rupees, monthly units, or interpret an ambiguous salary string as a range. |
| Published/status/closing date | Publication gate and active/open/closed/expired mapping. Unrecognized status fails closed. |
| Source created/modified times | Dedicated source metadata; do not overwrite local audit timestamps. Preserve source posting date separately. |
| Public application destination | Validated HTTPS URL plus explicit application-routing mode. Never use a private Recruit admin URL. |
| Learning requirements | Preserve locally authored structured requirements; do not generate LTE prerequisites or verification labels from free-text job descriptions. |

Existing `opportunities` columns and downstream queries may need additive fields for source provenance, external application mode, salary units/currency, confidentiality, and synchronization version. Confirm current schema through all migrations before implementation; the baseline schema alone is not the deployed contract.

### 6.3 Publication, duplicate prevention, and application routing

- Required publication predicate: the exact record/action version is approved in sp-dash, source is approved/public, audience and status are allowed, required fields/ownership/quota pass, and the deadline is unexpired. Internal-only Recruit jobs are never published just because they are open.
- Source closure/deletion/reopening is staged as an urgent proposed action and applied only after sp-dash approval. Once approved, closed/filled/cancelled/deleted openings become inactive/closed; retain opportunity IDs, historical applications, and audit records. Public discovery/recommendation and new-application paths check current visibility/status/deadline; authorized historical application/detail views can still display a closed job with its correct state. Do not erase history or hide it merely to enforce new-application restrictions.
- Source-owned fields are read-only in normal recruiter UI, or edited via an explicit local override with field-level provenance. Local fields, learner activity, counters, learning requirements, and existing applications are never overwritten by source upserts.
- Unmapped pre-existing opportunities require exact external ID reconciliation or reviewed duplicate candidates. Title/company similarity is insufficient for automatic merging.
- Phase one proposes **apply at the approved Zoho/public application destination**; this is an integration product choice, not an original user requirement or a currently missing UI capability. Reuse `application_link`, the external-navigation helper, and existing “Application Recorded” flow. Verify this contract through APIs, recommendation projections, browse/saved/detail UI, and backend validation; add fields only where the existing contract cannot distinguish local tracking from native submission. A redirect or local tracking record must not be presented as confirmed employer submission. Preserve existing tracking and distinguish its metrics from verified Zoho submissions rather than banning every application record/counter.
- If recruiting operations wants SkillPassport to receive native applications, select that mode explicitly and define who processes them; Zoho write-back is only necessary if that workflow requires it. Do not label a locally recorded external action as a completed Zoho submission. Do not disable the existing tracking endpoint solely because it also serves native applications.
- Validate destination hosts and redirects; no credential-bearing links or arbitrary server-side URL fetch. The existing helper accepts explicit HTTP and HTTPS URLs; requiring HTTPS/approved hosts for new Zoho imports is a proposed source-specific policy, not a claim that the current helper already applies it or must reject all legacy links. An opening with no approved application route remains non-actionable/staged rather than pretending applications are supported.

### 6.4 Failed updates and tenant ownership changes

When a newer source revision changes publication eligibility, stage the withdrawal/closure or correction as an urgent approval item and surface a prominent sp-dash warning. Do not automatically mutate the opportunity or silently approve its new fields. An authorized operator can approve a precise unpublish action immediately. A malformed/non-public source revision cannot be newly published. Existing deadline checks against the already approved job continue to apply without creating a new source-driven write. This explicit approval policy means a source withdrawal can remain unapplied while awaiting operator action; measure and escalate that approval delay inside sp-dash. Do not claim automatic closure within five minutes. Transport/permission failures are not confirmed deletions.

A source change that would cross the configured platform publishing organization or confidentiality boundary must not silently transfer platform ownership: stage the proposed ownership/publication change for explicit approval; do not automatically transfer authority or apply that revision. A routine Recruit owner reassignment within the same authorized source/publisher scope does not by itself require hiding the job. Likewise, changing a public client name does not require creating a client platform account. Keep the canonical opportunity ID and application history; hold unresolved publication/ownership decisions; routine in-scope edits still need the required change approval, but not an invented new employer account.

### 6.5 Recruiter ownership and publication quota

Learner Discover access and employer job-posting entitlement are different commercial scopes. The existing recruiter import already checks `active_job_posts` for its authenticated organization. Assign a verified platform publishing organization/service actor for Zoho jobs and reuse that entitlement policy; a connector service credential must not bypass the quota, ownership rules, or authorship audit.

Determine whether existing capacity covers the intended live job inventory. If it does not, obtain the approved plan/capacity configuration or keep excess jobs staged with a visible quota reason. Do not silently publish beyond the limit or omit excess records from inventory accounting. Validate atomic budget/reservation behavior across concurrent connector and native recruiter writes; preserve current database protections where present. No application-wide billing redesign or unrelated native-import rewrite is implied.

## 7. Bootstrap, incremental staging and reconciliation

### 7.1 Initial inventory and approval

1. Create a discovery run with source organization, scope, mapping version and start time `T0`. Start delta capture before the export so concurrent source changes can be reconciled.
2. Enumerate all supported bulk pages or verified regular list pages. Persist export job IDs, checksums, selected fields, expiry, scope and page outcomes. Poll status even if optional callbacks are lost.
3. Download to private temporary storage and stream bounded ZIP/CSV parsing. Enforce size/expansion/path/encoding limits; checkpoint and split extraction within existing background handlers. If existing runtime limits cannot safely support the export, pause that path and revise the chunking/manual-export approach; do not silently add another Worker deployment.
4. Stage normalized candidate/job snapshots and proposed diffs only. No SSO identity, learner, subscription or opportunity write; no email; no notification fan-out.
5. Run validation and read-only duplicate/entitlement/quota checks. Show all explicit outcomes and estimated workload in sp-dash.
6. Operators review and approve an exact selected-record manifest, individually or in bounded batches. A filter such as “all pending” is resolved to concrete IDs and versions before confirmation; it is not an ongoing rule.
7. Execute only those approved operations through the owning service; persist results and projections. Source changes occurring after review make the approval stale rather than being silently substituted.
8. Stage delta catch-up from `T0` minus overlap, then reconcile source IDs, approved operations and destination results. Mark pending approval separately from failures/completed provisioning.

Resume immutable exports using committed checkpoints; regenerated files require source-ID/version reconciliation, not blind row-offset continuation. Re-reading source data must not recreate approved destination entities.

### 7.2 Incremental staging

- Poll candidate/job changes and deletions separately; persist independent cursors. Use modified-since overlap, initially 10 minutes as a configurable planning value.
- Persist all pages durably before advancing the discovery cursor to a safe boundary. Destination execution completion and approval backlog have separate watermarks.
- Webhooks are optional dirty-record hints. Fetch authoritative data through Recruit; no hook-provided identity/role/plan/status constitutes approval.
- Changed/new records enter `pending_approval`; known identical source hash is a no-op. Approval binds source timestamp/hash, mapping and reviewed target diff, including equal-timestamp content changes.
- Serialize competing source/target operations, apply version checks and fencing, and prevent an older snapshot from overwriting an approved newer revision.
- Source deletes/merges create staged tombstone/linkage proposals; only approved effects reach destination state. Retry cannot resurrect a closed job or remove an account without its specific authorization.
- Permissions loss, incomplete pages and transient 404s are not proof of deletion.

### 7.3 Reconciliation and freshness

Reconcile daily as an initial target within the measured API budget. Discover missing source IDs, stale staging, lost events, incomplete **approved** projections and failed operations. Repair publication/projection of an existing committed approved action idempotently; any different source revision, new destination mutation or changed diff returns to approval.

Show source discovery freshness, oldest awaiting-approval age, oldest approved execution age, per-record source version, and last complete reconciliation separately. Healthy unchanged records are not stale merely because Modified_Time is old; a successful poll does not mean changes were approved/applied.

Previously suggested automatic stale-source unpublication is removed. Keep the already approved destination state until an operator approves a change, subject to existing read-time expiry/access checks. Surface source withdrawal/confidentiality and stale-approval warnings urgently in sp-dash; do not send escalation email or disguise operator waiting time as execution failure.

### 7.4 Capability fallbacks

Probe actual bulk/list/delete/metadata capabilities. Prefer bulk for large inventories; regular reads are valid when complete enumeration is supported. Stop with an incomplete-inventory error if access/page limits prevent completeness. Imported manual exports must include source organization and immutable IDs; missing source versions require authoritative re-fetch before approval/execution.

Missing required fields, changed picklists and lost permissions hold affected records for review. A permission change must not mass-delete or auto-unpublish destination data.

## 8. Proposed durable data model

Use application-owned private integration state (not browser-readable public candidate mirrors), plus narrowly scoped SSO identity/outbox state. The table below describes logical responsibilities: reuse suitable existing infrastructure and combine physical tables where ownership and retention permit. It is not a requirement to create a new table/service for every row. UUIDs are internal IDs; external IDs are text. Every operational row includes connection/source organization, environment, UTC timestamps, and schema/mapping version where applicable.

| Proposed relation | Owner | Key information and constraints |
| --- | --- | --- |
| `integration_connections` | Control plane | Provider, source org, region, credential reference, status, approved target scope, mapping version, pause controls. Unique active binding for a source org/environment unless an explicit migration is being performed. |
| `integration_mappings` | Control plane | Immutable mapping versions, allowed fields/statuses/clients, validation schema, approver and activation record. No secrets. |
| `integration_record_links` | Control plane | Unique `(provider, source_org_id, module, external_id)`; target UUID/type, source timestamp/hash, accepted version, lifecycle, projection readiness. Multiple candidate IDs may link to one reviewed identity. |
| `integration_inbox` | Control plane | Durable dirty-record/event registration, dedupe key, payload reference, status, attempts, next retry, lease and fencing token. |
| `integration_cursors` | Control plane | Unique connection/module/stream cursor, window boundaries, last successful discovery and completion times. |
| `integration_runs` and `integration_run_items` | Control plane | Run manifest, export pages/checksums, row outcomes, totals, error classifications and replay status. |
| `integration_outbox` | Each writing database | Commit domain change and required outbound effect together. Unique operation/effect identity; dispatcher status, attempts and next retry. |
| `external_identity_links` / provisioning operations | SSO | Source-key uniqueness, canonical user association, idempotency result, verified-claim/conflict state. SSO commits this with identity/access decisions. |
| `integration_approvals` and `integration_approval_items` | Control plane / owning execution service | Approver, selected source IDs and hashes, action, reviewed target diff/version, mapping/config version, expiry, decision and execution state. Unique approval-item operation key; revocation/fencing evidence. No invitation-delivery entity is required. |
| `integration_audit_events` | Each service | Actor/service, operation, source/target references, reason, correlation, mapping version and redacted outcome. |

Inventory and reuse existing constraints before adding the missing source-operation keys; do not recreate guards already supplied by SSO. Use foreign keys where databases are shared, and no fake cross-database foreign keys. Validate cross-service IDs at boundaries. Index source-key lookups, target references, run items, tenant-scoped audit queries, and pending work by `(status,next_retry_at)` with suitable partial indexes. Use bounded keyset pagination for operations views and short row-locking transactions for work claiming; do not hold locks during network requests.

Integration data must be denied to browser `anon`/ordinary authenticated access. Admin access flows through APIs that verify the existing SSO identity, live RBAC, source/tenant scope and target authorization. The user does not use Supabase RLS: neither `auth.uid()` nor restrictive policies nor caller-RLS views satisfy this contract. Use server-owned private state, database grants for internal functions/state, and explicit authorization/filtering at all supported read/write boundaries. If a table/view/RPC is directly browser-readable, API filtering alone cannot protect the same data; close that exposure or keep sensitive import data behind a private server-owned boundary before projection. Do not globally disable or remove unrelated existing database policies. No credential columns in broadly readable schemas.

Add timestamped, schema-only migrations in each owning repository after the real target-branch migration baseline. Place catalog/config data changes in approved seeds. Validate constraints and query plans against realistic volumes and representative existing data. Never rewrite applied migration history.

## 9. Reliability, idempotency, and failure handling

### 9.1 Guarantee and recovery model

Transport is **at least once**. Database effects are made idempotent through immutable source keys, uniqueness constraints, durable operation results, and compare-and-set updates. The design has no email delivery effects. Database transactions and queues still require idempotent recovery across the separate SSO and application databases.

Suggested operation identity: `(approval_item_id,source_org,module,external_id,source_revision,mapping_version,operation_kind)`. Revisions include timestamp plus content hash. Recommendation/embedding effects reuse the committed approved operation identity. Never generate email effects.

- Within a database: domain update + accepted source link + outbox record commit atomically.
- Across SSO and SkillPassport: use a persisted saga. SSO creation may succeed while app projection fails; retry projection against the same SSO IDs. Never delete the successful identity as an automatic compensation.
- Persist received work before acknowledging callbacks. Handle a crash between durable inbox insert and queue send with an inbox/outbox dispatcher. A 2xx acknowledgment means durable acceptance, not completed onboarding.
- Queue consumers acknowledge only after the required transactional state update. Deferred downstream effects remain visible in the operation state.
- Leases require expiry and fencing. Safely reclaimable discovery work and ambiguous destination writes have different rules: an expired destination lease does not prove that its effect never committed. Unknown outcomes require receipt reconciliation or verified fenced recovery before any repeat write.
- Reconciliation must be fair: persist a next-check time/backoff and progress through eligible operations. Permanently unresolved old items must not monopolize the first page and prevent newer committed receipts from being checked.

### 9.2 Retry policy

| Failure | Action |
| --- | --- |
| Temporary read/discovery failure or a definitive destination no-write response | Exponential backoff with full jitter and a durable bounded attempt/time budget; preserve operation identity. |
| Destination timeout/transport failure after invocation may have started | Keep outcome unknown; perform read-only receipt reconciliation. Do not repeat a write just because its queue message was retried or the lease expired. |
| Zoho 429 or quota exhaustion | Respect returned retry guidance, stop new work for that connection, resume from a durable schedule. |
| Expired access token | One coordinated refresh and retry; distributed single-flight lock avoids refresh storms. |
| Revoked refresh token / invalid grant / lost permission | Pause affected connection, alert operator, preserve backlog; require reconnection. Do not repeatedly refresh. |
| Invalid source data / unmapped status | Quarantine with reason and safe operator remediation; continue other records. |
| Duplicate/conflicting identity | Resolve using SSO uniqueness rules or move to manual review; never silently merge. |
| Poison batch / oversized export | Isolate deferred/invalid records durably and split/checkpoint work within existing runtimes, or use an approved manual-export path; one record must not block the entire backlog. No new Worker deployment. |
| Destination mirror missing / event ordering | Retry dependency within bounded budget, then repair from canonical source state; mark account not ready. |

Proposed default retry budget: eight attempts across up to 24 hours, followed by tenant-scoped DLQ review. Queue-native short delays and long-term database scheduling must respect actual platform limits. Replays reuse the same operation/effect identity and leave an audit trail.

This is the target policy, not a claim that every current background handler implements it. Discovery must persist its failure budget by run/page across newly published scheduler messages. Native delivery attempts are per message and cannot alone enforce a logical run's retry limit. Classify quota/retry guidance separately from revoked credentials and permanent permission failures; generic five-minute retries are not the final policy. [C2]

### 9.2.1 Approval expiry, revocation and retry

Approval covers one immutable operation, not a mutable source-record pointer. Before execution, verify signature/trust, expiry, revocation, source/config/destination preconditions and allowed action. Reject unknown or stale grants without partial target changes.

Approval cancellation is coordinated with queued/in-flight work. Show `revocation_requested` until the owning service confirms that new execution is fenced; do not promise an already committed operation can be recalled. Persist enough service-owned operation/grant state to reject a delayed handler after revocation/lease takeover. Cross-database approval state is not made atomic by a browser check.

A crash after identity commit retries projections for the same approved result. A replay of an unapproved or differently revised source record remains pending approval. Do not expose bypass/retry-as-admin or auto-approve flags.

### 9.3 Quota and capacity controls

Use a distributed governor with coordination keys matching Zoho's limits: organization-level credit budget and user/app concurrency (with relevant sub-concurrency), including connections that share those scopes. Persist observed usage and conservative local reservations; other apps can consume the same organization budget, so local accounting is not an exact authoritative credit balance. [Z9]

Apply this governor across all background handlers for the connection; do not use process-local Maps. Start with at most two simultaneous Zoho calls per connection, with separate export-download limits, and tune against actual licensed limits and observed response headers. Reserve quota for closures/deletions and catch-up; pause bootstrap before starving live updates.

For `C` candidates and `J` jobs, estimate regular full-read requests as `ceil(C/200) + ceil(J/200)` plus metadata, deletes, and detail enrichment. Bulk export planning starts with `ceil(C/200000) + ceil(J/200000)` jobs, then status/download costs and API-credit charges; verify account support and size distribution. Avoid one extra detail request per unchanged record.

Example planning volume only: 100,000 candidates + 10,000 jobs has an arithmetic lower bound of 550 paged list reads versus at least two bulk export jobs; filters, supported page ranges, repeated/overlapping windows and account permissions can require more calls or a different extraction strategy. Request counts are not API-credit counts; budget operation-specific charges, status polling, downloads, and detail reads separately. This is not a runtime SLA or an assertion about your inventory. Include SSO hashing/provisioning cost, database write throughput, event fan-out, approval throughput, and indexing/embedding cost in a load rehearsal before estimating duration or cloud spend.

## 10. Security, privacy, and data quality

- Store client secrets/refresh tokens in approved secret management or envelope-encrypted storage with key IDs and rotation. Isolate environments and source organizations. Never put tokens in logs, URLs, admin API responses, issue bodies, or the Markdown mapping report.
- Webhook authentication must match capabilities actually available in Recruit: prefer a verified signature when supported; otherwise a high-entropy rotating verification secret in a supported header/body field. Do not assume custom HMAC headers exist. Avoid query-string secrets; if secure validation cannot be configured, disable hook ingestion and use authenticated polling.
- Enforce body size, content type, module/ID allowlists, connection binding, timestamp/replay controls where possible, and distributed ingress throttles. Shared-secret webhooks are replayable hints; authoritative re-fetch and effect idempotency are still required.
- Restrict callback/download hosts and schemes; reject redirects to unapproved/private addresses, ZIP traversal, decompression bombs, malformed CSV, and formula execution in exported exception reports.
- Staged candidate data and newly provisioned profiles remain private under the approved visibility policy. Do not auto-enable public recruiter discovery, third-party data sharing, resume distribution, marketing, or inferred evaluated achievements. Preserve existing explicit preferences.
- Document source provenance, processing purpose, non-email privacy-notice/activation handling, retention, deletion/erasure, and age-related handling before production. The import is not evidence that a person accepted platform terms.
- Proposed retention defaults for review: delete raw export files within seven days of successful reconciliation; keep only necessary normalized staging for up to 30 days; retain redacted operational/audit records for 90 days unless an approved policy requires otherwise. Erasure and suppression overrides take priority. Confirm requirements with the data owner before enabling production.
- Define dependency-aware retention for staging snapshots, duplicated approved payloads, identity links, receipts, audit, OAuth state and backups. A pending review must expire visibly if its permitted payload retention ends; it must not disappear from accounting or remain approvable without an authoritative re-fetch. Preserve only the minimal metadata permitted for unresolved approved effects; do not treat immutable audit as permission to retain raw candidate PII forever.
- Persist purpose-scoped erasure/opt-out suppression so recurring discovery, reconnect and backup replay cannot silently resurrect removed connector data. Define whether suppression applies to a source ID, reviewed canonical identity or broader authorized scope, and how a separately authorized release occurs. Use minimal protected matching metadata; never expose a plain email-hash lookup list. Source deletion, platform account deletion and suppression remain distinct decisions.
- Never use production candidate data or real outbound recipients in tests. Use synthetic/redacted fixtures, separate OAuth apps and data stores, instrumented email-denial checks and isolated test environments, and environment-bound webhook endpoints. A test deployment must not connect to a production Recruit organization without an explicit read-only diagnostic policy.
- Do not automatically erase an independently established account because a recruiter removed a candidate. Handle connector data removal and platform account deletion as different workflows.
- The admin dashboard displays aggregate counts and minimal redacted record details; privileged diagnostics require an audit trail. No raw candidate payloads in DLQ messages or monitoring systems.

## 11. Zero-email enforcement and derived effects

`email_policy=forbidden` is an immutable policy for this integration, not an administrator toggle. There is no invitations screen, send-invitations permission, template preview/send action, or dispatch/resend queue.

- Do not bind the connector to an email provider/service or give it mail credentials. No SMTP, mail API, mail queue or direct provider fallback.
- Approved provisioning uses a silent SSO path. Audit signup/admission, verification/reset, user/profile creation, subscription changes, shared event handlers, database triggers, webhooks, provider automations and job notifications for implicit email before enabling writes.
- Origin/provenance is set by trusted server code and carried through approved operations/outbox/events. Every relevant downstream service enforces the no-email contract for those effects; a missing/changed browser flag is not an override.
- Identity/profile/entitlement sync events remain necessary internal data messages, but must not fan out into welcome, verification, password, receipt or subscription emails.
- Job import must bypass/suppress the existing notification fan-out for both historical and live approved jobs. Derived search/embedding/recommendation updates are permitted after approved commits; they must not enqueue notification email. A future in-app-only notification project requires explicit scope and proof that no email bridge is invoked.
- Operational errors appear in sp-dash and approved non-email monitoring. No email to administrators, candidates, recruiters or any other recipient.
- Before a live OAuth connection or export, verify tenant/provider notification settings and automations as well as application code. Whether Zoho authorization/security/export events send vendor-managed email is unverified; do not claim that they do or silently exclude them from the user's prohibition. If the process cannot meet the rule, stop before that live action rather than treating vendor email as an allowed exception.
- Retries, reconciliation and DLQ replay preserve the prohibition. No email may be emitted as a failure fallback or used to finish activation.
- Before rollout, prove zero outbound mail/provider calls, zero mail queue messages, and zero integration-origin email dispatch records across successful, rejected, failed, retried and reconciled operations. Fail the release if any such side effect occurs.

Material **approved** job changes record an outbox event for search/embedding/cache updates. Hash only relevant fields; reuse current-row visibility/expiry checks and existing stale-event guards. Do not import source skills/resume statements as evaluated LTE achievements or bypass Discover gates.

## 12. Operational controls and service objectives

Sp-dash is the required control center: **Integrations → Zoho Recruit**. The connector performs durable background work even when the browser is closed. Full screen/permission contracts are in section 21.

| Metric | Initial target / reporting rule |
| --- | --- |
| Source discovery freshness | Proposed p95 ≤ 5 minutes and p99 ≤ 15 minutes with healthy source access/quota; validate in pilot. |
| Approval waiting time | Show oldest pending candidate/job change and urgent source closures; an operator-governed business metric, not an automatic execution SLA. |
| Approved execution readiness | Proposed p95 ≤ 10 minutes after valid approval, excluding explicit failures; includes required profile/entitlement projections. |
| Source closures/deletions | Stage promptly and escalate within sp-dash; apply only after approval. Existing approved deadlines still expire at read/apply time. |
| Inventory accounting | Every enumerated source ID has staged/pending/approved/completed/held/rejected/blocked outcome. |
| Duplicate effects | Zero duplicate identities, grants, opportunities or approved operations under concurrency/replay. |
| Email | Zero integration-triggered emails or mail dispatch attempts to anyone. |

Dashboard/monitoring alerts cover auth loss, quota, source/approval/execution age, stale approval, projection lag, outbox/DLQ backlog, source withdrawal and attempted email side effects. Include redacted source/run/approval/correlation references; no raw candidate data in monitoring labels.

Accounting per snapshot: `distinct source IDs = pending_approval + approved_in_progress + completed_or_linked + held_or_rejected + blocked`. Define mutually exclusive categories and show provisioned versus login-ready independently. Reconciliation cannot count unapproved records as created users/jobs.

Runbooks cover reconnect, pause, approve/reject bounded changes, invalidate approval, repair an approved projection, recover queue/outbox/cursors and investigate forbidden email attempts. Rehearse restore/replay using protected integration/approval state and database backups/PITR. Do not email run results.

## 13. Test and acceptance matrix

| Area | Required evidence |
| --- | --- |
| Approval isolation | OAuth/discovery/bulk/delta/delete/dry-run/reconcile produce zero SSO/user/learner/subscription/opportunity writes without sp-dash approval. |
| Approval integrity | Exact IDs/versions/actions/diffs/config/targets; missing/stale/expired/revoked grants rejected; no browser boolean bypass. |
| Bulk/concurrency | Concrete bounded selection; second page/new arrivals not auto-approved; two operators/retries produce no duplicate effects. |
| Identity/Discover | New/existing/unverified/non-learner/paid/org-sponsored candidates; missing/shared emails; import versus signup/purchase/cancellation; correct `freemium` access and preserved existing state. |
| Provisioning completeness | User + independent learner + effective entitlement mirrors acknowledged; no fictional school membership; login readiness reported honestly. |
| Authentication | No fabricated verification, exposed passwords or automatic sessions; approved non-email activation or explicit activation_pending. |
| Jobs | Approved create/update/publish/reopen/close/delete; source visibility/ownership/quota/application route; closed history preserved. |
| Changed records | A source or reviewed target diff change invalidates pending execution; new revision returns to review. |
| No email | Instrument every mailer/provider/queue/fan-out/trigger path: zero calls/messages/emails for all users, admins and recipients across approval, success, error, retry, replay and reconnect. |
| Source API | OAuth/state/region, metadata drift, quotas, bulk pagination/expiry, modified/delete windows, incomplete permissions and loss of access. |
| Recovery | Crash before/after target commit/outbox/ACK; retry the same approved operation; no auto-approval; revocation requested versus fenced/committed state. |
| Privacy/security | Cross-org/target IDs, forged actor, raw credentials, malicious HTML/URLs/ZIP/CSV, server authorization/private storage, direct table/view/RPC exposure without RLS, retention and erasure. |
| Recommendations/apply | Approved changes reflected consistently; unapproved changes not substituted; imported claims unverified; external local tracking not misrepresented as Zoho submission. |
| Performance | Realistic inventory plus growth headroom; bounded memory/pages/DB plans; quota/backpressure and approval backlog measured. |
| Sp-dash E2E | Review → approve → queue → execute → verify; reject/hold/stale approval; refresh/concurrent tabs; no email controls or send endpoints. |

Use unit, SQL transaction/uniqueness/grant, server-authorization, service-contract, E2E and fault/load tests. Imported-profile privacy acceptance must pass without RLS and must cover real service-role API readers, nested/copied fields and direct database access where exposed. Preserve existing regression coverage; run each changed repository's required CI/hooks. A mock approval or queue success alone is not proof of a properly provisioned account.

## 14. Delivery phases and ownership

| Phase | Deliverable | Exit condition |
| --- | --- | --- |
| 0 — Verify contracts | Actual Recruit inventory/DC/permissions; schema/catalog; independent learner/login model; publisher quota; implicit email side-effect inventory | Approved mapping and implementation decisions; zero-email path identified. |
| 1 — Stage and review | Connector modules in the existing sp-dash runtime, OAuth, queues, private staging, run accounting and review screens | Complete inventory visible with no destination creation and no email. |
| 2 — Approval authority | Immutable approval manifests, permissions, version/expiry/revocation, trusted execution grants | Missing/stale/forged approval cannot execute; batch selection is exact. |
| 3 — Silent learner provisioning | SSO transaction/outbox, independent projection, Discover preservation and non-email activation state | Approved users are fully provisioned; all implicit email paths blocked. |
| 4 — Approved job changes | Reused opportunity rules, ownership/quota, lifecycle actions, apply routing and derived data | Only approved job actions execute; no notification email. |
| 5 — Recovery and pilot | Incremental staging, reconciliation, replay, fault/load/restore tests and monitored production cohorts | Complete accounting, operational handover and zero-email evidence. |

Integration/backend owns staging and execution; identity owns SSO/access; SkillPassport owns jobs/projections; sp-dash owns review/approval UX with server enforcement; platform owns secrets/queues/monitoring; recruiting operations owns approvals/mappings; QA owns end-to-end/no-email evidence.

Re-estimate effort after phase-zero discovery and approval/non-email activation design. Previous illustrative schedules are not commitments and do not authorize any production action.

## 15. Deployment, rollout, rollback and disconnect

1. Deploy additive schema, private staging, approval/operation state and server-side permission checks first. Keep destination execution disabled. Extend only existing service deployments; create no standalone Zoho Worker.
2. Deploy compatible silent SSO/import handlers, outbox/consumer projections and zero-email enforcement across all affected services. Validate that integration handlers receive no mail capabilities or email fallback, and that no implicit event/trigger mail path runs. Existing mail bindings used by unrelated workflows remain intact.
3. Update the existing sp-dash deployment with connection/review APIs, explicit Zoho queue routing and scheduled read-only discovery/recovery; preserve its course-upload and LTE consumers. Configure queues/DLQs on that existing deployment, with environment-specific names and preview consumption disabled. Complete inventory/dry-run checks without user/job creation.
4. Pilot a small **explicitly selected and approved** cohort spanning new/existing/paid/conflicting candidates and job lifecycle actions. No mail or automatic outbound substitute.
5. Verify canonical identity/profile/Discover, preserved paid access, account versus login readiness, opportunity identity/publication/quota and zero-email instrumentation.
6. Expand only through new explicit bounded approvals. Background schedules continue staging; they never become auto-approval rules.
7. Reconcile and rehearse approved-operation recovery and revocation before operational handover.

Rollback pauses discovery and/or approved execution, fences queued grants where possible, preserves committed identities/jobs/paid access/history, and presents proposed corrective actions for sp-dash approval. Do not delete users or reverse approved business state automatically.

Disconnect revokes source credentials/webhooks, stops new discovery/execution and invalidates unexecuted grants through coordinated revocation. It does not automatically erase users or change job publication; any destination cleanup is separately reviewed and approved. Reconnecting the same source organization preserves source keys and cannot replay previously rejected/pending records as newly approved work.

## 16. Remaining preflight decisions

Zero email, mandatory candidate/job approval and no new Worker deployment are settled requirements, not options to revisit.

- Actual Recruit organization/DC/edition, complete inventory and service-account permissions.
- Who may approve candidates versus jobs; supported initial `super_admin` role and any later delegated capabilities.
- Individual learner context and production Discover (`freemium`) applicability; preservation of organization/paid access.
- New-user login setup through a supported trusted provider or approved assisted non-email mechanism; otherwise explicit activation_pending after real account provisioning.
- Exact approved source fields/statuses, publisher organization/capacity, confidentiality and public application route.
- Approval TTL, maximum batch size, reviewed target diff rules, revocation execution boundary and dashboard escalation targets.
- Retention, purpose/notice delivery through permitted non-email channels and age-related handling; never substitute automatic SMS/message sending without a separate request.
- Measured source/cloud budget, real execution throughput and recovery objectives. No email-provider integration is needed.

## 17. Deliverables and definition of completion

- [ ] Complete versioned source inventory, mapping and private staged diffs.
- [ ] Sp-dash candidate/job review, approve/reject/hold and bounded bulk approval.
- [ ] Server-enforced version-bound approval authority, scoped grants, expiry and revocation.
- [ ] Silent canonical SSO learner creation/linking, independent profile and Discover/effective entitlement projection.
- [ ] Approved canonical opportunity create/update/publication/lifecycle with ownership/quota and apply routing.
- [ ] Permanent no-email enforcement across direct/indirect services, event consumers, triggers, retries and monitoring.
- [ ] Incremental staging, approved-operation recovery, reconciliation, DLQ review and audit.
- [ ] Honest account/projection/login-readiness and job outcome reporting in sp-dash.
- [ ] Passing security, transaction, approval, no-email, E2E, scale and recovery evidence.
- [ ] Production pilot and complete source/outcome accounting.

**Required flow:** Zoho discovery → private staging → sp-dash review → approve selected versions → silent queued creation/application → verified result.

**Done means:** sp-dash-approved candidates have canonical learner accounts/profiles and the correct Discover or preserved access; sp-dash-approved job actions reach SkillPassport correctly; unapproved records remain staged; every exception is visible; and no email is sent or queued to anyone by this process.

## 18. Official references

Initially reviewed 29 October 2026; selected OAuth, record/deletion, bulk-limit, quota and queue references were rechecked on 30 October for section 23. Zoho documentation describes platform capabilities; actual account permissions, supported fields, quotas, and behavior must be verified during preflight. Repository observations above are independent local evidence.

- **Z1:** [Recruit module metadata](https://www.zoho.com/recruit/developer-guide/apiv2/modules-api.html).
- **Z2:** [Recruit Get Records, pagination, and modified-since filtering](https://www.zoho.com/recruit/developer-guide/apiv2/get-records.html).
- **Z3:** [Recruit OAuth overview and scopes](https://www.zoho.com/recruit/developer-guide/apiv2/oauth-overview.html).
- **Z4:** [Recruit access/refresh tokens and regional Accounts endpoints](https://www.zoho.com/recruit/developer-guide/apiv2/access-refresh.html).
- **Z5:** [Create Recruit bulk read job](https://www.zoho.com/recruit/developer-guide/apiv2/bulk-read/create-job.html) and [read job details](https://www.zoho.com/recruit/developer-guide/apiv2/bulk-read/job-details.html).
- **Z6:** [Recruit bulk-read limitations](https://www.zoho.com/recruit/developer-guide/apiv2/bulk-read/limitations.html).
- **Z7:** [Recruit deleted-record listing](https://www.zoho.com/recruit/developer-guide/apiv2/get-deleted-records.html).
- **Z8:** [Recruit workflow webhooks, setup, retries, and limits](https://help.zoho.com/portal/en/kb/recruit/automation/workflow/webhooks/articles/zoho-recruit-webhooks).
- **Z9:** [Recruit v2 API credit and concurrency limits](https://www.zoho.com/recruit/developer-guide/apiv2/limits.html). Do not apply legacy authentication-token/API-v1 limits to this design.
- **Z10:** [Recruit v2 dedicated domains and multi-DC behavior](https://www.zoho.com/recruit/developer-guide/apiv2/whats-new.html).
- **C1:** [Cloudflare Service Binding RPC/HTTP and capability boundary](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/).
- **C2:** [Cloudflare queue acknowledgement, per-message retries and delayed delivery](https://developers.cloudflare.com/queues/configuration/batching-retries/).

## 19. Prior review findings retained under the new requirements

Existing protections remain reusable: SSO subscription uniqueness, stale-event guards, canonical opportunity import/quota, and external application tracking. Do not rebuild them based on earlier overstatements.

Earlier invitation cohorts, claim-email tokens, email dispatch/delivery reconciliation, send-invitations permissions and automatic source-to-destination application are removed from scope. They are superseded by **zero email and explicit approval before creation/update**. This is not a paused email workflow waiting to be enabled.

Source-derived safety changes also remain approval-controlled. Stage source withdrawals/confidentiality urgently and show unresolved risk in sp-dash; the system must not claim automatic closures while requiring approval. Existing approved deadline/access checks still apply normally.

## 20. Evidence and false-positive review disposition

| Claim / decision | Disposition |
| --- | --- |
| Discover code | Inspected SSO method resolves `freemium`; validate production catalog. |
| Duplicate active personal subscriptions | Existing indexes/trigger already guard covered rows; extend conflict recovery/approval transaction, not redundant guards. |
| Requisition import | Existing backend inserts opportunities and applies quota/notifications; extract/reuse domain logic while suppressing mail/fan-out. |
| External application UI | Existing link navigation and honest local recording labels exist; reuse with approved integration routing. |
| Stale subscription updates | Existing timestamp/seat guards exist; preserve/test them. |
| Independent learner projection | User sync alone only mirrors the user in the inspected path; verify/reuse approved profile creation infrastructure. |
| Zoho API contracts | Official references support the described capabilities; tenant access/fields/volume remain unverified. |
| Approval and zero email | Mandatory acceptance gates. Existing tests cover implemented layers only; full downstream/provider enforcement is not yet established. |
| Proposed tables/services/grants | New capabilities to implement or satisfy through verified reuse; no claim they already exist. |
| Production readiness | Not established: no live Zoho connection, import, provisioning, email or deployment has been performed by this plan. |

Review estimates, retention/freshness/retry values and transport capabilities during preflight. Do not convert unknown configuration into a confirmed production defect.

## 21. Sp-dash: required review, approval and control center

### 21.1 Placement and verified integration points

Navigation: **Integrations → Zoho Recruit**, locally implemented workspace `/integrations/zoho-recruit`; complete authorized run/approval deep links remain part of the target UX.

The [Integrations component](sp-dash/components/pages/IntegrationsPage.js) and [route](sp-dash/app/(dashboard)/integrations/page.js) were extended locally. The initial static-card finding is historical: the local card now uses API status and opens the review console. Complete live synchronization and canonical execution are not established.

Reuse [navigation](sp-dash/app/(dashboard)/layout.js), UI primitives, [server SSO auth](sp-dash/lib/middleware/sso-auth.js), [server-only service patterns](sp-dash/lib/sso-service-client.js) and [server role-check examples](sp-dash/app/api/maintenance/route.js). [Page middleware](sp-dash/middleware.js) is not sufficient API authorization. New granular capabilities below are proposals, not existing token claims.

### 21.2 Screens

| Screen | Information | Allowed controls |
| --- | --- | --- |
| Overview | Source/connection/environment, staged and pending approvals, approved execution, provisioned/activation-pending counts, job outcomes, quota and urgent warnings | Discover changes, dry run, reconcile; open pending approvals/runs. Fixed badge: **Email prohibited**. |
| Connection | Confirmed Recruit org/DC/service account, capabilities, auth health, last successful discovery | Connect/test/reconnect/pause/disconnect; never reveal tokens. |
| Candidate review | Exact source snapshot/hash, matched identity, new/link/update action, profile diff, Discover/preserved access, conflicts and validation | Approve/reject/hold selected version; bounded explicit bulk approval. No account created by Preview/Discover. |
| Job review | Source/opportunity IDs, field diff, create/update/close/delete/reopen action, publisher/quota/visibility/apply destination | Approve/reject/hold exact action/version; urgent source-withdrawal queue. No posting created merely by ingestion. |
| Approvals | Immutable selection, source/target versions, mapping/config, approver, decision/expiry/revocation and linked operation | Inspect approval/execution outcome, retry valid approved work, revoke unexecuted grant; no “approve all future” switch. |
| Runs | Discovery/staging/approved-execution/reconcile/replay runs and per-item states | Progress, safe pause/resume/cancel, bounded approved retry and redacted export. |
| Exceptions | Missing data, identity conflict, invalid/stale approval, quota, permission loss and projection/DLQ failure | Review/fix through owning authority; source changes require new approval. |
| Account readiness | Canonical SSO/learner IDs, correct entitlement, projection acknowledgements, login readiness | Inspect approved non-email activation readiness; no invite/send/reset-email/credential-export button. |
| Mapping & audit | Versioned mappings/publisher policy, schedules/limits/retention, actor/action/approval/correlation history | Review/activate configuration with permission; activation never approves records. |

There is **no Invitations tab or email control**. The zero-email policy is read-only and cannot be enabled by an administrator. Unimplemented/backend-unavailable controls show a precise disabled reason.

### 21.3 First-run and daily workflow

1. Connect the authorized environment/source and publishing organization.
2. Discover candidates/jobs into private staging, including all required pages.
3. Validate and preview concrete record diffs and identity/quota conflicts.
4. Review candidates and job actions separately; select exact records/versions.
5. Use **Approve & Create Account** for candidates or **Approve & Apply Job Action** for jobs (including publish/update/close as reviewed). Record actor, source/target, exact action/diff, mapping/config version and expiry. Bounded bulk approval has the same semantics for its concrete selected manifest.
6. The approval command automatically queues its valid approved operations; a second manual run is not required. Durable dispatch recovers a crash after approval without authorizing new records. Show HTTP acceptance separately from completed creation.
7. Verify profile/entitlement and job outcomes; no mail is sent.
8. Later source changes return to Pending Approval. Reconciliation reports missing/failed approved effects without authorizing new writes.

Refresh/reopening the browser resumes persisted review/run state. New records arriving after selection are not included in that approval. Rejected items remain rejected for that revision; a changed revision returns as a new review proposal, not automatically approved.

### 21.4 Permissions

| Proposed capability | Operations |
| --- | --- |
| `integrations.zoho.view` | Read redacted inventory, diffs, approvals, runs and health. |
| `integrations.zoho.manage_connection` | Connect/reconnect/disconnect within allowed source/environment. |
| `integrations.zoho.manage_mapping` | Manage versioned configuration; does not authorize destination mutations. |
| `integrations.zoho.approve_candidates` | Explicitly approve/reject/hold candidate create/link/update actions. |
| `integrations.zoho.approve_jobs` | Explicitly approve/reject/hold job creation/publication/update/lifecycle actions. |
| `integrations.zoho.execute_approved` | Queue/retry still-valid approved operations; cannot self-authorize other records. |
| `integrations.zoho.audit` / `view_pii` / `export` | Separately delegated audit, necessary data reveal and approved bounded exports. |

Start with server-verified `super_admin` if delegated capability infrastructure is unavailable; deny by default. Every handler checks identity, permission, connection, environment and action scope. Browser-supplied plan/role/actor/organization values never override server policy. No email permission or mail-capable endpoint is introduced.

### 21.5 API and command contract

Browser → authenticated same-origin sp-dash API → narrow connector administration capability → persisted approval/operation → owning SSO/SkillPassport service.

| Proposed operation | Contract |
| --- | --- |
| Read overview/staging/diffs | Scoped GET, redacted bounded DTOs, timestamps and stable pagination. |
| OAuth start/callback | Admin-bound single-use state, allowed region/redirect and server-side exchange; no mail. |
| Discover/dry-run/reconcile | POST typed read/staging command; HTTP 202 + run ID; no implicit destination creation. |
| Approve/reject/hold | POST concrete IDs/versions/actions/reviewed diffs + expected config; immutable decision. Approval atomically records execution intent/outbox for background creation/application; stale inputs return 409/review-required. |
| Execute/retry | POST approval-item IDs and idempotency key; reject missing/expired/revoked/stale grants; HTTP 202 + operation IDs. |
| Revoke | POST expected approval revision; report requested/fenced/already-committed state honestly. |
| Mapping activation | Expected revision and permission; new config invalidates affected unexecuted grants. |
| Pause/resume/cancel | Durable desired state with revision and safe checkpoint semantics; never email. |

Use the repository's route/versioning conventions for proposed `/api/integrations/zoho-recruit`. No direct browser-to-Zoho/SSO/database writes. No mail endpoints. Signed/scoped authorization is verified by execution authorities, not only the admin page.

### 21.6 Progress and operating controls

- Show counts for staged, pending approval, approved, queued/executing, provisioned, activation_pending, job-created/updated/closed, held/rejected and failed. “Imported” does not mean “account created.”
- Show last complete discovery, pending approval age and approved execution age separately. No fake Last Sync timestamp or 100% completion from a partial page.
- Source changes or stale target diffs show **Approval required again**; retry cannot silently substitute the newest payload.
- Pause discovery separately from approved execution; a global pause stops new work at defined safe boundaries. Already committed records persist.
- Cancellation/revocation is coordinated with in-flight operations; do not promise rollback of a completed identity or posting.
- No “send”, “invite”, “resend”, verification-email, reset-email, subscription-email or operational-email action exists in this integration.
- Shared services/triggers are tested for forbidden indirect email. Display attempted policy violations prominently in sp-dash/non-email monitoring.
- Safe retries repair only approved effects; new fields/actions/records require approval. No generic “Sync all and apply” shortcut.
- Poll bounded summaries with backoff; use existing realtime only if verified. Browser shutdown never stops a persisted background operation.
- Exports are authorized, minimal, asynchronous and privately downloadable; no raw credentials or candidate bulk payloads in client memory/logs.

### 21.7 Acceptance gates

- [ ] Existing Integrations navigation reaches candidate/job approval queues and immutable approval details.
- [ ] Discovery and Preview create no canonical accounts, subscriptions, learner profiles or opportunities.
- [ ] Missing/stale/expired/revoked/forged approval blocks execution in the destination authority.
- [ ] Bulk approvals resolve to exact reviewed IDs/versions; later arrivals need separate approval.
- [ ] Approved candidate creates a complete canonical learner + Discover/preserved entitlement projection; login readiness remains explicit.
- [ ] Approved job action respects source visibility, publisher authority, quota, history and application route.
- [ ] Every direct/indirect success/error/retry/replay path records zero mail calls, mail queue work or emails to anyone.
- [ ] There is no invite/email UI, endpoint, credential or runtime override for this integration.
- [ ] Real run state, pending approvals, exceptions, retries and audit remain correct across refreshes and concurrent operators.
- [ ] Permissions, CSRF, tenant isolation, config conflicts, queue failure and revocation/in-flight races pass E2E tests.

Sections 1–21 are the target specification, not an implementation checklist marked complete. Local dashboard/backend work is recorded in section 22; open whole-plan findings are in section 23. No live import or production rollout has been performed.


## 22. Implementation status — foundation in progress

The following source changes have been made locally on feature branches in sp-dash, SkillPassport and SSO. This is not a claim that the complete integration is operational.

### Implemented locally

- Sp-dash `/integrations/zoho-recruit` review console, navigation from Integrations, source registration, persisted source health, source-scoped counts, candidate/job staging tables, record review, hold/reject and approval confirmation.
- Server API checks signed JWT AND live platform super-admin membership, enforces same-origin mutations, bounds inputs and rejects arbitrary actor/email/plan overrides.
- Schema-only application migration for private connections, staged records, immutable approval manifests/operations, one-time actor-bound OAuth state, encrypted token envelopes and paginated discovery runs.
- OAuth start/callback, region allowlists, source-organization matching and AES-GCM token storage bound to its connection. Missing configuration remains unavailable; no live credentials have been supplied/tested.
- [Reusable discovery module](./sp-dash/lib/zoho/discovery-consumer.js): bounded regular reads, source-field allowlisting, staged validation exceptions, resumable page commits, retries and explicit incomplete-inventory reporting. The standalone deployment was removed; integration with existing runtime handlers is implemented locally (section 25). Its module interface has no mailer or canonical writer capability; shared-runtime credential isolation is not established by that interface.
- SQL approval records exact selected IDs/revisions atomically; stale selection/config, invalid records, changed idempotency requests and unsafe batches are rejected. This records an operation intent, not completed account/job creation.
- [Execution ledger migration](./skillpassport/supabase/migrations/20270129000000_zoho_recruit_execution_ledger.sql): private claim leases, immutable attempt IDs, approval/source/config fencing, bounded safe retries, unknown-outcome isolation and idempotent completion acknowledgements. These functions update integration metadata only; no canonical executor or dispatcher is installed by this migration.
- [Reusable approved-operation coordinator](./sp-dash/lib/zoho/approved-consumer.js) and [dispatch/reconciliation library](./sp-dash/lib/zoho/approved-execution.js): commit-before-publication delivery, scheduled recovery of unpublished intents, live approver checks, SQL-fenced dispatch, strict receipt matching and read-only receipt reconciliation. Canonical destinations are not yet implemented or bound; readiness remains disabled.
- [Restricted SSO approver reader](./sso-worker/src/rpc/zoho-approver-authority.ts) and [read-only SQL authority](./sso-worker/supabase/migrations/20261030000000_zoho_import_approver_authority.sql): returns only whether an unblocked actor has active platform super-admin membership. The coordinator does not receive SSO's general account/session/email methods or identity records through this binding.
- Source-scoped execution history in the console shows the latest 20 operations, attempt counts, retry limits and unconfirmed outcomes awaiting reconciliation. Failed/reconciliation work is represented in attention counts. Approval reports queued versus pending publication honestly; it never reports creation complete.
- Creation remains disabled in API/UI until the coordinator is wired into the existing runtime and supported canonical destinations are implemented, bound and verified. Readiness requires durable dispatch, receipt recovery, live approval/approver checks, lease fencing, destination idempotency, transactional receipts, verified postconditions and zero-email policy. No fake successful creation is shown.

### Validation performed

- Historical foundation check: 55 sp-dash tests passed for authority, no-email/input contracts, encrypted tokens, OAuth state failures, API fail-closed behavior, staging discovery, PostgreSQL pagination, consumer readiness, durable approval publication, execution/timeout classification, strict destination receipts, read-only reconciliation and source-scoped history.
- Eight new SSO reader tests pass. Its separate `npm run test:zoho:sql` suite passes in a disposable local database, covering absent/blocked/null-block-state users, missing/revoked roles, inactive/foreign-platform memberships and private function grants.
- Rollback-only local SQL regression tests pass: migration compiles; source changes invalidate queued approval; duplicates/replays/stale/partial-invalid decisions are handled; OAuth state is actor-bound/single-use; email policy cannot change; discovery does not approve itself; private grants exclude browser roles; user/learner/job counts remain unchanged.
- Execution SQL regression tests also pass, including changed/expired grants, wrong/reused attempt tokens, stale completion receipts, retry due-times/limits and unknown outcomes that cannot be reclassified as safe retries. Both migrations and both SQL fixtures passed together in a rollback-only transaction against the existing local schema.
- Repeatable `npm run test:zoho:sql` in SkillPassport uses a separate synthetic local fixture database and removes it afterward. It also races two real database sessions against the same approved operation: exactly one receives a claim and only one attempt is recorded. This is a focused concurrency check, not a production load test or canonical destination test.
- Sp-dash production build and type check passed. The former standalone coordinator bundled successfully before its deployment configuration was removed; existing-runtime routing, build and dry-run validation are now recorded in section 25. Browser checks render the actual console with synthetic data: late Source A responses cannot replace Source B discovery or execution history, and unresolved effects show receipt reconciliation rather than completion. These are component checks, not an authenticated end-to-end import.
- Application and SSO migration-rule validation passes. SSO production-source typing passes; full-project typing still reports four errors in existing tests, reproduced identically against the base commit (three ExecutionContext fixtures and one OAuth password_hash fixture). None originates in the new authority code.
- Knowledge graphs refreshed. Source changes remain local/uncommitted; no remote migration, connector deployment, source import or email was triggered.

### Still required before claiming completion

- Verify the actual Recruit data center/organization, supported organization identifier response, API permissions, field metadata and source inventory. Configure OAuth client/callback/encryption secrets through deployment secret management.
- Complete source-specific job/publication/identity mapping review. Current job normalization deliberately reports unmapped publication policy and blocks unsafe approval.
- Implement and verify the canonical silent SSO/Discover provisioning authority, independent learner/entitlement projections, trusted approval grants and approved opportunity executor. **These are not implemented by the staging modules.**
- Complete immutable reviewed destination diffs, explicit approval revocation controls, trusted approval-proof validation, least-privilege database/authority boundaries and canonical grant validation. Dispatch and positive receipt reconciliation are implemented against a strict destination contract, but no canonical writer currently implements that contract. Unconfirmed negative outcomes remain blocked for separately verified operator recovery.
- Add bulk export and incremental modification/deletion streams/reconciliation. Current discovery uses regular full reads, capped at 500 × 20 rows with an explicit incomplete state.
- Complete production queue/DLQ/binding setup, end-to-end sp-dash UI/browser tests, full downstream no-email side-effect audit, non-email activation readiness, load/recovery rehearsal and approved pilot.

The migration has only been tested in a transaction that rolls back; it has not been installed in a production or persistent local schema by this work. Existing SSO, learner, subscription and opportunity business tables were not modified by testing.

### Follow-up audit — 2026-10-29

The following implementation defects or readiness gaps were found by inspecting the source. The four foundation defects below have now been corrected locally; approval execution remains unfinished.

- **Review pagination — fixed:** [the cursor schema](./sp-dash/lib/zoho/contracts.js) now accepts validated timestamp offsets. The local reproduction rejected `2026-10-29T08:00:00.123456+00:00` before this fix. A regression test now exercises the second-page control-plane query using that unchanged PostgreSQL cursor and its paired UUID; malformed/unpaired cursors remain rejected.
- **Unsupported setup choices — fixed:** registration and [the UI](./sp-dash/components/pages/ZohoRecruitPage.jsx) now share the five supported region choices, matching [the OAuth host allowlist](./sp-dash/lib/zoho/oauth.js). Tests enforce matching supported regions and rejection of unsupported AU/CA/SA choices. No unverified provider hosts were introduced.
- **Discovery readiness — fixed:** [the API](./sp-dash/app/api/integrations/zoho-recruit/route.js) now requires both the producer and a readiness response from the configured consumer adapter (the former standalone deployment is removed; the API now uses the local existing-runtime adapter). The consumer requires its explicit enable flag, valid required configuration and queue binding. Missing/disabled/unsafe/unresponsive consumers fail closed before a discovery run is created. Readiness exposes no tokens or record data and is not a live tenant/API health check. [Existing-runtime implementation notes](./sp-dash/lib/zoho/README.md) describe the replacement runtime and authority requirements.
- **Cross-source history race — fixed:** [the console](./sp-dash/components/pages/ZohoRecruitPage.jsx) clears history when its source changes and fences responses/errors by request generation and current source. A local browser fixture rendered the actual component with synthetic API data: Source A's history was delayed, Source B's history loaded, then the A response was released. B remained selected and only B's history was visible. This checks the component race, not the authenticated production end-to-end flow.
- **Approval execution — partially addressed:** the local dispatcher, publication recovery, claim fencing and positive receipt reconciliation are now implemented and tested with synthetic destinations. Actual canonical account/job writers, trusted approval-proof validation and destination postconditions remain missing. Execution remains off until these components are implemented and verified together.

The Recruit organization identifier response still needs verification against the actual tenant. Requiring an exact string `org[].id` currently fails closed; the absence of that field from a documentation sample alone is not proof of a production API defect. Likewise, deliberately blocking unmapped jobs and disabling creation without an executor are intended safeguards, not false-positive bugs.

This review did not exercise a live Zoho tenant, full authenticated browser flow or downstream provisioning. Foundation and mock-destination tests, component browser fixtures and build validation do not establish end-to-end completion or a downstream no-email guarantee.

### Execution-ledger follow-up — 2026-10-30

The new ledger is the next implementation layer after review and approval. Its claim, outcome and completion functions are service-role-only and use a consistent connection → staged record → approved operation lock order. The attempt history is private and append-only for the service role. Each new attempt has a unique token that cannot be reused after a retry.

- Claims require an unchanged approved record, matching source/config revisions, valid validation state, active connection, unexpired approval, remaining attempt budget and a due retry time. A new lease lasts at most five minutes and never outlives the approval.
- An expired queued grant becomes stale and creates a new pending review revision, allowing a fresh explicit approval of unchanged source content without colliding with the previous operation's uniqueness constraint.
- A destination's definitive `NOT_APPLIED` outcome permits a delayed retry of the same approved intent. Eight attempts is the hard limit. Transport failures must be recorded as `OUTCOME_UNKNOWN`; these operations stay in flight and cannot be reclaimed or relabelled as safe retries.
- An expired processing lease is never stolen. Destination receipt reconciliation must establish the previous effect before any further action. A late completion receipt may record an already committed effect against the original lease; it does not renew authority to write.
- Completion acknowledgement is idempotent for the same operation, lease, target and receipt. Conflicting targets, changed receipts and old retry leases are refused.

The canonical destination still must independently validate the live approval/lease, live approver authority and reviewed destination state before any write, enforce operation-ID idempotency, persist its own receipt transactionally with its effect, and suppress all downstream email. A ledger claim or acknowledgement alone does not prove any of those destination behaviors. No integration account/job was created or updated by this work.

### Dispatch/reconciliation follow-up — 2026-10-30

The [existing-services implementation notes](./sp-dash/lib/zoho/README.md) document the retained transport modules and remaining canonical prerequisites. All standalone Zoho Worker entrypoints/configurations are removed. Enable flags default false; existing-runtime wiring is implemented locally. No service, queue, binding or migration has been deployed/applied persistently by this work.

Queue messages contain only an operation ID and execute/reconcile mode. The coordinator obtains immutable write data through the SQL claim and checks the approver through SSO's restricted boolean reader. Each canonical destination must still validate trusted approval evidence and the live grant independently: the coordinator's plain grant object and a generic service binding are not proof that a human authorized the write. Shared broad database credentials must not become a way for discovery or projection code to fabricate approval. Complete this authority boundary before enabling canonical execution.

Publication happens after approval commits. If publication fails, sp-dash returns pending delivery; the coordinator scheduler recovers persisted due operations. Only ready destination modules are scheduled. Duplicate messages are fenced by the ledger; changed/expired grants are refused. The coordinator only acknowledges completion after a matching operation/hash receipt. Pending, malformed or mismatched results and post-invocation exceptions/timeouts become unknown outcomes, with no automatic repeat write.

Read-only receipt lookup can confirm an already committed effect even after its lease expires. Absence of a receipt does not establish that an effect never occurred and cannot authorize a retry. Definitive matching no-write responses permit the existing bounded retry path. Manual negative-outcome recovery and revocation controls still require implementation.

The old learner-admission function generates temporary credentials and invitation email, so it cannot be reused unchanged. No change was made to that existing workflow. The next canonical implementation must provide the approved silent SSO identity/Discover transaction, external linkage and durable projections, followed by source-aware silent opportunity publishing with ownership/quota/current-target checks. Until then, no account/job execution is available.

## 23. Whole-plan audit and false-positive disposition — 2026-10-30

This audit reviewed sections 1–22 against the current source and rechecked the relevant official Recruit and queue documentation. Evidence levels below distinguish reproduced behavior, source-inspected gaps and unverified tenant/deployment questions. It did not connect to Recruit, create accounts/jobs, deploy anything or send email. Production execution is still disabled. The table records the original audit evidence. Subsequent local fixes address A1, A2, A4 and A5 at module/SQL level; A3 remains an authority release gate. Existing-runtime integration is implemented locally under sections 24–25; canonical destination validation remains pending. These local fixes do not establish end-to-end completion.

### 23.1 Original implementation findings — historical evidence

| ID / priority | Finding and evidence | Required correction / acceptance evidence |
| --- | --- | --- |
| A1 — locally fixed; canonical validation pending | **Original defect: an existing target was not correlated with a completion receipt.** [Receipt matching and acknowledgement](./sp-dash/lib/zoho/approved-execution.js) originally checked operation ID/hash without comparing a known `grant.targetId` with the returned target. Read-only reconciliation did not load the expected target either; both boundaries are now corrected locally. A synthetic probe supplied an existing target A and a receipt for target B with the same operation/hash; the dispatcher returned `completed` and invoked completion acknowledgement for B. No real destination was used. | Freeze create-versus-existing-target intent in the approved operation, validate it in the canonical authority, dispatcher, reconciliation and acknowledgement boundary. A mismatching known target must remain unconfirmed and require investigation; do not automatically compensate or delete an unexpected effect. Test create, update/link, wrong-target receipt and late reconciliation. |
| A2 — locally fixed | **Original defect: receipt reconciliation could starve later work.** [Scheduled recovery](./sp-dash/lib/zoho/approved-consumer.js) previously selected the oldest 25 unresolved rows with no persisted next-check time or advancing cursor. A synthetic 26-operation probe ran two scheduling passes: only the same first 25 distinct operations were scheduled; operation 26 was never selected. If the first 25 remain unresolved, this continues. | Add fair persisted due-times/check leases/backoff or an advancing stable cursor. Prove that permanently unresolved old operations cannot prevent newer committed receipts from being reconciled. Include more than 25 unresolved records, transient lookup failures and concurrent schedulers. |
| A3 — high release gate | **Code-path isolation is not a restricted database capability (still a release gate).** [Discovery](./sp-dash/lib/zoho/discovery-consumer.js) originally held the application's service-role credential; [the control-plane migration](./skillpassport/supabase/migrations/20270128000000_zoho_recruit_approval_control_plane.sql) grants that role approval-table writes and approval RPC execution. The refactored source module no longer accepts that credential. Its staging adapter now uses an expiring `zoho_discovery` database-role token and fixed RPC grants; tests exercise denied approval and operation writes. The shared host still has privileged application access, and independent canonical approval proof remains necessary; a narrow JavaScript interface is not a security principal. This is a verified authority boundary gap, not evidence that source discovery actually forged an approval. It was already recognized generally in section 22 and must remain a release blocker. | Restrict discovery/projection database access through narrowly scoped roles or authority interfaces. Canonical writers must validate human approval proof that discovery/projection credentials cannot fabricate or modify. An allowed actor UUID, service-role row, plain grant object or destination capability attestation alone is insufficient. Add tests where a discovery credential attempts to mint/edit approval or execute another operation. |
| A4 — locally fixed for durable source budgets; B4 recovery remains open | **Original defect: discovery lacked a durable logical failure budget and error classification.** [The consumer](./sp-dash/lib/zoho/discovery-consumer.js) previously derived failure exhaustion from native `message.attempts`, while its scheduler published fresh messages for the same due run. The database run then had no persisted run/page failure counter. [The HTTP helper](./sp-dash/lib/zoho/oauth.js) also collapsed non-success status into a generic error, losing retry guidance and auth classification. Durable budgets and basic classification are now implemented; B4 records the remaining 401 distinction. Native per-message retry limits do not establish the planned per-run bound. [C2] | Persist run/page attempts, elapsed budget and next retry independently of queue messages; avoid early duplicate deliveries resetting/consuming the wrong budget. Classify rate limits versus revoked credentials/permissions and pause or require reconnection appropriately. Test repeated scheduler publication, 429 guidance, invalid-grant responses and durable exhaustion. Current fixed five-minute retries are not the final exponential/jitter policy. |
| A5 — locally fixed for credential renewal | **Original defect: an unresolved processing operation could indefinitely block reconnect.** [Connection completion](./skillpassport/supabase/migrations/20270128000000_zoho_recruit_approval_control_plane.sql) previously refused reconnect while any operation was `processing`, without distinguishing an expired unresolved lease. Unknown effects deliberately remain processing, and the current coordinator cannot release them merely because no receipt was found. The guard is protective; the missing safe recovery route is the gap. | Define credential-only renewal versus semantic source/config changes, or provide verified fenced operator recovery for unresolved work. Test expired unknown effects, receipt absence, source credential revocation, reconnect and in-flight canonical commit together. Never fix this by blindly clearing processing state or declaring an absent receipt proof of no effect. |

The two original synthetic probes exercised the then-current dispatch/scheduling code with fake destinations/rows. They do not reproduce a live tenant incident or prove all production consequences. The passing test set at the original audit did not cover those two cases; later regressions cover the local fixes.

### 23.2 Additional plan requirements made explicit

1. **Inventory scope:** regular reads without `$state` cover saved records, not drafts. Define saved/draft and other supported inclusion streams per module; publish exclusions and scope-specific completeness. `approved=both`/`converted=both` do not resolve this. Whether the tenant has omitted drafts remains unverified. [Z2]
2. **Bulk data minimization:** reject an export mapping with more than 200 selected fields before sending it. The documented bulk API can export every available field when the select-field limit is exceeded. Do not let this fallback import excluded notes/other personal data into a raw export. [Z6]
3. **Privacy persistence:** implement scoped suppression across reimport/reconnect/restore, plus dependency-aware expiry/purge of raw exports, staged snapshots and duplicated approved payloads. Pending reviews must not silently disappear from accounting, remain approvable after data expiry or justify indefinite PII retention. These requirements make the earlier erasure/retention policy operational; they do not prescribe a legal retention period.
4. **Environment and key lifecycle:** verify source organization, application DB, SSO, queues, destination bindings and approval trust belong to the intended environment. Specify key IDs/rotation, unreadable old-token recovery and backup restore behavior. Physical environment separation can satisfy part of this; absence of an `environment` column alone is not proof of a vulnerability.
5. **External no-email boundary:** verify configured provider/OAuth/security/export notifications before live actions. Their behavior is unknown, not a confirmed email defect. Application mail denial does not by itself prove that no vendor-managed notification will occur; the explicit user rule cannot be silently narrowed.
6. **Read-cost accounting:** use the actual configured page size in estimates. `ceil(C/200)+ceil(J/200)` remains a valid maximum-page arithmetic lower bound; the current 20-row reader would require ten times as many calls for the same fully enumerable inventory and still has its explicit 500-page cap. This does not turn the plan's lower-bound example into a throughput commitment.

### 23.3 False positives excluded or wording corrected

| Claim considered | Disposition |
| --- | --- |
| The dashboard is still just a static card | Outdated. Local Integrations now reads API state and opens the review console. Historical wording in sections 2 and 21 was corrected. Complete production synchronization remains unproved. |
| Plural candidate/job-opening OAuth scope spellings are definitely invalid | Not established. The official OAuth overview itself uses plural candidate scopes and a plural job-opening example, despite singular examples elsewhere. Keep tenant preflight; do not rewrite working scope names based only on the singular table. [Z3] |
| The required string organization ID definitely cannot work | Not established by a sample omission or a documentation fetch failure. Validate the real organization response; keep verification fail-closed. |
| An expired destination lease should automatically be retried | Incorrect for an unknown external effect. Receipt reconciliation/fenced recovery is required. A5 concerns missing recovery, not removal of that safeguard. |
| Existing SSO duplicate-subscription protection, opportunity import, external application tracking or stale-event guards are absent | Incorrect; existing constraints/helpers remain verified reuse points. No redundant replacement is justified by this audit. |
| Raw job text shown in the review console proves an XSS vulnerability | Not established: the current console renders source strings as React text. Sanitizing content before canonical publication remains required and unimplemented; those are different boundaries. |
| Jobs blocked by unmapped publication policy or disabled creation are bugs | Intended safeguards. Source-specific mappings and canonical writers must be completed before enabling them. |
| Source withdrawal must automatically close the destination job | Conflicts with the user's approval rule. Urgent staging and visible approval delay are required; existing approved expiry/access checks continue. |
| All 63 targeted tests passing means full provisioning and zero-email behavior are verified | Incorrect. Tests cover implemented layers and synthetic destinations. A1/A2 were outside that coverage; full canonical, no-email, tenant, scale and authenticated E2E evidence remain required. |
| Four full-project SSO typing errors were introduced by the new reader | Excluded by the base-commit comparison: the same four existing test errors were reproduced unchanged. Production-source typing and the new reader tests pass. |

### 23.4 Remaining work and release order

The existing incomplete work is still incomplete: canonical silent SSO/Discover provisioning, independent learner/entitlement projections and outboxes, trusted target-aware approval validation, job publishing/ownership/quota/application routing, revocation/operator recovery, bulk/delta/delete capture, distributed source quotas, privacy cleanup, complete operational controls and full end-to-end/no-email/pilot evidence. Those are already listed requirements, not newly discovered regressions.

A1/A2/A4/A5 now have local module/SQL fixes and regression coverage; retain that coverage. Before destination execution, close A3's remaining canonical approval-proof gate and verify the silent writers against the complete authority/target/postcondition contract. Section 26 adds reproduced B1–B4 cases that still need correction. Complete source coverage, privacy, environment and provider-email gates before live rollout. Preserve the existing approval and no-email safeguards.


## 24. Revised implementation — existing deployments only

This section supersedes every former proposal to deploy a dedicated connector,
staging authority or approved-executor Worker. Their standalone entrypoints and
Wrangler configurations have been removed. The retained background logic is ordinary
application code under [sp-dash integration modules](./sp-dash/lib/zoho/).
No replacement Worker service is to be created.

### 24.1 Runtime ownership and final flow

| Existing deployment | Integration responsibility | Required implementation |
| --- | --- | --- |
| [Sp-dash runtime](./sp-dash/workers/sp-dash-worker.js) with its [existing configuration](./sp-dash/wrangler.toml) | OAuth/control APIs, scheduled source discovery, private staging, review/approval, approved dispatch and read-only receipt recovery | Add explicit Zoho queue routes and a scheduled handler. Preserve existing course-upload and LTE queue routing. Supply narrow staging capabilities to discovery; enforce private SQL grants and approval authority independently. |
| [SSO deployment](./sso-worker/src/index.ts) | Read-only approver checks and approval-gated silent canonical identity/Discover provisioning | Extend restricted entrypoints in this deployment; atomically persist effects, receipt and outbox. Preserve paid access, roles, credentials, verification and preferences. Do not call email-generating learner admission. |
| [Auth-sync consumer](./auth-sync-consumer/README.md) | Durable, idempotent identity/independent learner/entitlement projections | Extend existing event contracts, dependency checks and acknowledgements. A mirrored user alone cannot complete an import. |
| [SkillPassport deployment](./skillpassport/functions/_worker.js) | Approved opportunity writes and existing application/recommendation projections | Add a private approved import handler that reuses publishing rules and validates approval, target state, ownership/quota and no-email policy. Use a deployment-supported binding adapter; do not assume Pages exports WorkerEntrypoint. |

Flow: authorized operator connects Recruit in sp-dash → existing sp-dash background
handler reads the source → private staging and validation → operator reviews an exact
candidate/job version and target diff → explicit approval commits an immutable operation
→ existing sp-dash approved queue handler validates the live grant/approver → existing
SSO or SkillPassport owner applies the approved silent effect and records a transactional
receipt/outbox → existing transport updates required projections → verified completion
is shown in sp-dash. Later source changes return to review. No step sends email.

New logical queues/DLQs and methods on these existing deployments are allowed; they do
not require a new Worker service. No deployment/resource creation is performed merely
by editing this plan.

### 24.2 Implementation sequence

1. **Implemented locally; see section 25.** Wire [discovery](./sp-dash/lib/zoho/discovery-consumer.js),
   [restricted staging](./sp-dash/lib/zoho/discovery-authority.js) and
   [approved recovery](./sp-dash/lib/zoho/approved-consumer.js) into the existing runtime.
   Use explicit environment-specific queue routing; malformed discovery messages must
   never fall through to approved execution or the existing LTE consumer. Keep discovery
   and execution flags independent and default off. Add a bounded recovery schedule;
   previews must neither consume shared queues nor run scheduled integration recovery.
2. **Implemented locally; see section 25.** Replace the API's former standalone-service readiness adapters with checks of the
   actual existing-runtime handler configuration, producer/consumer routing, recovery
   schedule, narrow authority and supported canonical destination contracts. A queue
   producer alone or a static ready flag is insufficient. Until this is verified, keep
   API discovery/approval unavailable; do not retain bindings to deleted Worker names.
3. **Restricted discovery role implemented; canonical approval proof remains pending.** Close the shared-runtime trust gap: use restricted discovery database roles/functions,
   deny approval-table/decision/execution access, and require independently verifiable
   human approval proof at the owning canonical services. Verify server-side actor,
   selected versions/actions/target, environment, expiry and revocation. Source data,
   generic service bindings, capability declarations and caller-supplied actor IDs are
   never proof of approval. Treat existing privileged hosts as trusted components,
   explicitly; a filtered environment argument is not a sandbox.
4. Implement the silent SSO/Discover transaction, durable outbox and independent learner
   projections, then the silent opportunity handler and derived-data projections. Do
   not declare completion before all required effects and projections are verified.
5. Finish bulk/delta/deletion coverage, revocation/operator recovery, privacy retention/
   suppression, quotas, key rotation and environment/provider-email preflight. Shared
   runtime resource limits require bounded chunks and backpressure; they do not authorize
   adding another Worker. If a selected path cannot fit safely, leave it disabled and
   revise its extraction/checkpointing approach.
6. Validate routing against existing course/LTE consumers, authenticated console E2E,
   forged approval/target denial, retry/crash/concurrent reconciliation and zero email
   across every shared-service side effect. Roll out only an explicitly approved pilot.

### 24.3 Current local status and audit fixes

- Standalone discovery, staging-authority and approval-executor deployment files are
  removed. The existing runtime now delegates to environment-scoped integration handlers while
  preserving its course/LTE queue behavior. Runtime wiring is implemented locally;
  canonical writers and production rollout remain pending.
- A1: existing target IDs are frozen in approved operations; dispatcher, read-only
  reconciliation and SQL acknowledgement reject a different known target. Create intents
  still require canonical identity/linking and reviewed-state validation.
- A2: receipt scheduling now reserves persisted due-times with row locking/SKIP LOCKED.
  SQL regressions cover 26 unresolved operations progressing across successive batches.
- A4: SQL persists an eight-failure/24-hour run budget, lost-lease accounting, jittered
  retry times and Retry-After guidance independently of queue deliveries. Source status
  classification distinguishes revoked credentials, permissions, rate limits and invalid
  responses. Saved-record scope is explicit; it does not claim draft/full-tenant coverage.
- A5: same-source OAuth credential renewal advances a credential generation and fences
  old discovery leases without invalidating mapping approvals or clearing unknown
  destination effects. Source organization/region/publisher changes are separate semantic
  changes and must not use credential renewal to bypass approval.
- A3: restricted discovery database access is implemented and tested locally; canonical
  trusted approval proof remains open and must be exercised in the existing-service architecture. No passing module
  or SQL fixture substitutes for that release evidence.

Revision 7 verification established 62 passing module tests after removing standalone
deployments. Section 25 records the later existing-runtime validation. No standalone
Zoho Worker folders remain; canonical writers remain pending.

The existing no-email, explicit approval, Discover preservation, account-versus-login
readiness and honest completion requirements remain mandatory throughout this revision.


## 25. Existing-runtime implementation and local verification

### Implemented locally

- The existing [sp-dash entrypoint](./sp-dash/workers/sp-dash-worker.js) uses the
  [dashboard runtime](./sp-dash/lib/dashboard-runtime.js). Its HTTP requests still go
  to OpenNext; existing course-upload and LTE queue handlers are preserved.
- [Integration runtime](./sp-dash/lib/zoho/runtime.js) routes exact environment-scoped
  discovery/approved queue names, hosts the fixed staging interface in process and
  runs bounded scheduled source/receipt recovery. A Zoho queue from another environment
  is retried instead of falling through to an unrelated consumer. No public staging
  or approval-bypass endpoint is added.
- [The authenticated API](./sp-dash/app/api/integrations/zoho-recruit/route.js) now checks
  the actual local consumer adapters, not standalone Worker service bindings. Discovery
  and approval persist before publication. Publication failures return pending delivery;
  scheduled recovery uses the durable ledger/run. Queue acceptance never means an account
  or job was created.
- [Existing Wrangler configuration](./sp-dash/wrangler.toml) now declares environment-specific
  logical queues/DLQs and the two-minute recovery schedule on the existing deployment.
  The restricted approver binding targets the already existing SSO deployment, using
  its `ZohoApproverAuthority` entrypoint; release that SSO reader/migration before
  binding it. Background/discovery/execution flags default false. Previews disable integration
  processing and have no Zoho producer/consumer bindings. Queue/DLQ provisioning is
  required before deploying this configuration; no resources were created here.
- The [discovery-authority migration](./skillpassport/supabase/migrations/20270130000000_zoho_recruit_discovery_authority.sql)
  adds the NOLOGIN/NOINHERIT `zoho_discovery` role. Only five fixed staging/recovery
  functions are granted. The runtime uses an expiring role token and project anon gateway
  key for this storage path; it never falls back to the host service-role key. It rejects
  malformed, expired and broad-role reader credentials. PostgREST verifies signatures
  on use; readiness is configuration evidence, not a live tenant/database audit.
- The existing host remains trusted and has unrelated privileged and mail capabilities.
  Integration module arguments omit mail, general SSO and privileged discovery database
  capabilities. Canonical services must still independently verify human approval and
  reviewed target state. Shared-runtime placement is not a process sandbox.

### Validation and practical limits

The final targeted run passes **81 tests across 12 files** (73 Zoho integration tests
and eight existing LTE transport tests). These exercise actual existing-runtime discovery-to-staging wiring,
preview/disabled fencing, exact queue routing, current consumer readiness, persisted
publication failure, scheduled recovery, wrong-role/expired-token rejection and zero
calls to mail/account capability traps. Existing HTTP/course/LTE dispatch regressions
also pass. SQL tests exercise the real discovery role's permitted due-run function and
denied approval calls/operation writes, durable retry/lease/reconnect behavior and the
execution regressions; they race two sessions against one operation as well.

Next.js production build, sp-dash type checking, migration-rule validation and local
Wrangler configuration/bundle dry run all pass. This does not mean the normal OpenNext
packaging policy check passes; see the framework gate below. Disposable SQL tests clean up their
fixture database and any role they created; no application database migration is
installed persistently by these tests. No real import, email or deployment was performed.

These checks establish that the existing-runtime wiring exists and passes the exercised
cases. Section 26 records important cases that those checks missed. They do not establish
silent SSO/Discover provisioning, independent learner/entitlement completion, approved
job publishing, complete inventory streams, trusted canonical approval proof, full
operational controls or authenticated end-to-end/no-email evidence. Those release gates
remain required; execution stays disabled until they are implemented and verified.


Cloudflare packaging validation also exposed an existing framework release gate:
OpenNext rejects the installed Next.js 15.5.26 under its support-policy check. A
plain Next.js build passing does not resolve that check. Any local compatibility
build with `--dangerouslyUseUnsupportedNextVersion` is diagnostic only and is not
normal-release approval. Resolve the existing framework support/dependency baseline
before production rollout. This work does not change Next.js dependencies.


## 26. Whole-plan re-audit after runtime wiring — 30 October 2026

This review checked the target specification, current source, deployment configuration
and prior validation claims. The following four implementation gaps were reproduced
with synthetic data. They are missed implementation cases against existing requirements,
not proof of live incidents or four entirely new product requirements. These were open when this audit was recorded; section 27 records subsequent local
corrections for B2–B4. B1 remains deferred by the user. Source discovery and account/job execution remain
disabled in the checked-in configuration. No new Worker is proposed.

### 26.1 Confirmed additional gaps

| ID / priority | Finding and evidence | Required correction and acceptance criteria |
| --- | --- | --- |
| B1 — high release gate, conditional on shared-database environments | **Queue names do not isolate integration state in a shared database.** Dev and QA point to the same application database in [the existing configuration](./sp-dash/wrangler.toml). [Runtime recovery](./sp-dash/lib/zoho/runtime.js), [discovery due-run selection](./skillpassport/supabase/migrations/20270130000000_zoho_recruit_discovery_authority.sql) and [approved recovery](./sp-dash/lib/zoho/approved-consumer.js) do not filter persistent state by an owning environment. A synthetic probe gave dev/QA the same due-run store; both published the same run ID to their own queues. This proves cross-environment scheduling, not duplicate canonical effects: claim fencing still applies. Both environments are disabled now; production uses a different configured database. | Bind connections/runs/approvals/claims to an owning environment and scope API commands, scans and claims accordingly, **or enforce one owning integration environment per shared database at the database boundary**. Queue suffixes or an environment variable alone are insufficient. Test two environments sharing one database, different credential/encryption configurations, and a foreign run/operation ID injected directly into a queue. The wrong environment must neither claim nor change that state. Do not add another Worker to solve this. |
| B2 — medium, discovery availability | **One changed record with an unresolved execution blocks its whole discovery page.** [Staging](./skillpassport/supabase/migrations/20270128000000_zoho_recruit_approval_control_plane.sql) correctly refuses material changes while the record has processing work. [Page commit](./skillpassport/supabase/migrations/20270130000000_zoho_recruit_discovery_authority.sql) commits all rows atomically through that function. A disposable SQL probe supplied a changed in-flight record followed by an unrelated new record: the page raised a serialization failure, the unrelated record was not staged and the cursor stayed on page 1. Unresolved work can therefore stall this stream and consume its lost-lease/retry budget. | Preserve the in-flight execution fence. Durably capture the blocked source revision for deferred review/reconciliation, record a visible blocked outcome, and permit unrelated valid rows/pages to progress once every row is durably accounted for. Do not silently discard the changed record, clear unknown effects or authorize a retry. Test one unresolved row among healthy records, permanent row-validation failures, crash/replay and later reconciliation; the deferred revision must return to explicit review without a duplicate destination effect. |
| B3 — medium, inconsistent fail-closed authority | **The admin API accepts unknown block status that the executor authority rejects.** [The dashboard admin guard](./sp-dash/lib/zoho/admin.js) checks block status by truthiness; [SSO's canonical approver reader](./sso-worker/supabase/migrations/20261030000000_zoho_import_approver_authority.sql) requires `is_blocked IS FALSE`. A synthetic guard probe produced authorization results `[true, false, true, true]` for `[false, true, null, missing]`. A valid signed platform-admin JWT and live admin membership were still required. Explicit `blocked=true` was correctly denied; this is not an unauthenticated or known-blocked-user bypass. | Require a validated explicit unblocked state, preferably through the same restricted canonical decision used for execution, while retaining signed-session/live-membership/CSRF checks. Deny malformed, null, missing and inactive identity responses consistently. Test view/configure/OAuth/hold/reject/approve boundaries, not just destination execution. |
| B4 — medium, auth recovery/classification | **A source 401 is labelled revocation before trying the planned reactive refresh.** [The HTTP helper](./sp-dash/lib/zoho/oauth.js) maps every 401 to `AUTH_REVOKED`; [discovery](./sp-dash/lib/zoho/discovery-consumer.js) refreshes only when its cached expiry is near. A synthetic provider offered a successful refresh response and subsequent GET, but the first 401 caused zero refresh calls and terminal failure reporting. A cached future expiry does not establish that the server still accepts the access token. This is a recovery/classification gap, not evidence that every 401 is refreshable. | Under a valid connection/credential lease, attempt at most one coordinated forced refresh and retry of the read for a refreshable access-token failure. Respect provider quotas and refresh single-flight rules. Invalid/revoked refresh credentials, permanent permissions or a second unauthorized response stop for operator recovery. Test early invalidation with a future cached expiry, invalid grant, repeated 401, concurrent refresh, reconnect fencing and zero email. Never loop indefinitely or treat auth recovery as approval. |

The B1 probe used the actual runtime with a fake database adapter; it did not connect
to either deployed environment. The B2 probe executed actual migrations/functions in
a disposable local database and rolled back its synthetic source state. The B3 probe
used the actual guard with mocked signed-session/live-SSO dependencies. The B4 probe
used the actual discovery/runtime path with synthetic encrypted credentials and a
fake provider; no real token or provider API was used. Temporary probe tests were
removed afterward. These probes diagnose observed behavior, not passing acceptance
coverage for the eventual corrections.

The [official Recruit refresh-token documentation](https://help.zoho.com/portal/en/kb/recruit/developer-guide/oauth-authentication/refreshing-access-tokens/articles/refreshing-access-tokens)
distinguishes access-token renewal from revoking refresh access. It also documents
access-token invalidation when a refresh token exceeds its active-token allowance.
That supports the B4 recovery distinction; it does not identify the cause of any
particular live 401.

### 26.2 False positives excluded and claims narrowed

| Claim considered | Disposition |
| --- | --- |
| OpenNext introduces another Worker, or is unnecessary because sp-dash runs on Workers | Incorrect for this repository. The existing entrypoint imports the OpenNext-generated Next.js handler. Queue/cron modules run directly alongside it in the same deployment. Removing the adapter is a separate dashboard architecture change. |
| Two environments publishing the same run proves duplicate accounts/jobs | Not established. The probe proves scheduling crossover; SQL claim fencing still prevents simultaneous successful claims. Canonical writers are absent and execution is disabled. |
| B2 means the processing guard should be removed | Incorrect. The execution fence is necessary. The missing behavior is durable per-record deferral/isolation so unrelated discovery progresses. |
| All source 401 responses prove refresh authorization was revoked | Incorrect. Access-token failure and revoked refresh access need separate recovery classification. The bounded refresh attempt is still not permission to retry forever. |
| An explicitly blocked administrator can use the current integration API | Excluded by the synthetic probe: `true` is denied. B3 concerns null/missing state and disagreement with canonical execution authority. |
| A locally decoded role JWT is accepted as cryptographic authorization | Incorrect. Local decoding is only a readiness/configuration guard. PostgREST verifies the actual token on use. Existing tests with synthetic role tokens do not prove signature validation. |
| NOINHERIT and five explicit grants prove the discovery role has no other effective privileges | Not established. Existing object grants and inherited PUBLIC privileges still require target-schema inspection. The plan already makes that a release gate; do not mistake the minimal fixture for an audit of every legacy function. |
| Retaining existing shared-host email bindings proves integration email was sent | Not established. Unrelated mail functionality still exists. Integration modules omit those capabilities; full downstream zero-email verification remains pending before canonical execution. |
| The framework warning proves the Zoho runtime bundle cannot work | Incorrect. The local override build and fresh Wrangler dry run passed. The normal OpenNext support-policy check remains blocked by the existing Next.js baseline; compatibility evidence is not normal-release approval or proof of a specific vulnerability. |
| New queues/DLQs or a named entrypoint on existing SSO violate the no-new-Worker requirement | Incorrect. They are resources/methods on existing deployments. Standalone Zoho Worker deployment folders/configurations remain removed. |
| The provider's maximum 200 rows per call establishes a 200-page limit | Not established by the checked [Get Records documentation](https://www.zoho.com/recruit/developer-guide/apiv2/get-records.html). Keep actual tenant enumeration/page limits in preflight rather than inventing a page cap. |
| Passing the previously reported 81 sp-dash/LTE tests plus eight SSO tests establishes complete production synchronization | Incorrect. Those remain targeted foundation checks. The new probes show missed cases; canonical writers, authenticated import E2E, real tenant coverage and downstream no-email proof remain incomplete. |

### 26.3 Existing unfinished work — not newly discovered regressions

The plan already lists silent canonical SSO/Discover provisioning, independent learner/
entitlement projections and durable outboxes; target-aware trusted human approval;
silent opportunity ownership/quota/publication/application routing; mappings and reviewed
destination diffs; revocation/pause/disconnect/operator repair and DLQ controls; bulk,
delta and deletion streams; distributed source quotas; retention/suppression/key rotation;
non-email activation readiness; authenticated E2E, downstream no-email/fault/load/restore
proof and an approved pilot. They are still required. Runtime wiring, a read-only SSO
approver method and synthetic receipts do not implement those capabilities.

### 26.4 Revised acceptance and release order

1. Align administrator-state authorization (B3) and enforce database-level environment
   ownership (B1) before enabling a shared-database background environment.
2. Add durable record deferral/accounting (B2) and coordinated bounded reactive token
   recovery (B4) before claiming unattended discovery. Preserve existing leases,
   idempotency, approval and no-email fences.
3. Finish the independently validated silent canonical writers, projections and approved
   job rules. Close A3's remaining canonical approval-proof gate; complete the already
   listed revocation/privacy/operational/source-coverage work.
4. Validate target-schema effective grants, reader-token issuance/rotation, environment/
   queue/DLQ configuration and actual provider/tenant no-email behavior. Resolve the
   framework release baseline rather than adding a deployment-script policy bypass.
5. Run the new acceptance cases alongside authenticated end-to-end, no-email, concurrent
   recovery and existing LTE/course regressions. Only then perform an explicitly approved
   pilot through the existing deployments. No real import or rollout is authorized merely
   by this audit or by passing the current tests.


## 27. Requested corrections excluding environment isolation — 30 October 2026

B2–B4 are corrected in the local implementation. **B1 is explicitly deferred by the
user and remains unchanged.** Separate queue names still do not establish ownership
of integration state in a shared database. Do not enable multiple background
integration environments on that database until this release gate is resolved.

### 27.1 Implemented corrections

- **B2 — durable record deferral.** The [fourth application migration](./skillpassport/supabase/migrations/20270131000000_zoho_recruit_record_recovery.sql)
  commits each staged or deferred outcome together with the discovery checkpoint.
  A changed record with processing work preserves its original approved snapshot;
  unrelated valid records can progress. Invalid individual source rows receive durable
  blocked outcomes. Replay does not duplicate counters, and later pages preserve the
  newest waiting revision. The existing scheduler revisits bounded batches. After
  execution reconciliation, retained changes return to **pending approval**, with no
  new approved operation or destination effect. The [dashboard](./sp-dash/components/pages/ZohoRecruitPage.jsx)
  shows per-run deferred counts and private source-scoped deferred metadata separately
  from staged exceptions. Its latest-50 list is not a complete inventory count.
- **B3 — explicit administrator state.** The [shared API guard](./sp-dash/lib/zoho/admin.js)
  requires the live identity to match the signed subject and have `is_blocked === false`,
  alongside existing live membership, signed-session and mutation-origin checks.
  Unknown and malformed block status is denied consistently with canonical authority.
- **B4 — bounded coordinated renewal.** The [source consumer](./sp-dash/lib/zoho/discovery-consumer.js)
  distinguishes access-token rejection from revoked refresh authorization. A future
  cached expiry cannot suppress one reactive refresh/read retry. Proactive and reactive
  renewal share a one-renewal-per-page budget. Database reservations coordinate callers;
  another reader can adopt a newer stored envelope. Invalid grants, a second unauthorized
  response and permanent permission failures stop for operator recovery. Reconnect,
  lease expiry and generation changes fence stale refresh writers.

Read leases are three minutes; refresh reservations last at most 45 seconds within the
read lease. Deferred source payloads expire after 30 days and are scrubbed on resolution
or expiry. Expiry/configuration changes require a fresh source read. Confirm retention
policy and target-schema effective grants before rollout. The restricted discovery role
now has seven fixed staging/recovery entrypoints; it has no direct deferred-table access.
The trusted host reads only deferred metadata for the dashboard, not retained payloads.

### 27.2 Local evidence and limits

- 97 targeted sp-dash/LTE tests passed across 12 files, including unknown admin-state
  rejection, future-expiry 401 renewal, invalid grants, repeated 401, shared-envelope
  adoption, busy refresh reservation and malformed source text.
- [SQL regressions](./skillpassport/functions/__tests__/sql/zoho-recruit-record-recovery.sql)
  passed in a disposable local database: mixed healthy/blocked pages, replay, newest
  revision retention, reconciliation to manual review, payload cleanup, source correction,
  lease/generation fencing and private grants. Two actual database sessions also competed
  for refresh reservation and approved execution claims; each race had one winner.
  Canonical fixture user, learner and opportunity counts remained unchanged.
- Migration filename/baseline validation, sp-dash TypeScript checking and the Next.js production build passed. A local
  browser fixture using the actual dashboard component displayed deferred counts and
  distinct waiting/invalid outcomes. Its API and provider responses were synthetic.

These are local regression checks, not complete account provisioning or job publishing.
The unfinished canonical writers, approval proof, projections/outboxes, source coverage,
operational/privacy controls and authenticated end-to-end/no-email gates in section 26.3
remain pending. All enable flags remain false. No persistent application migration,
real import, account/job creation, email or deployment was performed. The existing
OpenNext support-policy release gate also remains unresolved. No Worker was introduced.


## 28. Canonical human approval evidence — 30 October 2026

The next local milestone adds human approval evidence inside the existing SSO service.
Section 29 subsequently adds the disabled candidate/Discover transaction. Learner
projections, job publishing and the complete A3 canonical execution boundary remain
unfinished. All execution
and discovery flags remain off. B1 environment isolation remains deliberately unchanged.

### 28.1 Implemented flow

1. The dashboard selects each reviewed record's ID, revision, source hash, mapping/config
   revision and nullable target ID. The record panel identifies an existing linked target
   or states that canonical identity matching still requires review. Approval rejects old
   clients that omit the reviewed hash/target/config fields; hold/reject can still use
   record IDs and revisions.
2. The authenticated API compares the selected values with current source-scoped storage.
   Before persisting the local approval, it forwards the operator's signed access token
   and a metadata-only manifest through the existing restricted SSO entrypoint. The token
   is not placed in approval tables, queue messages or API responses.
3. [SSO's evidence handler](./sso-worker/src/rpc/zoho-approval-evidence.ts) verifies its own
   signature, issuer, audience, token type, expiry, issued-at value and platform-admin
   scope. Caller actor IDs and caller role overrides are rejected. A fixed RPC rechecks
   the active, explicitly unblocked canonical approver before recording evidence.
4. The [canonical evidence migration](./sso-worker/supabase/migrations/20261031000000_zoho_import_approval_evidence.sql)
   binds actor, connection, source organization, publisher, config revision and exact
   record/hash/target metadata. It stores no raw candidate/job payload or credentials.
   Manifest retries converge by connection/request ID without extending the original
   24-hour expiry; changed intent under the same request is denied. Direct table access,
   including service-role INSERT/UPDATE, is revoked; the fixed functions own writes.
5. After evidence registration succeeds, the API records the existing local approval and
   dispatches its durable intent. A registration followed by a local failure leaves an
   inert expiring manifest; a retry must match the original intent. Registration itself
   creates no account, entitlement, job or notification.
6. The approved coordinator requires the canonical manifest as well as the live approver
   before invoking a destination. SSO also reads back the independent live claim through
   the [named dashboard authority](./sp-dash/workers/zoho-execution-authority.js) and the
   [fixed live-claim SQL reader](./skillpassport/supabase/migrations/20270201000000_zoho_recruit_live_execution_authority.sql).
   That reader verifies the processing operation, attempt/lease, deadlines, connected
   source, live record/config revision, actor, payload, target and absence of an unknown
   outcome. It returns a boolean and cannot claim, approve or write. Missing, denied or
   unavailable readback fails closed; SSO bounds that call to five seconds.
   Canonical evidence validation recomputes the claimed payload's
   SHA-256 using the same Postgres JSON encoding as staging, matches all approved scope
   and target fields, and denies expired/revoked evidence or a changed approver. Missing
   evidence methods also keep executor readiness false.

### 28.2 Remaining canonical boundary and release limits

The evidence registry and live readback together establish matching signed human intent
and a currently eligible control-plane claim. They do not make cross-database checks
one transaction or validate an unreviewed canonical identity/entitlement diff. The SSO
candidate core in section 29 rechecks its local human proof and lease inside its own
transaction and commits local effects/outbox/receipt atomically. Destination writers
must continue enforcing target rules, effect idempotency and postconditions themselves;
coordinator-only validation is insufficient. Unknown outcomes remain receipt-reconciliation
work, never permission to repeat a write.
Canonical identity matching and reviewed destination-diff preparation are still required
before candidate execution. A null target shown in staging does not grant permission to
silently link a newly found existing identity. Discover catalog validation, role/access
preservation, independent learner context, durable projections and non-email activation
readiness remain part of the next provisioning milestone. No destination capability has
been made ready by this evidence work. Operational revocation, expiry/retention cleanup
and target-schema grant inspection remain release requirements.

### 28.3 Verification

- 114 targeted sp-dash/LTE tests pass, including exact reviewed-field checks and canonical
  evidence registration before local approval and queue publication.
- 39 SSO tests pass, including actual ephemeral RSA signatures: wrong key, expired token,
  missing expiry, wrong issuer/audience/type; signed-scope checks and fail-closed storage.
- Disposable SQL regressions pass for immutable retries, duplicate selections, payload
  tampering, target/scope/version changes, missing grant fields, revoked/expired evidence,
  live approver blocking and private grants.
- Dashboard production build and type checking pass. SSO production-source type checking
  and an existing-Worker Wrangler bundle dry run pass. Full SSO type checking still reports
  four errors in unchanged test fixtures: three outdated ExecutionContext mocks and one
  OAuth fixture missing a password_hash property. Those unrelated files were not changed.
- SSO migration history/filename validation passes. No persistent database installation,
  deployment, real source read/import, candidate/job effect or email was performed.

Apply the five application and three SSO feature migrations in order through the normal release process before
using the extended entrypoint. This adds methods to the existing SSO deployment, with
no new Worker or standalone deployment configuration. The framework support-policy gate
and all unfinished release requirements in sections 26–27 remain in force.


## 29. Silent canonical candidate transaction — 30 October 2026

The [canonical transaction](./sso-worker/supabase/migrations/20261101000000_zoho_candidate_canonical_transaction.sql)
and [named entrypoint on the existing SSO Worker](./sso-worker/src/rpc/zoho-candidate-provisioner.ts)
are implemented locally. **They are disabled, and destination readiness remains false.**
This is a local canonical commit milestone, not completed end-to-end candidate import.

### 29.1 Supported local behavior

- An exact approved new candidate creates one unverified identity with an unusable
  password-hash sentinel, active learner membership in the existing platform context,
  SkillPassport membership-product assignment and an active zero-cost lifetime Discover
  subscription. Effective product access also needs the active organization-product
  association; C1 in section 30 records the original missing enforcement, corrected in section 31.
  It creates no owner role, school/college organization, verified-mailbox state,
  login session, credential invitation or outbound message. Activation stays pending.
- Discover is resolved from active `freemium`/B2C SkillPassport catalog data with the
  appropriate learner scope, numeric zero monthly/yearly pricing and required profile/
  opportunity features. The function uses canonical catalog features, not an invented
  fallback entitlement list. Invalid/missing catalog data rolls back the transaction.
- Existing identities require an explicitly approved matching target. A null target
  never implicitly links a newly found account. Ambiguous normalized emails, blocked
  users, changed targets and changed source links are denied without effects. Dots and
  plus tags are preserved. An identity created concurrently by normal signup requires
  a fresh review of that winning account.
- The supported existing-account case requires an active learner context and current
  personal SkillPassport access. Its credentials, verification, metadata/preferences,
  memberships and paid/free subscription remain byte-for-byte unchanged by this path.
  Sponsorship-only access, non-learner context additions and other entitlement outcomes
  remain blocked pending their reviewed canonical resolver; this is a coverage limit,
  not a claim that those users are ineligible for the product.
- Identity, membership/product/role, new Discover grant, immutable source link, operation
  receipt and durable outbox commit together. The transaction rechecks canonical human
  proof and actual lease expiry before returning. The private entrypoint independently
  checks human evidence plus live control-plane authority immediately before the RPC.
  A transport failure is ambiguous and is never converted to a definitive no-effect result.
- Replays bind the full approved static context and return the existing result without
  another effect. The operation and source-record revision are unique; source/email
  locks serialize competing imports. A receipt reports **projection_pending**, with
  separate identity and activation outcomes. An absent receipt never authorizes replay.
- Outbox payloads contain no password hashes, raw passwords, tokens or existing-user
  metadata. Canonical account deletion cascades retained source linkage and pending
  payloads, while receipts retain a target-null effect tombstone. Those tombstones do
  not make an old operation reusable. Broader source suppression, retention and audit
  policy remain release requirements.

### 29.2 Validation

[The SQL runner](./sso-worker/scripts/checks/test-zoho-candidate-sql.mjs) creates and
removes a disposable database. It extracts actual canonical SSO table definitions,
constraints, indexes and the personal-subscription trigger, then uses synthetic fixtures;
it does not load application seed records or install persistent application migrations.
Passing cases cover new Discover creation, unverified/disabled-password state, exact
existing-target review, paid/security/preference preservation, normalized-email ambiguity,
source-link conflicts, invalid catalog data, stale/revoked authority, payload tampering,
email-setting injection, atomic outbox-failure rollback and deletion cleanup. Two actual
database sessions also prove one receipt/effect for simultaneous operation replay and
one winner when separate reviewed create intents race for the same identity.

The targeted module suites currently pass **114 sp-dash/LTE tests and 39 SSO tests**.
Application and SSO SQL suites, migration validation, dashboard production build/type
checking, SSO production typing and local existing-Worker bundle dry runs pass. The four
unchanged full-project SSO test-fixture typing errors and the normal OpenNext support-
policy gate remain as documented in section 28. No runtime flag was enabled.

### 29.3 Next required work and rollout boundary

1. Prepare canonical candidate matches and reviewed destination/entitlement diffs in
   sp-dash, including supported existing non-learner/sponsored-access outcomes.
2. Deliver the durable outbox through the existing auth-sync transport; apply independent
   user/learner/entitlement projections with subject-version/staleness guards and no mail.
   Preserve existing profile ownership/preferences and avoid replaying an old free grant
   over newer paid access. Confirm postconditions before moving receipts to completed.
3. Finish approved job mapping/ownership/quota/publication/lifecycle writers and the
   remaining source coverage, operational/revocation/privacy and authenticated end-to-end
   no-email/pilot gates. B1 environment isolation stays deferred by user instruction.

There is no outbox publisher/consumer or projection-completion acknowledgement yet, so
[SSO capabilities](./sso-worker/src/rpc/zoho-candidate-provisioner.ts) deliberately return
ready=false even if its new local writer flag were set. The new flag is explicitly false
in root/dev/QA/production SSO configuration. No candidate destination service binding is
added to sp-dash until these completion guarantees exist. No new Worker is introduced.


## 30. Whole-plan audit after candidate transaction — 30 October 2026

This audit compared the target requirements with the existing runtime, API, canonical
SSO functions, local test coverage and recorded completion claims. It found **three
additional reproducible implementation gaps**. They are not live incidents. All flags
remain off and candidate destination readiness remains false. This audit changes the
plan only; C1–C3 were **not fixed** by recording them. Section 31 records the subsequent
local corrections and regression evidence. B1 environment isolation is
still deliberately deferred by the user and has not been changed.

### 30.1 Newly confirmed gaps

| ID / priority | Reproduced behavior and practical limit | Required correction and acceptance |
| --- | --- | --- |
| C1 — medium, canonical account readiness | **The candidate transaction does not validate organization-level product access.** [The new transaction](./sso-worker/supabase/migrations/20261101000000_zoho_candidate_canonical_transaction.sql) verifies that the platform organization exists and adds `membership_products`, but never checks `organization_products.active`. The [actual canonical claim resolver](./sso-worker/supabase/migrations/20260526000000_schema.sql) requires both associations. In a disposable SQL probe, missing and explicitly inactive organization-product rows both allowed identity/Discover/receipt creation, while `get_jwt_claims` returned `products=[]`. The positive control with an active association returned `products=["skillpassport"]`. This is conditional on canonical configuration; it does not establish that every new candidate lacks access or that a disabled product was bypassed. The receipt correctly remains projection_pending, but the new-account transaction's context validation and the earlier broad product-access claim were incomplete. | Validate the canonical independent-learner organization and its active SkillPassport product association before committing a new account. Deny/hold an unavailable context without auto-enabling a shared organization product or fabricating an academic organization. Test missing/inactive/enabled organization-product state with the real claim resolver and verify no partial identity/subscription/outbox effects when unavailable. Include this dependency in the canonical SQL fixture and activation/postcondition checks. |
| C2 — medium, discovery availability | **An unsafe malformed string source ID can still poison a whole page through the exception metadata.** [The normalization catch](./sp-dash/lib/zoho/discovery-consumer.js) copies any string ID into `issues.externalId` after slicing it. [The staging contract](./sp-dash/lib/zoho/discovery-authority.js) permits any string up to 40 characters there. Synthetic probes supplied a NUL or unpaired surrogate as the bad ID beside a healthy candidate: the healthy candidate was normalized, but the invalid ID was forwarded to page commit. PostgreSQL JSON casts independently rejected those exact escaped values. Thus the RPC can fail before per-record SQL deferral/accounting runs, leaving the page checkpoint unchanged. Numeric bad IDs are already replaced with null; valid-ID rows with unsupported source text are already quarantined. This finding does not undo those passing cases or mean all malformed IDs stall discovery. | Allow only safe canonical decimal strings in issue IDs; use null and a bounded diagnostic code for an invalid/unrepresentable identifier. Enforce the same restriction at the staging boundary. Test NUL, unpaired surrogates, invalid ASCII IDs and overlong IDs beside healthy rows through a real Postgres JSON/RPC boundary. Every row must have a durable safe outcome and the healthy page/cursor must progress, without retaining the unsafe raw identifier. |
| C3 — medium, approval command recovery | **Exact approval retries can lose the original idempotent result after processing changes current state.** [The approval API](./sp-dash/app/api/integrations/zoho-recruit/route.js) always calls [current-state evidence registration](./sp-dash/lib/zoho/approval-evidence.js) before the local decision RPC. [Completion](./skillpassport/supabase/migrations/20270129000000_zoho_recruit_execution_ledger.sql) changes a created record's target from null to its canonical UUID. A route probe repeated the original request ID/manifest after that transition: it returned HTTP409 and never reached the existing decision RPC, even though that RPC's immutable batch lookup would return the original matching approval. A later source revision or unavailable executor can similarly prevent recovery of an already accepted request. No duplicate effect or changed-manifest acceptance was observed; this is a command-result recovery regression. | Under the normal authenticated admin guard, first distinguish an exact already-recorded decision from a new intent. Return the durable original result only when actor, connection, request ID, reason, decision and full immutable manifest match. Do not renew evidence expiry, mint another operation or reapprove current data. Mismatched requests must still conflict, and new decisions must retain current-state/evidence checks. Test lost-response retries while queued, processing, completed and source-advanced, plus expired evidence/unavailable writers and mismatched retries. |

### 30.2 Reproduction evidence and scope

Three temporary module probes passed by asserting the **observed defective behavior**:
two unsafe-ID variants and the completed-target exact-retry conflict. They exercised the
actual source consumer, staging handler, approval route and evidence helper using fake
provider/storage/session dependencies. A separate disposable Postgres probe used the
actual canonical candidate transaction, table definitions and `get_jwt_claims` resolver;
it also verified rejection of the escaped NUL/unpaired-surrogate JSON values. It used
synthetic catalog/admin/candidate fixtures, rolled back its state and removed its database.
The enabled organization-product positive control succeeded.

These diagnostic passes are not acceptance tests proving the corrections. Temporary
module probes were removed afterward; the previously reported 153 targeted acceptance/
regression tests remain the existing coverage count. No application database installation,
real provider call, email, deployment or persistent account/job effect was performed.
No runtime code was changed by this audit.

### 30.3 False positives excluded and completion claims narrowed

| Concern considered | Disposition |
| --- | --- |
| Every imported learner currently has no product access | Not established. C1 is conditional; the enabled organization-product control produced the correct canonical product claim. No deployed account was inspected. |
| A membership-product row alone proves effective SkillPassport access | Incorrect. The canonical resolver also requires an active organization-product association. Section 29's wording is narrowed accordingly. |
| Any malformed source record invalidates the B2 fix | Incorrect. Durable in-flight deferral and valid-ID source-text quarantine remain implemented. C2 concerns unsafe malformed ID metadata rejected before SQL per-record processing. |
| The approval retry conflict proves duplicate accounts or an authorization bypass | Incorrect. The reproduced retry stops before mutation/queue dispatch. Its failure is loss of an existing command result; current mutation fencing remains necessary. |
| The disabled password sentinel is a shared usable password | Excluded by the existing bcrypt verification tests: the sentinel and sample guesses do not authenticate. New accounts remain unverified/activation_pending. |
| A locally committed candidate receipt proves the learner/profile/access pipeline is complete | Incorrect. Receipts remain projection_pending; the publisher, consumers and completion acknowledgement are absent, and capabilities explicitly return ready=false. |
| Sponsorship-only/non-learner cases being blocked are newly introduced product-ineligibility rules | Incorrect. These are explicitly disclosed unsupported cases pending the reviewed resolver. They remain unfinished scope, not a determination that those users cannot be supported. |
| The shared SSO/dashboard runtimes' existing mail bindings prove integration emails were sent | Not established. The new modules do not invoke mail/session/admission paths. Downstream end-to-end no-email proof is still pending; presence of a binding is not evidence of delivery. |
| New named entrypoints or queue resources violate the no-new-Worker requirement | Incorrect. They extend existing deployments; no standalone Zoho Worker service/configuration was introduced. |
| All plan fields need an additional unique index or a second subscription policy | Not justified. The canonical runner includes the existing uniqueness constraints/subscription trigger, and concurrent effect/identity tests pass. Reuse those constraints; do not add redundant billing rules. |
| Four SSO fixture type errors or the normal OpenNext policy gate were resolved by the local bundle checks | Incorrect. Those existing limitations remain recorded. Bundle compatibility and targeted tests do not clear full-project typing or normal-release support policy. |
| Environment isolation was accidentally forgotten again | Incorrect. B1 remains open and explicitly deferred by the user. Queue suffixes still do not establish shared-database ownership; this audit does not alter it. |

### 30.4 Whole-plan status and next acceptance order

| Area | Current status |
| --- | --- |
| Existing-runtime discovery/staging, durable source budgets and per-record in-flight deferral | Locally implemented; C2 must close before unattended malformed-row resilience can be claimed. Bulk/delta/delete coverage remains unfinished. |
| Signed human manifests and independent live-claim checks | Locally implemented; C3 must restore exact-command recovery without weakening approval checks. |
| Canonical candidate/Discover local transaction | Implemented for the disclosed supported cases, disabled, with atomic outbox/receipt and concurrent rollback coverage; C1 must validate effective product context. |
| Canonical matching/reviewed target diffs, non-learner contexts and sponsored access | Already recorded unfinished scope. |
| Durable projection delivery, independent learner/entitlement consumers, subject-version guards and receipt completion | Already recorded unfinished scope; required before candidate readiness can become true. |
| Approved job mapping/ownership/quota/publication/lifecycle writes | Already recorded unfinished scope; job validation remains fail-closed. |
| Operational revoke/pause/disconnect/repair, distributed quotas, retention/suppression and key rotation | Already recorded release work, with only the specifically documented local foundations complete. |
| Authenticated E2E, actual tenant coverage, downstream no-email/fault/load/restore evidence and approved pilot | Pending. Synthetic probes/module tests do not substitute for these. |
| Environment isolation and framework release baseline | B1 user-deferred; framework gate remains unresolved. |

Close C1–C3 with targeted real-boundary regressions before extending readiness claims.
Then continue reviewed canonical matching and durable projections, followed by approved
job writers and the remaining operational/source/privacy gates. Keep the explicit approval,
zero-email and no-new-Worker constraints, all flags off, and B1 unchanged as instructed.


## 31. C1–C3 corrections and acceptance evidence — 30 October 2026

All three cases reproduced in section 30 are now corrected locally. Environment isolation
(B1) remains explicitly deferred and unchanged. These corrections do not complete the
unfinished projection/job/source/operational/rollout scope or enable any runtime flags.

### 31.1 Canonical product context (C1)

The [candidate transaction](./sso-worker/supabase/migrations/20261101000000_zoho_candidate_canonical_transaction.sql)
now requires an active SkillPassport `organization_products` association in the existing
independent-learner platform context before creating a new identity. It holds the matching
row with a shared lock through commit; disabling/removing that association serializes with
the transaction. Unavailable context rolls back all local effects. The importer does not
enable a shared product, alter another user's organization or create an academic context.

The [disposable canonical SQL runner](./sso-worker/scripts/checks/test-zoho-candidate-sql.mjs)
now includes the actual organization-product table/constraints and actual `get_jwt_claims`
resolver. Missing and inactive associations are denied with unchanged identity, membership,
subscription, link, receipt and outbox counts. An enabled context creates the intended
membership/Discover grant and resolves `products=["skillpassport"]`. Existing-account
preservation, atomic rollback, deletion cleanup and two-session operation/identity races
continue to pass. The existing-account coverage limits in section 29 remain in force.

### 31.2 Safe source-ID diagnostic accounting (C2)

The [source consumer](./sp-dash/lib/zoho/discovery-consumer.js) now uses a shared safe-ID
allowlist for normalization exceptions. Only decimal string IDs of at most 40 characters
can enter `issues.externalId`; malformed IDs become null with `SOURCE_SCHEMA_INVALID`.
The [private staging contract](./sp-dash/lib/zoho/discovery-authority.js) independently
rejects unsafe IDs, instead of trusting the caller's normalization path.

Module regressions cover NUL, unpaired surrogate, invalid ASCII and overlong IDs beside
a healthy candidate. The healthy record and safe exception outcomes reach page commit.
The application SQL suite commits the matching safe JSON shape through the actual claimed
page function: four bad-ID outcomes plus one healthy record are durably counted, the
healthy record is staged, and the cursor advances to page 2 with completed_with_exceptions.
Unsafe raw identifiers are not retained. This is layered module/SQL-boundary coverage;
it does not claim a deployed-provider end-to-end import has been tested.

### 31.3 Immutable decision-result recovery (C3)

The new [read-only lookup](./skillpassport/supabase/migrations/20270202000000_zoho_recruit_decision_recovery.sql)
returns an existing result only when actor, connection, request ID, decision, normalized
reason and full sorted immutable manifest match the stored batch. A changed request
conflicts; an absent request is not authority to approve. The function is restricted to
the trusted service role, with discovery/anonymous/authenticated roles denied.

Under the existing signed-session/live-admin/origin guard, the [API](./sp-dash/app/api/integrations/zoho-recruit/route.js)
checks that immutable result before inspecting current records or executor readiness.
It also rechecks on an error if another delivery may have committed during readiness or
evidence validation. New decisions retain all current-state, capability and human-evidence
checks. A replay returned directly by the decision RPC is also treated as recovery.

Recovery does not register/renew human evidence, extend an approval deadline, create an
operation or republish queue messages. It returns HTTP200 for the accepted original intent;
current execution status remains a separate history/read operation. The dashboard labels
this as a recovered original decision and does not claim a fresh action was queued.

SQL regressions exercise queued, processing, completed, source-advanced, expired-approval
and paused-source states. The original result remains available, operation count stays
one, immutable batch contents/deadlines stay unchanged, and source-advanced data remains
pending review. Changed hash/target/config/revision, actor, decision and reason are denied.
Route tests verify recovery with unavailable writers without current-record reads, evidence
registration or dispatch, including a concurrent accepted-delivery recovery and fail-closed
storage/conflict cases.

### 31.4 Current verification and release boundary

- **126 targeted sp-dash/LTE tests** pass across 14 files.
- Canonical candidate SQL tests, including actual claim resolution and two-session races,
  pass in a disposable local database.
- Application SQL tests, including exact decision recovery, safe mixed-row accounting,
  claim fencing and refresh single-flight, pass in a disposable local database.
- Dashboard production build/type checking and migration filename/history checks pass.
  Unrelated SSO fixture typing errors and the normal OpenNext support-policy gate remain
  unchanged.

There are now **six application feature migrations and three SSO feature migrations**.
Feature migrations remain local and were not installed into a persistent application
database. No real source API call/import, email, account/job effect or deployment occurred.
All flags remain off; candidate readiness still returns false because durable projection
delivery/confirmation is unfinished. No Worker deployment/service was added.

## 32. Durable projection delivery foundation — 30 October 2026

This section advances the disabled candidate implementation; it does not complete
candidate provisioning or authorize a rollout. Section 31's statement that delivery was
unfinished is historical. Application projection writes and independent confirmation
are still unfinished. Environment isolation (B1) remains user-deferred and unchanged.

### 32.1 Durable publication on existing services

The [fourth SSO migration](./sso-worker/supabase/migrations/20261102000000_zoho_candidate_projection_delivery.sql)
adds publication attempts, due times, lease fencing and accepted application-receipt
metadata. The reserve function claims at most ten pending outbox entries with SKIP
LOCKED, one-minute leases and persistent exponential delays of 120–3600 seconds.
Eight publication reservations exhaust the budget across fresh queue deliveries.
Expired leases can be recovered; an old lease cannot acknowledge a new reservation.
Exhausted entries remain visible pending operator repair; no automatic budget reset exists.

The [existing SSO entrypoint](./sso-worker/src/rpc/zoho-candidate-provisioner.ts) uses the
[delivery module](./sso-worker/src/lib/zoho-candidate-delivery.ts) to publish only
operationId/sourceHash/emailPolicy=forbidden onto the existing auth-sync queue. It does
not publish the private outbox profile or an event-supplied entitlement. Publication
acknowledgement never marks delivered/completed. Ambiguous publication is safe to
repeat through receipt idempotency; the durable attempt budget remains consumed.

The [existing dashboard scheduler](./sp-dash/lib/zoho/runtime.js) now independently
calls projection recovery under the existing background/environment/preview/cron
guards and a separate ZOHO_PROJECTION_DELIVERY_ENABLED flag. New execution can remain
paused while committed-effect recovery runs. The
[dashboard configuration](./sp-dash/wrangler.toml) binds ZohoCandidateProvisioner on
the existing SSO deployment per configured environment. This supersedes earlier
statements that the candidate binding was absent; all enable flags remain false.
No new Worker deployment, queue or bucket was introduced by this change.

### 32.2 Reference-only transport and retained failures

The [existing auth-sync consumer](./auth-sync-consumer/src/lib/zoho-candidate-delivery.ts)
accepts exactly the three reference fields and sends an authenticated POST to the fixed
/sync/zoho-candidate path on the configured SkillPassport base URL. Payload-supplied
identity, role, plan, URL and email-policy overrides are rejected. Transport uses a
15-second timeout, forbids redirects and bounds confirmation bodies to 8 KiB.

HTTP success alone is insufficient. ACK requires a successful completed result matching
the operation, source hash and forbidden email policy. Non-2xx, malformed/mismatched
proofs and unexpected projection errors retain the message for retry. The
[existing DLQ handler](./auth-sync-consumer/src/index.ts) decodes the existing wire formats
and archives only a validated reference or null plus bounded operational metadata in
the existing private review bucket before ACK. Missing/failing storage retries. It
does not retain untrusted profile payloads or send operational emails.

The application endpoint does not exist yet, so an accidentally enabled delivery
currently receives a retryable failure, not a completed projection. Test HTTP responses
are synthetic transport-contract fixtures, not evidence that application postconditions
were checked. Existing development DLQ bucket configuration remains a release prerequisite.

### 32.3 Current canonical snapshots and guarded completion

The SSO snapshot function independently loads the nonblocked canonical user, active
learner/product context, personal SkillPassport subscription history and referenced
public plan fields. It reads current state, including a later paid purchase and the
cancelled former free row. It excludes password/session/payment data and raw metadata.
The supported scope is 1–25 personal subscription rows, including history; zero or
larger histories fail closed rather than being silently truncated. The entrypoint also
bounds the snapshot text to 128 KiB.

The snapshot envelope carries the exact PostgreSQL JSON text and its SHA-256 digest.
Future application code must preserve that text when passing it to SQL: parsing and
restringifying numeric amounts can change encoding and falsely invalidate the digest.
The projection must implement source-version guards and preserve newer paid access,
existing profile preferences, roles and organization context.

The SSO confirmation entrypoint requires independent application receipt/postcondition
readback before invoking the private service-only completion function. That function
recompares the current canonical snapshot hash before storing the accepted application
receipt and marking the outbox delivered. Stale hashes are rejected. The application
receipt reader is deliberately missing and confirmation fails closed until it exists.
The positive DB-owner fixture exercises the canonical transition only; it does not
prove independent application receipt validation or concurrent application projection.

### 32.4 Verification and remaining implementation

- **128 targeted dashboard/LTE tests** pass across 14 files.
- **46 targeted SSO tests** pass across five files, including publication failures,
  lease validation, bounded snapshots and independent confirmation denial/timeouts.
- **20 auth-sync tests** pass across three files, including the preserved LTE review
  and learning-maintenance tests under the standalone patched test runner.
- Canonical SQL fixtures pass in a disposable local database, covering publication
  fencing/budget, current paid snapshots, stale confirmation rejection, private grants
  and the existing real-schema atomicity/idempotency/concurrency checks. Delivery
  reservation concurrency is not yet a separate two-session acceptance test.
- Consumer type checking and local Wrangler bundle/configuration dry-runs for the
  existing dashboard, SSO and auth-sync services pass. The dashboard dry-run uses
  existing generated OpenNext output; it does not close the framework support-policy gate.

There are **six application feature migrations and four SSO feature migrations**.
They remain local and uninstalled into persistent databases. The consumer test runner
is pinned to the patched version identified during dependency validation. Its unchanged
Wrangler toolchain still reports four high development-dependency advisories; the
consumer runtime dependency audit is clean. The four existing SSO fixture type errors
and normal OpenNext support-policy gate remain unresolved.

Next, implement the application projection transaction/HTTP endpoint and its restricted
independent postcondition reader, including actual schema/trigger, version-race,
deletion-suppression and zero-email tests. Then complete reviewed matching/diffs, job
writers, source inventory/delta/deletion coverage, operator recovery/privacy controls and
authenticated end-to-end/pilot evidence. Candidate capabilities still return ready=false.
No real source read/import, account/job effect, email or deployment was performed.

## 33. Implementation-plan re-audit and false-positive review — 30 October 2026

This review compares the operating requirements and acceptance matrix with the current
runtime, approval, canonical transaction, delivery and test boundaries. It found three
additional reproducible issues. They remain open; this audit changes documentation,
not production code. All integration flags remain off. B1 remains explicitly deferred.

### 33.1 Confirmed additional findings

| ID / priority | Confirmed behavior and practical scope | Required correction and acceptance evidence |
| --- | --- | --- |
| D1 — medium, existing-account context validation | The existing-user branch of the [canonical transaction](./sso-worker/supabase/migrations/20261101000000_zoho_candidate_canonical_transaction.sql) checks an active learner role and personal SkillPassport subscription, but does not require the learner membership's product grant or enabled organization-product association. A synthetic SQL probe removed the membership product before an exact approved existing-account operation: source link, receipt and outbox still committed as existing_access_preserved, while the [projection reader](./sso-worker/supabase/migrations/20261102000000_zoho_candidate_projection_delivery.sql) returned null. Disabling the organization product reproduced the same mismatch. No identity duplication, paid downgrade or unauthorized product enablement occurred. C1's new-user correction remains valid; it did not cover this existing-user path. | Validate a supported existing learner/product context before committing any connector effect, with locking consistent with canonical access changes. Unsupported contexts must be held without changing memberships or enabling products. Test missing/inactive membership product, disabled/missing organization product, product access on a different membership, and concurrent revocation. Preserve legitimate paid access and supported existing profiles. |
| D2 — medium, live-authority configuration mismatch | The [named live execution authority](./sp-dash/lib/zoho/execution-authority.js) requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. The [runtime](./sp-dash/lib/zoho/runtime.js), [admin client](./sp-dash/lib/supabase-admin.js) and [declared configuration](./sp-dash/wrangler.toml) use SkillPassport-specific settings, with documented fallback keys. A probe with only valid SkillPassport-specific settings returned allowed=false without connecting. Supplying both settings made the authority select the generic URL/key even when they differed from the application settings. This is a fail-closed availability/configuration issue, not proof of forged approval or a live wrong-database write. | Share the same application database configuration resolution across the named authority, queue runtime and API. Test actual declared variable names, specific-key and generic-key fallback, conflicting URLs/keys and missing configuration. Use fixed read-only RPCs throughout. This correction is separate from B1 environment ownership and must not change the user's deferral. |
| D3 — low, configured endpoint construction | The [projection transport](./auth-sync-consumer/src/lib/zoho-candidate-delivery.ts) validates a parsed base URL but constructs the destination by appending to the original string. Bases containing a query, fragment or extra path therefore do not target the claimed fixed /sync/zoho-candidate pathname. Synthetic successful responses matching the reference were accepted from those constructed locations. Current declared deployment URLs are root URLs, so the normal configured path works; the queue payload cannot choose a URL or host. | Define an origin-only base contract and reject extra path/query/fragment, or construct the fixed pathname with the URL API under an explicit documented base-path policy. Verify that only the intended endpoint receives the reference and Bearer secret. Retain failures for malformed configuration; cover slash, query, fragment, user-info, invalid-scheme and local-loopback cases. |

The D1 probe executed actual SSO table definitions, constraints, subscription trigger
and feature migrations in a disposable database. It compared successful canonical
effects with the independently stricter projection reader, not a fake projection.
The D2/D3 probes called the actual modules with synthetic database/HTTP adapters.
They made no live database, identity-provider or Recruit call. Temporary probes were
removed afterward; these reproductions are not permanent acceptance tests for fixes.

### 33.2 False positives excluded and claims narrowed

- **No new Worker:** a named entrypoint/service binding on the existing SSO deployment
  is permitted by the user's rule. It does not create another Worker deployment.
- **No approval bypass found in these cases:** candidate capabilities still return
  ready=false, explicit flags remain false, and human evidence/live-claim checks remain
  in place. D1 is not authority to provision an unapproved or differently targeted user.
- **Application projection is known unfinished work:** the missing HTTP/SQL projection
  and independent receipt reader were disclosed in section 32. They are not a newly
  discovered regression or a completed feature. A private completion function and mock
  proof response do not establish end-to-end confirmation.
- **Current snapshots do not prove race safety:** paid/cancelled snapshot fixtures
  demonstrate fresh reads, not concurrent purchase/cancellation preservation across
  application writes. Version/race tests remain required before readiness.
- **Bounded snapshots fail closed:** the 25-row/128-KiB limits do not silently truncate
  paid history. Their unsupported cases still need visible operational handling; this
  is part of the documented remaining coverage, not evidence of a paid downgrade.
- **Retries are not unlimited archival:** retrying a DLQ message without ACK does not
  create indefinite retention. Queue retry/retention limits still apply, and existing
  development bucket configuration plus durable operator recovery remain prerequisites.
  Canonical outbox state survives transport exhaustion; an archived message alone is
  not the business completion record.
- **Mail bindings are not proof of mail:** unrelated existing mail bindings remain.
  No integration mail dispatch was observed in these synthetic probes, but deployed
  triggers, provider automations and full downstream zero-email evidence remain unverified.
- **Test scope stays explicit:** the prior 194 targeted passing tests and bundle checks
  do not prove complete source inventory, authenticated end-to-end onboarding, job
  publication, supported framework policy or zero email in a live tenant.

Official documentation was rechecked for this audit:
[Recruit Get Records](https://www.zoho.com/recruit/developer-guide/apiv2/get-records.html)
continues to document saved-record defaults, approval/conversion filters and up to 200
records per request. The local 20-record/500-page reader cap is an implementation
limit, not evidence of full tenant inventory. The
[Recruit bulk limitations](https://www.zoho.com/recruit/developer-guide/apiv2/bulk-read/limitations.html)
continue to document 200,000 records per export job, paginated additional jobs, ZIP/CSV
results and one-day download availability. Those capabilities do not prove tenant
permission or completed bulk implementation.
[Cloudflare retry documentation](https://developers.cloudflare.com/queues/configuration/batching-retries/)
confirms bounded retries followed by configured dead-letter handling or deletion;
retry requests must not be described as unlimited storage.

### 33.3 Current acceptance order

1. Correct D1–D3 and add permanent boundary regressions without changing B1.
2. Complete application projection/independent confirmation, actual trigger/no-email
   checks, deletion suppression and version/concurrency tests.
3. Complete reviewed identity/destination diffs and supported existing-user contexts,
   then approved job lifecycle/ownership/quota/apply routing.
4. Complete source inventory/delta/delete coverage, durable operator recovery,
   privacy/retention controls, framework/CI gates and authenticated E2E/pilot evidence.

The mandatory approval, zero-email and no-new-Worker requirements remain unchanged.
This audit does not authorize a deployment or enable execution.

## 34. D1–D3 corrections and acceptance evidence — 30 October 2026

All three findings from section 33 are corrected locally. The audit remains historical
evidence; these corrections do not complete application projections, jobs or rollout,
and do not change the explicitly deferred B1 environment-ownership issue.

### 34.1 Supported existing-account product context (D1)

The [canonical transaction](./sso-worker/supabase/migrations/20261101000000_zoho_candidate_canonical_transaction.sql)
now requires the same active learner membership to carry the SkillPassport product
grant within an enabled organization-product association. It holds the contributing
membership, role assignment, role, membership-product and organization-product rows
with shared locks through commit. Unsupported contexts are denied without creating a
source link, receipt or outbox; the importer does not enable a product or add a role.
This correction edits the local unapplied feature migration, not applied history.

The [real-schema SQL fixture](./sso-worker/src/__tests__/sql/zoho-candidate.sql) verifies
unchanged canonical effect counts for missing membership product, product access on a
different non-learner membership, disabled/missing organization product and inactive
learner membership. Restoring the supported context permits the exact reviewed
existing user while preserving paid access, credentials, verification and preferences.

The [SQL runner](./sso-worker/scripts/checks/test-zoho-candidate-sql.mjs) also holds a
successful existing-account operation open in one PostgreSQL session. Separate sessions
attempt organization-product disablement, membership-product deletion, membership
deactivation and role-assignment deletion. All four hit the expected lock timeout
until the owning transaction ends. This demonstrates serialization at commit, not a
promise that independently authorized later revocations can never occur. The existing
two-session operation/identity races continue to pass.

### 34.2 Shared application database configuration (D2)

The [shared resolver](./sp-dash/lib/skillpassport-db-config.js) is used by the
[API admin client](./sp-dash/lib/supabase-admin.js),
[queue runtime](./sp-dash/lib/zoho/runtime.js) and
[named live authority](./sp-dash/lib/zoho/execution-authority.js).
URL precedence is SKILLPASSPORT_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL, then SUPABASE_URL;
key precedence is SKILLPASSPORT_SERVICE_ROLE_KEY, then SUPABASE_SERVICE_ROLE_KEY.
Conflicting generic settings cannot redirect the authority away from the configured
application settings. Missing configuration continues to deny before connecting.

Permanent authority regressions cover the declared application URL with either key,
public-URL and generic fallback, conflicting settings, missing URL/key and the fixed
read-only RPC contract. No database URLs, environment ownership or Worker deployments
were changed. This resolves configuration consistency, not B1 data isolation.

### 34.3 Fixed projection endpoint (D3)

The [transport](./auth-sync-consumer/src/lib/zoho-candidate-delivery.ts) now accepts only
a configured HTTPS origin, or HTTP loopback origin for local testing. Non-root paths,
queries, fragments and user-info are rejected before fetch. It constructs the fixed
/sync/zoho-candidate path with the URL API from the validated origin and continues to
forbid redirects. Queue data cannot choose a destination or change the email policy.

Permanent regressions verify root URLs with/without a trailing slash and local
localhost/IPv4/IPv6 origins. Query, fragment, extra path, credentials, invalid protocol,
remote HTTP and malformed URL cases produce retryable errors without sending the
reference or Bearer secret. Existing proof matching, body bounds and failure-retention
tests remain in place.

### 34.4 Verification and unchanged release boundary

- **135 dashboard/LTE tests** pass across 14 files.
- **46 targeted SSO tests** pass across five files.
- **32 auth-sync tests** pass across three files; consumer type checking passes.
- Canonical SQL regressions and the real two-session identity/operation and
  context-revocation checks pass in a disposable local database.
- Migration filename/history validation passes for all 41 SSO migration files.
- Dashboard production build and explicit type checking pass. The corrected consumer
  also passes its local Wrangler dry-run. Knowledge graphs were refreshed and relative
  documentation links validated. The normal OpenNext support-policy gate remains
  unresolved; these checks do not close it.

Feature migration inventory remains six application migrations and four SSO migrations.
No feature migrations were applied to persistent databases. All integration flags and
candidate readiness remain off. No real account/job import, email or deployment occurred.
Application projection/independent receipt verification, reviewed matching/diffs, jobs,
source coverage, operator/privacy controls and end-to-end/pilot evidence remain pending.

## 35. Disabled application projection and independent readback — 30 October 2026

The application projection SQL/endpoint and independent receipt reader now exist locally.
This supersedes the missing-component statements in sections 32–34. Candidate capabilities
still return ready=false; implementing these components does not establish verified
end-to-end onboarding or authorize enabling flags. B1 remains unchanged.

### 35.1 Application transaction and receipts

The [seventh application migration](./skillpassport/supabase/migrations/20270203000000_zoho_candidate_projection.sql)
introduces service-only projection and independent postcondition functions plus protected
receipts. It verifies the exact canonical snapshot text/hash, operation/source/target and
forbidden email policy. Per-target transaction advisory locks serialize repeated deliveries.

A supported canonical-created learner receives an application user with no organization,
an independent learner with no fabricated academic assignment, a user shadow and canonical
plan/subscription mirrors in one transaction. Notification settings are explicitly false
for the new learner. A matching existing active application user must already have a
nondeleted matching learner; the transaction preserves the existing user/profile fields,
roles, organization, credentials and preferences. Missing or conflicting existing profiles
are held rather than being silently repaired into another context.

Plan/subscription cache writes use canonical auth_updated_at versions. Newer cached values
and equal-version conflicting data are not overwritten. The complete bounded personal
subscription inventory must agree; additional mirror rows cause review/retry. A receipt
requires current active/grace effective access, not merely a cached cancelled free row.

Receipts bind operation/source/projection hashes, target, learner and exact mirror IDs to
a fingerprint of current application postconditions, including personal subscription
inventory. Independent readback recomputes that fingerprint and checks current effective
access; merely possessing a receipt ID is insufficient. Deleted user/learner references
become tombstones, preventing old projection work from resurrecting the deleted profile.
Receipts store hashes/IDs, not a duplicate raw canonical snapshot or profile payload.

### 35.2 Direct database privacy and trigger boundaries

The baseline learner schema contains broad permissive public-read policies. The migration
therefore adds restrictive policies for newly imported user/learner/shadow rows using
server-owned receipt markers. Base-table queries by anonymous and unrelated authenticated
clients are denied; ownership checks still require any underlying permissive policy.
Inherited owner-run views are not covered by that base-table evidence: section 36 E1
reproduces exposure through one such view. Existing profiles retain their existing visibility/preferences. An
ownership guard prevents moving an imported learner/shadow onto another ID to evade the
restriction. Canonical deletion remains possible and leaves the receipt tombstone.

This is **base-table RLS evidence**, not a claim that inherited views/RPCs, every service-role
API, recruiter/search/export path or provider automation enforce imported-profile privacy.
Service-role clients bypass RLS; those application visibility paths remain a release gate.
Retention/suppression for new receipts and connector erasure also remain unfinished.

The disposable runner uses the actual five table definitions/constraints and baseline
learner insert triggers, including ID generation, grade mapping, license auto-assignment
and Aadhar validation with its real dependency. Independent rows exercise the license
trigger's no-academic-context return path. They do not invoke signup, learner admission,
generic membership sync or application email/notification handlers. The fixture does not
model deployed database webhooks/provider automations, so full zero-email proof remains
required before rollout.

### 35.3 Existing Pages route and independent confirmation

The [existing Pages deployment](./skillpassport/wrangler.toml) gains a default-off delivery
flag and a binding to the existing SSO candidate entrypoint. No Worker deployment was
added. The [projection route](./skillpassport/functions/sync/zoho-candidate.ts) delegates to
a [dedicated handler](./skillpassport/functions/lib/zoho-candidate-projection.ts) that checks
the existing webhook Bearer secret and a bounded exact operation reference. Caller-supplied
profile, plan, identity and email-policy overrides are rejected before canonical reads.

The handler independently fetches SSO's snapshot, verifies envelope/body identity and
SHA-256, and passes the original PostgreSQL text to SQL without numeric re-encoding.
It never passes the event to the generic user/membership/subscription sync handlers.
After local commit, it asks SSO to confirm the application receipt. The existing SSO
guard now calls the actual
[dashboard named reader](./sp-dash/workers/zoho-execution-authority.js), whose
[fixed read-only RPC](./sp-dash/lib/zoho/execution-authority.js) independently checks current
application postconditions. New execution can stay paused while committed-work delivery
and receipt verification use their separate delivery flag.

SSO's canonical completion still rechecks the current snapshot hash. Only a matching
completed canonical response makes the Pages endpoint return completed=true to auth-sync.
Missing authorities, stale proofs, storage errors and timeouts return failure for retry;
they do not reverse an already committed identity/profile or emit raw errors/PII.

### 35.4 Evidence and next required work

- **137 dashboard/LTE tests**, **46 targeted SSO tests**, **32 auth-sync tests** and
  **8 projection endpoint tests** pass: 223 targeted tests in total.
- New projection SQL tests pass in a disposable database: invalid digest, late-failure
  rollback across user/learner/shadow/cache/receipt writes, replay identity, unchanged
  existing profile/preferences, newer paid-cache preservation, changed proof rejection,
  direct privacy/ownership, deletion tombstones and two-session projection idempotency.
- Existing application approval/control-plane SQL tests and real claim/refresh races pass.
- All 169 application migration filenames/history validate. Pages Functions compilation,
  dashboard type checking and dashboard Worker dry-run pass. The normal OpenNext support
  policy remains a separate unresolved gate.
- The full application Functions type check reports thousands of diagnostics elsewhere;
  no diagnostics name the new projection files. It is not a clean repository-wide type
  check and must not be reported as one. Existing SSO fixture typing limits also remain.

Migration inventory is now **seven application feature migrations and four SSO feature
migrations**, all local and uninstalled into persistent application databases. Flags remain
false and SSO candidate readiness remains false. No live source read/import, email, real
account/job effect or deployment occurred.

Next acceptance work must connect the actual SSO snapshot and application projection
against both disposable databases through the real HTTP/RPC chain, including lost commit/
confirmation responses, signup/purchase/cancellation and deletion races. Complete service-
role API/search/export visibility, trigger/provider zero-email instrumentation, reviewed
matching/diffs and unsupported existing contexts before claiming candidate readiness.
Approved job writers, full source inventory/delta/deletion capture, operator recovery,
privacy/retention/suppression, framework/CI and pilot gates remain open as well.

## 36. Projection audit and false-positive disposition — 30 October 2026

Two additional issues are reproduced below. This audit updates the plan; it does not
fix production code or authorize rollout. All flags and candidate readiness remain off.
B1 environment isolation remains explicitly deferred and unchanged.

### 36.1 Confirmed findings

| ID / priority | Reproduction and scope | Required correction and acceptance evidence |
| --- | --- | --- |
| E1 — high, inherited-view privacy exposure | The new restrictive policies protect direct user/learner/shadow table queries, but the inherited [learner_applications_with_pipeline view](./skillpassport/supabase/migrations/20260526000000_schema.sql) runs with its PostgreSQL owner's access and is granted to anon/authenticated. It starts from learners with LEFT JOINs, so no job application or pipeline entry is needed. A disposable probe installed the actual view definition, owner and grants with empty join-table fixtures. Anonymous and unrelated authenticated roles each saw zero matching rows from learners but one row containing the imported learner's name/email through the view. This is a concrete direct-database access path, beyond the already disclosed service-role API visibility gap. | Make inherited views enforce the intended caller/owner privacy scope or explicitly exclude private imported profiles for unauthorized callers. Audit other views and privileged RPCs for the same bypass, including duplicated candidate PII on joined tables. Add tests for anonymous, unrelated authenticated, actual owner and explicitly authorized server paths, with and without related activity. Keep existing-profile visibility behavior and intended authorized workflows intact; do not claim base-table RLS covers owner-run views. |
| E2 — medium, cross-consumer mirror-label incompatibility | The [generic subscription sync](./skillpassport/functions/lib/sync-service.ts) sets subscription_cache.plan_name from the canonical subscription's plan_type. The [new projection](./skillpassport/supabase/migrations/20270203000000_zoho_candidate_projection.sql) instead requires the referenced catalog plan's name. Those legitimate strings can differ, for example Freemium versus Discover. A synthetic fixture modeled the generic DTO with matching IDs, versions, status, amount, features and plan_type. Projection rejected it with SQLSTATE 40001 and created no receipt. Changing only the derived plan_name to Discover made the exact same canonical snapshot succeed. Repeated delivery cannot resolve this deterministic equal-version mismatch. Access was not downgraded. | Define a consistent derived-label contract between consumers, or safely reconcile that non-entitlement label without weakening equal-version/newer-version protection for identity, scope, status, amount, dates and features. Test a real generic-sync DTO feeding the projection, both matching and differing plan_type/catalog labels, repeat delivery, and critical-field conflicts. Preserve existing user/profile/preferences and never resolve this by blindly overwriting all equal-version fields. |

The E1 fixture used the actual baseline view SQL/owner/grants and the real new projection
function/policies in a disposable database. Joined pipeline/opportunity tables were empty
minimal schema fixtures, not copied production data. The E2 fixture modeled the DTO
produced by the inspected generic handler and exercised the real projection SQL. It was
not a deployed HTTP-chain test. Both probes completed alongside existing SQL regressions
and two-session projection idempotency checks. Temporary probes were removed afterward.
No real user, source/provider API, email or persistent application database was used.

### 36.2 False positives excluded and claims corrected

- **Privacy is not wholly absent:** direct base-table anonymous/unrelated reads are
  restricted, ownership reassignment is guarded, and receipts are private. E1 identifies
  a specific inherited view bypass; it does not invalidate those narrower tests.
- **No paid downgrade in E2:** the transaction rejects and rolls back. This is an
  availability/compatibility defect for valid existing mirrors, not proof that stale free
  access overwrites a purchase. Genuine newer/equal-critical-field conflicts must remain denied.
- **Projection components exist:** the endpoint, SQL and independent receipt reader are
  implemented locally. Calling them missing is now stale; calling the entire pipeline
  verified would also be wrong. Two-database HTTP/RPC E2E and races remain pending.
- **Concurrent identical delivery is covered:** the application test uses two real
  PostgreSQL sessions and verifies one learner/receipt. It does not establish purchase,
  signup, erasure or cross-database confirmation race behavior.
- **No integration approval bypass or new Worker was demonstrated:** strict reference
  payloads, independent canonical reads, human/live-claim checks and default-off flags
  remain in place. Existing named entrypoints/bindings are permitted by the no-new-Worker rule.
- **No-email remains a release gate:** the probes invoked no mail handler/provider.
  Existing mail bindings or preference=true on a preserved existing profile are not,
  by themselves, evidence of an integration email. Deployed trigger/provider and complete
  downstream zero-email instrumentation remain unverified.
- **Repository type checking is still not clean:** prior passing targeted tests and
  bundle compilation do not close the documented Functions typing or framework policy gates.

### 36.3 Current acceptance order

1. Correct E1–E2 with permanent boundary regressions, preserving B1's deferral.
2. Complete actual two-database HTTP/RPC projection/reconciliation and failure/race tests,
   service-role API/search/export privacy, and full zero-email/trigger/provider evidence.
3. Complete reviewed identity/destination diffs and unsupported existing contexts, approved
   job lifecycle/ownership/quota/apply routing, full source inventory/delta/deletions,
   operator recovery, retention/erasure/suppression and remaining CI/pilot gates.

There are still seven application feature migrations and four SSO feature migrations,
all local and uninstalled into persistent application databases. No flags were enabled.

## 37. E1–E2 corrections and acceptance evidence — 31 October 2026

The confirmed view bypass and equal-version label mismatch from section 36 are now
corrected locally. The broader privacy/readiness gates remain open; this section does
not assert that every inherited privileged reader or service-role API is safe. All flags
remain false, and the user's B1 environment-ownership deferral remains unchanged.

### 37.1 Caller-RLS view privacy (E1)

**Superseded by section 38:** this historical local fix depends on RLS and does not
satisfy the user’s server-authorization architecture. E1 privacy acceptance remains open.

The [eighth application migration](./skillpassport/supabase/migrations/20270204000000_zoho_projection_view_privacy.sql)
sets security_invoker=true on learner_applications_with_pipeline. It preserves the
actual view definition, owner, grants, columns and joins while applying the underlying
tables' permissions/RLS for the caller. The existing imported-profile restrictive policy
therefore protects this view as well as direct learner reads. The migration requires
the baseline view to exist; it does not silently skip a missing schema object.

The [projection SQL runner](./skillpassport/scripts/checks/test-zoho-projection-sql.mjs)
now installs the actual baseline view SQL/owner/grants, with empty minimal join-table
fixtures and the existing synthetic table/policy/trigger setup, before applying the new
migration. Permanent [compatibility regressions](./skillpassport/functions/__tests__/sql/zoho-projection-compatibility.sql)
verify that anonymous and unrelated authenticated callers cannot read the imported
name/email, both without and with a related pipeline row. The owner and service role
can read it. An ordinary preexisting learner remains visible under the deliberately
permissive legacy fixture, demonstrating that this correction does not globally hide
existing profiles. Service-role authorization remains the server endpoint's responsibility.

### 37.2 Derived labels without weakening access guards (E2)

The [projection transaction](./skillpassport/supabase/migrations/20270203000000_zoho_candidate_projection.sql)
still derives the display label from the canonical catalog. At an otherwise identical
version, it may now normalize only plan_name when the generic handler previously used
plan_type instead. The row is already locked by the cache upsert; the comparison includes
the canonical version and every other expected identity/scope/access field. It does not
rewrite other fields or treat a newer conflicting row as a label-only difference.

Matching labels and Freemium/Discover label differences now project successfully and
replay idempotently, preserving the existing profile and effective access. Permanent
SQL regressions verify rollback and unchanged receipts/cache rows for conflicting status,
amount, features, expiry, plan code/ID, organization scope, organization-subscription flag
and newer versions. The original stale-paid protection remains in place. Only the local
unapplied projection migration was edited; no installed migration history was rewritten.

The [cross-consumer contract test](./skillpassport/functions/__tests__/zoho-projection-subscription-contract.test.ts)
invokes the actual SyncService.syncSubscriptionCreated implementation with synthetic
input and a fake database transport. Shadow bookkeeping is mocked separately. It captures
the real generic cache DTO and passes that DTO into the disposable SQL runner; the runner
populates the corresponding mirror fields before invoking the real projection transaction.
This is a handler-to-SQL compatibility test, not the full deployed HTTP/SSO chain.

Run npm run test:zoho:projection:contract for that explicit Docker-backed contract test;
the ordinary test run captures the generic DTO but skips the database integration unless
ZOHO_LOCAL_PROJECTION_SQL_TEST=1 is set. The SQL-only compatibility fixture remains part
of npm run test:zoho:projection:sql.

### 37.3 Related-reader inventory and scope limits

The review also inspected inherited reader categories rather than assuming that table
RLS protects every reader:

| Reader category | Disposition |
| --- | --- |
| learner_applications_with_pipeline | Confirmed E1 path corrected and role-tested, including a related activity row. |
| Regular invoker functions such as get_learner_details and get_learner_stream_recommendation_data | Their learner reads use caller table permissions; do not classify them as SECURITY DEFINER merely because an anonymous EXECUTE grant exists. Their broader activity data still requires normal authorization review. |
| Other owner-run activity views, including conversations, pipeline details, interviews, badges, competition results and enrollment reports | Require their own caller/privacy and duplicated-PII checks before rollout. The one-view correction is not evidence that every joined table or copied candidate field is protected. |
| Privileged training/portfolio readers and profile-hash helpers | Remain part of the inherited RPC/privacy release review; digest returns are distinct from raw profile reads. No broad revoke or untested authorization rewrite was applied to unrelated workflows. |
| Service-role API/search/export and provider automations | Continue to bypass or sit outside base-table RLS; remain explicit release gates from section 35. |

Candidate capabilities remain ready=false because those wider checks and full integrated
two-database/race/no-email evidence are unfinished. This correction closes the reproduced
E1 view case, not the entire application privacy acceptance requirement.

### 37.4 Verification and remaining work

- Both real-generic DTO tests pass, including the opt-in disposable-database contract.
  The eight projection endpoint regressions also pass.
- Expanded projection SQL tests, including caller/view privacy, label compatibility,
  critical-field rejection and the original two-session idempotency checks, pass.
- Existing application approval/control-plane SQL regressions, claim fencing and refresh
  single-flight pass. All 170 application migration filenames/history validate.
- The previous full Functions typing failure remains a separate repository gate; targeted
  tests are not a clean repository-wide type check.

Migration inventory is now **eight application feature migrations and four SSO feature
migrations**, all local and uninstalled into persistent application databases. No new
Worker, source API call, real account/job effect, email or deployment was introduced.
No integration flags or candidate readiness were enabled. Full integration acceptance,
reviewed matching/diffs, jobs, source coverage, operator/privacy/retention/suppression,
framework/CI and pilot work remain pending.


## 38. No-RLS architecture audit and false-positive review

**Date:** 31 October 2026. This section supersedes privacy completion claims in
sections 35–37. The user explicitly does not use Supabase built-in RLS in any project.
This audit updates the plan; it does not replace the pending production implementation.
All integration flags remain false and candidate capabilities remain ready=false.
B1 environment isolation stays deferred. No persistent migration, source API call,
real account/job effect, email or deployment was performed.

### 38.1 Confirmed findings

| Finding | Evidence and practical consequence | Required correction |
| --- | --- | --- |
| F1 — high: the proposed privacy implementation depends on an unsupported authorization model | The [projection migration](./skillpassport/supabase/migrations/20270203000000_zoho_candidate_projection.sql) enables RLS on users/learners/shadows and uses `auth.uid()` in `zoho_candidate_profile_visible`. The [view migration](./skillpassport/supabase/migrations/20270204000000_zoho_projection_view_privacy.sql) only enables `security_invoker`. A disposable probe ran the existing SQL fixture, then disabled RLS on those three fixture tables: anonymous reads returned the synthetic imported learner through both the base table and the view; service-role reads also returned it. The historical test success is conditional on RLS and does not establish privacy in the required architecture. This is a local reproduction using baseline grants, not proof of deployed anonymous access. | Replace only the Zoho-introduced RLS dependencies with the existing SSO/server authorization model and a verified private data boundary. Inventory direct table/view/RPC exposure before choosing storage/filtering. Do not remove all project policies or merely delete the new policies while leaving imports readable. Rewrite acceptance tests to work without RLS. |
| F2 — high: existing server readers do not enforce imported-profile invisibility | [Recruiter actions](./skillpassport/functions/api/recruiter/actions.ts) `list-learners` and `get-learner` select complete learner rows using [getServiceClient](./skillpassport/functions/lib/supabase.ts), without a private-import check. Locked contacts have only email/contact_number removed; names and remaining profile fields are still returned. [Recruiter copilot](./skillpassport/functions/api/recruiter-copilot.ts) fetch/basic/enriched paths likewise mask contacts without excluding private imports. A contact-unlock record is not evidence of permission to publish a new private import. These are existing readers that become an integration privacy defect when new imported profiles enter the shared table; no production leak is asserted. | Define one server-owned visibility rule and enforce it across lists, by-ID/alias reads, search/matching, exports, joined/copied profiles, contact unlocks and mutations. Resolve the actor and allowed scope from verified SSO context. Preserve authorized owner/admin access and existing public-profile behavior. Filter before pagination/counts/ranking where appropriate, and prevent alternate readers from returning the same private data. |

F1 is the architecture mismatch; F2 identifies concrete server paths that would remain
unsafe even if caller-RLS view behavior were available. They share the same privacy
release gate and should not be counted as independent production incidents.

### 38.2 False positives and evidence limits

- E2's catalog label reconciliation remains valid and independent of RLS. The real
  generic sync DTO still produces `Freemium`; projection may reconcile only the derived
  display label to `Discover` when all compared canonical fields/version agree.
- A `SECURITY DEFINER` function or an anonymous EXECUTE grant alone is not sufficient
  evidence of a data leak. Inspect returned fields, authorization and reachability.
  Digest-only outputs are not equivalent to raw profile/name/email reads.
- PostgreSQL grants and service-only transaction functions are separate from RLS.
  The no-RLS requirement does not require exposing internal staging/receipts or removing
  those controls. Restricted discovery-role credentials remain useful; they do not
  isolate the trusted hosting service from its own privileged credentials.
- Disabled flags and ready=false are intentional rollout safeguards. They are not
  evidence that provisioning is complete or that current local code has affected users.
- Current SQL privacy fixtures use a synthetic Supabase-style subject and RLS policies.
  Their passing assertions cannot establish authorization under the actual SSO request
  path. Full no-email proof also remains open: synthetic SQL fixtures do not model
  deployed webhooks, provider automations or every downstream notification path.
- No new Worker deployment was found in the inspected integration configuration.
  Named entrypoints on existing services and new queue bindings do not themselves
  constitute a new Worker service. The deferred B1 issue is not reopened here.

### 38.3 Verification and remaining acceptance

Focused endpoint and generic DTO unit tests were rerun: nine passed, with the opt-in SQL
contract skipped in that command. The dedicated opt-in SQL contract was then rerun separately: both tests passed,
including the real generic DTO through disposable SQL. These runs cover ten distinct
tests; do not double-count the repeated DTO unit test or count a skipped test as a pass. The disposable no-RLS probe above
also ran the projection SQL atomicity/version/deletion/two-session suite before testing
unprotected reader visibility. Its exposure assertions confirm the defect, not a fix.

The remaining work is still: implement and test the no-RLS private-profile boundary;
run authenticated approval-to-canonical-to-application two-database E2E and concurrency,
delete/retry/no-email cases; finish reviewed identity/entitlement diffs; implement the
approval-gated job writer with quota/ownership/lifecycle/search/application semantics;
complete source inventory/bulk/delta/delete and operator recovery/quota/key-rotation
controls; implement retention/erasure/suppression; satisfy normal framework/build/CI
and pilot acceptance. Earlier sections describe these as pending requirements, not
newly reproduced defects. Existing migration files remain local/unapplied and must
be revised before any release; their presence is not acceptance evidence.


## 39. Explicit no-RLS corrections and local verification

**Date:** 31 October 2026. This section records the local corrections to F1–F2.
It supersedes the RLS implementation described in sections 35–37 and the outstanding
code-change statements in section 38. It does not declare full integration readiness.

### 39.1 Database authorization boundary

All local, unapplied Zoho application/SSO migrations now omit RLS enablement; the
Zoho-specific restrictive policies, `auth.uid()` helper and caller-RLS view alteration
are removed. Unrelated existing policies and grants are unchanged. Internal staging,
evidence, receipts and outboxes remain protected by their explicit database grants
and service-only functions. No migration is applied to a persistent database.

The [application boundary migration](./skillpassport/supabase/migrations/20270204000000_zoho_projection_view_privacy.sql)
defines `zoho_assert_private_projection_boundary`. The
[canonical candidate migration](./sso-worker/supabase/migrations/20261101000000_zoho_candidate_canonical_transaction.sql)
defines the equivalent `zoho_assert_private_identity_boundary` before new SSO identity
writes. They inspect actual table/column privileges and transitively dependent views
for both browser roles, and conservatively reject browser-callable SECURITY DEFINER
routines outside system schemas. No RLS policy or Supabase subject is consulted.

The application guard runs before creating a private profile, before replaying a
private profile projection and before private receipt postcondition confirmation.
The SSO guard runs before a new recruiting identity is inserted. Denial raises 42501
and rolls back the owning transaction; turning on a flag cannot override it.
Unrelated existing public-profile projection behavior is preserved.

**Operational consequence:** baseline anonymous/authenticated permissions in the
existing databases can intentionally prevent these guards from passing. These changes
do not automatically revoke legacy access or migrate browser clients. Establish and
verify the server-only boundary through a separately reviewed migration of those
legacy readers before enabling the integration. The callable-definer check is
conservative: even a harmless callable definer prevents acceptance; it is a fail-closed
readiness constraint, not an allegation that every such function leaks information.
Do not weaken it to a function-name substring test or treat a configuration assertion
as proof that transitive/dynamic readers are safe.

### 39.2 Recruiter readers and copied profile fields

The server-only `zoho_recruiter_learners` view uses an explicit NOT EXISTS predicate
against the internal private-import marker. Existing public profiles remain visible.
Its grants deny browser roles. View ownership bypassing RLS is immaterial: the SQL
predicate itself excludes private imports.

The same migration defines server-only filtered surfaces for pipeline records and
pipeline details, applications, interviews, shortlists, training, certificates and skills.
Filtering parent rows prevents copied candidate name/email/phone and nested learner
embeddings from reintroducing a hidden profile. Automatically updatable views include
CHECK OPTION; private candidates cannot be inserted or reassigned through those views.
The inherited detailed pipeline view remains read-only at this new surface.

[Recruiter actions](./skillpassport/functions/api/recruiter/actions.ts),
[recruiter copilot](./skillpassport/functions/api/recruiter-copilot.ts) and
[recruiter pipeline](./skillpassport/functions/api/recruiter-pipeline/[[path]].ts)
now use these explicit server readers. Missing reader/schema/query errors do not fall
back to unfiltered tables. Private by-ID/alias lookups return unavailable/not-found;
the detail action now explicitly handles a missing profile rather than destructuring
null. Existing SSO middleware and organization/permission checks remain required.

Semantic search/matching RPCs keep their signatures and use the filtered learner
source before thresholding, LIMIT and ranking. Contact unlock resolves candidates
from the same filtered source before its existing claim/charge transaction. An old
unlock row cannot make a private candidate discoverable through these paths.

Owner/self-service and independently authorized administrative readers continue to
require their existing explicit SSO ownership/RBAC checks; the new discovery view does
not grant owner access. No browser token, client actor ID or Supabase Auth subject can
select the private server path. Full authenticated owner/admin and embedded-view HTTP
integration remains part of acceptance, not something SQL fixtures alone establish.

### 39.3 Local verification and limits

- 54 focused tests passed: eight private recruiter reader regressions, eight projection
  endpoint tests, 25 existing requisition/application review tests and 13 organization
  scope tests. The private-reader tests verify public-profile preservation, hidden ID
  lookups, unlock refusal, copilot readers and fail-closed query failure.
- Both real generic-subscription DTO contract tests passed, including disposable SQL.
  Projection SQL still verifies atomic rollback, paid/version preservation, receipt
  idempotency, deletion tombstones and real two-session projection races.
- New SQL checks use RLS-disabled tables and no `auth.uid()` fixture. They verify actual
  projection rejection before effects, direct/column grants, inherited/nested views,
  callable privileged routines, service-only filtered discovery, semantic ranking,
  by-ID/alias unlock denial and write CHECK OPTION.
- Application control-plane SQL, two-session claim fencing and refresh single-flight
  passed after removal of unused RLS settings. Canonical SSO SQL and its operation,
  identity and context-revocation races passed; the real canonical transaction is also
  denied under a synthetic anonymous users-table grant without identity/outbox effects.
- Database rules validated 170 application and 41 SSO filenames/history; the new views
  are explicit schema-only statements. No baseline migration was rewritten.

The Pages Functions compile successfully with the changed recruitment routes. The
SSO approver/evidence SQL suite also passes. Required application/SSO graph updates
completed, and whitespace checks pass. The previously reported repository-wide typing
and normal dashboard framework/build gates are not claimed resolved by this work.

Deploy the revised application migrations before deploying API code that reads the
new server-only views. Do not enable discovery/execution/delivery just to bypass this
ordering or the database guards. The current migrations do not migrate legacy browser
readers or establish production grant closure.

The SQL runner closes legacy privileges only inside its disposable synthetic database.
That preparation is not a production migration or evidence of deployed permissions.
The auxiliary activity tables are minimal filter fixtures, not full application HTTP
or PostgREST embedded-relationship tests. Server-role authorization across all other
APIs/search/export, deployed webhooks/provider automation, integrated two-database E2E,
source/jobs/operator/privacy lifecycle and normal build/CI/pilot gates remain open.
All flags remain false and capabilities ready=false. B1 environment isolation remains
deferred. No email, provider call, real account/job, persistent migration, new Worker,
commit, push or deployment was performed.


## 40. Legacy-access inventory and first authenticated browser replacements

**Date:** 31 October 2026. This is progress on the first next step in section 39,
not completion of legacy access cleanup or permission revocation. Existing flags,
ready=false, mandatory approvals, zero email and the deferred B1 decision are unchanged.

### 40.1 Read-only inventory and false-positive boundaries

The [browser inventory](./skillpassport/scripts/checks/audit-browser-db-access.mjs),
run with `npm run audit:browser-db`, scans non-test frontend source with TypeScript's
parser and reports table/RPC call sites. It now finds **zero literal protected-relation
references** for users, learners, users_shadow and the inherited pipeline learner view.
This is a scoped static check, not proof of deployed access control, dynamic query
safety, every possible client factory or absence of external consumers.

There are still **38 anonymous SDK calls** in the two modules that actually import the
browser database client. Those remaining calls must be migrated or explicitly reviewed
before closing the corresponding legacy permission boundary:

| Remaining relation | Literal anonymous SDK calls |
| --- | ---: |
| personal_assessment_attempts | 22 |
| personal_assessment_results | 5 |
| adaptive_aptitude_results | 4 |
| personal_assessment_responses | 2 |
| personal_assessment_sections | 1 |
| personal_assessment_streams | 1 |
| personal_assessment_questions | 1 |
| notifications | 1 |
| adaptive_aptitude_sessions | 1 |

An additional 38 `supabase.from` references occur in modules without the tracked client
import. They are reported as unresolved/legacy references requiring reachability review,
not automatically counted as functioning anonymous database access. Barrel exports,
type-only SDK imports and names such as DashboardWithSupabase are not evidence of a
query. No browser RPC call was found by this scoped scan; that does not prove that
published RPC grants are harmless or unused outside this source tree.

Read-only catalog transactions against the existing local SkillPassport and SSO
containers confirmed that both browser roles retain public schema usage and SELECT
permissions on the protected relations present there, including the application
owner-run learner/pipeline view. Both databases also expose non-system definer routines.
Only catalog metadata/permissions/routine signatures were inspected, not user rows or
credentials. Existing RLS flags were observed on some tables; they were not changed,
and are not relied on under the required architecture. These are local catalog findings,
not assertions about production grants, actual successful RLS-protected reads or a
production privacy incident. A callable routine's presence is an inventory/review item,
not proof that it returns private information.

### 40.2 Owner-scoped assessment and profile reads

The existing [profile API](./skillpassport/functions/api/learners/profile.ts) now derives
the owner solely from verified SSO subject. A matching legacy user_id query parameter
continues to work; an empty or foreign override is rejected before database reads.
The response includes college/program degree context required by assessment processing
and is marked no-store. It never uses a Supabase Auth subject.

The new [assessment learner helper](./skillpassport/src/features/assessment/api/learnerContext.ts)
uses the existing authenticated API client. Optional user/learner references are local
consistency checks, not caller-selected server scope. Missing own profiles return null;
authorization/network failures propagate rather than falling back to anonymous queries.
Assessment initialization, submission context, notification-recipient resolution and
legacy user-to-learner fallback lookups now use this helper.

The [public learner API](./skillpassport/functions/api/learners/index.ts) validates its
UUID reference and reads the server-only filtered discovery relation, so a private
import cannot be read via the public ID/user-ID alias route.
[By-email reads](./skillpassport/functions/api/learners/by-email.ts) use that same source
for other people, including unrelated administrator roles. Such requests cannot fall
back to the caller's profile or trigger self-heal if the target is absent/private.
Own-email reads also bind user_id to the immutable SSO subject; email equality alone
is not ownership. Identity-bearing diagnostic logs were removed from this endpoint.
Existing broader generic mutation/admin/data APIs still require their separate review.

### 40.3 Academic roster replacement

The new [roster API](./skillpassport/functions/api/assessment-roster.ts) runs on the
existing Pages deployment with standard SSO middleware. The server verifies:

- The verified active organization and academic role; caller-selected foreign scope,
  unknown keys, invalid UUIDs and filter-syntax injection are rejected.
- An active mirrored organization_members row, and the organization's school/college
  type. An admin claim alone cannot elevate an ordinary membership.
- For educators, an active staff record belonging to that SSO user/organization and
  the actual class assignments for the class's academic year. Every requested class
  must be assigned and belong to the organization. Stale-year assignments are denied.
- Private-import filtering through the existing server-only learner view, before
  pagination. School and college use their actual respective class columns.

These are current application-mirror checks, not a claim of synchronous canonical
revocation under queue lag. The API is read-only and returns bounded 200-row keyset
pages with no-store. No caller-supplied educator identity selects authorization scope.

[Exam roster methods](./skillpassport/src/features/assessment/api/examsService.ts) use
an [authenticated paginator](./skillpassport/src/features/assessment/api/assessmentRoster.ts)
that collects all pages, detects repeated cursors, preserves roll ordering and rejects
an exceeded 100-page bound instead of returning silent partial success. The remaining
unresolved-client references in that legacy exam service were not relabelled as migrated.

### 40.4 Verification and next work

91 focused tests pass across owner/public/by-email reads, academic roles/memberships,
teaching assignments/year, foreign classes, filtering failures, pagination, browser
transport, projection endpoints and existing recruiter permission/application review.
Functions compile locally. Repository-wide frontend and Functions typing checks still
fail; the existing context-envelope issue in the three touched learner routes was
corrected with an explicit Pages envelope plus verified user type. The new APIs/helpers/tests and corrected learner API envelopes have no targeted
diagnostics in the latest checks. Other diagnostics remain in the existing assessment
hooks/services and elsewhere; passing tests are not a clean repository-wide type check.

Next migrate/review the remaining assessment/adaptive/notification calls, review public
views and routines with their actual consumers, and prepare permission closure that
preserves service-only function privileges. Do not blanket-grant EXECUTE to service_role
or remove all policies to force the guard to pass. Legacy access cleanup is incomplete;
no persistent permission changes or migration installation occurred. Full authenticated
HTTP/PostgREST and two-database E2E, job execution and source/operator/privacy/build/pilot
acceptance remain pending. No provider call, email, real account/job, new Worker,
commit, push or deployment was performed.


## 41. Current implementation audit and false-positive dispositions

**Historical audit:** section 42 records the subsequent local corrections.

**Date:** 31 October 2026. Audit only: the confirmed defect below is not yet fixed.
This section supersedes any reading of section 39 as proving interview privacy.
All import flags remain disabled; readiness remains false. No persistent database
migration, real account/job, provider call, email, new Worker or deployment occurred.

### 41.1 Confirmed privacy finding

| Finding | Verified evidence and scope | Required correction |
| --- | --- | --- |
| G1 — high: private interview data passes the new filtered reader | The [boundary migration](./skillpassport/supabase/migrations/20270204000000_zoho_projection_view_privacy.sql) filters interviews using `l.id=t.learner_id`. The actual `interviews_learner_id_fkey` in the [baseline schema](./skillpassport/supabase/migrations/20260526000000_schema.sql) references `learners.user_id`, whereas pipeline/application/shortlist rows reference `learners.id`. A disposable probe loaded the actual interview foreign-key definition into the existing synthetic fixture and inserted an interview for the private imported user's user_id. As service_role, the filtered learner view returned zero rows, but `zoho_recruiter_interviews` returned the copied candidate name/email row. [Recruiter actions](./skillpassport/functions/api/recruiter/actions.ts) reads that view. This is a concrete local bypass of the intended predicate, not an assertion of deployed imports or a production leak. | Match the interview's actual user-ID key, audit any alias compatibility separately, and add private/public interview reads and write CHECK OPTION tests using the real FK semantics. Keep organization authorization in place. Other activity tables must be tested with their actual key contracts, not assumed identical because the column is named learner_id. |

The prior projection fixture uses actual core user/learner/cache constraints but minimal
activity tables. Its interview stub omitted this foreign key, and its private-reader
cases exercised pipeline semantics. Passing those tests did not cover the interview
key contract. This is a coverage gap with a reproduced consequence, not a reason to
discard the still-valid atomicity/version/idempotency checks.

### 41.2 Latent code defect, with reachability limits

A temporary mounted-hook test reproduced an owner-switch defect in
[useAssessment](./skillpassport/src/features/assessment/model/useAssessment.ts): after
loading owner A, changing the verified frontend user to B leaves A's learnerRecordId
in state and never requests B, because initialLoadComplete is never reset. Outstanding
loads are also not fenced to the current user. The hook's initialization predates the
latest migration; the migrated owner lookup does not solve its lifecycle problem.

**Do not label this a confirmed active-page privacy leak.** Current non-test source
references found only the hook definition and its barrel export, with no invocation.
The mounted-hook defect is real, but active application reachability was not established.
Before using this exported hook, reset owner-dependent state and reject stale async
results on user changes/sign-out, with mounted-switch and in-flight-switch tests.
The temporary reproduction test was removed after the audit; no implementation fix
or permanent regression was added in this audit turn.

### 41.3 False positives ruled out and acceptance limits

- Suspected repeated-OR replacement was ruled out. The installed PostgREST client
  uses URLSearchParams.append for `.or()`, preserving the separate deleted-state and
  section filters. Do not report a filter-overwrite defect from the chained syntax.
- Do not infer that copied pipeline/application/interview rows become public after a
  learner hard-delete from the minimal fixtures. Their actual baseline foreign keys
  restrict that deletion while those rows remain; shortlist rows cascade. Erasure
  still needs its planned workflow, but the guessed orphan-row exposure was not a
  confirmed defect under those constraints.
- The refreshed scoped browser inventory still reports zero literal protected-table
  references and 38 imported anonymous SDK calls. These are call sites, not 38 proven
  leaks. The unresolved-client group is still separate. Static zero does not revoke
  database grants, prove dynamic-query coverage or validate public RPCs.
- Browser-callable privileged routines and retained RLS flags are catalog findings,
  not evidence that every routine leaks. The existing guard intentionally blocks even
  harmless definer routines until reviewed; it remains conservative and can obstruct
  rollout. This is already disclosed, not a newly proven confidentiality exploit.
- Default-off flags and ready=false are intentional safeguards. The 38 remaining
  calls, permission closure, wider APIs/exports, full authenticated HTTP/PostgREST,
  two-database E2E/no-email, jobs/source/operations/privacy lifecycle and normal
  build/type/CI/pilot work remain previously recorded release requirements.

### 41.4 Evidence from this audit

The disposable projection SQL suite still passes its existing assertions; an appended
probe with the real interview FK confirms G1 by asserting that the private interview
remains visible. That positive exposure assertion establishes a defect, not a fix.
The temporary React hook reproduction passed and established the narrower latent
lifecycle issue above. The full previous 91-test suite was not rerun or relabelled as
new complete acceptance evidence. No production code was changed in this audit.


## 42. Interview key and assessment owner-lifecycle corrections

**Date:** 31 October 2026. G1 and the narrower latent hook defect from section 41
are corrected locally. This does not close legacy grant cleanup, every application
reader, integrated E2E or the other release gates. All flags remain false and candidate
capabilities ready=false. B1 environment isolation remains deferred.

### 42.1 Interview privacy uses its actual key

The [server-only interview view](./skillpassport/supabase/migrations/20270204000000_zoho_projection_view_privacy.sql)
now matches interviews.learner_id to learners.user_id, consistent with the actual
baseline foreign key. Pipeline/application and other record-ID relations retain their
own key semantics. There is no RLS dependency, anonymous grant or role bypass added.

The [disposable projection runner](./skillpassport/scripts/checks/test-zoho-projection-sql.mjs)
now loads the actual interview table definition and the actual seven activity learner
foreign keys, including their RESTRICT/CASCADE behavior. It stops if a key is missing.
Other activity tables still have minimal column fixtures; this is not presented as
full activity-schema or authenticated PostgREST embedding coverage.

Permanent [SQL regressions](./skillpassport/functions/__tests__/sql/zoho-private-readers.sql)
create a copied private interview and an ordinary public interview using canonical
user UUIDs. They verify that the private interview stays hidden and the public one
remains readable/updatable. Inserts and reassignment to a private identity fail CHECK
OPTION; deleting a hidden interview through the filtered view affects zero rows. A
learner-record UUID is rejected by the actual interview FK, preventing the old fixture
assumption from returning. Browser roles retain no SELECT on this server-only view.

### 42.2 Owner-generation-scoped hook state and async work

[useAssessment](./skillpassport/src/features/assessment/model/useAssessment.ts) no longer
uses a once-only load latch. Each owner transition, including sign-out and A→B→A,
gets a fresh generation. Every owned state slot is tagged with that generation and
returns its initial value immediately when the owner changes, before effects run.
Old callbacks cannot publish values/errors/loading state into a new owner generation.
Unmounted callbacks are also fenced.

Initialization reloads through the existing authenticated owner API and cancels its
state publication on cleanup. Async assessment actions check the owner before dispatch,
after service awaits and before follow-up reads/returning old records. In particular,
response-restoration fallback cannot swallow an owner-change error and then return an
old attempt. Already-dispatched writes are not claimed cancelled or rolled back; their
server authorization remains necessary. The remaining legacy anonymous assessment
calls are still the separately recorded migration work.

Permanent [hook regressions](./skillpassport/src/features/assessment/model/__tests__/useAssessment.owner.test.tsx)
cover a mounted switch, late old initialization, sign-out with populated attempt and
responses, retained callbacks, late action completion, stale errors/finally handlers,
A→B→A, delayed response restoration, unmount and StrictMode cleanup. The previous
reachability limitation remains: no current non-test invocation of this exported hook
was found. This fixes the latent module contract; it does not establish that an active
page previously leaked data.

### 42.3 Validation and remaining acceptance

- 100 focused tests pass across the nine new hook cases and the prior owner/public,
  roster, projection and recruiter permission/application-review cases.
- Both generic-subscription DTO contract tests pass, including the expanded disposable
  SQL suite. Its existing atomicity, paid/version preservation, deletion and two-session
  idempotency checks still pass alongside the real-key interview regressions.
- Application database rules validate all 170 filenames/history. Eight application
  and four SSO feature migrations remain local/unapplied; no baseline was rewritten.
- Repository-wide frontend typing remains a separate failing gate; targeted passing
  tests are not a clean repository-wide build/type/CI result.

The remaining 38 anonymous SDK call sites, legacy privileges/routine review, broader
API/export authorization, authenticated HTTP/PostgREST and two-database E2E/no-email,
job publishing, source coverage, operator/privacy lifecycle and normal build/CI/pilot
acceptance remain pending. No email, provider call, real account/job, persistent database
change, new Worker, commit, push or deployment occurred.


## 43. Authenticated assessment record readers

The remaining-browser-access work continues with eight anonymous SDK read call sites
removed from [assessmentService](./skillpassport/src/features/assessment/api/assessmentService.js).
History, attempt-with-results, responses, latest completed results (including adaptive
results), and the production eligibility date now use the authenticated
[assessment records API](./skillpassport/functions/api/assessment-records.ts) on the
existing SkillPassport Pages deployment.

### 43.1 Ownership and compatibility

- The normal SSO authentication wrapper gates the route. The server resolves a learner
  only by `learners.user_id = verified subject`; a coincident learner-record ID is not
  an ownership fallback. A supplied learner/user reference can only narrow this scope.
- Attempt detail and responses require an owned parent attempt. Missing and foreign
  attempts both return 404 before child reads. Result detail checks both the parent
  attempt ID and child learner ID. Latest adaptive results check both session and learner.
- Unknown/repeated parameters, invalid IDs and unsupported cursor combinations fail
  before database access. Success, absence, validation and handler-error responses use
  `Cache-Control: no-store`; database internals are not returned in errors.
- History and responses use 200-row keyset pages with an explicit continuation. The
  [frontend transport](./skillpassport/src/features/assessment/api/assessmentRecords.ts)
  collects pages, rejects repeating/malformed continuations, and throws after its bounded
  100-page budget rather than silently truncating. History keeps newest-first display
  ordering; attempt detail retains the `results` array shape.
- Authorization/database errors propagate rather than falling back to anonymous reads.
  The existing development eligibility bypass is unchanged; the production date check
  is a UI hint, not a new server-side assessment-admission rule.
- The responses endpoint retains the legacy question relation shape. Assessment answer
  integrity/question-content policy is not established by this ownership migration.

### 43.2 Local validation and limits

112 focused tests pass across the new mixed-owner record-reader tests, authenticated
transport and legacy-export wiring tests, and existing owner-context/lifecycle, roster,
private-reader and candidate-projection tests. The database query fixture actually
filters mixed-owner rows; it also tests foreign parent IDs, mismatched child ownership,
linked adaptive ownership, pagination and database failures. The authentication wrapper
is mocked in these endpoint tests; actual signed-token HTTP/PostgREST and two-database
acceptance remain required. These are not live-provider or production tests.

Pages Functions compile successfully with the installed Wrangler toolchain. Functions
repository typing remains failing with existing diagnostics and no diagnostics naming
the new endpoint, transport or tests. Full frontend typing also remains failing; the final comparison found no new diagnostic
messages relative to the prior owner-lifecycle check and no diagnostics naming the new
files. Focused passing tests and a Pages compile are not a clean repository-wide CI.

The browser AST inventory now reports **30 imported anonymous SDK call sites**, down
from 38, and zero scoped protected-relation references. The separately labelled 38
unresolved/legacy call sites were not converted into confirmed access findings. Static
counts do not establish deployed grant closure. The remaining browser reads/writes,
legacy permissions/routines, broader API/export authorization, two-database E2E/no-email,
job publishing, source coverage, operational/privacy lifecycle and release/pilot gates
remain open. Eight application and four SSO feature migrations remain local/unapplied.
All integration flags stay false and candidate capability readiness stays false; B1
remains explicitly deferred. No persistent grants/migrations, real accounts/jobs, mail,
provider actions, new Worker deployments, commit or push were performed in this step.


## 44. Alternate-reader audit and false-positive review

**Date:** 31 October 2026. This is an audit, not a correction or acceptance milestone.
It checked the recent assessment reader migration, alternate frontend exports and
server readers, source identity contracts, current disabled configuration and the
outstanding plan gates. Synthetic probes exercised the actual handlers/helper with
mocked authentication and database/transport dependencies. No real user rows, live
provider, persistent database, account/job or email was accessed or changed.

### 44.1 Reproduced findings — still open

| ID / priority | Evidence and consequence | Required correction |
| --- | --- | --- |
| H1 — high, alternate server authorization bypass | [Learner-profile actions](./skillpassport/functions/api/learner-profile/actions.ts) authenticates the caller but `fetch-personal-assessment-results` directly selects raw results using the supplied `learnerId`, without ownership, live organization authorization or private-import filtering. `fetch-learners-rich` and `fetch-learners-admin` likewise read raw learner rows; omitting organization filters permits a broad query. Synthetic ordinary-learner-context calls returned HTTP 200 with another learner's result and a private fixture email. The configured global middleware adds CORS/auth routing, not an object-level authorization check for these actions. The new assessment-records endpoint rejected the same foreign reference with 403. | Introduce verified actor/action/target authorization across the legacy action surface, with live scoped owner/admin permissions and one private-profile visibility contract. Cover broad lists, by-ID/alias reads, joined/copied fields, counts, exports and mutations; do not fix only the frontend caller or assume authentication is authorization. Preserve legitimate owner and institution-admin workflows with separately verified scope. Test ordinary learner, cross-organization/stale admin, private/public target and alternate action paths before any import. |
| H2 — medium, the active exported latest-result path was not migrated | The public [assessment barrel](./skillpassport/src/features/assessment/index.ts) exports `getLatestResult` from [assessmentApiService](./skillpassport/src/features/assessment/api/assessmentApiService.ts), not the recently migrated `assessmentService.js`. Its helper still calls H1's legacy action, returns the first row regardless of completion, does not resolve user-ID aliases, and catches errors as null. Synthetic calls through this actual helper returned a foreign result, returned null for its user-ID alias while finding the learner-record ID, and returned a newer pending row ahead of an older completed row. [Assessment recommendations](./skillpassport/src/features/assessment/model/useAssessmentRecommendations.ts), the report drawer and academic admission pages consume this export. | Reconcile both service contracts and their real callers. Resolve aliases on the server, filter completed results before ordering, preserve authorization/storage errors rather than treating all failures as absence, and use explicit scoped admin access for legitimate other-learner reports. Do not redirect every admin caller to an owner-only endpoint. H1 is the underlying authorization defect; the helper's foreign read is not a second independent security incident. |

H1 is an existing API boundary exposed by the audit, not a defect introduced by the
new records endpoint. Its privacy impact becomes especially relevant when imported
learners occupy shared tables. The probes establish local handler behavior; they do
not establish an incident or exploit against a deployed database.

### 44.2 Conditional ownership gap — do not overstate reachability

The legacy [assessment result handler](./skillpassport/functions/api/assessment/handlers/result.ts)
and in-progress reader resolve a learner using `user_id = subject OR id = subject`.
A consistent synthetic fixture where a foreign learner-record UUID equals the caller's
subject returned that foreign learner's report through the result handler. This proves
the fallback is weaker than `user_id = verified subject`; it does **not** prove such a
collision exists in real data or that a caller can create it. Record it as a conditional
actor-binding hardening requirement, not a confirmed production cross-account exploit.
The new assessment-records endpoint already rejects the equivalent ownership fallback.

### 44.3 False positives excluded and verification limits

- Eight disposable probe assertions passed, including the final consistent-key rerun.
  Several assert the unsafe current 200 behavior; passing those assertions confirms
  findings, not a repaired privacy boundary. The two permanent new-reader suites also
  passed (40 tests); the initial combined run had 48 tests. The repeated eight-probe
  run is not eight additional distinct tests. The disposable probe source was removed.
- The refreshed static inventory remains zero scoped protected references, **30 imported
  anonymous SDK calls** and **38 unresolved/legacy calls**. These are call-site counts,
  not 68 confirmed leaks. The static frontend check cannot detect H1's privileged API
  reads and is not a comprehensive security scanner.
- Section 43 accurately describes the migrated legacy module's exports. It does not
  establish that every exported frontend assessment path now uses that implementation.
- A pending row hiding a completed result and missing user-ID alias resolution are
  reproduced helper contract gaps; they are not evidence of a new database schema defect.
- Plain routine grants, retained unrelated mail bindings, named service entrypoints,
  and disabled integration flags are not themselves privacy incidents, sent email,
  new Worker deployments or completed rollout. The `auth.uid()` mention in a SQL comment
  is not an executed RLS dependency.
- All integration execution/delivery flags remain false; no new standalone Worker or
  new Zoho RLS enablement/policy was found in the inspected configuration/migrations.
  B1 environment isolation remains explicitly deferred and is not reopened.

### 44.4 Plan completion remains gated

H1 authorization closure is the next privacy priority, alongside the remaining browser
writes/resume paths and legacy grant/routine cleanup. The already tracked matching and
review diffs, approved job writer, full source inventory/backfill/delta/delete coverage,
operator recovery/quotas/credential controls, retention/erasure/suppression, real signed
HTTP/PostgREST and two-database E2E/race/no-email acceptance, normal typing/build/CI and
approved pilot/deployment gates remain incomplete. Those are known unfinished scope,
not additional newly reproduced bugs. Eight application and four SSO feature migrations
remain local/unapplied. This audit does not certify every unaudited reader or provider
side effect and does not enable any integration capability.


## 45. Alternate-reader authorization and helper corrections

The section 44 H1/H2 findings and conditional actor-binding fallback are corrected
locally. This is a code/test milestone, not production or whole-integration acceptance.

### 45.1 Shared legacy action authorization

The [legacy dispatcher](./skillpassport/functions/api/learner-profile/actions.ts) now
runs every action through a [server authorization gate](./skillpassport/functions/lib/learner-profile-access.ts)
before executing the action's data reads/writes. Unknown capabilities are denied.

- Ownership derives only from the verified SSO subject bound to `learners.user_id`.
  Learner/user reference aliases narrow that binding; mixed user, learner, email and
  organization references cannot choose different targets for one operation.
- Other-learner target reads and broad lists require an academic administrator role,
  an active mirrored organization membership with owner/admin authority, and the
  active academic organization context. Caller-supplied organization filters cannot
  broaden it. Generic/stale roles alone are insufficient.
- Non-owner profiles use the private-import filtered reader. Lists/counts append SQL
  organization scope before ordering, offsets and limits, including `useSimple` and
  missing-filter requests. Missing filtered views/storage fail closed, with no raw
  fallback. Own private profiles retain owner-only raw access. Classmate reads use the
  filtered source after resolving the authorized learner's class.
- The verified target supplies canonical aliases for assessment/overview reads.
  Target user settings are owner-only. Training batches validate every selected parent;
  staff/academic metadata, class references and enrollment operations have explicit
  capability checks instead of falling through an authenticated-only dispatcher.
- Profile updates allow explicit fields and cannot replace identity, tenant linkage,
  arbitrary metadata or account-deletion state. Structural academic/admission updates
  require live academic admin scope; classes/program departments/sections are checked
  against it. Manual enrollment requires an existing active member identity, canonical
  identity email and matching organization, and refuses a private-import marker.
- Message writes check actual conversation participants or live scoped academic admin
  access, bind sender identity/type from server context and validate recipients. New
  conversations cannot fabricate recruiter/educator capabilities through this route.
- Every dispatcher response uses `Cache-Control: no-store`.

These are explicit capability boundaries: generic educator roles do not receive broad
full-profile/admin-list authority through this legacy endpoint. The existing separate
assignment/current-year-scoped roster API remains the educator roster capability.
Recruitment and educator conversation initiation use their dedicated messaging APIs;
this endpoint denies unsupported initiation capabilities instead of guessing permission.
This change does not certify those separate APIs or create a new permission delegation.

### 45.2 Actual exported assessment path and ownership fallback

The public [assessment helper](./skillpassport/src/features/assessment/api/assessmentApiService.ts)
now requests completed-only results from the authorized action. The server resolves
both user/learner aliases, filters status before ordering, uses a stable ID tie-breaker
and bounds the latest-result request to one row. A newer pending row cannot hide the
completed result. Empty successful results return null; authorization, storage and
malformed-envelope failures propagate to the caller. Scoped academic admin report reads
remain supported rather than being redirected to an owner-only endpoint.

The analyze, start, regenerate, result and in-progress handlers all remove the
`learners.id = subject` ownership fallback. They resolve only by `user_id = subject`.
The result reader additionally checks result-row learner ownership as well as parent
attempt ownership. This closes the synthetic collision case without claiming that a
real collision or deployed exploit previously existed.

### 45.3 Verification, release order and remaining scope

Permanent [server regressions](./skillpassport/functions/__tests__/learner-profile-authorization.test.ts)
exercise mixed-owner/private fixtures and evaluate actual query predicates; separate
[frontend export tests](./skillpassport/src/features/assessment/api/__tests__/assessmentApiService.latest.test.ts)
verify authenticated requests, completed-only behavior, absence and error propagation.
They are separated by compiler environment; no frontend module is imported into the
Functions test compilation merely to prove a helper contract. Authentication and database
transport remain mocked, so real signed HTTP/PostgREST acceptance is still required.

The final focused suite comprises 212 tests across the prior ownership/privacy/projection
coverage and these corrections. Local Pages Functions compile successfully. Full frontend
and Functions typing remain failing repository gates. The final logs contain 8,846
frontend lines and 6,783 Functions lines, with no diagnostics naming the new gate,
dispatcher or regression files. Comparison against the prior baseline found no new
substantive diagnostics: one apparent Functions difference only reordered the same
quoted union members in an existing analyze-assessment error. Passing runtime tests
do not establish clean repository-wide typing or CI. No database schema was changed in this step. The existing
filtered-view/private-state migrations must be installed before deploying these API
readers; an absent view/marker table deliberately fails closed.

The scoped browser inventory remains 30 imported anonymous SDK calls and 38 unresolved
legacy calls, not confirmed leak counts. Remaining browser read/write/resume migration,
legacy database grants/routines, other API/export authorization, reviewed candidate
diffs, approved job publishing, source coverage, operational/privacy lifecycle,
two-database E2E/race/no-email evidence and normal CI/pilot/rollout remain open.
Eight application and four SSO feature migrations remain local/unapplied. Integration
flags/readiness remain false, B1 stays explicitly deferred, and no real account/job,
mail, provider action, persistent migration, new Worker deployment, commit or push was
performed. Section 44 remains the historical audit evidence, not the current fix status.


## 46. Atomic owner progress and read-only assessment resume

The remaining browser-access migration now removes nine more anonymous call sites
from [assessmentService](./skillpassport/src/features/assessment/api/assessmentService.js).
Progress, response-map saves and abandonment use an authenticated writer; resume uses
an owner-scoped read. All integration flags/readiness remain off.

### 46.1 Atomic mutation authority without RLS

The additive [owner-progress migration](./skillpassport/supabase/migrations/20270205000000_assessment_owner_progress.sql)
adds `patch_owned_assessment_progress`, executable only by the service role. It uses
SECURITY INVOKER and explicit grants, not Supabase Auth, `auth.uid()` or RLS.
The API derives its owner argument exclusively from the verified SSO subject.

The transaction locks the learner's user binding and owned attempt, then merges answer
and timing objects inside that lock. Concurrent non-overlapping saves through this
transaction preserve both sets of keys; same-key conflicts remain last-commit-wins.
This is not a global guarantee for the direct legacy writers that still remain.
Omitted fields retain their stored values. Response-map saves merge rather than erase
unmentioned answers; an empty object is not an answer-reset operation.

Only explicit progress fields are accepted. Client-supplied identity, completion status,
computed scores or other columns cannot be written through this capability. Completed
or abandoned attempts reject subsequent progress saves; abandonment cannot change a
completed attempt, and an already-abandoned retry returns its unchanged record.
Linked adaptive sessions must belong to the same learner, and a completed existing
link cannot be replaced. Invalid stored map shapes fail closed instead of being silently
replaced. Numeric/timing bounds also protect the real generated total-time column.

The shared [request handler](./skillpassport/functions/lib/assessment-progress.ts)
validates/bounds JSON input, refuses actor overrides, maps storage failures to safe
errors and checks the returned attempt ID before acknowledging success. The new
[Pages endpoint](./skillpassport/functions/api/assessment-progress.ts) and legacy
update-progress/abandon handlers use that same transaction. Missing migration/RPC
returns unavailable, never an anonymous/direct-write fallback. Handler responses are
no-store; no account/job creation, notification or mail capability is invoked here.

### 46.2 Resume is a read, not implicit state repair

The [records endpoint](./skillpassport/functions/api/assessment-records.ts) adds an
owner-only in-progress lookup with a deterministic latest-row tie-breaker and separately
owned adaptive-session context. Valid nullable college stream IDs remain readable.
It never abandons an empty attempt or reopens an abandoned record during a lookup.

The legacy check-in-progress endpoint is also read-only: its recent-abandoned-record
revival branch is removed, adaptive context checks learner ownership, and storage errors
remain failures rather than being returned as an empty successful resume. Absence and
errors are no-store. Historical abandoned progress remains stored; any intentional
repair/reopening requires a separate explicit workflow rather than a GET side effect.
The browser helper preserves the raw attempt shape used by its existing callers and
propagates denied/conflicting/unavailable saves. This does not claim cancellation of
already-dispatched actions or completed migration of every assessment writer.

### 46.3 Verification and deployment prerequisites

- 256 focused tests pass across 12 files, including prior privacy/owner/projection
  coverage and new request, resume, legacy-route and frontend transport regressions.
- The [disposable SQL suite](./skillpassport/scripts/checks/test-assessment-progress-sql.mjs), available
  as `npm run test:assessment:progress:sql`, passes real ownership/grant/validation,
  terminal-state, idempotent abandonment and adaptive-link checks. Two independent
  PostgreSQL sessions preserve both answer/timing updates under overlapping transactions.
- The SQL fixture loads the actual baseline attempt definition and its generated timing
  column, real completion-result/restriction triggers, and minimal owner/session tables
  with the relevant FKs. RLS stays disabled. It is not a full production-schema or
  deployed webhook/email test; completion is never requested by this writer.
- Pages Functions compile, and migration rules validate all 171 SQL filenames/history.
  Full frontend and Functions typing remain separate failing repository gates; passing
  focused tests and SQL do not establish clean full CI or real signed HTTP acceptance.
- Static inventory now reports **21 imported anonymous SDK calls**, down from 30, plus
  the unchanged 38 separately labelled unresolved/legacy calls. These are not leak counts.

The new assessment migration must be installed before deploying either migrated progress
handler; there is no unsafe fallback if it is missing. **Nine application feature
migrations (eight Zoho plus this assessment migration) and four SSO feature migrations
remain local/unapplied.** No persistent schema/user/job/provider change or email occurred.

The remaining direct browser creation/response/result/scoring/submission calls, legacy
grants/routines and broader API/export coverage still require completion. Reviewed
candidate diffs, approved job publishing, complete source/backfill/delta/delete coverage,
operator/privacy lifecycle, two-database E2E/race/no-email evidence, full typing/build/CI
and pilot/rollout gates remain open. B1 environment isolation stays explicitly deferred;
no new Worker, RLS dependency, commit, push or deployment was introduced.

## 47. Progress and alternate-writer audit — three open findings

Section 48 supersedes the open finding status below; this section preserves the
original audit evidence.

This audit checks section 46 against its browser callers and an alternate adaptive
writer. It does not certify the entire integration or change its release status.
The findings below are reproduced locally, remain unfixed, and supplement the known
incomplete scope listed in section 46.

### 47.1 Confirmed findings

1. **An acknowledgement can discard answers queued during an in-flight save.**
   [useAnswerSync](./skillpassport/src/features/assessment/hooks/useAnswerSync.ts)
   snapshots the pending map before awaiting the API, then clears the entire live
   map after success. A deferred-response hook probe queued `q1`, started its save,
   queued `q2`, then acknowledged `q1`: after another ten seconds only the first
   request had been sent and the pending queue was empty. The
   [active assessment page](./skillpassport/src/features/assessment/ui/AssessmentTestPage.tsx)
   uses this hook and permits online navigation while saves run. This predates the
   new SQL writer; its row lock cannot preserve an answer the client never sends.
   The second answer remains in the local store, so this is a resume/sync reliability
   defect, not evidence of permanent loss or a failure of every final submission.
   Fix by acknowledging only the sent key/value versions, retaining newer values
   and other keys, and scheduling a follow-up batch; add a permanent delayed-response
   regression for both another question and a changed answer to the same question.

2. **Existing optional-null progress contracts now receive HTTP 400.** The
   [shared handler](./skillpassport/functions/lib/assessment-progress.ts) rejects
   `elapsedTime: null` and `allResponses: null`. The
   [legacy hook](./skillpassport/src/features/assessment/model/useAssessment.ts)
   defaults both to null and forwards them through the migrated transport; the
   [typed API contract](./skillpassport/src/features/assessment/api/assessmentApiService.ts)
   also still permits nullable elapsed time. Three handler probes reproduced the
   rejection before any RPC call. Normalize legacy null-as-omitted fields at the
   compatibility boundary, preserving intentional timer resets and strict map
   validation, and cover the full caller-to-handler contract. No active page
   invocation of the legacy hook was established: this is a confirmed compatibility
   regression with bounded reach, not a claim that all current autosaves fail.
   The active answer-sync request omits these null fields.

3. **An alternate link endpoint exposes foreign link metadata before ownership.**
   [link-to-attempt](./skillpassport/functions/api/adaptive-session/link-to-attempt.ts)
   reads the supplied attempt and returns `existingSessionId` immediately if its
   existing adaptive session is completed. Attempt/session ownership checks occur
   later and are skipped on that branch. An authenticated-handler probe returned
   HTTP 200 with a synthetic foreign session ID after only the learner, attempt-link
   and session-status reads. This is a metadata authorization defect, not a reproduced
   foreign write or disclosure of answers/contact data. The
   [adaptive client](./skillpassport/src/features/assessment/api/adaptiveAptitudeApiService.ts)
   still exposes this route. Scope all reads before branching and move linking
   through the same guarded transaction, preserving the intended completed-link
   behavior and testing foreign, terminal-state and concurrent-link requests.

### 47.2 Evidence and false-positive dispositions

- **35 checks passed across four files:** the existing 30 progress-handler tests,
  three temporary null-contract probes, one deferred-response hook probe and one
  alternate-link probe. The five probes assert the current unsafe behavior to verify
  the findings; passing them does not mean the defects are fixed. Temporary probes
  were removed after the run. The earlier 256-test and disposable SQL results remain
  historical evidence and were not rerun by this audit.
- Hook/handler probes use synthetic data and mocked transport/storage. They establish
  control flow, not a deployed exploit, a live record collision, or complete signed
  HTTP/PostgREST acceptance. No live user or provider data was accessed.
- Non-overlapping map merges through the new SQL transaction remain covered by the
  prior two-session SQL evidence. Same-key last-commit-wins and alternate direct
  writers were already disclosed limitations; neither proves that transaction is
  broken. The client queue finding is a separate, reproduced omission.
- The 21 imported anonymous SDK call sites and 38 separately classified legacy calls
  are inventories, not confirmed leak counts. Read-only resume intentionally leaves
  abandoned attempts untouched; this is not evidence that their history was erased.
- Inspected sp-dash, SSO and SkillPassport integration enable flags remain false.
  No-RLS authorization, no new Worker, explicit approval and zero email remain
  requirements; this audit did not exercise provider/webhook/mail side effects and
  therefore does not establish end-to-end no-email acceptance.

### 47.3 Remaining implementation and release work

Fix and permanently test the three findings above before treating the current
assessment migration as accepted. The broader previously recorded work remains:
remaining browser writers/grants and wider API authorization, reviewed candidate
matching/diffs, approved job publishing, complete source/backfill/delta/delete
coverage, operator/privacy lifecycle, two-database E2E/race/no-email acceptance,
full typing/build/CI and pilot/rollout. Nine application feature migrations and four
SSO feature migrations remain local/unapplied. B1 environment isolation stays
explicitly deferred. This audit made documentation changes only after removing its
temporary probes; it did not apply persistent migrations, create accounts/jobs, send
email, deploy, commit or push.

## 48. Local corrections for all three section 47 findings

Section 47 remains the historical audit. Its three confirmed defects are now corrected
locally, with permanent regressions and the acceptance limits below. This does not
complete the wider integration or authorize enabling imports/publication.

### 48.1 Versioned answer acknowledgements and follow-up batches

[The active answer-sync hook](./skillpassport/src/features/assessment/hooks/useAnswerSync.ts)
assigns a token to each queued answer version. Successful saves remove only entries
whose token matches the sent batch; answers added or changed during the request stay
pending and are sent in a follow-up batch. Retries snapshot the current queue. Next-step
readiness is set only after the queue drains. A change back to the original answer
still has a newer token and is not cleared by the original acknowledgement.

Attempt changes invalidate older callbacks and reset the queue/timing state; late
completions cannot clear a newer attempt's queue or release its sync lock. Pending
debounce timers are cancelled on cleanup. This cannot cancel an already-dispatched
request and does not claim cancellation at final submission, cross-tab ordering,
or reliable asynchronous delivery during browser shutdown. Answers remain in the
in-memory store; automatic localStorage persistence is not implemented by this store.
Section 53 corrects the earlier durability wording. Two existing typing errors in the edited hook
were also corrected: nullable section names and the logger's metadata argument.

[Permanent hook tests](./skillpassport/src/features/assessment/hooks/useAnswerSync.test.tsx)
exercise a second question arriving in flight, same-question replacement/change-back,
retry contents, old/new attempt overlap, and unmount-before-debounce cleanup.

### 48.2 Null-as-omitted compatibility without weaker storage validation

[The shared request handler](./skillpassport/functions/lib/assessment-progress.ts)
normalizes only the legacy optional `elapsedTime: null` and `allResponses: null`
values to omitted fields. It preserves explicit timer resets, accepts zero/empty maps,
and still rejects malformed maps, nullable `answers`/`sectionTimings`, actor overrides
and unsupported fields. The SQL transaction keeps its strict validated input contract;
it does not gain nullable response maps or an answer-reset operation.

[Caller-to-handler regressions](./skillpassport/src/features/assessment/api/__tests__/assessmentService.progress.test.ts)
pass the existing default-null payload through the real legacy service, authenticated
transport and shared handler with mocked storage, and verify the exact normalized
RPC patch. [Handler tests](./skillpassport/functions/__tests__/assessment-progress.test.ts)
also cover null maps alongside the answer alias and malformed-input rejection.

### 48.3 Alternate adaptive links use the same transaction

[The existing adaptive-link route](./skillpassport/functions/api/adaptive-session/link-to-attempt.ts)
now adapts only `{attemptId, sessionId}` into the guarded progress transaction, using
the verified subject. It no longer performs direct attempt/session reads or writes,
and cannot return completed-link metadata before authorization. Missing/foreign
attempts return the same absence response; foreign sessions are denied. All handler
responses are no-store and storage errors are sanitized.

The transaction retains its owner/attempt/session locks and terminal-state rules.
An owned in-progress attempt can retry the same completed-session link successfully;
replacing that completed link returns HTTP 409 instead of the old misleading skipped
success. Completed/abandoned attempts also reject linking. The existing frontend
link helper consumes only request success/failure, so no skipped-response dependency
is retained. There is no raw-write fallback when the RPC is unavailable.

[Route tests](./skillpassport/functions/__tests__/assessment-link.test.ts) cover the
owner-derived RPC, foreign/missing absence, denial/conflict/unavailability, malformed
inputs/overrides and receipt validation. The
[disposable SQL suite](./skillpassport/scripts/checks/test-assessment-progress-sql.mjs)
now additionally covers a foreign attempt already linked to a completed session,
same-link retries, explicit terminal-attempt links and competing completed-session
links. In the race, exactly one link commits and the other observes the immutable
completed link and fails. Concurrent tests now execute as `service_role`; RLS remains
disabled. This is scoped fixture evidence, not a whole-production-schema test.

### 48.4 Verification and remaining gates

- **284 tests pass across 15 files** in the combined assessment/authorization/
  privacy/projection suite. The expanded disposable SQL suite passes, including
  service-role concurrent map merges and competing completed-session links.
  Pages Functions compile locally, and whitespace/document-link checks pass.
  The local AST graph was refreshed after the final code changes (21,951 nodes,
  40,168 edges); HTML visualization was skipped by its existing size limit.
- Full repository frontend and Functions typing remain failing release gates;
  passing focused checks does not establish clean CI, signed HTTP acceptance,
  provider behavior or end-to-end no-email delivery guarantees.
  Final frontend and Functions diagnostic logs contain 8,838 and 6,773 lines
  respectively, with no diagnostics naming the changed hook, shared handler,
  adaptive-link route or new regression files.
- No migration definition or schema grant was changed by these corrections.
  The existing owner-progress migration must precede deployment of the migrated
  adaptive-link endpoint as well as progress/abandon handlers. Nine application
  feature migrations and four SSO feature migrations remain local/unapplied.
- Existing integration enable/readiness flags remain off. No account/job, provider
  action, email, persistent migration, new Worker, RLS dependency, commit, push or
  deployment was introduced by these corrections. B1 remains explicitly deferred.

The remaining browser writers/grants and wider API authorization, reviewed candidate
matching/diffs, approved job publishing, full source/backfill/delta/delete coverage,
operator/privacy lifecycle, integrated two-database E2E/race/no-email evidence,
full typing/build/CI and pilot/rollout work remain open. The section 47 findings
are no longer listed as unfixed implementation items; broader acceptance remains.

## 49. Authenticated atomic individual-response saves

The next browser-access migration removes the direct response upsert in
[the legacy assessment service](./skillpassport/src/features/assessment/api/assessmentService.js).
Both that service and the existing modern assessment API now use the authenticated
save-response handler, backed by one owner-locked transaction. No new Worker or RLS
dependency is introduced, and integration enable/readiness flags remain off.

### 49.1 Transaction and input authority

The additive [owner-response migration](./skillpassport/supabase/migrations/20270206000000_assessment_owner_response.sql)
adds `save_owned_assessment_response`, executable only by `service_role`. It takes the
verified SSO subject, locks its learner binding, locks the owned attempt, and requires
`in_progress` before upserting on the existing `(attempt_id, question_id)` unique key.
Foreign/missing attempts return the same absence result. Concurrent saves to the same
question update one row; they remain last-commit-wins rather than a client-version
ordering guarantee. The lock order matches progress/link/abandon operations.

Only the raw answer, question key and server timestamp are stored. Client-supplied
correctness is never accepted; each raw save stores `is_correct = null`, invalidating
any previous correctness value until trusted grading occurs. The old positional
correctness argument remains accepted by the legacy helper for caller compatibility,
but is not sent to the API. This step does not establish authoritative scoring,
question assignment/provenance, or the safety of remaining scoring/submission writers.
UUID question keys remain required by the actual response table, including generated
question UUIDs. String-keyed questionnaire maps continue through the progress API.

Raw answers may be JSON scalars, arrays or objects. False/zero/empty string/empty
array remain valid. The legacy helper preserves its existing null/undefined-to-empty-
string conversion; direct API null/missing answers are rejected. Input byte limits,
UUID validation and an explicit field allowlist reject malformed input and actor,
correctness or other metadata overrides. Neither scalar answers nor nested answer
content are treated as certified scores or evaluated achievements.

### 49.2 API and caller behavior

[The existing handler](./skillpassport/functions/api/assessment/handlers/save-response.ts)
now delegates directly to the transaction instead of separately reading ownership,
counting rows and choosing insert/update. Ownership remains held through the write;
there is no count-then-insert race. It returns sanitized no-store errors, preserves
storage unavailability as failure, and rejects receipt mismatches before success.
Completed/abandoned attempts return conflict, including late answer saves.

[The browser transport](./skillpassport/src/features/assessment/api/assessmentRecords.ts)
uses authenticated API access and verifies the returned attempt/question/row receipt.
The legacy `saveResponse` still returns the saved response row and propagates failures;
it no longer logs answer contents, calls the anonymous SDK or writes client correctness.
Modern `assessmentApiService.saveResponse` keeps its existing success/error contract.
The new migration must be installed before deploying the migrated handler; a missing
RPC returns unavailable, with no direct-write fallback.

### 49.3 Local evidence and remaining work

- **317 tests pass across 16 files**, including 25 response-handler cases and eight
  additional legacy caller-to-handler success/failure cases. They cover owner-only
  RPC arguments, valid empty/scalar answers, forbidden metadata, malformed requests,
  input bounds, missing/foreign/terminal/unavailable outcomes, normalized legacy
  answers, correctness suppression and receipt validation.
- The [disposable SQL suite](./skillpassport/scripts/checks/test-assessment-progress-sql.mjs)
  loads the actual baseline response table with its PK, unique key and parent FK,
  plus both real owner progress/response migrations. It verifies service-only execute
  grants, ownership binding, terminal-state rejection, stable-row upserts, nullable
  correctness, input bounds and real independent-session response races with RLS off.
  In the response/abandonment race, the save either commits before abandonment or
  fails after it; subsequent saves are rejected. Existing merge/link races still pass.
  This remains a scoped fixture, not full production-schema/webhook/no-email evidence.
- Pages Functions compile locally. Database validation passes all **172 SQL
  filenames/history**. Static inventory reports **20 imported anonymous SDK calls**,
  down from 21, with zero scoped protected literal references and the separately
  classified 38 unresolved/legacy calls unchanged. These are not leak counts.
- Full frontend and Functions typing remain failing repository gates. Focused tests,
  SQL and compilation do not establish clean full CI or real signed HTTP acceptance.
  The final typing logs contain 8,838 frontend and 6,769 Functions lines, with no
  diagnostics naming the edited response handler/transport or its regression tests.

**Ten application feature migrations (eight Zoho plus two assessment) and four SSO
feature migrations remain local/unapplied.** No persistent schema/data migration,
account/job/provider action, email, deployment, commit or push occurred here. B1
environment isolation remains explicitly deferred.

Remaining work includes browser creation/result/scoring/submission writers and legacy
grants/routines, broader API/export authorization and question/grading authority,
reviewed candidate matching/diffs, approved job publishing, source/backfill/delta/
delete coverage, operator/privacy lifecycle, two-database E2E/race/no-email evidence,
full typing/build/CI and pilot/rollout. This increment does not complete provisioning,
job publication or the entire implementation.

## 50. Raw-response and finalization audit — four confirmed findings

Section 51 supersedes the open statuses below; this section retains the original audit evidence.

This follow-up checks section 49's raw-response boundary, its callers, and the still
unmigrated results/submission APIs. It reproduces one bounded receipt compatibility
defect in the new path and three concrete defects inside the already-disclosed
unfinished finalization scope. It does not retract the verified SQL ownership,
terminal-state and concurrency guarantees of the new response transaction.

### 50.1 High priority: alternate results writer has no ownership boundary

[save-results](./skillpassport/functions/api/assessment/handlers/save-results.ts)
uses service credentials to upsert `personal_assessment_results` with the request's
`attemptId`, `learnerId` and report, then marks that request's attempt completed.
The verified subject is logged but never bound to those records. A synthetic
authenticated-handler probe submitted a foreign attempt/learner pair and recorded
the foreign result upsert and attempt update with HTTP 200, with no learner-owner
lookup. The route is exposed through the existing authenticated assessment router
and the public `completeAttempt` API helper; authentication alone does not supply
record ownership.

This is a confirmed missing authorization check and privileged write path. It is
not evidence that any deployed user's records were changed: the probe mocked storage
and used synthetic IDs. Real target rows/keys must satisfy the schema constraints;
the finding does not claim that arbitrary nonexistent foreign IDs can be inserted.
Bind ownership and canonical learner/stream/grade data before any access, independently
check adaptive-session ownership, and execute authorized finalization atomically.
Client reports must not become trusted achievements or scores solely by being supplied
to this endpoint. Prior raw-response privacy improvements do not protect this route.

### 50.2 Terminal submission can overwrite an attempt

[submit](./skillpassport/functions/api/assessment/handlers/submit.ts) checks learner
ownership but neither reads nor conditions its update on the attempt's current
status. Two handler probes for owned `abandoned` and `completed` attempts both
returned HTTP 200 and wrote completed status, a fresh completion timestamp and
merged client answers. Thus an abandoned attempt can be finalized, and completed
answers can be changed through this remaining path. This predates section 49 and
is a concrete defect within the known unfinished submission migration, not a new
foreign-write vulnerability in `save_owned_assessment_response`.

Move submission behind the same parent-lock/status authority as progress and raw
responses. Define completed retries explicitly and reject answer-changing retries;
an idempotent retry must not silently replace completed inputs. Concurrent progress/
response/finalization and terminal-state HTTP regressions remain required.

### 50.3 Results endpoint acknowledges partial finalization

The results writer upserts its result before a separate attempt update. When that
update fails, it logs the failure and still returns `success: true`. A fault-injection
probe made the result upsert succeed and the attempt update fail; HTTP 200 and success
were still returned. This establishes a handler partial-success contract defect,
not a demonstrated production outage. Use one transaction and acknowledge only a
consistent committed result/attempt transition. A client must not treat this response
as proof that the parent attempt was finalized.

### 50.4 Bounded new-path compatibility defect: uppercase UUID receipts

[The response handler](./skillpassport/functions/api/assessment/handlers/save-response.ts)
accepts UUIDs case-insensitively but compares returned attempt/question IDs as exact
strings. A local PostgreSQL literal query confirmed that uppercase hexadecimal UUID
characters serialize in lowercase; a handler probe using that canonical receipt
returned HTTP 503 after its mocked RPC succeeded. An accepted request can therefore
be reported as failed after a successful write. The
[browser receipt check](./skillpassport/src/features/assessment/api/assessmentRecords.ts)
also compares literal IDs, so fixing only the handler is insufficient.

Canonicalize validated UUIDs consistently across request, RPC and receipt comparisons
and test uppercase/mixed-case IDs end to end, while still rejecting genuinely different
IDs. The progress path contains the same strict comparison pattern and should be
covered by the correction. Current database-produced IDs normally arrive lowercase;
no active UI failure from uppercase IDs was established. This is a narrow compatibility
defect, not a foreign-ownership bypass or evidence that ordinary answer saves fail.

### 50.5 Evidence and false-positive review

- **40 checks passed across three files:** 25 existing response-handler tests, ten
  existing caller-to-handler tests, and five temporary audit probes. The audit probes
  assert the current defective behavior to reproduce it; their passing does not mean
  the findings are fixed. Temporary probes were removed afterward.
- The disposable no-RLS SQL suite was rerun successfully, including ownership/grants,
  raw-response validation/upserts, terminal rejection, concurrent response upserts,
  answer/abandonment serialization, progress merges and completed-link races.
  The earlier 317-test full focused run remains historical evidence; this audit did
  not rerun all 317 or certify full repository CI.
- Missing/foreign rejection, service-only function execute rights, and parent-lock
  protection remain valid for the new raw-response transaction. The alternate
  finalization findings do not demonstrate a bypass inside that transaction.
- Null raw-row correctness is intentional ungraded input, not proof of zero aptitude
  scores. Existing score/report generation uses other inputs as well; trusted grading
  remains explicitly unfinished. No zero-score regression was reproduced here.
- Arbitrary UUID question provenance remains an already-disclosed question-assignment
  gap; validating a UUID is not proof it was assigned. String-key questionnaire maps
  remain separate from UUID response rows. Those distinctions are not new failures
  introduced by this audit.
- The 20 imported anonymous SDK calls and 38 separately classified legacy calls are
  inventories, not counts of confirmed leaks. Passing local/mocked checks does not
  prove deployed privacy, provider automation behavior or end-to-end no-email safety.

### 50.6 Current status

All four findings above remain unfixed. Prior section 48 corrections remain locally
implemented; section 49's raw-response migration remains implemented with the UUID
receipt edge case now open. The results/submission routes require concrete ownership,
state, grading authority and atomicity work before acceptance. The broader browser/
grant/API migration, reviewed candidate diffs, approved job publishing, complete source
and operational/privacy lifecycle, two-database E2E/no-email evidence, full typing/
build/CI and rollout gates remain open.

Ten application feature migrations and four SSO feature migrations remain local and
unapplied. No enable flag, RLS dependency, Worker deployment, real user/job/provider
data, email, persistent migration, commit or push was changed by this audit. B1 stays
explicitly deferred. Only documentation changes remain after removing the temporary
probe file; the audit used synthetic storage and a read-only literal UUID query.

## 51. Local finalization and UUID corrections

All four section 50 findings are now corrected locally. The new
[finalization migration](./skillpassport/supabase/migrations/20270207000000_assessment_owner_finalization.sql)
and [shared API handler](./skillpassport/functions/lib/assessment-finalization.ts)
replace the separate result upsert/parent update and terminal-unsafe submission paths.
This does not complete the broader assessment/grant migration or enable Zoho imports.

### 51.1 Ownership and atomic finalization

Both existing submit/save-results routes call a single service-only transaction using
the verified subject. It locks the learner's user binding and owned attempt before any
result or adaptive access, then locks the result. Missing/foreign attempts return the
same absence result. Learner, stream and grade are derived from the stored attempt;
optional client context claims must match. Actor overrides and unsupported fields
are rejected. No unscoped recent-session search, cross-learner logging, or direct-write
fallback remains in these handlers.

Adaptive aptitude is taken only from the attempt's existing link, with independently
owned completed session and result checks. Client session IDs cannot replace the link
through finalization. Canonical adaptive accuracy/category counts override the legacy
report's aptitude columns. The transaction retains legacy report field mappings,
including RIASEC backups, learning preferences and strengths. Client report content
outside the authoritative adaptive projection remains owner-supplied legacy report
input: trusted grading/report-generation attestation remains separate unfinished work.
Ownership authorization is not proof that an AI report or self-supplied score is valid.

The result write, attempt transition and actual baseline completion-result/restriction
triggers commit or roll back together. No successful response is issued for a failed
parent update. API responses are no-store, storage errors are sanitized, receipts are
checked, and unavailable RPCs remain failures.

### 51.2 Terminal states and compatible retries

- Abandoned attempts reject both submission and report finalization.
- Initial submission merges answers under the parent lock, creates a canonical pending-
  analysis report placeholder, and completes the attempt once. Completed submission
  retries succeed only when each supplied answer exactly matches the stored value;
  they do not rewrite answers, timestamps or the restriction window.
- A completed attempt's empty report placeholder can be filled once by its owner,
  preserving the existing submit-then-report workflow. A nonempty report is immutable
  through this capability: identical report retries return its receipt, while changed
  reports conflict. Explicit regeneration uses its separate workflow and remains part
  of the broader writer/authority audit.
- Existing inconsistent result/attempt context fails closed; this migration does not
  silently repair historical partial finalizations. Such records need explicit repair.
- Null stream IDs remain canonical rather than being invented by the caller. The
  migration relaxes the result table's stream NOT NULL constraint to match the existing
  nullable attempt contract, while retaining the stream FK and deriving its value from
  the owned attempt. No arbitrary generic stream is substituted.

Timings merge with existing progress for an initial report-led completion, with integer
and aggregate bounds protecting the real generated total-time column. Filling an
already-completed placeholder does not rewrite completed attempt timings or answers.
These guarantees apply to this transaction; remaining legacy direct writers/grants
are not globally fenced by this change.

### 51.3 UUID normalization across both receipt boundaries

The response and progress handlers normalize validated attempt/question/session IDs
before their RPCs and receipt checks. The authenticated browser response/progress
transport normalizes IDs before sending and checking returned IDs too. Finalization
uses the same canonical lowercase UUID representation. Mixed/uppercase UUIDs therefore
match PostgreSQL receipts; genuinely different receipt IDs still fail. Owner identity
continues to come exclusively from verified authentication, not request metadata.

### 51.4 Local verification

- **352 tests pass across 17 files**, including 31 new finalization tests and four
  additional mixed-case response/progress/caller regressions. Tests cover guarded RPC
  dispatch, owner-only authority, malformed/oversized/privileged inputs, null stream
  context, sanitization, conflict/unavailability/failed-update outcomes, and receipt
  normalization/mismatch handling alongside prior privacy/projection coverage.
- The [disposable SQL suite](./skillpassport/scripts/checks/test-assessment-progress-sql.mjs)
  passes with RLS disabled and service-role concurrent sessions. It now loads the actual
  baseline result/restriction schema, relevant result-column migrations, real completion
  triggers, unique keys and relevant parent/learner/stream/adaptive FKs. Minimal owner,
  stream and adaptive tables remain scoped fixtures, not a whole production database.
- SQL checks cover foreign/context/session denial, canonical nullable streams,
  unchanging terminal retries, changed-answer/report rejection, submit-then-report
  compatibility, adaptive category projection and preserved report fields. An injected
  failure after real completion triggers proves rollback of both direct-report
  finalization and submission, including the result/placeholder write. Independent
  sessions verify submission/answer-save serialization and one-winner conflicting
  report writes; previous progress/link/abandonment/upsert races still pass.
- Pages Functions compile and all **173 SQL filename/history checks** pass. Full
  frontend and Functions typing remain separate failing repository gates; focused
  success does not establish clean full CI or deployed signed HTTP acceptance.
  Final frontend and Functions diagnostic logs contain 8,838 and 6,763 lines
  respectively, with no diagnostics naming the changed handler/transport/test files.

### 51.5 Deployment prerequisites and unfinished scope

The owner-finalization migration must precede deployment of either migrated submit or
save-results handler, including the nullable-stream constraint change. **Eleven
application feature migrations (eight Zoho and three assessment) plus four SSO feature
migrations remain local/unapplied.** Integration enable/readiness flags remain off;
no persistent migration, account/job/provider action, email, new Worker, RLS dependency,
commit, push or deployment was introduced. B1 stays explicitly deferred.

Remaining browser creation/result/scoring/submission writers and legacy grants/routines,
broader API/export and regeneration authorization, trusted question/grading/report
authority, reviewed candidate matching/diffs, approved job publishing, complete source
and operational/privacy lifecycle, integrated two-database E2E/race/no-email evidence,
full typing/build/CI and pilot/rollout remain open. The four section 50 defects are no
longer open implementation items; full integration and release acceptance remain pending.

## 52. Authenticated serialized assessment creation and start

The next remaining browser-writer migration replaces the legacy direct attempt insert
and the modern start endpoint's separate open-attempt check/insert. Both paths now use
the same service-only owner transaction. Integration enable/readiness flags remain off;
no new Worker or RLS dependency is introduced.

### 52.1 Canonical creation authority and concurrent requests

The [owner-start migration](./skillpassport/supabase/migrations/20270208000000_assessment_owner_start.sql)
adds `start_owned_assessment`. It locks the verified subject's learner binding exclusively
before checking open attempts or inserting. This serializes callers even when no attempt
exists yet. The learner FK always comes from that binding. A legacy reference can assert
only the current learner ID or SSO subject; it never selects the owner or performs a
fallback lookup of another learner. Unknown/foreign references fail closed.

For a specified stream, the transaction requires an active catalog row and takes its
registered grade as authoritative. Null streams retain the validated requested grade.
Invalid/inactive streams are rejected. The catalog row is locked through the write.
Initial answers/timings/position/timers/status are set on the server, not from arbitrary
request metadata; personal context is supplied only by the modern server's own learner
lookup. That lookup's learner ID is reasserted inside the transaction, fencing a changed
user binding between context lookup and creation.

The existing [modern start handler](./skillpassport/functions/api/assessment/handlers/start.ts)
requests reuse of a matching open attempt. Reuse returns its stored answers, timers,
position and context without resetting them. Another grade/stream conflicts; multiple
historical open attempts require review rather than choosing an arbitrary one. An
abandoned/completed attempt is never reopened by this function. No global partial
unique index is added over potentially inconsistent legacy data: serialization is
guaranteed for these migrated paths, not for all remaining direct writers/grants.

### 52.2 Explicit legacy creation and question compatibility

The existing legacy `createAttempt` helper now calls
[the authenticated creation API](./skillpassport/functions/api/assessment-attempts.ts)
through [the records transport](./skillpassport/src/features/assessment/api/assessmentRecords.ts).
This action requests a new attempt explicitly. If an open attempt already exists,
it returns conflict and requires the existing resume/abandon workflow instead of
silently reusing it and clearing local answers. The helper preserves its raw attempt
return shape and never falls back to an anonymous insert.

[The shared start handler](./skillpassport/functions/lib/assessment-start.ts) bounds
and validates input, refuses owner/status/reuse/context overrides, checks the returned
attempt shape/context and returns no-store responses with sanitized errors. Missing
RPC/migration or database failures remain unavailable rather than being reported as
absence or triggering a direct insert. Modern profile lookup failures also remain
failures, not permission to create another attempt.

Modern start loads questions using the returned canonical grade/stream and reports
whether the attempt was reused. The
[legacy assessment hook](./skillpassport/src/features/assessment/model/useAssessment.ts)
also loads questions from the stored attempt's grade/stream. The existing converter
now preserves `timer_remaining = 0` on modern resume rather than converting an expired
timer into null. Question loading can still fail after the database creation commits;
the modern retry reuses the same open attempt. This is not a transaction with remote
question generation, nor a new entitlement, retake-window or trusted-grading policy.

### 52.3 Local verification and unfinished scope

- **386 tests pass across 18 files**, including 31 start/creation cases, two additional
  authenticated legacy caller tests and a canonical-question-loading hook regression.
  Coverage includes owner-derived arguments, reference assertions, input/actor bounds,
  canonical grade, explicit create conflicts, preserved resume answers/zero timer,
  storage/question-load failures, receipt checks and previous privacy/projection tests.
- The [disposable SQL suite](./skillpassport/scripts/checks/test-assessment-progress-sql.mjs)
  passes with RLS disabled. It now loads the actual stream catalog definition and its
  grade checks. Creation tests verify execute grants, owner binding, active stream
  authority, null streams, no reopening, retained resume state and ambiguous-open-attempt
  rejection. Two independent modern starts converge on one row; two explicit new-create
  requests produce one winner and one conflict. All prior mutation/finalization races
  and trigger/rollback checks still pass.
- Pages Functions compile, and all **174 SQL filenames/history checks** pass. Static
  browser inventory reports **19 imported anonymous SDK calls**, down from 20, zero
  scoped protected literal references and 38 separately classified legacy calls. These
  counts are inventories, not leak counts or proof that all browser access is safe.
- Full frontend/Functions typing and integrated signed HTTP/no-email acceptance remain
  separate release gates. Focused regressions and disposable fixtures do not certify a
  deployed database, full production triggers, provider automation or clean whole CI.
  Final frontend and Functions diagnostic logs contain 8,838 and 6,759 lines.
  The nullable-stream declaration was corrected; the new creation handler, transport
  and tests have no diagnostics. The edited legacy assessment hook retains the same
  39 pre-existing diagnostics as before this increment. The AST graph was refreshed
  after the final declaration correction.

The owner-start migration must precede deployment of the new creation endpoint and
modern start changes. **Twelve application feature migrations (eight Zoho and four
assessment) plus four SSO feature migrations remain local/unapplied.** No persistent
migration, real account/job/provider action, email, deployment, commit or push occurred.
B1 environment isolation remains explicitly deferred.

Remaining browser result/scoring/submission writers, legacy grants/routines, wider API/
export/regeneration authorization and trusted question/grading/report authority still
require completion. Reviewed candidate matching/identity/entitlement diffs, approved job
publishing, complete source/backfill/delta/delete coverage, operator/privacy lifecycle,
two-database E2E/race/no-email evidence, full typing/build/CI and pilot/rollout remain
open. This creation milestone does not complete the overall Zoho implementation.

## 53. Creation/start client integration audit — three open findings

This audit follows section 52's start response into the actual public API helper,
store and active assessment page. It confirms three uncompleted client integration
behaviors, rather than a failure of the new SQL ownership or creation serialization.
The behavior predates the latest migration, but remains present in the current flow
and was not covered by section 52's server/caller tests.

### 53.1 Reused progress is discarded before the active page can restore it

[The public start helper](./skillpassport/src/features/assessment/api/assessmentApiService.ts)
returns the attempt ID, sections and runtime `isResumed` flag but discards the returned
attempt record. Its declared start response type also omits the resume state. The
[active page's start branch](./skillpassport/src/features/assessment/ui/AssessmentTestPage.tsx)
ignores `isResumed`, initializes using its fresh-start path, shows the introduction,
and resets elapsed/adaptive elapsed time.

A probe returned an owned reused attempt with a saved answer, question index 1,
elapsed time 91 and timer 0 through the real API helper, then used the page's current
initialization call against the real store. The helper contained no attempt state;
from an initially empty store the saved answer remained absent and the question index
remained 0. This can be reached if initial check-in-progress fails transiently or
another start creates an attempt before the next request; the SQL correctly reuses it,
but the page does not hydrate it.

Existing resume-prompt handling is a separate path and must not be described as always
broken. Same-attempt in-memory state can also mask the gap. No database answer erasure
or permanent loss was reproduced. Fix the public response contract and make start
reuse enter the same canonical resume/hydration path as the resume prompt, including
answers, position, timing and owned adaptive state. Do not reset reused timers as new.

### 53.2 The active page retains the requested grade instead of the canonical grade

Even for a newly created attempt, the start helper drops the stored attempt's grade/
stream. The page initializes `gradeForAssessment` and the selected stream rather than
the server-returned context. A fresh-start probe requested `college` for `bca` while
the server returned canonical `after12`, and the actual store retained `college`.

This is more than a label mismatch: the active page selects legacy versus modern
submission from `store.gradeLevel`, and AI-question loading also consumes that value.
The probe showed the stored/requested grade and canonical grade choosing different
submission branches. It did not call a real model, produce a live report, or prove
every catalog row differs. Backend question loading and the separately fixed legacy
hook do use canonical context; neither fixes the active page's context initialization.
Carry canonical grade/nullable stream through the typed API response and all active
initialization/submission consumers, with a catalog-tier mismatch regression.

### 53.3 Fresh initialization can retain another attempt's state

[initializeAssessment](./skillpassport/src/features/assessment/model/assessmentStore.ts)
sets sections, ID, grade, stream and status but does not clear answers, question/section
position, adaptive session/completion state or result state when the attempt changes.
A real-store probe seeded an older attempt's answer, position and completed adaptive
session, initialized a different fresh attempt, and reproduced all of those values
remaining under the new attempt ID.

This is conditional on old state still being present; explicit reset flows can avoid
it, and no deployed cross-account disclosure or server write was reproduced. The
active start branch does not reset before initialization, so the boundary itself must
distinguish fresh initialization from resume hydration. Reset attempt-scoped state for
a different fresh attempt, restore only validated resume state for reuse, and preserve
owner/attempt generation fences in asynchronous question/adaptive/answer callbacks.
Add real-store and page integration tests for fresh, reused and switched attempts.

### 53.4 Evidence, corrected claims and false positives

- **34 checks passed across two files:** 31 existing start-handler tests and three
  temporary API/real-store probes. The probes assert current defective behavior to
  establish the findings, not acceptance. Temporary probes were removed afterward.
  The page control flow was inspected directly; a complete rendered-page E2E was
  not run. The previously reported 386-test run remains historical evidence.
- The current disposable SQL suite was rerun successfully for ownership, grants, canonical creation,
  no resetting on reuse, one-winner creation, convergent modern starts and prior
  mutation/finalization races. The three client findings do not establish a bypass
  or duplicate creation inside the new transaction.
- The store uses Zustand with Immer/devtools, not persist middleware, and the inspected
  active start/store/sync path contains no localStorage recovery implementation. The
  sync hook's comment claiming automatic persistence is not implementation evidence.
  Section 48's earlier local-persistence wording is corrected to in-memory retention;
  durable browser/offline recovery must not be counted as completed.
- Question-loading failure after a committed allocation is an already-disclosed
  boundary; modern retries reuse that attempt. Explicit legacy creation conflicts
  are intentional and require resume, not proof of broken retry authorization.
- Learner references assert the verified subject/own record and never choose another
  owner. Nullable streams, catalog-grade authority and expired zero timers remain
  supported on the server. Those protections are not false fixes simply because
  the active page still needs integration.
- Anonymous SDK counts remain inventories, not leak counts. Inspected integration
  enable flags stay false. No provider automation/no-email behavior, clean full CI
  or deployed privacy was certified by these local probes.

### 53.5 Current acceptance status

The three client findings remain unfixed. Section 52's owner-start transaction and
server adapters remain implemented, but complete active-page start/resume acceptance
is now explicitly open. Twelve application feature migrations and four SSO migrations
remain local/unapplied; no persistent migration, real account/job/provider operation,
email, new Worker, RLS dependency, commit, push or deployment occurred in this audit.
B1 remains explicitly deferred. The candidate review/diff, job publishing, source/
privacy/operational lifecycle and wider legacy authorization/typing/E2E/rollout work
remain unfinished as previously recorded. Only documentation changes remain after
removing the synthetic probe file.


## 54. Local correction of the three active-page start/resume findings

This section supersedes section 53.5's unfixed client status. It completes those three
bounded corrections; it does not complete the entire Zoho integration or establish a
production release gate.

### 54.1 Canonical start and validated reuse

The [public API helper](./skillpassport/src/features/assessment/api/assessmentApiService.ts)
now carries the canonical attempt, nullable stream and typed reuse flag. It rejects
malformed start confirmations. Reuse fetches the authenticated in-progress snapshot
and requires matching attempt ID, canonical grade and stream before returning it;
unavailable or changed resume data never falls back to fresh initialization.

The [active page](./skillpassport/src/features/assessment/ui/AssessmentTestPage.tsx)
uses the canonical grade/stream on fresh starts and sends reused starts through the
existing resume prompt. Resume uses a validated, atomic
[snapshot](./skillpassport/src/features/assessment/model/assessmentSession.ts) to
restore answers, position, elapsed time, remaining timer (including zero), saved
section timings and adaptive linkage. The adaptive resume response must match the
requested session. A saved AI timer applies once to its resumed question; subsequent
questions receive their normal timer. Fractional saved section timings remain valid.
The exported service hook follows the same fresh-versus-resume distinction.

### 54.2 Fresh state and asynchronous boundaries

The [store](./skillpassport/src/features/assessment/model/assessmentStore.ts) resets
attempt-scoped answers, navigation, timers, adaptive state, result state and analysis
retry counters before every explicit fresh initialization. Resume validates before
changing state and hydrates in one update. Owner changes clear the session, and a
monotonic generation distinguishes replaced or rehydrated attempts, including owner
A → B → A changes. This client owner tag is a lifecycle fence, not authorization;
server ownership checks remain necessary.

Start, resume, abandon, initialization checks, AI question loading, adaptive callbacks
and answer-sync acknowledgements reject stale local results at the relevant owner/
attempt boundary. AI question results are scoped so a previous attempt's questions
cannot populate replacement sections, and progress intervals are cleaned up on errors,
scope changes and unmount. These fences cannot cancel a server operation already sent.
Failed abandon does not reset the client as if abandonment succeeded.

The [sync hook](./skillpassport/src/features/assessment/hooks/useAnswerSync.ts) seeds
its baseline from hydrated answers rather than resending them as new edits. Subsequent
answers retain saved section timing when calculating additional elapsed time. Queues
and acknowledgements reset on generation changes even when the attempt ID is reused;
pending status updates after reset/acknowledgement. The misleading automatic
localStorage-persistence comment and offline wording are corrected. State remains
in memory: durable offline/browser-restart recovery has not been implemented.

### 54.3 Local evidence and limits

- **414 tests passed across 22 files.** This includes existing owner/start/progress/
  response/finalization/privacy tests and new API-contract, real-store, rendered-page,
  answer-sync and deferred AI/adaptive regressions. The rendered page exercises
  canonical fresh starts, reused starts, saved answers/position/elapsed time, zero
  timer restoration, user switching and attempt replacement during adaptive resume.
- Pages Functions compiled successfully. The diff whitespace check passed.
- The rendered-page tests mock external services and supporting UI/hook boundaries;
  they are not a live-browser, two-database, provider or email-side-effect E2E test.
  No SQL changed in this correction, and no migration was applied.
- The full repository TypeScript check remains a separate existing failure gate;
  local test/compile success does not certify clean CI. The check produced 8,830
  diagnostic/output lines versus the previous 8,838. Comparing diagnostic messages
  with source coordinates removed found zero added diagnostics and seven removed
  diagnostic entries. Existing errors elsewhere and in these legacy components
  remain unresolved.
- The required AST-only knowledge-graph refresh completed: 22,002 nodes, 40,288
  edges and 1,195 communities. HTML visualization was skipped by the graph tool
  because the graph exceeds its 5,000-node visualization limit.

### 54.4 Remaining integration and rollout gates

Candidate canonical matching, reviewed identity/entitlement diffs and binding them to
approval, the canonical job publisher, the full bulk/backfill/delta/deletion lifecycle,
operator/privacy retention/erasure/suppression controls, remaining legacy authorization
and trusted-scoring boundaries, full E2E/no-email evidence, clean full CI and rollout
remain open as previously recorded. Twelve application feature migrations and four
SSO migrations remain local/unapplied. All integration enable/readiness flags remain
off. B1 environment isolation remains explicitly deferred. No real account/job/provider
operation, email, new Worker, RLS dependency, commit, push or deployment was introduced.


## 55. Parallel candidate review and approved job implementation — verification pending

Three implementation agents worked on separate sp-dash, SSO and job-publisher surfaces.
The parent integrated the shared approval ledger and reviewed their contracts. This is
an implementation checkpoint, not a statement that the entire integration is complete.

### 55.1 Implemented source changes

- **Canonical candidate review:** sp-dash now offers account/access preview from the
  existing SSO authority. The server loads private staging data; the browser supplies
  version/hash/configuration/target assertions. Exact identity and entitlement outcomes,
  blockers and activation status are displayed, with explicit operator acknowledgement.
  Blocked/ambiguous identities, unsupported sponsored-only access and missing contexts
  remain blocked instead of receiving an unreviewed replacement grant.
- **Approval binding:** the canonical review digest covers relevant current identity,
  membership, role/product, catalog, entitlement and source-link state. SSO rechecks it
  at approval and under locks at canonical commit. Human manifests, the application
  operation ledger, claims and live authority bind `candidateReviewHash`. Existing
  queued/failed candidate operations without that evidence become stale and need a new
  review; uncertain processing work remains available for reconciliation. Minimal
  hold/reject commands remain supported. Jobs retain their separate manifest shape.
- **Existing-account preservation:** an explicitly reviewed canonical match can be
  preserved even when the staged target was initially null; the digest binds the actual
  match. Credentials/preferences and supported paid/organization access are preserved.
  Existing imported accounts retain their honest `activation_pending` status. New
  accounts still have no usable password or implied verified mailbox/sign-in session.
- **Canonical job publisher:** an internal adapter in the existing dashboard Worker
  calls service-only SkillPassport SQL for approved create/update/draft/close changes.
  Live operation context, source revision, immutable ownership/source links, local edit
  fingerprints, entitlement/quota checks and atomic receipts guard effects. Arbitrary
  takeover, hard deletion and treating a missing source record as deletion are excluded.
- **Operator job policy:** sp-dash exposes exact source status/employment mappings,
  database trigger definitions and a no-email review/attestation. Saving uses an expected
  configuration revision and audit reason, invalidates old context and requires fresh
  discovery/reapproval. Unmapped statuses and unreviewed policies remain blocked. No
  environment execution flag is enabled by saving a policy.
- **Receipt recovery:** paused write capabilities no longer block receipt-only
  reconciliation. The existing runtime derives recovery permission from its existing
  background/environment/preview gates. Queue and scheduler dispatch new effects only
  for writable modules, and independently reconcile readable committed receipts; no
  receipt absence authorizes another effect.
- **Notification boundary:** managed jobs require empty learning requirements, so the
  known learning-notification enqueue path is not activated. A fingerprint covers the
  public routine catalog and enabled public triggers; drift invalidates review. A
  fingerprint and operator attestation do not themselves prove every external or
  transitive effect is email-free. That acceptance evidence remains required.

Primary sources: [candidate review](./sp-dash/lib/zoho/candidate-review.js),
[review UI](./sp-dash/components/zoho/CandidateReview.jsx),
[job policy UI](./sp-dash/components/zoho/JobPolicyPanel.jsx),
[SSO review migration](./sso-worker/supabase/migrations/20261103000000_zoho_candidate_review.sql),
[ledger binding](./skillpassport/supabase/migrations/20270209000000_zoho_candidate_review_binding.sql),
[job publisher](./skillpassport/supabase/migrations/20270210000000_zoho_job_publisher.sql) and
[existing-runtime adapter](./sp-dash/lib/zoho/job-destination.js).

### 55.2 Verification status

New module/route tests, SQL fixtures, a cross-connection final-quota-slot race and a
real two-disposable-database candidate delivery harness have been written. Runtime
execution of these new tests is **pending**, not passed. Agent escalation attempts
returned `Rejected("rejected by user")` without an additional reason; they were not
retried. A parent request for permission to run local suites and disposable database
checks is pending. The earlier 414-test result applies to section 54's earlier state,
not these new changes. The old control-plane SQL suite passed before the new review
binding fixture was installed; it does not validate that new migration.

The two-database harness is opt-in and uses synthetic records and disposable databases,
actual canonical/projection SQL and existing delivery modules; it does not replace
provider OAuth/discovery or a deployed authenticated-browser acceptance test. Run the
new module/SQL/HTTP-contract tests, compile both UIs/services, validate migration history,
compare typing baselines before accepting this checkpoint. Source graph refreshes
completed for SSO and sp-dash, including the final receipt-recovery correction;
SkillPassport’s final refresh completed. Whitespace checks pass across all three repositories. Persistent application databases must not be used as test fixtures.

### 55.3 Remaining work and rollout constraints

- Resolve any failures from the pending tests and validate the integrated operator,
  approval, canonical account and job paths.
- Finish supported non-learner/sponsored-account decisions and a separately approved
  no-email activation/sign-in approach where required; no mail-based activation is
  authorized by this plan.
- Replace the candidate capability's deliberate hardcoded `ready=false` only after its
  actual deployment/readback/transport/privacy/no-email dependencies are verified.
  Merely setting provisioning flags cannot make this incomplete release gate ready.
- Complete large inventory/backfill/delta/source-deletion coverage, approved deletion
  and suppression/retention/erasure workflows, broader operator controls and acceptance.
- Finish remaining legacy authorization/trusted-scoring/browser access and clean full CI.
  Publisher quota locks serialize integration connections; they do not fix races from
  wider existing writers that do not use that lock.
- Configure the existing auth-sync queue/DLQ and service bindings. Consumer
  `SYNC_API_SECRET` must match application `INTERNAL_WEBHOOK_SECRET`;
  `SKILLPASSPORT_SYNC_URL` must be the approved application origin. Provisioning,
  projection and independent readback bindings remain release prerequisites.
- Verify actual Zoho tenant coverage, transitive/external no-email effects, authenticated
  two-database/browser E2E and a controlled pilot before enabling operation.

Cross-service source review also corrected FK-backed role/product insertion fences,
disabled quota overrides and inherited plan handling, trigger firing-mode fingerprint
drift, stale preview responses and inherited default table-write privileges. None of
these new corrections has yet been runtime-verified.

The migration inventory is now **14 application feature migrations and 5 SSO feature
migrations**, all local/unapplied. The new job publisher flag is explicitly false in
root/dev/dev-preview/QA dashboard configuration, and all prior integration flags remain
off. No candidate/job import, email, persistent migration, new Worker, RLS dependency,
commit, push or deployment occurred. B1 environment isolation remains user-deferred.


## 56. Reproduced implementation audit and false-positive dispositions

This section supersedes section 55's pending-verification status. The new audit ran
local module suites, the real disposable job/control-plane SQL runners, the canonical
candidate runner and the opt-in two-database harness. No persistent database migration
or live candidate/job/provider/email operation was performed. Four findings remain
unfixed; this audit did not change production source code.

### 56.1 P1 — SSO review migration cannot be installed

The [new SSO migration](./sso-worker/supabase/migrations/20261103000000_zoho_candidate_review.sql)
contains an unparenthesized CASE expression inside the approval-validation IF condition
at line 150. Running the real candidate SQL runner fails while installing that migration:
`syntax error at end of input`, pointing to `<>CASE WHEN ... THEN 7 ELSE 6 END`.
The unmodified two-database harness fails for the same reason during setup; its two
scenario tests are skipped, not passed.

A temporary runner parenthesized only that expression in memory while loading the
migration into a disposable database. The existing candidate SQL regression/race suite
then passed. This isolates the parser failure and permits investigation of later paths;
it does not make the checked-in migration valid or certify full acceptance. Fix the
real migration and rerun both original runners without scratch substitutions.

### 56.2 P1 — job side-effect fingerprint misses post-review executable changes

The [fingerprint](./skillpassport/supabase/migrations/20270210000000_zoho_job_publisher.sql)
hashes public functions and enabled public triggers but omits relation column defaults.
A disposable SQL reproduction defined a dormant marker-writing function before policy
review, saved the reviewed policy, then changed the opportunity `company_logo` default
to call that function. No routine body or trigger definition changed. The fingerprint
was unchanged, readiness remained true, and an approved job insert executed the new
unreviewed default and wrote the marker.

The marker represented an unsafe enqueue; no real email or external call was made.
This is a concrete post-review drift defect, not an allegation that an operator knowingly
approved email sending. Non-public helper bodies, rules and other executable dependencies
also need coverage or explicit rejection; those variants are not counted as additional
reproduced findings. Include the relevant relation/default/dependency surface in review
and the drift gate, or fail closed on unsupported side-effect paths.

### 56.3 P2 — definite pre-write job rejection is stranded as an unknown outcome

The [job adapter](./sp-dash/lib/zoho/job-destination.js) throws a generic error on SQL
rejection. The [dispatcher](./sp-dash/lib/zoho/approved-execution.js) has already set
`started=true`, so a normal quota denial becomes `OUTCOME_UNKNOWN` and stays processing.
The job SQL race proves a losing quota transaction has no committed job/receipt; a
separate temporary probe through the actual job adapter and dispatcher reproduced its
unknown-outcome classification and subsequent receipt-only reconciliation returning
`reconciliation_required` again. The destination never supplies the already-supported
operation-bound `not_applied` response for this case.

This is conservative about duplicate effects, not evidence of unauthorized job creation.
It nevertheless strands ordinary quota/conflict failures and can block source/configuration
progress. Return an authoritative operation/lease/source-bound no-effect or review-required
result for verified pre-mutation rejections. Continue treating transport failure, timeout
and uncertain external effects as ambiguous; a missing receipt alone must never allow
another effect. Existing SQL tests manually record `NOT_APPLIED` after quota rejection,
so their success does not establish that the runtime has that recovery behavior.

### 56.4 P2 — candidate approval misses required canonical version readiness

[Canonical review](./sso-worker/supabase/migrations/20261103000000_zoho_candidate_review.sql)
checks Discover/catalog/access eligibility but not every version required by application
projection. The real canonical schema permits an explicit NULL `plans.updated_at` on
INSERT. A two-disposable-database probe inserted an otherwise eligible free plan with
that value, obtained a create review/approval and successfully committed a new canonical
candidate. Its snapshot then failed [application projection](./skillpassport/supabase/migrations/20270203000000_zoho_candidate_projection.sql)
with `Plan version required`. Retry alone cannot repair the canonical catalog value.

This is conditional on schema-valid legacy/imported NULL version data; it is not a claim
that current live catalog data is NULL. Before-UPDATE timestamp triggers prevent the
naive `UPDATE updated_at=NULL` reproduction in the real schema, so that version of the
claim is rejected. Validate required plan/subscription projection versions before approval
and again at canonical commit, or provide a separate reviewed repair policy. Do not invent
an access timestamp silently during delivery.

### 56.5 False positives excluded and known limitations kept separate

- **Approval response-loss replay is implemented.** The route performs exact immutable
  decision lookup before fresh canonical verification and again in its recovery path.
  The fresh-review guard rejecting already-approved rows is not by itself a retry bug.
- **Null staged target versus matched canonical target is deliberate and digest-bound.**
  No arbitrary target takeover was reproduced. PostgreSQL JSONB-text source hashing is
  consistent between the inspected staging and canonical paths.
- **Approver revocation after an already-authorized transaction starts is not automatically
  an authorization bypass.** A missing lock alone does not prove the transaction cannot
  legitimately linearize before concurrent revocation. Commit-time actor-revocation
  semantics need explicit acceptance policy; no new exploited bypass is claimed here.
- **Missing application mirrors are an existing limitation, not a newly discovered leak.**
  A canonical preservation operation without a user/learner mirror blocks at projection.
  The probe also proved an out-of-order preservation delivery succeeds once the original
  created-account projection runs. Do not call that case permanent data loss. Accounts
  without any preceding profile-creation path still need the previously documented review/
  projection coverage; the new-create-only E2E scenarios do not prove that support.
- Existing pending activation, disabled readiness/flags, unapplied migrations, global
  quota races with unrelated legacy writers, source bulk/delta/delete coverage and review
  retention/erasure remain disclosed release gates. Expired review data contains candidate
  contact fields and still needs the planned retention/erasure lifecycle; server-only grants
  do not prove retention is complete.
- No direct description-HTML injection sink or deployed email/cross-account disclosure
  was reproduced. A fingerprint and passing module tests are not production no-email proof.

### 56.6 Evidence and current status

- **237 existing module tests passed:** 187 across 16 sp-dash files and 50 across five
  SSO files. They do not cover away the new findings.
- The real disposable job SQL suite, including cross-connection quota contention, and
  control-plane SQL approval/claim/recovery suite passed.
- The unmodified candidate SQL runner failed at migration installation. The unmodified
  two-database harness failed setup with two cases skipped. They must not be reported as
  passing E2E acceptance.
- One temporary adapter/dispatcher probe passed by asserting the current defective
  rejection behavior. Temporary SQL/default and cross-database boundary probes reproduced
  the findings; they used only synthetic records, marker writes and a scratch-only
  parenthesized migration copy where required. The temporary repository test was removed.
- The SSO candidate suite passed with the isolated in-memory parser correction; that
  result does not replace rerunning the original source after a real fix.
- Graphs were already refreshed at the section 55 implementation checkpoint; this audit
  leaves production code unchanged. Full typing/build/CI, authenticated browser/provider
  acceptance, no-email evidence and the rest of section 55.3 remain open.

All four findings are open. Fourteen application feature migrations and five SSO feature
migrations remain local/unapplied, all integration enable flags remain off, and B1 remains
user-deferred. No source grant, live import, email, new Worker, RLS dependency, commit,
push or deployment was introduced by this audit.


## 57. Local corrections for all four section 56 findings

This section supersedes section 56's four open findings. Each reproduced defect is
corrected locally and validated against the actual checked-in source. It does not mark
the entire Zoho integration or production release complete.

### 57.1 Actual SSO migration installation and canonical version readiness

The [SSO review migration](./sso-worker/supabase/migrations/20261103000000_zoho_candidate_review.sql)
now uses the parenthesized CASE expression accepted by PostgreSQL. The original candidate
runner and two-database harness run without scratch substitutions.

Canonical preview returns `discover_plan_version_unavailable` for an eligible Discover
plan whose version is NULL. Existing-account review returns `projection_versions_unavailable`
if any projected personal subscription or referenced plan lacks its required version,
including cancelled history. Commit recalculates the canonical snapshot under its locks,
so version drift after approval rejects before account/membership/subscription/source-link/
outbox mutation. No timestamp is invented and no catalog/history row is silently repaired.

SQL fixtures and the [two-database tests](./skillpassport/functions/__tests__/zoho-candidate-two-db.test.ts)
use actual timestamp-update triggers and explicit NULL INSERTs. They cover initial review
blocking, historical plan/subscription versions and drift after valid approval. The two-
database cases prove a blocked new candidate creates neither account/profile and blocked
preservation leaves its existing account/profile intact.

### 57.2 Executable-catalog review and drift denial

The [job publisher migration](./skillpassport/supabase/migrations/20270210000000_zoho_job_publisher.sql)
now inventories non-system application schemas instead of public routines/triggers alone.
The conservative surface includes routine definitions/bindings/owners/grants, trigger firing
modes, column defaults, rewrite rules, constraints, relation/column metadata, indexes,
application types and indirect operator/cast/aggregate bindings. The same inventory is
exposed for operator review. Oversized inventories return no usable fingerprint and deny
readiness/configuration rather than silently omitting dependencies. A target table lock
precedes metadata validation to fence its concurrent DEFAULT/trigger/rule DDL.

Real SQL regressions define dormant marker-writing helpers before review, then change only
a column default, a non-public helper body or a rule after review. Fingerprints change,
readiness denies and the effect path rejects before any marker write. Trigger mode and
legacy privilege guards remain covered. Row data/statistics are excluded so ordinary DML
does not invalidate an executable-surface review.

This is database-local drift protection, not proof about external provider automation,
changed native library binaries or arbitrary concurrent helper deployment. Coordinate
schema/helper changes with integration pauses and a new review. Actual production and
transitive/external no-email acceptance remain mandatory.

### 57.3 Durable rejection evidence and a fresh review boundary

A new [no-effect migration](./skillpassport/supabase/migrations/20270211000000_zoho_job_no_effect_receipts.sql)
wraps the private job effect function. Only reserved anticipated pre-write business
rejections produce durable operation/lease/source-bound no-effect evidence. The rejected
subtransaction is rolled back before evidence commits. Unexpected errors escape; transport
failures, timeouts and receipt absence remain ambiguous.

The [job adapter](./sp-dash/lib/zoho/job-destination.js) and
[dispatcher](./sp-dash/lib/zoho/approved-execution.js) accept only the strict durable DTO.
`zoho_ack_job_no_effect` independently verifies its private row, the current operation's
lease/hash and absence of a completed job receipt. It invalidates the old approval and
advances the matching staged revision to pending review. This permits explicit re-review
without spending automatic retry attempts on the same rejected grant.

Read-only reconciliation can recover this proof after a lost response, lease expiry or
`OUTCOME_UNKNOWN`. It never renews the old grant. Completed receipts take precedence;
acknowledgement is idempotent, and forged/cross-operation/cross-lease proofs are rejected.
Direct browser/service writes to the proof table and service execution of the private effect
function are revoked. No new Worker, email capability or RLS dependency is introduced.

The [real SQL regression](./skillpassport/functions/__tests__/sql/zoho-job-no-effect.sql)
uses the actual losing quota-race operation to check immediate proof, forged acknowledgement,
late unknown/expired-lease recovery, one revision bump and old-grant non-reusability. A real
unexpected CHECK violation remains an exception with no durable proof. Module tests cover
strict DTOs, generic SQL/transport failures and lost acknowledgement recovery.

### 57.4 Repository migration rule correction

The repository validator additionally caught direct data UPDATEs in the earlier, still-
unapplied review-binding migration. Schema changes remain in that
[migration](./skillpassport/supabase/migrations/20270209000000_zoho_candidate_review_binding.sql);
the integration-owned legacy approval invalidation statements now live in matching
[development](./skillpassport/supabase/seed/dev/20270209000001_seed_invalidate_unreviewed_zoho_candidates.sql)
and [production](./skillpassport/supabase/seed/production/20270209000001_seed_invalidate_unreviewed_zoho_candidates.sql)
upgrade seeds, as required by the repository's schema-only migration rule. Processing
unknown effects are untouched. Apply those seeds through the normal release process,
not as test fixtures against an application database.

Claim/live-authority checks already deny review-less approvals before a seed runs. A
service-role regression simulates an old queued operation without a review hash and
proves claim marks it stale and advances it to a fresh review without execution.
No baseline migration history was changed.

### 57.5 Verification and limits

- **259 tests across 23 files pass:** 196 sp-dash tests in 16 files, 59 SSO tests in six
  files, and four opt-in two-database cases in one file.
- Original-source candidate SQL (including version-readiness, idempotency and race checks),
  job SQL (including drift markers, quota contention and durable rejection recovery) and
  control-plane SQL suites pass in uniquely named disposable databases. Each fixture is
  cleaned up; persistent application databases are not migrated.
- The Zoho dashboard page and its local panels bundle successfully. Pages Functions
  compile. These checks are not a claim that the complete Next/OpenNext/repository CI
  pipeline is clean.
- Migration filename/history/schema-only validation passes for **179 SQL files**, including
  the two upgrade seeds. Whitespace checks pass across all three changed repositories.
- Functions typing still produces the existing 6,759 diagnostic/output lines. Comparing
  normalized diagnostic messages against the recorded baseline finds **zero additions**;
  the repository-wide typing gate remains unresolved.
- The existing SSO Worker bundle dry run passes without deployment. Required AST-only
  graph refreshes complete for SkillPassport, sp-dash and SSO. SkillPassport contains
  22,028 nodes/40,329 edges; sp-dash contains 1,996 nodes/4,637 edges; SSO reports no
  topology change. The large application HTML visualization is skipped by the graph
  tool’s size limit. Earlier false-positive dispositions in section 56 remain valid.

There are now **15 application feature migrations, five SSO feature migrations and two
legacy-approval upgrade seeds**, all local/unapplied. All integration enable flags remain
off. The candidate capability/release readiness gate, broader supported account/activation
and mirror cases, source inventory/bulk/delta/delete lifecycle, privacy/retention/suppression,
legacy authorization/trusted scoring, full CI and production/provider/no-email/pilot
acceptance remain open as recorded in section 55.3. B1 stays user-deferred. No live import,
email, new service/Worker, RLS dependency, commit, push or deployment occurred.

## 58. Runtime readiness, no-email activation and local acceptance

This checkpoint supersedes the hardcoded candidate-readiness, missing-mirror,
no-activation-path and source-review-retention statements in section 57. It does not
declare every item in the entire plan or the production release complete.

### 58.1 Candidate readiness and account access

- [SSO runtime capabilities](./sso-worker/src/lib/zoho-candidate-capabilities.ts)
  require provisioning/delivery configuration, a producer queue, live-operation and
  projection-confirmation authorities, the installed canonical schema/catalog/private
  boundary, and an independent application capability. Execution checks the same
  dependencies again; an enable flag alone does not authorize a write.
- The [application authority](./sp-dash/lib/zoho/execution-authority.js) calls a fixed
  read-only [storage probe](./skillpassport/supabase/migrations/20270213000000_zoho_candidate_projection_readiness.sql).
  It verifies required routines/grants, projection tables, private owner triggers and
  browser boundaries. Missing dependencies and unsafe grants fail closed without
  returning candidate data or mutating an account. This is runtime dependency health,
  not proof that a deployed queue consumer, route, sync secret or provider is correct.
- The prior claim that no no-email activation/sign-in path exists was too broad:
  existing Google authentication already proves ownership through the trusted gateway.
  [Imported activation](./sso-worker/supabase/migrations/20261104000000_zoho_candidate_runtime_readiness.sql)
  now rechecks the exact Google subject/address/link and private boundary under locks,
  marks the same identity verified and updates its activation outcome. It preserves
  Discover, memberships, credentials and preferences. An approved source email alone
  never verifies ownership. No email, temporary password or import-time session is issued.
- The first imported sign-in uses the existing reference-only canonical outbox for
  projection recovery, rather than replaying a generic user-creation snapshot. Other
  non-email activation providers/methods remain unsupported; do not promise password
  login for the sentinel password.
- [Projection](./skillpassport/supabase/migrations/20270203000000_zoho_candidate_projection.sql)
  now repairs missing mirrors for supported canonical learners: a missing application
  user/learner or a learner-only gap can be filled privately. Existing app-user state
  and canonical subscriptions/credentials are preserved. Tombstoned, inactive,
  conflicting-email and incompatible non-learner contexts still require separate review.
  The candidate acknowledgement explains private mirror creation when missing.

### 58.2 Discovery continuity

The [incremental discovery migration](./skillpassport/supabase/migrations/20270212000000_zoho_discovery_incremental.sql)
persists scan start, overlap watermark and prior exceptions. Clean scans advance from
scan start minus ten minutes; exception scans never advance the clean watermark.
Enrolled modules are scheduled at fifteen-minute intervals, with daily full scans,
using the existing Worker cron. Stable ID ordering and conditional modified-time reads
are used. A 500-page segment saves a continuation instead of silently limiting the
inventory; the explicit 500,000-page safety ceiling remains incomplete/review-required.
Provider errors stop the run rather than implying an empty/complete inventory.

This covers saved records through REST pagination, not a transactional source snapshot,
dedicated bulk export, drafts, or a provider deletion stream. Concurrent source mutations
are reconciled by overlap and daily full scans. Missing records never authorize deletion.
Provider limits, permissions and tenant-specific coverage still require actual acceptance.
The API contract is the official [Get Records documentation](https://www.zoho.com/recruit/developer-guide/apiv2/get-records.html).

### 58.3 Source privacy and operator controls

The [source privacy migration](./skillpassport/supabase/migrations/20270214000000_zoho_source_privacy.sql)
and [dashboard panel](./sp-dash/components/zoho/SourcePrivacyPanel.jsx) provide:

- Durable suppression keyed by source organization/module/record ID, independent of
  credential renewal. Suppression blocks further staging/live execution and revokes
  unclaimed approvals; removing it restores neither payload nor approval automatically.
- Configurable staged/deferred payload retention (30-day default; 1–365 days), bounded
  cleanup batches and minimal hash/ID audit events. Expired staged payloads cannot be
  approved and need fresh discovery/review. Active/unknown effects retain evidence for
  receipt reconciliation. Deferred copies obey the configured retention too. Expired
  SSO preview contexts are removed by the existing SSO schedule.
- Pause/resume/disconnect commands bound to actor, reason and configuration revision.
  They invalidate queued approvals, preserve ambiguous operations and require fresh
  review. Started external calls may still finish; the UI explicitly reports that limit.
  Disconnect removes local credentials/OAuth states, not source-side provider access.
- Existing recovery scheduling cleans source payloads. The separately default-off
  `ZOHO_PRIVACY_CLEANUP_ENABLED` flag enables cleanup while new discovery/execution is
  paused, within existing environment/background/preview gates. Manual cleanup is also
  available to the authenticated platform super administrator.

Privacy wraps the previously installed staging function rather than replacing its job
policy mapping. The combined job SQL suite verifies policy/approval behavior with the
privacy migration installed. No RLS dependency, new Worker, email capability, automatic
canonical account/job deletion, or erasure of paid/learning/application history is added.
Suppression and payload cleanup are not canonical erasure or backup/restore compliance.

### 58.4 Executed local evidence

The new [local acceptance runner](./skillpassport/scripts/checks/test-zoho-local-acceptance.mjs)
is exposed as `npm run test:zoho:local` from SkillPassport. It strips inherited application
credentials/flags, rejects remote Docker contexts, runs serially against unique synthetic
fixture databases and stops on failure. See the [test guide](./ZOHO_LOCAL_TESTING.md).

- **314 tests across 27 files pass:** 206 dashboard tests/16 files, 82 SSO tests/7 files,
  and 26 application tests/4 files. The eight two-database cases include grant drift,
  activation, missing-mirror preservation, replay/recovery and invalid canonical versions.
  The full run also passes canonical/approver/control-plane/job SQL suites. The final
  deferred-retention additions pass the real control-plane SQL suite separately.
- SQL coverage includes retained unknown effects, suppressed reimport, reconnect,
  expiry/refetch, deferred-copy cleanup, stale connection commands, disconnect credential
  removal and restricted grants. Job tests run after the privacy wrapper is installed.
- Dashboard and authenticated API bundles compile. Pages Functions compile. SSO Worker
  dry-run bundling succeeds without deployment. Migration validation passes for 182 SQL
  filenames/history. Whitespace checks pass across all three repositories.
- Functions typecheck still fails with 6,759 output lines. No Zoho integration or imported
  SSO source diagnostics occur in that output. This is not a green full repository CI.
- AST-only graph refreshes run for all three changed repositories. No API/LLM graph
  extraction is required. Graph sizes are recorded by the tool, not used as correctness
  evidence for the integration.

The synthetic bindings/HTTP adapters and isolated table fixtures are intentionally
bounded. Passing them does not substitute for authenticated browser acceptance,
provider OAuth/automations, deployed transport/secrets or production grant review.

### 58.5 Exact remaining implementation and release boundaries

- Broader non-learner/organization-sponsorship-only entitlement decisions remain held
  instead of silently changing canonical roles or inventing a personal grant. Mirror
  repair is for the supported learner contexts above, not all existing account types.
- Dedicated bulk export and source merge/delete streams with approved lifecycle actions,
  broader canonical erasure/restore workflows, distributed source quota/key-rotation
  operations and remaining legacy authorization/trusted-scoring/browser access work are
  not completed by this checkpoint. REST pagination is now resumable; a separate Bulk
  API implementation is not claimed. Deletion-stream scope must be reviewed separately
  from the current read-only OAuth scopes; no source privilege was broadened here.
- Actual local/manual configuration and persistent migration application, existing
  queue/consumer/DLQ and independent service bindings, matching internal sync secrets,
  production grant remediation, authenticated provider/browser acceptance and transitive
  no-email evidence are still required. The probes will deny unsafe legacy grants.
- Full repository CI/typecheck, controlled pilot and rollout acceptance remain open.
  B1 environment isolation remains expressly user-deferred.

There are now **18 application feature migrations, six SSO feature migrations and two
legacy-approval upgrade seeds**, all local/unapplied. All integration flags, including
the new privacy-cleanup flag, remain false. Tests create/drop synthetic fixture databases
only. No real account/job import, source write, email, commit, push or deployment occurred.

## 59. Audit of the section 58 implementation and false positives

This is an audit checkpoint, not a source fix or release approval. Three additional
defects are reproduced against the current implementation. Section 58's passing local
acceptance evidence remains valid for its covered cases and does not cover these paths.

### 59.1 P1 — Later imported sign-in can escape the private projection path

[OAuth recovery](./sso-worker/src/routes/oauth.ts) uses canonical outbox recovery only
when `activation_pending` is true for that invocation. Successful provider activation
removes that marker. A subsequent successful Google sign-in, with the application
mirror missing or its existence check failing, can therefore emit generic `user.created`
and `membership.created` events again.

The actual [generic membership writer](./skillpassport/functions/lib/sync-service.ts)
updates application organization linkage and upserts the learner without a private
projection receipt or the import's notification defaults. Temporary probes reproduced
the later-login events, captured this writer's real learner DTO, and inserted it into
the actual disposable learner table. The learner appeared in the filtered recruiter
view because no private marker existed. This models generic delivery winning a race
with a still-pending approved projection; it does not prove a deployed disclosure.

Fix: distinguish imported identity provenance durably from one-time activation state.
Keep all imported-account recovery, including later OAuth/password-login backstops,
on the authoritative reference-only projection path. Deny generic reconstruction of
private/tombstoned imports on the application side as defense in depth. Cover later
login before projection completion, existence-check failure, duplicate/reordered events
and deleted-profile behavior. Do not infer that first activation itself is broken.

### 59.2 P2 — Expired staged reviews can still be approved

The [privacy review guard](./skillpassport/supabase/migrations/20270214000000_zoho_source_privacy.sql)
checks the redaction marker and suppression, not the effective capture-time retention
deadline. The [approval function](./skillpassport/supabase/migrations/20270209000000_zoho_candidate_review_binding.sql)
also lacks that deadline check. A synthetic review aged 31 days under the default
30-day policy was approved with its payload intact before cleanup visited it.
Its newly queued approval then survived cleanup because unexpired queued operations
are intentionally retained for reconciliation safety.

Fix: enforce effective payload expiry during preview/approval/claim/live authority,
independently of cleanup scheduling and batch latency. Expiry must force a fresh source
fetch/review; preserve read-only reconciliation for effects already started. Cleanup
timing must not determine whether an expired review can authorize a new effect.

### 59.3 P2 — Old approved payload copies can outlive their retention

[Payload cleanup](./skillpassport/supabase/migrations/20270214000000_zoho_source_privacy.sql)
scrubs operation `approved_data` only when the current staged record is selected for
expiry/suppression. A completed operation aged beyond retention kept its old payload
after the same source received a fresh staged revision and cleanup ran. Repeated fresh
source updates can keep those historical approved copies indefinitely.

Fix: expire safe terminal-operation payload copies using their own capture/approval
deadline and relationship-aware cleanup, independently of the latest staged payload's
age. Preserve hashes, IDs, receipts and unknown-effect recovery evidence. Add coverage
for several historical revisions while the current revision remains fresh.

### 59.4 Suspicions excluded or narrowed

- Candidate readiness is no longer hardcoded false. Disabled flags/unsafe grants
  correctly deny it; section 58's real two-database grant-drift tests prove a healthy
  configured positive path. Runtime presence still does not prove deployed transport.
- A missing no-email activation mechanism is no longer a valid broad finding: first
  Google activation works with trusted provider-verified ownership. The new P1 is the
  subsequent synchronization path after that activation marker has been cleared.
- Suppression removal intentionally does not restore payloads, old approvals or access.
  Fresh discovery/review is required; that is a safeguard, not missing automatic repair.
- Retaining processing/unknown payloads is deliberate reconciliation protection. The
  historical-copy finding above uses a completed operation, not an unresolved effect.
- Disconnect intentionally removes local credentials only. The UI already distinguishes
  provider-side revocation and started calls that may still finish; no immediate external
  rollback is promised. No-email bindings alone are not evidence that mail was sent.
- Explicit grants/private predicates without Supabase RLS match the user's requirement;
  missing RLS is not a finding. Existing unsafe legacy grants remain a real rollout gate.

### 59.5 Evidence and unchanged boundaries

Temporary unit probes reproduced later OAuth generic user/membership publication. A
separate probe used the actual generic writer DTO and disposable application schema to
confirm filtered-recruiter visibility without a projection marker. The eight existing
two-database cases passed alongside it. Original control-plane SQL ran with temporary
additional synthetic cases and asserted all three retention observations: expired review
approval, retention of that queued approval, and an old completed payload surviving a
fresh current revision. Fixture databases were dropped; the temporary repository test
files were removed. These probes assert observed defects, not corrected behavior, and
must not be added to the 314-case acceptance count as new passing regression coverage.

Production source is unchanged by this audit. All three findings remain open. Known
bulk/deletion, unsupported account/erasure, broader authorization/CI and provider/browser/
no-email rollout work in section 58.5 remains pending. Eighteen application and six SSO
feature migrations plus two upgrade seed files remain local/unapplied; all enable flags
remain off. B1 stays user-deferred. No real import, source write, email or deployment ran.

## 60. Local corrections for all three section 59 findings

Section 59 is the historical reproduction record. All three findings are corrected in
the current source with regression coverage. The broader work in section 58.5 remains.

### 60.1 Durable provenance and generic replay denial

The [SSO policy migration](./sso-worker/supabase/migrations/20261105000000_zoho_candidate_sync_policy.sql)
adds indexed, restricted provenance lookup using canonical links/receipts. Only a
protocol version and boolean leave it. It outlives activation metadata and works while
delivery is paused. Both [Google sign-in](./sso-worker/src/routes/oauth.ts) and
[password sign-in](./sso-worker/src/routes/login.ts) check it before generic replay.
Imported identities use reference-only outbox recovery; unavailable provenance never
falls back to generic snapshots. Background failure does not change authentication's
normal result. The password regression represents separately established credentials;
import still issues no password or login session.

The [existing candidate entrypoint](./sso-worker/src/rpc/zoho-candidate-provisioner.ts)
exposes a narrow `getSubjectSyncPolicy` method. Application
[generic user/membership writers](./skillpassport/functions/lib/sync-service.ts) consult
[local private/tombstone state](./skillpassport/supabase/migrations/20270216000000_zoho_generic_identity_sync_guard.sql)
and required canonical policy before writing. Obsolete imported reconstruction is
acknowledged without mutation. Failed/malformed required authority throws and returns
a retryable server error. Local private/tombstone denial works without the binding or
delivery permission. Once candidate operations/projections exist, a missing canonical
binding cannot enable generic recovery. Preserve the binding during pauses. Separate
versioned subscription/payment synchronization is unchanged.

Tests cover later sign-in after activation, password recovery, provenance failures,
ordinary Google recovery, generic replay before/after projection and learner deletion.
The two-database case exercises actual provenance/private-state SQL and the real generic
service with no generic database writer exposed. Normal educator/subscription tests pass.

### 60.2 Expiry is enforced independently of cleanup

The [retention-fence migration](./skillpassport/supabase/migrations/20270215000000_zoho_payload_retention_fences.sql)
checks actual capture time plus configured retention. Preview checks freshness through
a fixed read-only RPC; approval rejects expired data before cleanup; claim and live
authority deny expired effects. Leases are capped by the payload deadline, so a normal
five-minute lease cannot extend source TTL. Renamed pre-fence routines are owner-only.

An exact decision replay reads its original result without renewing the effect. Started
and unknown work remains receipt-reconcilable. An actual fresh fetch of identical
content after expiry forces a new review generation while preserving job policy and
suppression. SQL tests cover all these boundaries, including shorter-than-normal leases,
expiry after claim, no execution attempt for expired unclaimed work and preserved
unknown-effect payloads. Preview tests deny stale data before canonical inspection.

### 60.3 Historical copies expire by their own deadline

Approval captures the staged timestamp into `payload_captured_at`. Cleanup independently
visits safe old operation copies, rather than waiting for the current stage to expire.
Legacy NULL timestamps fall back to approval creation time. IDs, hashes, terminal
outcomes, receipts and minimal audit events survive. Processing/unknown payloads remain
for reconciliation. Connection → record → operation locks, bounded batches and a
500-copy cap precede the existing staged/deferred sweep. Tests expire two completed
historical revisions while retaining the current fresh payload and unknown work.

### 60.4 Validation and ordered release requirements

- **396 tests across 32 files pass:** 207 dashboard/16 files, 95 SSO/9 files,
  35 application Zoho/5 files and 59 existing educator/subscription compatibility/2 files.
  All nine two-database cases run. Approver, canonical candidate, control-plane/retention
  and job/quota/recovery SQL suites pass in unique disposable fixture databases.
- The local acceptance command includes the compatibility suites. Migration validation
  passes for **184 SQL filenames/history**. Dashboard API, Pages Functions and existing
  SSO Worker dry-run bundling are checked without deployment. Whitespace checks pass.
- Functions typing retains 6,759 output lines. Normalized comparison against the pre-fix
  baseline yields **zero added and zero removed diagnostics**; full CI is still failing.
- Required AST-only graph refreshes run in all three changed repositories. No new Worker,
  Supabase RLS dependency, email capability or provider write scope is introduced.

Apply schemas through the reviewed release process before the new bundles: SSO needs
its policy RPC; the application needs retention fences and the generic policy RPC.
The existing Pages→SSO candidate binding must reach the updated named entrypoint,
including while imports are paused. Readiness requires the new policy routines.
Unavailable configuration denies/retries recovery rather than reconstructing profiles.
Verify the ordered setup in local/provider/browser acceptance before enabling imports.

There are now **20 application feature migrations, seven SSO feature migrations and
two upgrade seed files**, all local/unapplied. All flags remain off. Section 58.5's bulk/
deletion, unsupported account/erasure, legacy authorization/CI and provider/browser/
no-email/pilot work remains open. B1 remains user-deferred. No real import, source write,
email, commit, push or deployment occurred while correcting these three findings.

## 61. Persistent local setup and runtime acceptance (revision 44)

This section supersedes prior statements that all local feature migrations/seeds
are unapplied or every local flag is off. It does not close live-provider or broader
implementation gaps. See [the local testing guide](./ZOHO_LOCAL_TESTING.md) for
commands, fixture identifiers, exact evidence and remaining inputs.

Applied only to the existing local Docker databases: 20 application migrations,
seven Zoho SSO migrations, the previously missing password-reset migration and the
**development** approval upgrade seed. Backups preceded changes. Migration ledger
entries were committed with their migrations. Browser grants on protected identity/
profile relations and privileged routines were removed locally; service-role access
was preserved, job writes are server-only, and all 22 Zoho tables have RLS disabled.
Neither remote databases nor production seeds were changed.

The existing dashboard, SSO, auth-sync consumer and compiled Pages Functions now run
with explicit loopback database/endpoints, matching sync secrets and no mail bindings.
Ignored local aliases avoid attaching to already running services; no source Worker
or deployed service was added. Next.js uses separate local build/proxy names. Pages
uses its existing compiled bundle with explicit local configuration. This local test
setup does not implement the user-deferred B1 isolation architecture.

Authenticated synthetic browser approvals yielded two independent learner identities,
active free Discover (`freemium`) access and private application projections. Both
canonical and control-plane receipts completed. New addresses remain unverified,
activation pending and notification preferences false. The first delivery was used
for authenticated HTTP diagnosis; the second completed through the existing queue
and scheduled durable recovery. The synthetic job was created as a draft and then
updated/closed under a second explicit approval, keeping one target job. No job
notification work was created. No real provider inventory was imported.

Actual Workers execution revealed that `redirect: 'error'` is unsupported. It was a
real runtime defect hidden by fetch mocks, affecting candidate delivery and future
OAuth/discovery HTTP. Both now use `manual` and reject redirects. Tests cover
301/302/307/308; the runner additionally includes the formerly omitted auth-sync
transport contracts. **428 tests / 33 files and all SQL suites pass**. Frontend and
Pages Functions builds pass. AST graphs were refreshed. Temporary diagnostics were
removed; failed local reference deliveries were preserved in the existing local DLQ.

Still pending: a local test-tenant OAuth credential file, data center/organization
identity and owner consent; live discovery/tenant no-email verification; actual
Google activation; exhaustive UI acceptance; and the broader section 58.5
bulk/deletion/unsupported account/erasure/legacy authorization/CI/pilot work. Existing
local legacy dashboard badge requests for missing students/universities tables can
fail independently of successful Zoho APIs. Do not represent the synthetic connected
fixture as a verified Zoho account. Production flags remain off; local discovery also
remains off. Full repository CI was not rerun or declared green.

## 62. Audit of local setup, coverage and false positives (revision 45)

This checkpoint audits section 61 rather than implementing new fixes. No business
source, database grants, enable flags or imported identities were changed. Two
additional defects and one reproducibility gap were confirmed. Existing readiness
remains true in both databases; two learner operations and both job revisions remain
completed, with exactly two synthetic application learner profiles.

### 62.1 P2 — A new approval does not refresh execution history or start polling

[Decision submission](./sp-dash/components/pages/ZohoRecruitPage.jsx) refreshes the
summary and records but not `loadRuns`, which also loads execution history. Polling
only starts when existing discovery/deferred/execution state already contains active
work. Approve a record while those lists have no active work: the new operation is
never fetched and polling never begins. The operator can recover with manual Refresh
status; the issue is stale observability, not a missing canonical write or receipt.

Reproduced in a temporary browser harness that bundles the actual component and uses
synthetic fetch responses, without real approval endpoints/database effects. It began
with one history GET, accepted one approval, then still had exactly one history GET
and displayed “No approved execution recorded” after 16.5 seconds (poll interval 15s).
The mocked publication-policy panel had incomplete fixture data; its separate panel
error is a harness limitation, not an additional product finding.

Fix: refresh execution history after decisions, and refresh records/summary when
background completion changes displayed outcomes. Preserve connection/generation
fences and avoid clearing an operator's selections during arbitrary polling.

### 62.2 P2 — Local enablement can leave a partial flag update on validation failure

[The local launcher](./scripts/zoho-local-runtime.mjs) checks each generated service's
loopback database target inside the same loop that writes enabled flags. When the
first service is valid and a later one is invalid, the first file has already been
enabled before the error. Earlier database/binding checks do not validate all those
files. This is a local configuration correctness issue, not evidence of a production
write or an approval bypass in the canonical destination.

A memory-only probe ran the actual final loop with synthetic file reads/writes:
valid dashboard, nonlocal SSO, valid application. It raised “Nonlocal database rejected”
after recording a dashboard write with `ZOHO_EXECUTION_ENABLED=true`. No real file or
flag was changed by the probe. Fix: load and validate every candidate configuration
first, then commit the intended files with failure rollback/clear restart semantics.

### 62.3 Fresh-setup gap — Required dashboard build is not in the startup sequence

[The existing background entrypoint](./sp-dash/workers/sp-dash-worker.js) imports the
ignored generated `.open-next/worker.js` and its local config binds generated assets.
The launcher has a Pages build action, but no dashboard build action/preflight, and
the documented regeneration sequence does not build that dashboard bundle. Next dev
starts the UI but does not supply the imported background bundle.

The current workspace already contains that build, so its successful tests remain
valid. A clean checkout/build-output deletion is not covered by those tests. Static
verification confirmed the generated Worker is untracked and the startup sequence
omits its build. A destructive deletion of the user's existing build was not performed.
Fix: explicitly build/check the existing dashboard bundle before background startup,
with the same local configuration and no deployment/new service.

### 62.4 Suspicions rejected or classified correctly

- Incremental 304 responses are already translated to empty 204 responses inside
  [the source reader](./sp-dash/lib/zoho/discovery-consumer.js). Reporting missing 304
  handling from the generic HTTP helper alone would be a false positive.
- Singular/plural module-scope documentation differs between Zoho pages. The
  [official OAuth overview](https://www.zoho.com/recruit/developer-guide/apiv2/oauth-overview.html)
  explicitly demonstrates the plural candidate/job-opening scopes used by the code.
  No scope rename is justified by the record-page table alone. Actual tenant consent
  and endpoint scope validation still remain required.
- Local aliases run existing entrypoints and do not create a new deployed Worker.
  The broader B1 environment-isolation architecture remains user-deferred.
- RLS is intentionally unused; private grants/readiness, not missing RLS policies,
  enforce the supported boundary. Current readiness was rechecked, not assumed.
- Pending activation/unverified imported addresses and disabled local Google OAuth
  do not mean canonical account creation failed. Real activation acceptance is still
  missing and cannot be inferred from the synthetic `.invalid` test identities.
- The fixture's connected state does not establish real OAuth. Missing live credentials
  and owner consent are configuration/acceptance blockers, not a newly proven code bug.
- Existing student/university dashboard badge failures are separate legacy missing-table
  issues; they are not evidence that the successful Zoho approval APIs failed.

### 62.5 Remaining plan scope and limits of this audit

Live Zoho discovery/tenant no-email evidence and Google activation are still untested.
Dedicated Bulk API work, merge/delete lifecycle actions, broader non-learner and
sponsorship-only cases, erasure/restore, distributed source quota/key rotation,
production grant remediation, remaining legacy authorization/scoring work, full
repository CI and rollout acceptance remain open. B1 is deferred by user instruction.
The prior 428 tests/33 files and SQL suites were inspected, not rerun for this read-only
source audit. Two focused audit probes supplement them; they are not permanent
regression tests or evidence that the new findings have been fixed.


## 63. Section-62 fixes and regression acceptance — 2 November 2026

All three newly confirmed findings are addressed:

1. [The approval screen](./sp-dash/components/pages/ZohoRecruitPage.jsx) refreshes
   execution history immediately after a decision. Active execution starts the existing
   polling loop even from idle; each tick refreshes records and summary as well as
   history. Unchanged reviews/selections survive background refresh, changed revisions
   lose approval eligibility, and polling stops when work completes. A shared in-flight
   guard prevents overlapping requests across effect refreshes.
2. [The launcher configuration helper](./scripts/lib/zoho-local-config.mjs) validates
   all four local configurations before any probe or flag write, checks all database
   aliases, excludes mail configuration and checks matching sync wiring. The launcher
   then probes real readiness before staging all flag files. Per-file atomic replacement
   rolls earlier files back on failure; it is not a multi-file filesystem transaction.
   Runtimes must restart after success. Discovery stays disabled without OAuth credentials.
3. [The local launcher](./scripts/zoho-local-runtime.mjs) now prepares and checks an
   ignored local dashboard adapter using `build-dashboard`. The adapter imports the
   existing `dashboardRuntime` and `ZohoExecutionAuthority`; its HTTP transport forwards
   only to Next dev, while queues/RPC/recovery use the actual existing modules. It removes
   generated OpenNext/assets from local startup requirements. This adds no deployed
   service and makes no production configuration change. The local setup guide includes
   this preparation step before background startup.

The initial attempt to build the production-shaped OpenNext bundle compiled Next
successfully but failed during adapter packaging on native Sharp resolution. A custom
Next output directory also proved incompatible with the adapter's expected layout.
These are not evidence that the local queue handlers or candidate execution are broken.
The local adapter resolves the bootstrap dependency without a framework upgrade or
unsupported production deployment. Production packaging/framework compatibility remains
a release gate; do not describe that build as passing. Temporary build-source test
collection was also excluded using Vitest's default exclusions plus generated-directory
exclusions; source tests remain included.

Permanent regressions live in [launcher tests](./scripts/__tests__/zoho-local-config.test.mjs)
and [actual React-page tests](./scripts/__tests__/zoho-dashboard-ui.test.mjs). They cover
later invalid configuration, unsafe database aliases, mail/secret rejection, absent
credentials, replacement failure rollback, missing files/runtime preparation, approval
from idle, completion refresh, selection preservation and stale revisions. The expanded
[acceptance runner](./skillpassport/scripts/checks/test-zoho-local-acceptance.mjs) passed:
**10 Node tests + 428 Vitest tests = 438 tests across 35 files**, plus all approver,
canonical candidate/concurrency, control-plane/recovery and job/quota SQL suites.
Disposable test databases were used; no persistent schema migration was needed.

Local post-fix probes also pass: canonical and projection readiness are true,
all four persisted operations remain completed, recovery returns 200, and `enable`
passes real local service/reader/projection checks. Authenticated browser navigation
through Integrations → Open review console shows the synthetic source, completed
candidates and all four receipts. Direct navigation showed a transient return to the
dashboard, but normal in-app navigation succeeded; no new authorization defect or
redirect fix is claimed. The known unrelated legacy badge-table errors remain.

No email runtime was bound, no new real source record was imported, and no production
DB/deployment was changed. These fixes do not close the live OAuth/provider no-email,
Google activation, bulk/lifecycle, erasure, quota/rotation, remaining legacy authorization,
full repository CI and rollout gates listed in section 62.5. B1 remains user-deferred.


## 64. Latest implementation audit and false-positive review — revision 47

This is a source and isolated fault-injection audit, not a claim that the entire plan
or every deployment path has passed acceptance. Section 63's normal approval/startup
fixes stand; two uncovered paths remain. No application source, persistent database,
runtime flags or real source records were changed during this audit.

### 64.1 P2 — Successful approval can still fail to start polling after a refresh error

[Decision submission](./sp-dash/components/pages/ZohoRecruitPage.jsx) refreshes summary,
records and execution history sequentially after recording approval. If summary or
records fails, execution history is skipped. When the page previously had no active
work, the polling effect still sees an empty execution history and does not start.
The approval notice remains, alongside the request error; durable approval/queue work
continues independently. This is an operator-status failure, not lost approval or a
canonical authorization bypass.

An in-memory extension of the actual React-page regression harness injected a 503
only into summary GET after a successful decision POST. The probe confirmed approval
was recorded, execution GET count did not increase, the error was rendered, and there
were zero polling timers. The three permanent success-path component tests also
passed. The probe changed no source or database data and is not a permanent regression.
Fix direction: refresh independent views even if another fails, preserve the durable
approval outcome, and ensure retry/polling starts despite a partial refresh outage.
Add summary/records failure regressions to the permanent harness.

### 64.2 P2 — Local projection preflight proves routing, not dependency readiness

[The enable action](./scripts/zoho-local-runtime.mjs) sends unauthenticated `{}` to the
projection route and accepts 400, 401 or 503. [The actual handler](./skillpassport/functions/lib/zoho-candidate-projection.ts)
checks the flag first, authentication second, request shape third, then its canonical
source binding. Consequently, none of those accepted outcomes establishes that the
Pages runtime has a working canonical projection/readback binding or accepts the
intended transport credential. The separate canonical/database probes do not test
that Pages-to-SSO connection.

An isolated run of the real handler, with database construction forbidden and the
canonical source binding absent, returned 503 with delivery disabled and 401 with
delivery enabled. Both pass the launcher's current predicate. This confirms a
readiness/preflight gap; it does not establish that the currently generated binding
is absent or that the persistent synthetic imports failed. The handler continues
to reject unauthorized requests and uncertain effects safely.

A 503 while delivery is disabled is expected, so simply rejecting all 503 responses
would break the documented flags-off bootstrap and would be a false correction.
Fix direction: an authenticated, non-mutating readiness check independent of write
flags must validate the Pages dependency chain, followed by a post-restart verification.
Do not create a candidate, invent a success receipt, weaken authorization, or temporarily
permit unapproved work merely to test readiness.

### 64.3 False positives rejected and evidence limits

- The three prior findings were not wholly unfixed: normal approval history refresh,
  validated/rollback-aware flag writes and local startup without OpenNext have permanent
  regression or runtime evidence. Section 64.1 is a distinct partial-refresh failure.
- A missing OpenNext artifact does not block the revised local adapter. Production
  packaging remains unresolved; a local adapter does not make a production build pass.
- Local aliases do not add a deployed Worker. B1 remains explicitly deferred.
- Missing RLS is intentional; server authorization/grants are the supported boundary.
- Unverified/pending activation does not mean approved identity creation failed.
  Google activation remains a separate untested acceptance requirement.
- Synthetic connected state is not real Recruit OAuth; absent credentials/consent are
  configuration/acceptance blockers rather than a newly demonstrated OAuth defect.
- Disabled discovery without credentials and preserved unrelated Google flags are
  deliberate. The no-email policy is not relaxed by enabling execution.
- Background refresh of a later-page selection does not prove its revision is fresh;
  server approval fencing still independently rejects stale source/configuration data.
  No approval bypass was demonstrated from first-page-only polling.
- The previously observed browser navigation return is not diagnosed as an authorization
  bug: prior normal in-app navigation succeeded. The shared page was unavailable to the
  browser tool during this audit, so fresh live-browser acceptance was not repeated.
- 438 tests/35 files plus SQL suites are the previous full-run result, not a fresh full
  suite run in this audit. Here, three existing component tests and one new fault probe
  passed; two isolated handler cases exposed the preflight blind spot.

The permanent component harness currently uses job rows and stubs the candidate
review panel. It does not prove the candidate-specific canonical-check → human
acknowledgement → approval click sequence. Candidate SQL/service regressions and
previous authenticated API acceptance still count, but do not replace that missing
full operator-UI acceptance. This is a coverage gap, not a demonstrated candidate
provisioning defect.

### 64.4 Entire-plan work still open

| Area | Current disposition |
| --- | --- |
| Post-approval refresh failure handling | Newly reproduced implementation gap, section 64.1. |
| Positive projection-chain readiness | Newly reproduced preflight gap, section 64.2. |
| Real OAuth/discovery and provider no-email evidence | Credentials/consent and live tenant acceptance still required. |
| Candidate operator UI and no-email activation/sign-in | Full canonical-check/acknowledgement click flow and real Google activation remain unverified. |
| Dedicated bulk/backfill and source merge/delete lifecycle | Dedicated bulk and approved lifecycle coverage remain incomplete; current REST pagination is resumable. |
| Broader non-learner/sponsorship-only accounts | Unsupported contexts remain held, with no invented role/access grant. |
| Canonical erasure/restore, distributed quota/key rotation | Broader operational workflows remain incomplete. |
| Production grants, remaining legacy authorization/trusted scoring, full CI | Still release gates; local synthetic acceptance is not repository-wide completion. |
| Production packaging, controlled pilot and rollout | Still required; local startup success does not close these gates. |
| B1 environment isolation | Deferred by explicit user instruction. |

Historical sections record earlier checkpoints and do not override this status.
No new email side effect or approval bypass was demonstrated by these probes.


## 65. Section-64 corrections and local verification — revision 48

### 65.1 Approval success survives independent refresh failures

[The approval screen](./sp-dash/components/pages/ZohoRecruitPage.jsx) starts summary,
record and history refreshes together and awaits all outcomes. Failure of summary or
records no longer skips history or stops its polling decision. After a successful
approval, a connection-scoped pending-history marker keeps polling active if history
itself fails before any execution is visible. A successful history response clears
that fallback; normal queued/processing history then determines continued polling.
The in-flight guard is held until every refresh settles. Durable approval notices
remain separate from displayed refresh errors.

Permanent component regressions inject summary, records and execution-history outages
after successful approval. They verify history still refreshes, retries start from
idle, completion updates the record, and polling stops after confirmed completion.
Existing selection-preservation and stale-revision regressions continue to pass.

### 65.2 Authenticated, non-mutating Pages dependency preflight

[The existing projection route](./skillpassport/functions/sync/zoho-candidate.ts) now
exposes an authenticated GET implemented by [the readiness handler](./skillpassport/functions/lib/zoho-candidate-projection.ts).
It authenticates before consulting dependencies, checks the snapshot/confirmation
binding methods, invokes the actual Pages-to-SSO policy method with a fixed
non-personal reference, and calls the existing application projection-readiness RPC.
The policy response and literal database result must satisfy the expected contracts.
No caller-selected identity, projection operation, write, confirmation or queue send
is accepted. Errors return generic unavailable responses without dependency details.

Readiness is explicitly `dependenciesReady` plus `readOnly`, version and forbidden-email
policy; `deliveryEnabled` is reported separately. It can succeed with delivery disabled,
and it neither changes flags nor bypasses the existing POST write guard. Authentication
and unavailable/malformed dependency outcomes remain fail-closed.

[The launcher verifier](./scripts/lib/zoho-local-config.mjs) requires HTTP 200 and
positive versioned evidence using the consumer's matching credential at the fixed
local origin. It rejects prior 400/401/503/redirect outcomes as readiness proof. The
`enable` action checks dependencies before writing flags. The new read-only `verify`
action, documented in [the local guide](./ZOHO_LOCAL_TESTING.md), runs after restart:
it requires enabled Pages delivery, the actual canonical execution capability,
matching desired local flags, database readiness, reader authentication and existing
service/queue checks. It changes no configuration or application data.

This proves the checked dependency contracts; it does not manufacture a candidate
receipt or replace real queue delivery/provider acceptance. No new Worker, RLS policy,
SQL migration or production configuration was introduced.

### 65.3 Candidate-specific operator component coverage

[The permanent UI harness](./scripts/__tests__/zoho-dashboard-ui.test.mjs) now imports
the real candidate-review panel. Its synthetic candidate flow verifies: approval is
disabled before checking; canonical check alone still cannot approve; Discover and
pending activation are displayed; explicit human acknowledgement enables selection;
submission carries the reviewed hash and revision; and execution polling updates
completion. Candidate canonical review is no longer stubbed. Only unrelated policy/
privacy panels and framework primitives remain test substitutes. This is actual
component/state coverage with synthetic HTTP responses, not live browser/provider E2E.

### 65.4 Executed verification and remaining gates

The expanded local runner passed **455 tests across 35 files**: 18 Node launcher/UI
tests, 211 dashboard contracts, 95 SSO contracts, 28 existing queue transport tests,
59 educator/subscription compatibility tests and 44 application contracts. All
approver, canonical candidate/concurrency, control-plane/recovery, two-database
projection and job/quota SQL suites passed using disposable fixture databases.
The local frontend/assets and actual Pages Functions bundle rebuilt successfully.
Syntax and child-repository whitespace checks passed.

The restarted local stack passed the new `verify` action, including authenticated
GET readiness and real canonical execution capability. A separate flags-off check
explicitly restarted only this session's Pages process with delivery disabled:
authenticated GET readiness returned 200 and the unchanged POST write guard returned
503. The original local configuration was restored, its private temporary backup
removed, and Pages restarted. Editing vars alone did not hot-reload them; explicit
restart and verification are therefore mandatory in the guide. No persistent migration was
needed. The whole-plan gates in section 64.4 still apply: real Zoho credentials/
consent and tenant no-email evidence, provider activation/full browser E2E, dedicated
bulk and merge/delete/erasure workflows, broader account contexts, distributed quota/
rotation, remaining legacy authorization/scoring and full CI, production packaging,
pilot and rollout. B1 remains user-deferred. Those are not closed by these fixes.

## 66. Remaining non-release implementation — revision 49

This section supersedes the implementation-pending entries in sections 64.4 and
65.4. It does not supersede the no-email, human-approval, no-new-Worker, no-RLS,
local-database-only or release exclusions.

### 66.1 Source inventory, lifecycle and operator controls

[Bulk Read](./sp-dash/lib/zoho/bulk-read.js) uses durable export jobs and resumable
200-row staging checkpoints. It never provisions a destination. Export archives
are bounded to 8 MiB compressed and 16 MiB CSV; larger results must use resumable
REST discovery. ZIP structure, CRC, paths, sizes and CSV records are validated.
Provider creation or token-refresh outcomes that are ambiguous are held rather
than blindly retried. Bulk scope requires explicit Zoho reconsent.

[Private export storage](./sp-dash/lib/zoho/bulk-artifacts.js) reuses the existing
SKILLPASSPORT_ASSETS binding. Archives are encrypted with authenticated context,
expire within seven days or the shorter run/connection policy, and use durable
write/deletion acknowledgements. Unknown in-flight writes keep erasure pending.
The private prefix is outside public asset-serving allowlists. Cleanup needs the
existing background runtime and cleanup flag running; stopping all processing does
not itself prove physical deletion. Old encryption read keys must remain available
while dependent envelopes or cached artifacts still exist.

[Source lifecycle operations](./sp-dash/lib/zoho/source-lifecycle.js) persist deleted
scan cursors, overlap, leases and bounded retries. Observed deletions become review
proposals. Approved candidate removal suppresses that source; approved job removal
stages a closure for the ordinary job approval flow. Manual merge evidence is
verified against the provider: the survivor must exist and the losing record must
be successfully absent. Authorization/network failures are never deletion proof.
Source linkage never merges platform identities. A losing active job must be
closed through normal approval first.

[The operator panel](./sp-dash/components/zoho/OperationsPanel.jsx) exposes export and
deleted-scan history, reviewed merge/delete decisions, shared quota, paused token
rotation, reviewed candidate context and recoverable connector cleanup. The
[server dispatcher](./sp-dash/lib/zoho/operator-actions.js) retains live admin
authorization, source/target/revision checks and actor-bound recovery. The browser
cannot choose an arbitrary canonical account target.

### 66.2 Candidate context and connector privacy

[Canonical administration](./sso-worker/src/rpc/zoho-candidate-administration.ts)
previews the exact changes before separate approval. Establishing an additional
learner context requires an explicit Discover acknowledgement and fresh canonical
review. Existing primary roles, credentials and paid, organizational or sponsored
access remain intact. Application projection validates actual canonical membership
and role context. Unsupported privileged mirror cases remain held.

Connector erasure removes source-owned copies, revokes source approvals, records
permanent erased-operation tombstones and suppresses future source replay. It
preserves the independently established account, subscriptions, platform profile
and learning activity. SSO and application cleanup use bounded, resumable pages;
completion requires application confirmation and export artifact cleanup. Pending
cleanup survives closing the dashboard. Separately reviewed suppression release
does not restore erased data or allow old operation IDs to replay. This is connector
privacy, not platform-account deletion or automatic backup restoration.

### 66.3 Shared quota and key rotation

[Source quota accounting](./sp-dash/lib/zoho/source-quota.js) shares rolling budgets,
concurrency reservations and provider backoff across the same source organization
and region. The configured conservative budget is not a claim about remaining Zoho
credits. Ambiguous requests are charged conservatively. The restricted discovery
role can only reserve or settle through its current run/lease.

[Key rotation](./sp-dash/lib/zoho/token-rotation.js) requires a paused connection,
expected credential generation, exact prior envelope and an audit reason. The
keyring supports legacy reads and an explicit active key; unknown key IDs fail
closed. Generic source operations and REST discovery share durable token-refresh
fencing. No token or key is returned to the operator UI.

### 66.4 Assessment evidence safeguards

Legacy assessment delivery, progress and completion now use authenticated ownership
boundaries. Objective grading binds the delivered question manifest before answers,
uses immutable server grading receipts and invalidates report links after answer
version drift. Current catalog edits cannot change a previously delivered test's
answer keys. Historical unbound/generated-unattested results remain advisory or
unavailable as verified evidence. Subjective AI analysis retains advisory labeling.

[Question delivery](./skillpassport/functions/lib/assessment-question-safety.ts)
removes answer keys and explanations from learner assessment responses. Streaming
assessment generation persists and binds questions before emitting them. Adaptive
session routing verifies the owning learner before reading or mutating a session,
including enumeration and SSO-ID aliases. Session totals and legitimate submitted
answer feedback remain available. Practice course quizzes are a separate contract;
removing their locally required keys would break practice without strengthening
career evidence, so that suspected fix was rejected.

Direct browser table/column/dependent-view grants and legacy adaptive definer RPC
grants are revoked, with a private runtime boundary check. The
[atomic answer commit](./skillpassport/supabase/migrations/20270217070000_adaptive_owned_answer_commit.sql)
locks the owned session, verifies its current question and version, derives
correctness from the server key, and commits response plus counters together.
Matching retries return the persisted result; conflicting retries, stale questions
and historical duplicates fail closed. Existing duplicate history is not deleted.
Real two-session replay/concurrency tests passed. Historical adaptive results are
not promoted into the new manifest-bound objective grading receipts.

### 66.5 Verification and external prerequisites

The final combined acceptance runner passed **682 tests across 55 files**, including
local migration/configuration safety, dashboard connection-switch races, SSO,
transport, compatibility, projection/privacy and assessment contracts. All disposable
SQL suites passed, including real identity/claim/quota/answer races. Local frontend
and Pages Functions builds passed. Migration compatibility was also tested with both
historical enum roles and the actual local text-role schema. The migration derives
its role variable from the real column type instead of assuming the enum exists.

One SSO and eight application migrations are applied and tracked **locally only**;
both databases were backed up first. The application batch rolled back on the
initial role-type mismatch, then committed after the compatibility correction.
No reviewed migrations remain pending. Restarted authenticated dependency checks and
the actual recovery tick passed. Browser checks saved the synthetic source quota,
previewed connector erasure, separately approved it and completed both application
and artifact confirmation. Its canonical account, active subscription and application
learner profile remained present. The synthetic source is suppressed and its old
connector payload erased. The other synthetic learner remains available for review.
These checks used no real Zoho credentials and bound no mail services.

Local configuration serialization now preserves JSON keyrings and multiline
credentials through dotenv parsing; JSON-style escaping had left the keyring
unreadable and caused a real cleanup failure. A round-trip regression and the
successful recovery tick verify the correction. Safe recovery diagnostics identify
only failed component names, without logging payloads, credentials or exception text.
See [the local guide](./ZOHO_LOCAL_TESTING.md) for the exact setup and limits.

Real Zoho OAuth connection, live source discovery, production-shaped export limits,
and tenant/provider no-email assurances require the owner's credentials and test
organization. Real no-email Google activation also needs a configured approved
provider flow. Synthetic SQL, service contracts and component tests cannot substitute
for those external acceptance steps. Unrelated whole-repository CI remediation,
production grants, production packaging, deployment, pilot and rollout remain
release work and were excluded by the user. B1 environment isolation remains deferred.

## 67. Post-implementation audit — revision 50

This audit supersedes the blanket non-release completion claim at revision 49.
The earlier 682-test result remains valid for those cases; it did not exercise the
four gaps below. This audit changed documentation only. Synthetic SQL probes used
an explicit transaction ending in ROLLBACK; no audit test rows were retained.

### 67.1 Confirmed implementation gaps

1. **Bulk OAuth permission is never requested.** The authorization URL in
   [the OAuth adapter](./sp-dash/lib/zoho/oauth.js) asks for module, organization and
   metadata permissions, but omits `ZohoRecruit.bulk.read`. The normal reconnect
   flow therefore cannot obtain the extra permission that bulk creation requires.
   [Recruit's create-job contract](https://www.zoho.com/recruit/developer-guide/apiv2/bulk-read/create-job.html)
   explicitly requires bulk-read permission with the module permission. Add the
   required read scope to the appropriate reviewed consent flow and test the actual
   generated authorization URL; do not solve this with module write/ALL scopes.

2. **Privacy receipts lack a canonical ordering fence.**
   [SSO receipt lookup](./sso-worker/supabase/migrations/20270217020000_zoho_candidate_administration.sql)
   returns the durable historical receipt for the original active actor.
   [Application administration](./skillpassport/supabase/migrations/20270217040000_zoho_candidate_context_privacy.sql)
   validates request replay and source/target scope, but does not order different
   requests for the same source identity. If canonical erase E commits, then release
   R commits, application delivery R followed by delayed E can leave the application
   suppressed while SSO is released. The reverse stale-release case can clear the
   application suppression after a newer canonical erase. Rollback-only SQL confirmed
   that reverse-delivered receipt-shaped commands are accepted. This does not prove
   account deletion, an email side effect or loss of the existing SSO replay fence;
   it proves cross-database administration state can diverge. Add canonical source-
   scoped ordering/current-state evidence and atomic application fencing, or prevent
   the next opposite action until its predecessor is confirmed across both stores.
   Cover both delivery orders, delayed pages and exact-request retries.

3. **History limits hide actionable pending work.**
   [Lifecycle snapshot](./skillpassport/supabase/migrations/20270217010000_zoho_source_lifecycle.sql)
   always returns the latest 100 proposals, including completed decisions, without a
   cursor. One older pending proposal disappeared when the rollback probe inserted
   100 newer approved proposals. Similarly,
   [operator snapshot](./sp-dash/lib/zoho/operator-actions.js) limits administration
   history to the latest 20 entries before the UI filters completed cleanup. Twenty
   newer completed entries hid an older incomplete entry. The records remain in the
   database, but the promised dashboard control cannot reach them. Provide bounded
   keyset pagination and separate pending/history views; keep actor/source scope and
   include artifact-pending entries, not just rows with `completed=false`.

4. **An SSO-only committed administration is not rediscovered after reload.**
   [Execution dispatch](./sp-dash/lib/zoho/operator-actions.js) calls SSO before it
   creates application progress. If SSO commits and its response is lost, or the
   dashboard stops before application progress, the durable receipt exists only in
   SSO. The panel retains its request ID in React state/ref, which disappears on
   reload, while pending recovery history reads only application progress. Existing
   lookup requires the already-known request ID; it does not list these operations.
   The canonical receipt is not lost, but the dashboard cannot discover it. Persist
   an actor/source-bound intent before the remote call and reconcile it through the
   existing runtime, or expose narrowly scoped canonical recovery enumeration. Test
   commit-before-response-loss followed by a full page remount with no client memory.

### 67.2 False positives rejected

- **Bulk `selectfields`, lowercase CSV `id`, ZIP results and the result path are not
  proven contract mistakes.** Recruit's own
  [create-job](https://www.zoho.com/recruit/developer-guide/apiv2/bulk-read/create-job.html),
  [job-details](https://www.zoho.com/recruit/developer-guide/apiv2/bulk-read/job-details.html)
  and [download](https://www.zoho.com/recruit/developer-guide/apiv2/bulk-read/download-result.html)
  pages support those shapes. CRM's newer API contract must not be substituted.
- **Deleted-record response casing and endpoint match Recruit's contract.** The
  [deleted-record documentation](https://www.zoho.com/recruit/developer-guide/apiv2/get-deleted-records.html)
  uses the implemented endpoint and lowercase `recycle` response value. HTTP errors
  are not interpreted as successful absence.
- **No remaining direct browser answer-key exposure was reproduced locally.** The
  read-only recursive grant query over question catalogs, grading receipts, generated
  authority and question manifests found no browser SELECT/column-SELECT access on
  those tables or dependent views. The checked exposed definer-RPC search also found
  no matching catalog/receipt reader. This is evidence for the current local grants,
  not a guarantee about future migrations or unrelated endpoints.
- **Broad export invalidation during connector erasure is intentional.** A cached
  candidate export can contain the erased source record among many rows; deleting
  that source organization's candidate archives prevents retaining those copies.
- **Preserving an independent learner account during connector erasure is required.**
  It is not a failed account-deletion implementation. Erased operation IDs remain
  tombstoned, and separately approved release does not restore their payloads.
- **Real credentials/provider consent, no-email tenant verification and live provider
  activation are external acceptance prerequisites.** Release work remains excluded;
  B1 remains explicitly deferred. None is evidence of an unauthorized email or a
  reason to introduce another Worker or RLS.

### 67.3 Evidence limits and next correction scope

The pagination and receipt-ordering probes executed successfully against local
PostgreSQL and rolled back. OAuth omission and SSO-only recovery visibility were
confirmed from the actual authorization builder, sequential dispatcher, canonical
lookup contract and panel state lifecycle. No new email side effect, automatic
candidate/job approval, canonical-account deletion or browser role escalation was
established by this audit. The four implementation gaps need targeted fixes and
regressions before restoring a blanket non-release completion claim. The previous
real-provider and release acceptance exclusions still apply.

## 68. Section-67 fixes and local acceptance — revision 51

All four confirmed findings in section 67 are addressed. Historical audit findings
remain above as evidence of the original behavior; this section supersedes their
open status. No release, production database, email service, new Worker or RLS
policy was introduced.

### 68.1 Bulk permission and recovery discovery

[The OAuth authorization URL](./sp-dash/lib/zoho/oauth.js) now requests
`ZohoRecruit.bulk.read` with the existing read permissions. A regression inspects the
actual generated consent URL, its region, state hash and absence of module write/ALL
permissions. Existing real connections need reconsent; no live tenant was connected.

[Canonical pending enumeration](./sso-worker/supabase/migrations/20270218010000_zoho_administration_recovery.sql)
returns protected source-scoped references with fixed-size keyset pages, independent
of application progress or browser memory. The operator desk has a dedicated
canonical recovery list. A response lost after SSO commit remains discoverable after
reload. A currently active platform super-admin can recover a previously committed
operation even if the original approver is revoked. Recovery does not grant a new
canonical effect; original approval attribution remains immutable, with recovery
attribution recorded separately.

### 68.2 Ordered privacy completion

SSO assigns a monotonic source-scoped administration version and retains a pending
confirmation barrier. New administration cannot overtake an unconfirmed operation.
Exact execution retries still bind the original actor, context and review hash;
readback/recovery uses the current live administrator's authority. Only after full
application and artifact confirmation does the dashboard acknowledge the canonical
operation and unblock subsequent actions. Learner-context-only administration also
acknowledges its completed context before returning for fresh candidate review.

[Application ordering](./skillpassport/supabase/migrations/20270218030000_zoho_administration_order.sql)
retains a source watermark across completion. Older receipts/pages and equal-version
conflicting requests fail closed, including delayed erase after release and delayed
release after a new erase. Bulk invalidation uses a request/version-bound overload
under the same source lock, so a delayed old recovery cannot invalidate newer exports.
The unfenced overload is no longer executable by the application service role.

Historical completed progress with version zero is reconciled through the new
wrapper before confirmation; partial legacy progress resumes its saved cursor.
A failed/lost acknowledgement remains pending in SSO and discoverable in the UI.
Readiness checks cover the new private data and capabilities. These changes preserve
independent accounts, credentials, access, learner profiles and learning activity.

### 68.3 Pending work and history pagination

[Operator history](./skillpassport/supabase/migrations/20270218020000_zoho_operator_history.sql)
uses stable creation-time/UUID keysets with fixed 25-row pages. Lifecycle pending
and held decisions are separate from terminal history. Application cleanup remains
pending when SQL pages or artifact confirmation are incomplete; source-scoped pending
work includes other approvers so revocation cannot hide committed cleanup. Completed
application history remains actor-bound. Canonical recovery uses fixed 50-row pages.
[The operator panel](./sp-dash/components/zoho/OperationsPanel.jsx) exposes independent
views and Load more controls, with errors shown explicitly and connection-switch
results fenced. New completed entries cannot crowd pending work out of view.

### 68.4 Executed evidence and remaining prerequisites

Full combined acceptance passed **712 tests across 57 files**: 31 local safety/UI
checks, 305 dashboard contracts, 122 SSO contracts, 28 existing transport contracts,
59 synchronization compatibility cases, 44 application contracts and 123 assessment
cases. All disposable SQL suites passed, including canonical and application ordering,
502-operation erasure pagination, cross-admin recovery after approver revocation,
51-item canonical recovery cursors, mixed artifact-pending state, historical partial
and completed upgrades, reversed receipts, stale export invalidation and private
grants. Projection fixtures use both enum and text role schemas; existing two-database
fixtures also load the new migrations. Syntax and repository whitespace checks passed.

The initial fixture failures were corrected without weakening production safeguards:
the projection fixture now loads the actual bulk-erasure dependency, and the missing-
approval-actor rejection probe removes the JSON field from the complete merged object
rather than only its right-hand fragment. These were fixture defects, not evidence
that the final production checks should be relaxed.

One SSO and two application migrations were backed up, applied and tracked locally.
The read-only migration plan now reports zero pending reviewed upgrades. Authenticated
runtime readiness and the actual recovery schedule passed. In a fresh browser session,
the synthetic historical erase action appeared under Canonical recovery despite its
completed legacy application row. Recovery upgraded its application version, completed
artifact confirmation and acknowledged SSO. The pending entry disappeared and the
synthetic user/learner rows remain present; the existing canonical operation was
recovered rather than executed again. See [the local guide](./ZOHO_LOCAL_TESTING.md).

Real Zoho OAuth connection/reconsent, live provider exports/discovery, provider
activation and tenant no-email assurances still require owner-controlled credentials
and acceptance. This local evidence does not replace those checks. Release remains
excluded and B1 remains deferred. No further implementation gap is claimed closed
merely because it is outside these targeted checks.


## 69. Live provider discovery and operator progress (3 November 2026)

The India tenant exposed API differences that mocked responses did not cover:

- Authorization requires singular module scope names. Organization verification
  uses the exact string `zgid`, with legacy `id` support only when `zgid` is absent.
- The live Get Records endpoint rejects `converted=both` with HTTP 400
  `PATTERN_NOT_MATCHED`, although its documentation lists that value. Discovery
  now reads `converted=false` and `converted=true`, ten records each at the same
  durable page. Both reads must succeed before the page commits; either stream's
  `more_records` continues discovery. The existing twenty-record staging bound is
  preserved. A record observed in both streams retains its newest source version.
  Source merge evidence also checks both streams before treating a loser as absent.
- This tenant's original system “Modified Time” field has API name `Updated_On`.
  Discovery resolves missing system timestamps from field metadata, accepts only
  one noncustom datetime field with the system label, and re-reads the projected
  page. A bounded five-minute cache stores schema names only, scoped by source,
  region, credential generation and module. No current-time or custom-field
  substitution is used. Missing/ambiguous metadata fails closed.

The progress panel beside the review table shows an immediate starting state,
queue/retry status, current batch, elapsed time, received/staged/deferred/not-staged
counts, and the last refresh. Active scans refresh every three seconds; duplicate
clicks are disabled. Progress is indeterminate because the provider has not supplied
an inventory total. Finished-with-exceptions and checkpoints are distinct from full
completion. Source/module switches fence progress to the selected context.

The earlier local scan had accumulated schema exceptions before field resolution
was corrected. It was stopped with its history preserved, then restarted from the
first page. Browser and local database checks observed 60 received and 60 staged in
that fresh scan, without destination approvals. The scan was still running at that
checkpoint; this is not evidence of complete inventory coverage or destination
creation. The dashboard Zoho suite passed 324 tests in 23 files. No release or
remote database changes were made. See [local testing](./ZOHO_LOCAL_TESTING.md).


## 70. Console audit fixes and local acceptance — revision 53

The confirmed console audit findings are addressed:

- Decision failures appear inside the named approval dialog. Selection is bounded
  to fifty exact revisions across loaded pages. Tabs support keyboard navigation.
- Mobile review opens a focused, dismissible drawer; the operator layout wraps
  without document overflow at a 390-pixel viewport.
- Selected sources survive navigation and OAuth returns. Source/request generations
  fence delayed responses. Independent history failures cannot discard discovery
  progress, and resolved deferred rows leave the refreshed history window.
- Privacy controls distinguish loading from failure and offer retry. Disabled
  actions explain reason requirements. Disconnect requires a separate dialog and
  typed confirmation. A successful mutation followed by refresh failure is labeled
  as saved, including job policy reloads.
- Header refresh reloads Zoho views, privacy and operations. Saved quota values
  populate editable fields; active bulk/deletion operations poll without replacing
  unsaved quota edits.
- Review search and state filters run on the server with source scoping, literal
  wildcard handling, exact totals and bounded keyset pages. Discovery, execution
  and deferred histories expose older-page controls.
- Count-only shared navigation replaces legacy full-list count requests. Missing
  local university/student review sources are explicitly unavailable and counts
  remain null; the badge indicates a partial total. College counts use the actual
  organizations source. Missing legacy list schemas produce an explicit 503.

Independent discovery pause/resume/cancel now uses durable server controls.
Pausing invalidates outstanding leases while preserving the checkpoint and
approvals. Resume continues the same run and excludes paused time from its budget.
Cancelled scans retain staging and history. The existing scheduler skips paused
runs; no new worker or RLS dependency is introduced. Control reasons are hashed in
an append-only audit table and direct bypass helpers lose execution grants.

The additive application migration
[console controls](./skillpassport/supabase/migrations/20270219010000_zoho_console_controls.sql)
was backed up and applied only to local databases. The private backup manifest is
under ignored `sp-dash/.wrangler/zoho-local/db-backups/20261103T100538425Z-2743999/`.
The reviewed migration plan reports zero pending migrations.

Full local acceptance passed **741 automated tests** plus all six disposable SQL
suites, including real two-session races and two-database projection checks.
Rendered UI tests cover modal error recovery, fifty-record limits, source
persistence, keyboard tabs, independent history failures, quota restoration and
saved-policy refresh failure. SQL fixtures cover pause/resume/cancel, stale leases,
source fences, audit grants, literal search, totals and cursor boundaries.

Browser checks verified server search/state filtering, a protected disconnect
confirmation, header refresh, the mobile drawer and selection cap. A live local
scan was paused, resumed under the same run ID, then cancelled after saving thirty
records from the source. The connection stayed active at configuration revision 3;
no destination approval was submitted. Existing staging is retained. These checks
do not certify complete source inventory coverage, tenant-wide no-email effects,
production bindings or provider job/export acceptance. Release remains excluded.


## 71. Five reproduced follow-up console fixes — revision 54

The follow-up audit reproduced five remaining defects rather than inferring them
from appearance. All five now have implementation changes and regression checks:

1. Background refresh re-fetches the loaded record window through bounded cursor
   pages. It replaces that window, revalidates later-page revisions and removes
   rows that stopped matching the filter. Only unchanged selections and canonical
   reviews survive. A read sequence rejects superseded responses. This replaces
   the old first-page merge that could show 51 displayed against a total of 50.
2. Mobile drawer visibility is separate from the selected record. Dismissing the
   drawer retains the candidate for administration. An explicit navigation control
   closes the drawer, scrolls to source operations and focuses its reason field.
3. A completed requested discovery no longer pins progress to an obsolete run.
   A newer active/paused run takes precedence; newer terminal history is also
   reflected. Request-error text is suppressed once durable run state is available.
4. Hold/reject confirmation is disabled when background revalidation empties the
   selection. Submission independently rejects an empty selection before a request.
5. Filter/source/module reads clear the prior count, show Loading records and mark
   the panel busy. Empty-result messaging waits for the response. Stale response
   completion cannot clear a newer read's loading state.

Full local acceptance passed **747 automated tests** and all six disposable SQL
suites. Targeted final progress/control tests also passed after extending the
newer-run check to completed history. Rendered tests cover the exact stale-row and
zero-selection reproductions, a later-page revision change, loading feedback and
mobile selection retention. Browser checks at 390 pixels verified that candidate
administration remains visible and receives focus after drawer navigation, with no
document overflow. A delayed real read showed loading rather than false emptiness.

No migrations or real destination decisions were introduced by these fixes. The
real source remains connected and the earlier control-test discovery stays
cancelled. No emails, release or remote database changes were performed. Missing
legacy local review sources remain explicitly unavailable; they are not treated as
Zoho discovery failures. Backend revision/state fences continue to reject stale or
empty decisions; the reproduced UI defects did not demonstrate an approval bypass.


## 72. Server configuration ownership — revision 55

Each owning service now normalizes Zoho flags through one server module:
[dashboard](./sp-dash/lib/zoho/config.js),
[SSO](./sso-worker/src/lib/zoho-config.ts) and
[application projection](./skillpassport/functions/lib/zoho-config.ts).
These modules expose immutable mandatory policy and explicit deployment flags,
without copying credentials or runtime capability objects. Auth-sync adds no Zoho
configuration module because it has no Zoho-specific environment variables.

Transport timeout, response-size, retry-delay and recovery-cadence defaults are
code constants. Durable SQL limits, leases and quota transactions remain owned by
the database; no migration is needed. Quotas, retention, mapping policies and pause
controls already have database-backed operator controls and remain there.

Only exact string true enables an operation. Provisioning, execution, job writing,
discovery, source operations, projection delivery, cleanup and background work keep
independent deployment controls. Missing/malformed flags disable their operation.
Dashboard preview values other than absent or exact string false block all flags.
No flag can override human approval requirements or the no-email prohibition.

The obsolete ZOHO_RECOVERY_CRON variable was removed from tracked configuration and
local setup generation; one existing local copy was removed without revealing or
altering secret values. The application cadence constant remains two minutes and
actual scheduled events are checked against it. Tests assert all three existing
Wrangler schedules match. The missing source-operations flag is now explicitly
false in production, development, preview and QA declarations. No checked-in
operation was enabled and no deployed settings were changed.

OAuth client ID/callback, environment identity, service URLs and encryption active
key ID remain deployment-specific configuration. Client IDs and key IDs are not
secrets. OAuth secrets, encryption keyring/legacy read key, restricted database
reader token and internal/database credentials stay external. Existing credential,
keyring and independent runtime-readiness validators remain authoritative. Queue,
service and R2 resources stay in Wrangler as platform bindings. No new worker,
RLS dependency or environment-isolation work was introduced.

Final full local acceptance passed **756 automated tests** plus all six disposable
SQL suites. Added tests cover independent controls, strict parsing, preview gates,
immutable policy, exclusion of secrets/bindings, environment changes and deployment
schedule/flag consistency. Local runtime probes passed without data writes. SSO
full type-check still reports the same six diagnostics as a separately extracted
committed baseline; this refactor introduces no new diagnostics. The diagnostics
concern pre-existing test ExecutionContext fixtures and an OAuth-test property type.
No database migrations, real approvals, emails, deployments or releases were run.

See [dashboard configuration ownership](./sp-dash/lib/zoho/README.md#configuration-ownership-3-november-2026)
for the maintenance matrix. The versioned workspace-support copies are synchronized
with the root documentation and local setup scripts.


## 73. Configuration follow-up fixes and inventory — revision 56

Three verified gaps from the refactor audit are fixed:

- Operator source readiness and start-action guards now share the consumer's
  background/discovery/source-operation/preview gates and require a working queue
  producer capability. Disabled starts are rejected before credential parsing or
  mutation. The existing storage, OAuth, source-state and SQL checks remain.
- Discovery and approved-execution retry paths use the same retry constant as the
  source-operation consumer. A regression substitutes a different default and
  verifies both queues use it, rather than repeating the old literal.
- Local schedule generation and manual tick URLs use pure helpers importing the
  application recovery cadence. Root tooling no longer repeats the cron literal.
  Production/development/QA schedules stay explicitly declared and tested.

[Environment inventory](./sp-dash/lib/zoho/ENVIRONMENT.md) documents all 17 active
Zoho-specific string variables: eight deployment switches, five nonsecret
settings and four secret/credential names. Shared projection delivery is counted
once even though three services configure it independently. The inventory lists
six externally bound Zoho capabilities, two internal adapter objects and existing
shared database, auth-sync transport and SSO dependencies separately. Code
constants and the removed cron variable are explicitly excluded from active vars.
No secret values are recorded and no additional deployment is introduced.

Full local acceptance passed **766 automated tests** plus all six disposable SQL
suites. New coverage verifies the operator/consumer gate under disabled background,
discovery/source flags, preview and missing queue; disabled API actions perform no
DB work. Positive readiness, substituted retry defaults and generated local
schedule/manual tick consistency also pass. Existing no-email and exact-approval
boundary tests remain green. The prior six baseline SSO type diagnostics remain
outside this follow-up's code changes. No new migration, real approval, email,
release or deployment was performed. Workspace-support copies were synchronized.


## 74. Code-owned nonsecret configuration — revision 57

Supersedes the environment ownership described in sections 72–73. Nonsecret Zoho
switches, callback URLs, queue identity and preview behavior now live in immutable
application profiles. Dashboard, SSO and SkillPassport retain their independent
policy modules. Production/development/QA defaults stay disabled; the existing
local loopback setup selects the enabled local profile. Local preparation remains
review-only until dependency verification selects the enabled local context.
Existing platform `ENVIRONMENT`, infrastructure URLs and Cloudflare bindings retain
their shared platform ownership. No additional worker or database change is needed.

Only six Zoho-specific credential/key names remain external: OAuth client ID and
secret, encryption keyring and active key ID, legacy/single encryption key and
restricted discovery DB token. Key identifiers remain alongside their key
management configuration. [Current inventory](./sp-dash/lib/zoho/ENVIRONMENT.md)
lists every remaining name, retired setting, binding and shared dependency.
Obsolete local settings were removed without changing credential values.

The known local OAuth callback is a constant. Remote callbacks remain unset until
actual dev/QA/production dashboard origins are supplied; remote OAuth is therefore
unavailable until those constants and the corresponding Zoho registrations are
completed. Unknown/preview profiles stay disabled. Retired environment variables
cannot override code profiles. Global background disablement also fences nested
processing adapters. No-email and exact human approval checks remain mandatory.

Full local acceptance passed **766 automated tests** and all six disposable SQL
suites, including the two-database candidate flow with actual code-owned profiles.
Unit policy matrices inject test-only policies rather than enabling production
environment overrides. Pages Functions build passes. SSO type checking retains
six existing baseline diagnostics; no new diagnostics remain. Local dependency
probes and versioned workspace support synchronization are checked separately.
No real approval, email, deployment, release or database migration was performed.


## 75. Configuration audit fixes — revision 58

The application profile selector now honors the existing `VITE_SUPABASE_URL`
fallback with exactly the admin database client's precedence: a truthy primary
`SUPABASE_URL` wins. It does not treat a local fallback as permission to use a
remote or malformed primary. Preview, review-only and remote deployment profiles
remain disabled. SSO and application environment contracts now explicitly declare
the shared platform context; the application also declares its existing URL fallback.

Permanent dashboard regression tests use the real config module and real narrow
runtime adapters, with synthetic provider/storage dependencies. They verify
local discovery reaches staging without identity/email effects, disabled profiles
avoid storage/recovery and malformed/mixed aliases cannot enable processing.
The application regression checks the actual admin client's outgoing RPC URL and
profile selection agree; precedence, unsafe URLs and deployment gates are covered.
Existing mocked policy matrices remain useful for isolated consumer branches and
are not claimed as standalone verification of the real profile wiring.

Validation: **772 automated tests**, all six disposable SQL suites and the Pages
Functions build pass. SSO type checking retains the same six committed baseline
diagnostics, with no new diagnostics. Workspace-support documentation is synchronized.
No database migration, real approval, email, release or deployment is required.
Remote callback constants still need confirmed dev/QA/production origins; no URLs
were guessed and those profiles remain disabled.


## 76. Dev merge compatibility and database validation — revision 59

Latest dev changes are integrated without rewriting feature commits. Assessment
specialization remains supported through bounded modern start input, an
owner-filtered profile update and the authenticated learner-context endpoint.
Session generation guards, canonical grade/resume state and server ownership
remain intact; failed or stale starts do not consume pending specialization.
The additive `20270219020000_assessment_specialization_context.sql` migration
extends the existing context RPC field list without changing its owner, state or
service-role-only grant boundary. It is tested only in disposable local databases
in this merge task, not applied to any shared or persistent project database.

Historical administration version/fence initialization and operator-history
backfill move from migrations into explicit matching dev/production upgrade seeds:
- SSO: `20270218010000_seed_zoho_administration_recovery.sql`.
- Application: `20270218020000_seed_zoho_operator_history.sql`.

Apply upgrade seeds after schema changes and before enabling processing. The SSO
seed leaves current versioned receipts/fences unchanged on rerun and rejects mixed
unreconciled state. Candidate readiness and administration entrypoints reject
legacy zero-version operations until initialized. Existing installations where the
old migration already performed these updates are compatible with the idempotent
seeds. Operator timestamps preserve historical update time without modifying
newer records. No migration checks are bypassed.

The database validator now recognizes catalog-driven GRANT/REVOKE and index DDL
inside executed blocks, while tests continue rejecting real DML, unknown dynamic
SQL, concatenated commands and opaque procedure calls. This fixes actual DDL false
positives; real data-changing statements remain forbidden in schema migrations.
Auth-sync retains the newer upstream worker type dependency alongside the Zoho
transport tests. Full local acceptance, specialization/session regressions and CI
SQL/encoding checks are rerun against the integrated branches before merging.
Merging source does not apply these migrations/seeds or enable remote profiles.
