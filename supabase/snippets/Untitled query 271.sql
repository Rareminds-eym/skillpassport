-- Drop and recreate the organizations foreign table with all columns
DROP FOREIGN TABLE IF EXISTS sso_organizations;

CREATE FOREIGN TABLE sso_organizations (
    id UUID,
    name TEXT,
    slug TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ,
    metadata JSONB
)
SERVER sso_worker_server
OPTIONS (schema_name 'public', table_name 'organizations');
