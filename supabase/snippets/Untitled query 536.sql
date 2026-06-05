-- Drop and recreate the FDW server with correct port
DROP SERVER IF EXISTS sso_worker_server CASCADE;

CREATE SERVER sso_worker_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (
    host 'localhost',
    port '54332',        -- Correct SSO-Worker database port
    dbname 'postgres'
);

-- Recreate the user mapping
CREATE USER MAPPING FOR current_user
SERVER sso_worker_server
OPTIONS (
    user 'postgres',
    password 'postgres'
);

-- Create schema for foreign tables
CREATE SCHEMA IF NOT EXISTS sso_foreign;

-- Create foreign tables in sso_foreign schema
CREATE FOREIGN TABLE sso_foreign.organizations (
    id UUID,
    name TEXT,
    slug TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ,
    metadata JSONB
)
SERVER sso_worker_server
OPTIONS (schema_name 'public', table_name 'organizations');

CREATE FOREIGN TABLE sso_foreign.users (
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
OPTIONS (schema_name 'public', table_name 'users');

CREATE FOREIGN TABLE sso_foreign.memberships (
    id UUID,
    user_id UUID,
    org_id UUID,
    created_at TIMESTAMPTZ,
    status TEXT
)
SERVER sso_worker_server
OPTIONS (schema_name 'public', table_name 'memberships');

CREATE FOREIGN TABLE sso_foreign.membership_roles (
    id UUID,
    membership_id UUID,
    role_id UUID,
    created_at TIMESTAMPTZ
)
SERVER sso_worker_server
OPTIONS (schema_name 'public', table_name 'membership_roles');

CREATE FOREIGN TABLE sso_foreign.roles (
    id UUID,
    name TEXT,
    description TEXT,
    created_at TIMESTAMPTZ
)
SERVER sso_worker_server
OPTIONS (schema_name 'public', table_name 'roles');
