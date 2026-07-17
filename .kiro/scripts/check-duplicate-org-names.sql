-- =====================================================
-- Pre-Migration Check: Duplicate Organization Names
-- =====================================================
-- Purpose: Verify no duplicate org names before deploying unique constraint
-- Migration: 20260702000002_make_org_name_unique.sql
-- Documentation: .kiro/verifications/2026-07-17_unique-org-names_pre-migration-check.md
--
-- Usage:
--   psql $DATABASE_URL -f .kiro/scripts/check-duplicate-org-names.sql
--
-- Expected Result: 0 rows
-- If rows returned: Migration will FAIL - cleanup required
-- =====================================================

\echo ''
\echo '========================================='
\echo 'Duplicate Organization Names Check'
\echo '========================================='
\echo ''
\echo 'Checking for duplicate organization names (case-insensitive)...'
\echo ''

-- Main duplicate check query
SELECT 
  LOWER(name) as normalized_name,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as org_ids,
  STRING_AGG(name, ' | ') as original_names,
  MIN(created_at) as first_created,
  MAX(created_at) as last_created
FROM public.organizations 
WHERE name IS NOT NULL 
GROUP BY LOWER(name) 
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, LOWER(name);

\echo ''
\echo '========================================='
\echo 'Check Complete'
\echo '========================================='
\echo ''
\echo 'Interpretation:'
\echo '  - 0 rows: ✅ SAFE TO DEPLOY - No duplicates found'
\echo '  - 1+ rows: ❌ MIGRATION WILL FAIL - Cleanup required'
\echo ''
\echo 'If duplicates found:'
\echo '  1. See: .kiro/verifications/2026-07-17_unique-org-names_pre-migration-check.md'
\echo '  2. Run detailed analysis: .kiro/scripts/analyze-duplicate-orgs.sql'
\echo '  3. Execute cleanup plan (with approval)'
\echo '  4. Re-run this check'
\echo ''
