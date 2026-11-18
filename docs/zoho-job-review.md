# Zoho job import

Jobs use the same staged workflow as candidates:

1. Discover source records through the existing bounded REST queue.
2. Validate and stage proposals without creating destination jobs.
3. Review and approve individual records or all eligible staged records.
4. Process approved revisions through the existing execution queue.
5. Confirm completion from the transactional destination receipt.

## Source mappings

Client Name supplies company and City supplies location. Department is optional.
Exact source status and employment labels map to the platform's existing enums.
Unknown labels remain validation issues rather than silently publishing a job.
Existing mappings are preserved. Where no policy exists, Integration settings
prefills standard mappings for a one-time save. Policy edits retain the existing
configuration revision fence, audit reason and explicit no-email acknowledgement.
Each job still requires approval after the mapping is enabled.

## Ordinary execution checks

The publisher validates the live approval, actor, lease, source revision, immutable
approved payload, current mapping and expected destination. Imported jobs belong
to SkillPassport Platform. Existing source links identify updates; titles and
company names are never used to take over another job. Target fingerprints detect
concurrent edits to that specific job; these small record hashes remain distinct
from the removed database-catalogue fingerprint mechanism.

Organization entitlement/capacity checks, transactional target locks, post-write
checks and atomic operation receipts remain. Receipt replay does not create a
second job. Uncertain outcomes continue through receipt reconciliation. No email
provider or email queue is part of this flow, and imported jobs have no learning
requirements that would enqueue learning-match notifications.

## Removed machinery

The forward [simple-import migration](../supabase/migrations/20270317000000_zoho_simple_job_import.sql)
removes runtime SQL tokenization, recursive database-dependency traversal,
executable-catalogue snapshots, catalogue paging, policy fingerprint storage,
and the private batch-fingerprint overloads. Staging checks source fields and
mappings directly. Readiness checks current policy and browser write privileges;
it does not parse database functions or compute a catalogue digest.

The dashboard mapping form no longer contains a database executable-surface
inspector or sends a fingerprint. Source hashes, approval revisions and destination
record fingerprints remain because they provide duplicate and concurrent-edit
protection without catalogue scanning. Future database changes follow ordinary
migration review and testing, as in the candidate flow.

## Verification

Run `node scripts/checks/test-zoho-job-publisher-sql.mjs --simple` from this project.
The harness creates a disposable database and drops it afterward. It applies the forward migrations, verifies the
scanner functions are removed, and installs a test-only poison function that
throws if any active path still calls the retired fingerprint. It then exercises
readiness, mapping reads and saves, discovery, approval, job creation/update,
receipt replay, no-email effects, source suppression and full batch rollback.

The default SQL command also runs upgrade regressions before verifying the current
simple import. The optional --simple flag runs only the current import suite.
Retired scanner modes and their dedicated fixtures have been removed. Dashboard library
and rendered tests also cover policy loading, saving and individual/bulk approval
without scanner response fields.

Both SQL modes also test concurrent publishing after the final migration. Two
approved jobs from separate source connections contend for the Platform's last
available slot. The harness observes both writers waiting on locks before releasing
the publisher, then verifies one completed receipt, one no-effect receipt, replay,
capacity, ownership links and no notification work.

## Rollout

This replacement is prepared locally and has not been applied to QA or the
existing local application database. Every target requires explicit approval.
Apply database migrations in order through the simple-import migration, then
release the matching dashboard code. The retired policy-configure RPC signature
is removed: coordinate this short rollout rather than adding an alternate legacy
execution path. Existing source records, jobs, approvals and receipt history are
preserved. Old migrations and historical audit JSON remain as migration history.

No policy is automatically approved by the scanner-removal migration. Recovery
uses the existing source checkpoints and explicit approved operations. A rollback
requires a separately approved forward migration and matching application version.
