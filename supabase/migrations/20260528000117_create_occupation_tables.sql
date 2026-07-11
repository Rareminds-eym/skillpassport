-- ============================================================================
-- Migration: Create Occupation / RIASEC Role Tables (Normalized, v2)
-- Date: 2026-05-28
-- Purpose: Reference + junction tables for the HTT RIASEC role -> capability ->
--          ordered 6-month plan flow.
-- Source of truth: HTT_RIASEC_ROLE_BY_ROLE_FINAL_COMPLETED_ORDERED.xlsx
-- Schema matches: Task/2026-06-02_embedding-service-binding/roles-er-diagram-v2.md
--
-- Flow: Learner RIASEC -> match score on roles -> suitable role ->
--       role_domains (context) -> ordered role_capability_sequence (courses) -> 6-month plan.
-- Capabilities are NOT recommended directly from RIASEC; the role recommends, the
-- role-capability sequence builds the plan.
-- ============================================================================

-- Extensions: uuid-ossp for UUIDs, vector for embeddings
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Enum for capability status (Core / Important / Supporting).
DO $$ BEGIN
  CREATE TYPE public.capability_status_enum AS ENUM ('Core', 'Important', 'Supporting');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- TABLE 0: industries  (parent of domains: HTT, DAI, HR, FIN, MME)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.industries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(16) UNIQUE NOT NULL,
  name        VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_industries_code ON public.industries(code);

