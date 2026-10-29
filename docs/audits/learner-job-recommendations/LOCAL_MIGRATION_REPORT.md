# Local database migration result — 29 October 2026

All unapplied repository migrations were applied to the local application and LTE databases. Final ledger comparison reports zero pending migration files in both projects. No remote database or deployment was changed.

## Applied migrations

| Local database | Version | Migration |
| --- | --- | --- |
| skillpassport | `20261027160000` | [20261027160000_repair_recruiter_semantic_rpc.sql](../../../supabase/migrations/20261027160000_repair_recruiter_semantic_rpc.sql) |
| skillpassport | `20261027170000` | [20261027170000_handle_missing_candidate_unlock.sql](../../../supabase/migrations/20261027170000_handle_missing_candidate_unlock.sql) |
| skillpassport | `20270121000000` | [20270121000000_jobs_only_recommendations.sql](../../../supabase/migrations/20270121000000_jobs_only_recommendations.sql) |
| skillpassport | `20270122000000` | [20270122000000_recommendation_context_revisions.sql](../../../supabase/migrations/20270122000000_recommendation_context_revisions.sql) |
| skillpassport | `20270123000000` | [20270123000000_learner_career_preferences.sql](../../../supabase/migrations/20270123000000_learner_career_preferences.sql) |
| skillpassport | `20270124000000` | [20270124000000_recommendation_candidate_filters.sql](../../../supabase/migrations/20270124000000_recommendation_candidate_filters.sql) |
| skillpassport | `20270125000000` | [20270125000000_recommendation_learning_dependency.sql](../../../supabase/migrations/20270125000000_recommendation_learning_dependency.sql) |
| skillpassport | `20270126000000` | [20270126000000_recommendation_freshness.sql](../../../supabase/migrations/20270126000000_recommendation_freshness.sql) |
| skillpassport | `20270127000000` | [20270127000000_career_preferences_concurrency.sql](../../../supabase/migrations/20270127000000_career_preferences_concurrency.sql) |
| lte | `20261022105000` | [20261022105000_recommendation_learning_summary.sql](../../../../lte/supabase/migrations/20261022105000_recommendation_learning_summary.sql) |

Each migration and its original SQL were recorded in the local Supabase ledger within the migration's transaction. Local PostgREST schema reloads were requested afterward. Targets were the existing `supabase_db_skillpassport` and `supabase_db_lte` containers, database `postgres`, exposed locally on ports 54322 and 54347.

## Backup, dry run and verification

Full custom-format backups and a manifest with SHA-256 digests are retained in [the ignored local backup directory](../../../supabase/backups/local-recommendations-20261029T063046Z/). The directory is private, and archive/manifest files have owner-only permissions.

The migrations first passed against restored temporary copies, which were removed after testing. A fully validated disaster-recovery restore is **not** established: scheduler objects were omitted from the temporary copies because pg_cron is tied to its configured database; an ACL for an unavailable generated GraphQL wrapper was omitted; existing foreign keys were recreated without initial validation and then checked. Ten application foreign keys could not validate because of existing orphan rows. Those rows and the original databases' foreign-key constraints were not changed. Original full backup archives retain these objects and data.

After application, function signatures, revision tokens and browser/service-role privileges passed checks in both local databases. A rollback-only test on the real application schema passed preference compare-and-save, stale-write rejection, opt-out preservation, owned freshness reads and the missing-candidate contract. LTE summary projection executed successfully. No test records were retained.

Code deployment, signed-in acceptance, independent relevance evaluation, operational measurements and the remote rollout gates remain open in the [release checklist](./RELEASE_CHECKLIST.md).
