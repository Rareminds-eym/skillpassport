# Learner job recommendation remediation archive

Published with the recommendation hardening branch on 2026-10-16.

The original audit documents and evidence were authored in the parent workspace,
outside this Git repository. `workspace/` preserves that layout and its recorded
history so the reports and evidence travel with the implementation.

- [Implementation and remaining release gates](workspace/LEARNER_JOB_RECOMMENDATION_IMPLEMENTATION.md)
- [Engineering fix plan](workspace/LEARNER_JOB_RECOMMENDATION_FIX_PLAN.md)
- [Historical audit](workspace/LEARNER_JOB_RECOMMENDATION_AUDIT.md)
- [Evidence guide](workspace/audit-evidence/learner-job-recommendations/README.md)

Recorded local verification: 186 tests across nine files, 24 passing independent
boundary checks with two historical skips, isolated PostgreSQL/pgvector migration
assertions, frontend and Functions builds, and a ten-file selected type guard.
The full repository typecheck is not green. Nothing in this archive certifies a
deployment, production quality, external employer submission, or audit closure.

## Reading and reproducing the snapshot

Original source paths beginning `skillpassport/` refer to this repository's root.
Other workspace-relative paths refer to files beneath `workspace/` here. Source
links and archived runners retain the original workspace assumptions; they are
not silently rewritten or relabelled as new evidence. Absolute paths inside test
results describe the machine on which those historical tests ran.

For the archived runners, use the original parent-workspace layout: a
`skillpassport/` checkout beside the three root reports and `audit-evidence/`.
Do not execute SQL fixtures or mutation assertions against staging or production.
The separate catalog-only preflight is for approved read-only live inspection.

Changes to archived documents or scripts invalidate their recorded fingerprints.
The original parent-workspace copies remain untouched. Generated knowledge graphs
are Git-ignored and intentionally not included in this publication.
