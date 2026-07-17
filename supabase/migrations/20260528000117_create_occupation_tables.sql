-- ============================================================================
-- Migration: Assessment Catalog (2-DB split, junction design)
-- Date: 2026-05-28 (restructured 2026-07-16)
-- Design source: lte/docs/LTE_SPLIT_ER_DIAGRAM.md
--
-- SkillPassport owns the assessment side:
--   industries <-> domains via industry_domains (junction)
--   role_families (normalized, one row per code)
--     <-> industry_domains via role_family_domains (junction, scope rows)
--     -> role_family_roles (junction to role; holds ALL assessment data)
--   role = slim role identity (one row per role code)
--   embeddings: one vector per role_family_roles.id (entity_type 'role')
--
-- LTE owns capabilities/sequences/skills/courses
-- (lte/supabase/migrations/20260716092555_lte_learning_catalog.sql).
-- Cross-DB bridge: role_family_roles.id is mirrored by LTE's shadow roles.id
-- (deterministic UUIDv5, no cross-database foreign keys).
--
-- Note: table is `role` (singular) per the ER diagram because `public.roles`
-- already exists (RBAC roles in 20260526000000_schema.sql).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE public.riasec_code AS ENUM ('R','I','A','S','E','C');
CREATE TYPE public.degree_gate AS ENUM ('Mandatory','Preferred');

-- ============================================================================
-- TABLE 1: industries
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.industries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(16) UNIQUE NOT NULL,
  name        VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE NOT NULL,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_industries_code ON public.industries(code);

-- ============================================================================
-- TABLE 2: domains (no direct industry FK; junction below)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.domains (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(50) UNIQUE NOT NULL,   -- e.g. 'IND_AGR_D01'
  name        VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE NOT NULL,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_domains_code ON public.domains(code);
CREATE INDEX idx_domains_active ON public.domains(is_active);

-- ============================================================================
-- TABLE 3: industry_domains (junction)
-- Today every domain belongs to exactly one industry; the junction keeps the
-- model open for shared domains without a future schema change.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.industry_domains (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  industry_id UUID NOT NULL REFERENCES public.industries(id) ON UPDATE CASCADE ON DELETE CASCADE,
  domain_id   UUID NOT NULL REFERENCES public.domains(id) ON UPDATE CASCADE ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_industry_domains UNIQUE(industry_id, domain_id)
);

CREATE INDEX idx_industry_domains_domain_id ON public.industry_domains(domain_id);

-- ============================================================================
-- TABLE 4: role_families (normalized — one row per family code)
-- Family identity/name/description stored ONCE. Which domains a family
-- appears in is a junction (role_family_domains below).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_families (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(50) UNIQUE NOT NULL,   -- e.g. 'AGR_RF_01', 'RF-CS-003-01'
  name        VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  is_active   BOOLEAN DEFAULT TRUE NOT NULL,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_role_families_code ON public.role_families(code);
CREATE INDEX idx_role_families_active ON public.role_families(is_active);

-- ============================================================================
-- TABLE 4b: role_family_domains (junction)
-- One row per family per industry-domain scope (a multi-domain family links
-- once per domain). Role contexts hang off THIS row, since a role's context
-- is family-in-domain, not family alone.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_family_domains (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_family_id     UUID NOT NULL REFERENCES public.role_families(id) ON UPDATE CASCADE ON DELETE CASCADE,
  industry_domain_id UUID NOT NULL REFERENCES public.industry_domains(id) ON UPDATE CASCADE ON DELETE CASCADE,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_role_family_domains UNIQUE(role_family_id, industry_domain_id)
);

CREATE INDEX idx_role_family_domains_industry_domain_id ON public.role_family_domains(industry_domain_id);

-- ============================================================================
-- TABLE 5: role (slim role identity)
-- One row per role code. All contextual/assessment attributes live in
-- role_family_roles.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code       VARCHAR(50) UNIQUE NOT NULL,
  name       VARCHAR(255) NOT NULL,
  is_active  BOOLEAN DEFAULT TRUE NOT NULL,
  metadata   JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_role_code ON public.role(code);
CREATE INDEX idx_role_name ON public.role(name);

-- ============================================================================
-- TABLE 6: role_family_roles (junction)
-- One row per role per family-in-domain scope (role_family_domains row).
-- This id is the "role context" sent to LTE (mirrored by LTE's shadow
-- roles.id). All assessment data lives here: RIASEC, aptitude, Big5,
-- work values, degree gate, descriptions.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_family_roles (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_family_domain_id   UUID NOT NULL REFERENCES public.role_family_domains(id) ON UPDATE CASCADE ON DELETE CASCADE,
  role_id                 UUID NOT NULL REFERENCES public.role(id) ON UPDATE CASCADE ON DELETE CASCADE,
  description             TEXT,
  primary_riasec          public.riasec_code,
  secondary_riasec        public.riasec_code,
  tertiary_riasec         public.riasec_code,
  riasec_code_string      VARCHAR(3),
  riasec_reason           TEXT,
  observable_behaviours   TEXT,
  role_work_context       TEXT,
  typical_work_activities TEXT,
  role_output_evidence    TEXT,
  aptitude_profile        JSONB DEFAULT '{}'::jsonb,
  big_five_profile        JSONB DEFAULT '{}'::jsonb,
  work_values_profile     JSONB DEFAULT '{}'::jsonb,
  aptitude_assessment     JSONB DEFAULT '{}'::jsonb,
  big5_assessment         JSONB DEFAULT '{}'::jsonb,
  work_values_assessment  JSONB DEFAULT '{}'::jsonb,
  degree_gate             public.degree_gate DEFAULT 'Preferred',
  direct_degree_mapping   TEXT,
  is_active               BOOLEAN DEFAULT TRUE NOT NULL,
  created_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_role_family_roles UNIQUE(role_family_domain_id, role_id)
);

CREATE INDEX idx_role_family_roles_role_id ON public.role_family_roles(role_id);
CREATE INDEX idx_role_family_roles_active ON public.role_family_roles(is_active);
CREATE INDEX idx_role_family_roles_riasec ON public.role_family_roles(primary_riasec, secondary_riasec, tertiary_riasec);
COMMENT ON TABLE public.role_family_roles IS 'Junction: role in a family-in-domain scope (role_family_domains), carrying all assessment attributes for RIASEC/aptitude/Big5/work-values matching. Its id is the role context sent to LTE.';

-- ============================================================================
-- TABLE 7: embeddings  (generic RAG vector storage)
-- One vector per role context (role_family_roles.id).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.embeddings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id   UUID NOT NULL,
  embedding   vector(1536),
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_entity_embedding UNIQUE(entity_type, entity_id),
  CONSTRAINT chk_entity_type CHECK (entity_type IN ('role'))
);

CREATE INDEX idx_embeddings_entity ON public.embeddings(entity_type, entity_id);
-- NOTE: No ANN (ivfflat/HNSW) index on `embedding` on purpose. Exact brute-force
-- KNN over a few thousand rows is fast and correct. Reintroduce an ANN index
-- (HNSW, or ivfflat with lists ~= sqrt(rows)) only at tens of thousands+ rows.

COMMENT ON TABLE public.embeddings IS 'Generic embedding storage for RAG. entity_type=''role'' -> role_family_roles.id (one vector per role context).';
