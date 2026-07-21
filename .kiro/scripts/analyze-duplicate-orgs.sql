-- =====================================================
-- Detailed Analysis: Duplicate Organizations
-- =====================================================
-- Purpose: Analyze duplicate organizations to determine cleanup strategy
-- Run this ONLY if check-duplicate-org-names.sql found duplicates
-- Documentation: .kiro/verifications/2026-07-17_unique-org-names_pre-migration-check.md
--
-- Usage:
--   psql $DATABASE_URL -f .kiro/scripts/analyze-duplicate-orgs.sql > duplicates_analysis.txt
--
-- =====================================================

\echo ''
\echo '========================================='
\echo 'Detailed Duplicate Organizations Analysis'
\echo '========================================='
\echo ''

-- Detailed analysis of each duplicate organization
\echo 'Analyzing each duplicate organization...'
\echo ''

WITH duplicates AS (
  SELECT 
    LOWER(name) as normalized_name,
    COUNT(*) as count
  FROM public.organizations 
  WHERE name IS NOT NULL 
  GROUP BY LOWER(name) 
  HAVING COUNT(*) > 1
)
SELECT 
  o.id,
  o.name,
  o.slug,
  o.created_at,
  o.created_by,
  o.updated_at,
  d.count as total_duplicates,
  -- Check if org has any members
  (SELECT COUNT(*) FROM organization_members om WHERE om.organization_id = o.id) as member_count,
  -- Check if org has any subscriptions
  (SELECT COUNT(*) FROM organization_subscriptions os WHERE os.organization_id = o.id) as subscription_count,
  -- Check if org has any requisitions
  (SELECT COUNT(*) FROM requisitions r WHERE r.organization_id = o.id) as requisition_count,
  -- Check creator email
  (SELECT email FROM users u WHERE u.id = o.created_by) as creator_email,
  -- Classification
  CASE 
    WHEN (SELECT COUNT(*) FROM organization_members om WHERE om.organization_id = o.id) = 0
     AND (SELECT COUNT(*) FROM organization_subscriptions os WHERE os.organization_id = o.id) = 0
     AND (SELECT COUNT(*) FROM requisitions r WHERE r.organization_id = o.id) = 0
    THEN 'ABANDONED (safe to delete)'
    WHEN (SELECT COUNT(*) FROM organization_members om WHERE om.organization_id = o.id) > 0
      OR (SELECT COUNT(*) FROM organization_subscriptions os WHERE os.organization_id = o.id) > 0
      OR (SELECT COUNT(*) FROM requisitions r WHERE r.organization_id = o.id) > 0
    THEN 'ACTIVE (requires rename or merge)'
    ELSE 'UNKNOWN'
  END as classification
FROM public.organizations o
JOIN duplicates d ON LOWER(o.name) = d.normalized_name
ORDER BY d.normalized_name, o.created_at;

\echo ''
\echo '========================================='
\echo 'Summary by Duplicate Group'
\echo '========================================='
\echo ''

WITH duplicates AS (
  SELECT 
    LOWER(name) as normalized_name,
    COUNT(*) as count
  FROM public.organizations 
  WHERE name IS NOT NULL 
  GROUP BY LOWER(name) 
  HAVING COUNT(*) > 1
)
SELECT 
  LOWER(o.name) as normalized_name,
  COUNT(*) as total_orgs,
  SUM(CASE 
    WHEN (SELECT COUNT(*) FROM organization_members om WHERE om.organization_id = o.id) = 0
     AND (SELECT COUNT(*) FROM organization_subscriptions os WHERE os.organization_id = o.id) = 0
     AND (SELECT COUNT(*) FROM requisitions r WHERE r.organization_id = o.id) = 0
    THEN 1 ELSE 0 
  END) as abandoned_count,
  SUM(CASE 
    WHEN (SELECT COUNT(*) FROM organization_members om WHERE om.organization_id = o.id) > 0
      OR (SELECT COUNT(*) FROM organization_subscriptions os WHERE os.organization_id = o.id) > 0
      OR (SELECT COUNT(*) FROM requisitions r WHERE r.organization_id = o.id) > 0
    THEN 1 ELSE 0 
  END) as active_count,
  STRING_AGG(o.id::text, ', ') as org_ids
FROM public.organizations o
JOIN duplicates d ON LOWER(o.name) = d.normalized_name
GROUP BY LOWER(o.name)
ORDER BY total_orgs DESC;

\echo ''
\echo '========================================='
\echo 'Abandoned Organizations (Safe to Delete)'
\echo '========================================='
\echo ''
\echo 'These organizations have no members, subscriptions, or requisitions.'
\echo 'They can be safely deleted after approval.'
\echo ''

SELECT 
  o.id,
  o.name,
  o.created_at,
  o.created_by,
  (SELECT email FROM users u WHERE u.id = o.created_by) as creator_email
FROM public.organizations o
WHERE LOWER(o.name) IN (
  SELECT LOWER(name) 
  FROM public.organizations 
  WHERE name IS NOT NULL 
  GROUP BY LOWER(name) 
  HAVING COUNT(*) > 1
)
AND NOT EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = o.id)
AND NOT EXISTS (SELECT 1 FROM organization_subscriptions os WHERE os.organization_id = o.id)
AND NOT EXISTS (SELECT 1 FROM requisitions r WHERE r.organization_id = o.id)
ORDER BY o.created_at;

\echo ''
\echo '========================================='
\echo 'Active Organizations (Require Resolution)'
\echo '========================================='
\echo ''
\echo 'These organizations have activity and require manual resolution.'
\echo 'Options: Rename, Merge, or Contact Creator'
\echo ''

SELECT 
  o.id,
  o.name,
  o.created_at,
  (SELECT COUNT(*) FROM organization_members om WHERE om.organization_id = o.id) as members,
  (SELECT COUNT(*) FROM organization_subscriptions os WHERE os.organization_id = o.id) as subscriptions,
  (SELECT COUNT(*) FROM requisitions r WHERE r.organization_id = o.id) as requisitions,
  (SELECT email FROM users u WHERE u.id = o.created_by) as creator_email
FROM public.organizations o
WHERE LOWER(o.name) IN (
  SELECT LOWER(name) 
  FROM public.organizations 
  WHERE name IS NOT NULL 
  GROUP BY LOWER(name) 
  HAVING COUNT(*) > 1
)
AND (
  EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = o.id)
  OR EXISTS (SELECT 1 FROM organization_subscriptions os WHERE os.organization_id = o.id)
  OR EXISTS (SELECT 1 FROM requisitions r WHERE r.organization_id = o.id)
)
ORDER BY LOWER(o.name), o.created_at;

\echo ''
\echo '========================================='
\echo 'Recommended Actions'
\echo '========================================='
\echo ''
\echo '1. Review abandoned organizations list above'
\echo '2. Get approval to delete abandoned orgs (if any)'
\echo '3. For active orgs, choose resolution strategy:'
\echo '   - Strategy A: Delete if truly abandoned'
\echo '   - Strategy B: Rename with suffix (Acme Corp -> Acme Corp (2))'
\echo '   - Strategy C: Merge data and delete duplicate'
\echo ''
\echo '4. See detailed cleanup procedures in:'
\echo '   .kiro/verifications/2026-07-17_unique-org-names_pre-migration-check.md'
\echo ''
\echo '5. After cleanup, re-run:'
\echo '   .kiro/scripts/check-duplicate-org-names.sql'
\echo ''
