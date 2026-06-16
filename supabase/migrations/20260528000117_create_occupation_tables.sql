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
  code        VARCHAR(16) UNIQUE NOT NULL,   -- e.g. 'D01' (HTT) or 'HR-D01' (industry-prefixed)
  name        VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  industry_id UUID REFERENCES public.industries(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_domains_code ON public.domains(code);
CREATE INDEX idx_domains_industry_id ON public.domains(industry_id);
COMMENT ON TABLE public.domains IS '7 HTT domains (D01..D07): Customer Service, Accommodation, Food & Beverage, Transport, Travel Booking, Destination, Safety & Compliance';

-- ============================================================================
-- TABLE 2: capability_master  (27 canonical capabilities, IND-CAP-01..27)
-- Intrinsic attributes only (shared across all roles that use the capability).
-- Role-specific usage (order, priority, level, duration) lives in role_capability_sequence.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.capability_master (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code               VARCHAR(20) UNIQUE NOT NULL,   -- e.g. 'IND-CAP-01' (HTT) or 'HR-IND-CAP-01'
  name               TEXT NOT NULL,
  description        TEXT NOT NULL,
  master_sequence    INTEGER UNIQUE,                       -- canonical catalog sort key 1..27; NOT learner order
  capability_status  public.capability_status_enum,        -- Core / Important / Supporting
  primary_riasec     TEXT[],                               -- explanatory only; does NOT feed match score
  secondary_riasec   TEXT[],
  work_style_demands TEXT,
  created_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_capability_master_code ON public.capability_master(code);
COMMENT ON TABLE public.capability_master IS '27 canonical capabilities. RIASEC fields are explanatory only (capabilities are not recommended from RIASEC).';
COMMENT ON COLUMN public.capability_master.master_sequence IS 'Canonical catalog order 1..27. NOT the learner/plan order (that is role_capability_sequence.sequence_step). Stage buckets = ceil(master_sequence/9).';

-- ============================================================================
-- TABLE 3: occupations  (86 roles; RIASEC + match-score weights live here)
-- NOTE: named `occupations`, NOT `roles`, because public.roles already exists
-- (RBAC roles table from 20260526000000_schema.sql). Avoids the name collision.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.occupations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code                  VARCHAR(24) UNIQUE NOT NULL,   -- e.g. 'HTT-ROLE-001', 'HR-ROLE-001'
  name                  VARCHAR(255) UNIQUE NOT NULL,
  description           TEXT,
  primary_riasec        CHAR(1),                            -- R/I/A/S/E/C
  secondary_riasec      CHAR(1),
  tertiary_riasec       CHAR(1),
  riasec_code_string    VARCHAR(3),                         -- e.g. 'ESC'
  riasec_reason         TEXT,                               -- EMBEDDING SOURCE (unique per role)
  observable_behaviours TEXT,
  aptitude_profile      JSONB DEFAULT '{}'::jsonb,
  big_five_profile      JSONB DEFAULT '{}'::jsonb,
  work_values_profile   JSONB DEFAULT '{}'::jsonb,
  is_active             BOOLEAN DEFAULT TRUE,
  metadata              JSONB DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_primary_riasec   CHECK (primary_riasec   IN ('R','I','A','S','E','C')),
  CONSTRAINT chk_secondary_riasec CHECK (secondary_riasec IN ('R','I','A','S','E','C')),
  CONSTRAINT chk_tertiary_riasec  CHECK (tertiary_riasec  IN ('R','I','A','S','E','C'))
);

CREATE INDEX idx_occupations_code ON public.occupations(code);
CREATE INDEX idx_occupations_riasec ON public.occupations(primary_riasec, secondary_riasec, tertiary_riasec);
CREATE INDEX idx_occupations_aptitude_profile ON public.occupations USING GIN (aptitude_profile);
CREATE INDEX idx_occupations_big_five_profile ON public.occupations USING GIN (big_five_profile);
CREATE INDEX idx_occupations_work_values_profile ON public.occupations USING GIN (work_values_profile);
COMMENT ON TABLE public.occupations IS '86 HTT roles (table named occupations to avoid collision with RBAC public.roles). riasec_code_string drives the Holland-hexagon match score; riasec_reason is the embedding source.';
COMMENT ON COLUMN public.occupations.riasec_reason IS 'Per-row unique text (86/86) used as the embedding source for RAG.';

-- ============================================================================
-- TABLE 4: capability_skills  (188 skills; each belongs to exactly 1 capability)
-- NOTE: named `capability_skills`, NOT `skills`, because public.skills already exists.
-- Domain is reachable via capability (verified 188/188), so not stored here.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.capability_skills (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          VARCHAR(20) UNIQUE NOT NULL,   -- e.g. 'IND-SK-001' (HTT) or 'HR-IND-SK-001'
  capability_id UUID NOT NULL REFERENCES public.capability_master(id) ON DELETE RESTRICT,
  name          TEXT NOT NULL,
  description   TEXT,
  skill_type    VARCHAR(50),                                -- Documentation / Coordination / ...
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_capability_skills_code ON public.capability_skills(code);
CREATE INDEX idx_capability_skills_capability ON public.capability_skills(capability_id);
COMMENT ON TABLE public.capability_skills IS '188 skills, each mapped to exactly one capability (1:1 verified). Named capability_skills to avoid collision with public.skills. Domain derives via capability.';

-- ============================================================================
-- TABLE 5: role_domains  (M:N context label: which domains a role touches)
-- 15 roles span >1 domain. This pairing is a plain label; it does NOT own capabilities.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_domains (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id    UUID NOT NULL REFERENCES public.occupations(id) ON DELETE CASCADE,  -- FK to occupations
  domain_id  UUID NOT NULL REFERENCES public.domains(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_role_domain UNIQUE(role_id, domain_id)
);

CREATE INDEX idx_role_domains_role ON public.role_domains(role_id);
CREATE INDEX idx_role_domains_domain ON public.role_domains(domain_id);
COMMENT ON TABLE public.role_domains IS 'M:N role<->domain context label. Multi-domain combined cells (e.g. "D06; D01") are split into separate rows on load.';

-- ============================================================================
-- TABLE 6: role_capability_sequence  (the ordered 6-month learning plan)
-- Hangs off a single role_domains context (Option A: multi-domain roles attach
-- their plan to the primary/first-listed domain). One ordered plan per role.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.role_capability_sequence (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_domain_id      UUID NOT NULL REFERENCES public.role_domains(id) ON DELETE CASCADE,
  capability_id       UUID NOT NULL REFERENCES public.capability_master(id) ON DELETE RESTRICT,
  sequence_step       INTEGER NOT NULL,                     -- 1..N order within the plan
  capability_priority VARCHAR(20),                          -- Core / Important / Supporting
  required_level      VARCHAR(4),                           -- L1 / L2 / L3
  duration_weeks      INTEGER,
  cumulative_weeks    INTEGER,
  created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_context_step       UNIQUE(role_domain_id, sequence_step),
  CONSTRAINT unique_context_capability UNIQUE(role_domain_id, capability_id),
  CONSTRAINT chk_required_level CHECK (required_level IN ('L1','L2','L3'))
);

CREATE INDEX idx_rcs_context ON public.role_capability_sequence(role_domain_id);
CREATE INDEX idx_rcs_capability ON public.role_capability_sequence(capability_id);
CREATE INDEX idx_rcs_order ON public.role_capability_sequence(role_domain_id, sequence_step);
COMMENT ON TABLE public.role_capability_sequence IS 'Ordered role learning plan. FK to role_domains guarantees every step runs in a real (role+domain) context. Sort by sequence_step to build the 6-month plan.';
COMMENT ON COLUMN public.role_capability_sequence.role_domain_id IS 'FK to role_domains (the role+domain context). Replaces separate role_id+domain_id; enforces the pair exists.';

-- ============================================================================
-- TABLE 7: embeddings  (generic RAG vector storage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.embeddings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,                         -- 'occupation' (extensible)
  entity_id   UUID NOT NULL,
  embedding   vector(1536),
  metadata    JSONB DEFAULT '{}'::jsonb,
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