-- ============================================================================
-- TABLE 1: domains  (7 HTT domains, D01..D07)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.domains (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(50) UNIQUE NOT NULL,   -- e.g. 'D01' (HTT) or 'IND_AFF_D01' (custom format)
  name        VARCHAR(500) UNIQUE NOT NULL,
  description TEXT,
  industry_id UUID REFERENCES public.industries(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_domains_code ON public.domains(code);
CREATE INDEX idx_domains_industry_id ON public.domains(industry_id);
COMMENT ON TABLE public.domains IS '7 HTT domains (D01..D07): Customer Service, Accommodation, Food & Beverage, Transport, Travel Booking, Destination, Safety & Compliance';

-- ============================================================================
-- TABLE 2: capability_master  (299 unique capabilities)
-- Base capability info only (name, description, sequence).
-- Role-family-specific attributes (status, RIASEC, work_style, level, duration)
-- live in role_capability_sequence.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.capability_master (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(50) UNIQUE NOT NULL,   -- e.g. 'IND-CAP-01', 'CAP-AFF-001', 'CAP-CS-015'
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  master_sequence INTEGER,                       -- canonical sequence order (informational)
  created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_capability_master_code ON public.capability_master(code);
COMMENT ON TABLE public.capability_master IS '299 unique capabilities (base info only). Role-family-specific attributes (status, RIASEC, work_style, level, duration) stored in role_capability_sequence.';
COMMENT ON COLUMN public.capability_master.master_sequence IS 'Canonical catalog order. NOT the learner/plan order (that is role_capability_sequence.sequence_step).';

-- ============================================================================
-- TABLE 3: occupations  (86 roles; RIASEC + match-score weights live here)
-- NOTE: named `occupations`, NOT `roles`, because public.roles already exists
-- (RBAC roles table from 20260526000000_schema.sql). Avoids the name collision.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.occupations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                  VARCHAR(50) NOT NULL,
  name                  VARCHAR(255) NOT NULL,
  domain_id             UUID REFERENCES public.domains(id) ON DELETE RESTRICT,
  role_family_id        VARCHAR(100),
  description           TEXT,
  primary_riasec        CHAR(1) CHECK (primary_riasec IN ('R','I','A','S','E','C')),
  secondary_riasec      CHAR(1) CHECK (secondary_riasec IN ('R','I','A','S','E','C')),
  tertiary_riasec       CHAR(1) CHECK (tertiary_riasec IN ('R','I','A','S','E','C')),
  riasec_code_string    VARCHAR(3),
  riasec_reason         TEXT,
  observable_behaviours TEXT,
  role_work_context     TEXT,
  typical_work_activities TEXT,
  role_output_evidence  TEXT,
  aptitude_profile      JSONB DEFAULT '{}'::jsonb,
  big_five_profile      JSONB DEFAULT '{}'::jsonb,
  work_values_profile   JSONB DEFAULT '{}'::jsonb,
  big5_assessment       JSONB DEFAULT '{}'::jsonb,
  aptitude_assessment   JSONB DEFAULT '{}'::jsonb,
  work_values_assessment JSONB DEFAULT '{}'::jsonb,
  degree_gate           VARCHAR(20) DEFAULT 'Preferred' CHECK (degree_gate IN ('Mandatory','Preferred')),
  direct_degree_mapping TEXT,
  metadata              JSONB DEFAULT '{}'::jsonb,
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_code_domain UNIQUE(code, domain_id)
);

CREATE INDEX idx_occupations_code ON public.occupations(code);
CREATE INDEX idx_occupations_domain_id ON public.occupations(domain_id);
CREATE INDEX idx_occupations_role_family ON public.occupations(role_family_id);
COMMENT ON TABLE public.occupations IS 'Occupations with domain context. Each record = occupation in one domain. Multi-domain roles = duplicate records (same code, different domain). UNIQUE by (code, domain_id) pair.';

-- ============================================================================
-- TABLE 5: role_capability_sequence  (ordered learning plan with role-family context)
-- Direct FK to occupations. Each occupation has ordered capabilities with
-- role-family-specific attributes (status, RIASEC, work_style, level, duration).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_capability_sequence (
  id                           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id                UUID NOT NULL REFERENCES public.occupations(id) ON DELETE CASCADE,
  capability_id                UUID NOT NULL REFERENCES public.capability_master(id) ON DELETE RESTRICT,
  sequence_step                INTEGER NOT NULL,
  capability_priority          VARCHAR(20) CHECK (capability_priority IN ('Core','Important','Supporting')),  -- role-family-specific status
  required_level               VARCHAR(4) CHECK (required_level IN ('L1','L2','L3','L4','L5')),              -- role-family-specific max level
  duration_weeks               INTEGER,                                                                      -- role-family-specific duration
  primary_riasec_context       CHAR(1) CHECK (primary_riasec_context IN ('R','I','A','S','E','C')),         -- role-family-specific RIASEC
  secondary_riasec_context     CHAR(1) CHECK (secondary_riasec_context IN ('R','I','A','S','E','C')),       -- role-family-specific RIASEC
  work_style_demands           TEXT,                                                                        -- role-family-specific work style demands
  created_at                   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_occupation_step UNIQUE(occupation_id, sequence_step),
  CONSTRAINT unique_occupation_capability UNIQUE(occupation_id, capability_id)
);

CREATE INDEX idx_rcs_occupation ON public.role_capability_sequence(occupation_id);
CREATE INDEX idx_rcs_capability ON public.role_capability_sequence(capability_id);
CREATE INDEX idx_rcs_order ON public.role_capability_sequence(occupation_id, sequence_step);
CREATE INDEX idx_rcs_riasec ON public.role_capability_sequence(primary_riasec_context, secondary_riasec_context);
COMMENT ON TABLE public.role_capability_sequence IS 'Ordered learning plan with role-family-specific capability context. Maps occupations to capabilities with role-specific attributes.';
COMMENT ON COLUMN public.role_capability_sequence.occupation_id IS 'FK to occupations. Each occupation = one role in one domain = one learning path.';
COMMENT ON COLUMN public.role_capability_sequence.capability_priority IS 'Role-family-specific priority (Core/Important/Supporting) for this capability in this role.';
COMMENT ON COLUMN public.role_capability_sequence.required_level IS 'Role-family-specific maximum required proficiency level (L1-L5) for this capability.';
COMMENT ON COLUMN public.role_capability_sequence.duration_weeks IS 'Role-family-specific duration in weeks for this capability.';
COMMENT ON COLUMN public.role_capability_sequence.primary_riasec_context IS 'Role-family-specific primary RIASEC code for this capability context.';
COMMENT ON COLUMN public.role_capability_sequence.secondary_riasec_context IS 'Role-family-specific secondary RIASEC code for this capability context.';
COMMENT ON COLUMN public.role_capability_sequence.work_style_demands IS 'Role-family-specific work style demands and behavioral expectations for this capability.';

-- ============================================================================
-- TABLE 6: embeddings  (generic RAG vector storage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.embeddings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,                         
  entity_id   UUID NOT NULL,
  embedding   vector(1536),
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_entity_embedding UNIQUE(entity_type, entity_id),
  CONSTRAINT chk_entity_type CHECK (entity_type IN ('occupation'))
);

CREATE INDEX idx_embeddings_entity ON public.embeddings(entity_type, entity_id);
-- NOTE: No ANN (ivfflat/HNSW) index on `embedding` on purpose. With only ~86 role
-- vectors, an approximate index hurts correctness with no speed benefit. Exact brute-force
-- KNN over a few hundred rows is sub-millisecond. Reintroduce an ANN index (HNSW, or ivfflat
-- with lists ~= sqrt(rows)) only when the embedding set grows to tens of thousands+.
-- CREATE INDEX idx_embeddings_embedding ON public.embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE public.embeddings IS 'Generic embedding storage for RAG. entity_type=''occupation'' uses occupations.riasec_reason-based document as source text.';
COMMENT ON COLUMN public.embeddings.entity_id IS 'UUID of the embedded entity (e.g. occupations.id when entity_type=''occupation'').';

-- ============================================================================
-- TABLE 7: skill-capability mapping  (many-to-many)
-- ============================================================================

-- Create junction table for skill-capability mapping
CREATE TABLE IF NOT EXISTS public.skill_capability_mapping (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id      UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  capability_id UUID NOT NULL REFERENCES public.capability_master(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_skill_capability UNIQUE(skill_id, capability_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_skill_capability_mapping_skill_id ON public.skill_capability_mapping(skill_id);
CREATE INDEX idx_skill_capability_mapping_capability_id ON public.skill_capability_mapping(capability_id);

-- Add comments
COMMENT ON TABLE public.skill_capability_mapping IS
'Junction table mapping skills to capabilities. Allows one skill to be associated with multiple capabilities without duplication.';

COMMENT ON COLUMN public.skill_capability_mapping.skill_id IS
'Foreign key to skills. The skill being mapped.';

COMMENT ON COLUMN public.skill_capability_mapping.capability_id IS
'Foreign key to capability_master. The capability that uses this skill.';

