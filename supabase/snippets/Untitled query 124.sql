-- =========================================================
-- Enable postgres_fdw
-- =========================================================

CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- =========================================================
-- Create dedicated schema for foreign tables
-- =========================================================

CREATE SCHEMA IF NOT EXISTS sso_foreign;

-- =========================================================
-- Clean up old objects
-- =========================================================

DROP FOREIGN TABLE IF EXISTS sso_foreign.sso_membership_roles CASCADE;
DROP FOREIGN TABLE IF EXISTS sso_foreign.sso_memberships CASCADE;
DROP FOREIGN TABLE IF EXISTS sso_foreign.sso_organization_products CASCADE;
DROP FOREIGN TABLE IF EXISTS sso_foreign.sso_organizations CASCADE;
DROP FOREIGN TABLE IF EXISTS sso_foreign.sso_products CASCADE;
DROP FOREIGN TABLE IF EXISTS sso_foreign.sso_roles CASCADE;
DROP FOREIGN TABLE IF EXISTS sso_foreign.sso_users CASCADE;

DROP SERVER IF EXISTS sso_worker_server CASCADE;

-- =========================================================
-- Create FDW server
-- =========================================================

CREATE SERVER sso_worker_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (
    host 'host.docker.internal',
    port '54332',
    dbname 'postgres'
);

-- =========================================================
-- User mapping
-- =========================================================

CREATE USER MAPPING FOR current_user
SERVER sso_worker_server
OPTIONS (
    user 'postgres',
    password 'postgres'
);

-- =========================================================
-- Foreign tables
-- =========================================================

CREATE FOREIGN TABLE sso_foreign.sso_users (
    id UUID,
    email TEXT,
    password_hash TEXT,
    is_email_verified BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    is_blocked BOOLEAN
)
SERVER sso_worker_server
OPTIONS (
    schema_name 'public',
    table_name 'users'
);

CREATE FOREIGN TABLE sso_foreign.sso_organizations (
    id UUID,
    name TEXT,
    slug TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ,
    metadata JSONB
)
SERVER sso_worker_server
OPTIONS (
    schema_name 'public',
    table_name 'organizations'
);

CREATE FOREIGN TABLE sso_foreign.sso_memberships (
    id UUID,
    user_id UUID,
    org_id UUID,
    created_at TIMESTAMPTZ,
    status TEXT
)
SERVER sso_worker_server
OPTIONS (
    schema_name 'public',
    table_name 'memberships'
);

CREATE FOREIGN TABLE sso_foreign.sso_membership_roles (
    id UUID,
    membership_id UUID,
    role_id UUID,
    created_at TIMESTAMPTZ
)
SERVER sso_worker_server
OPTIONS (
    schema_name 'public',
    table_name 'membership_roles'
);

CREATE FOREIGN TABLE sso_foreign.sso_roles (
    id UUID,
    name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ
)
SERVER sso_worker_server
OPTIONS (
    schema_name 'public',
    table_name 'roles'
);

CREATE FOREIGN TABLE sso_foreign.sso_organization_products (
    id UUID,
    org_id UUID,
    product_id UUID,
    active BOOLEAN,
    created_at TIMESTAMPTZ
)
SERVER sso_worker_server
OPTIONS (
    schema_name 'public',
    table_name 'organization_products'
);

CREATE FOREIGN TABLE sso_foreign.sso_products (
    id UUID,
    code TEXT,
    name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ
)
SERVER sso_worker_server
OPTIONS (
    schema_name 'public',
    table_name 'products'
);

-- =========================================================
-- Permissions
-- =========================================================

GRANT USAGE ON SCHEMA sso_foreign TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA sso_foreign TO authenticated;