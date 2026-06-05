SELECT 
    'Server exists' as check_type,
    EXISTS(SELECT 1 FROM pg_foreign_server WHERE srvname = 'sso_worker_server') as status
UNION ALL
SELECT 
    'Can query organizations',
    EXISTS(SELECT 1 FROM sso_organizations LIMIT 1)
UNION ALL
SELECT 
    'Can query memberships',
    EXISTS(SELECT 1 FROM sso_memberships LIMIT 1);
