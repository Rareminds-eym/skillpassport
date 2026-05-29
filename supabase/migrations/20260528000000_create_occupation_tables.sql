-- ============================================================================
-- Migration: Create Occupation Management Tables (Normalized)
-- Date: 2026-05-28
-- Purpose: Create reference and junction tables for occupation/role management
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: domains
-- Reference table for 7 hospitality domains
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(3) UNIQUE NOT NULL,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_domains_code ON public.domains(code);
COMMENT ON TABLE public.domains IS 'Hospitality domains: Customer Service, Accommodation, Food & Beverage, Transport, Travel Booking, Destination Management, Safety & Compliance';

-- ============================================================================
-- TABLE 3: capabilities_master
-- Reference table for 27 capability definitions with name and description
-- Maps to: Hospitality_Travel_Tourism_RIASEC_Role_Capability corrected.xlsx (Sheet 2: Capabilities Master)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.capabilities_master (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_capabilities_master_code ON public.capabilities_master(code);
COMMENT ON TABLE public.capabilities_master IS 'Capability Master: 27 capability definitions with name and description';
COMMENT ON COLUMN public.capabilities_master.code IS 'Capability ID: IND-CAP-01, IND-CAP-02, etc. (from Capability_ID)';
COMMENT ON COLUMN public.capabilities_master.name IS 'Capability Name: Short name for the capability';
COMMENT ON COLUMN public.capabilities_master.description IS 'Capability Description: Full description of capability requirements (from Capability_Description)';

-- ============================================================================
-- TABLE 4: occupations
-- Main table: occupations with semantic properties (embeddings in separate table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.occupations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_occupations_code ON public.occupations(code);
CREATE INDEX idx_occupations_name ON public.occupations(name);

COMMENT ON TABLE public.occupations IS 'Base occupation/role definitions (embeddings stored in separate embeddings table)';
COMMENT ON COLUMN public.occupations.code IS 'Unique occupation code: ROLE-HTT-001, ROLE-EDU-001, ROLE-HR-001, etc.';
COMMENT ON COLUMN public.occupations.name IS 'Occupation name/title';

-- ============================================================================
-- TABLE 5: embeddings (Generic RAG Embedding Storage - Minimal)
-- Stores semantic embeddings for occupations, capabilities, domains
-- Flexible: any entity type can be embedded without schema changes
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_entity_embedding UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_embeddings_entity ON public.embeddings(entity_type, entity_id);
CREATE INDEX idx_embeddings_embedding ON public.embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE public.embeddings IS 'Generic embedding storage for RAG. Supports occupations, capabilities, domains, and future entity types.';
COMMENT ON COLUMN public.embeddings.entity_type IS 'Entity type: occupation, capability, domain';
COMMENT ON COLUMN public.embeddings.entity_id IS 'UUID reference to the entity (occupation_id, capability_id, or domain_id)';
COMMENT ON COLUMN public.embeddings.embedding IS 'Semantic embedding vector (1536 dimensions) for similarity search';

-- ============================================================================
-- TABLE 6: occupations_context (Junction Table)
-- Links occupations to domains
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.occupations_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID NOT NULL REFERENCES public.occupations(id) ON DELETE CASCADE,
  domain_id UUID NOT NULL REFERENCES public.domains(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_occupation_domain UNIQUE(occupation_id, domain_id)
);

CREATE INDEX idx_occ_context_occupation ON public.occupations_context(occupation_id);
CREATE INDEX idx_occ_context_domain ON public.occupations_context(domain_id);

COMMENT ON TABLE public.occupations_context IS 'Junction table linking occupations to domains';
COMMENT ON COLUMN public.occupations_context.occupation_id IS 'Foreign key to occupations (CASCADE on delete)';
COMMENT ON COLUMN public.occupations_context.domain_id IS 'Foreign key to domains (RESTRICT on delete)';

-- ============================================================================
-- TABLE 6: occupations_capabilities_master (Junction Table)
-- Links occupations to capabilities_master (one-to-many relationship)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.occupations_capabilities_master (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID NOT NULL REFERENCES public.occupations(id) ON DELETE CASCADE,
  capability_id UUID NOT NULL REFERENCES public.capabilities_master(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_occupation_capability UNIQUE(occupation_id, capability_id)
);

CREATE INDEX idx_occ_cap_occupation ON public.occupations_capabilities_master(occupation_id);
CREATE INDEX idx_occ_cap_capability ON public.occupations_capabilities_master(capability_id);

COMMENT ON TABLE public.occupations_capabilities_master IS 'Junction table linking occupations to capabilities_master (one-to-many: each occupation can have multiple capabilities)';
COMMENT ON COLUMN public.occupations_capabilities_master.occupation_id IS 'Foreign key to occupations (CASCADE on delete)';
COMMENT ON COLUMN public.occupations_capabilities_master.capability_id IS 'Foreign key to capabilities_master (RESTRICT on delete)';

-- ============================================================================
-- TABLE 7: riasec_profiles (Separate Junction Table)
-- Links occupations to their RIASEC profile codes (one-to-many relationship)
-- Handles cases where an occupation can have multiple RIASEC profiles (e.g., SC; CIS; SCI)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.riasec_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  occupation_id UUID NOT NULL REFERENCES public.occupations(id) ON DELETE CASCADE,
  profile_code VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_occupation_profile UNIQUE(occupation_id, profile_code)
);

CREATE INDEX idx_riasec_profiles_occupation ON public.riasec_profiles(occupation_id);
CREATE INDEX idx_riasec_profiles_code ON public.riasec_profiles(profile_code);

COMMENT ON TABLE public.riasec_profiles IS 'Junction table linking occupations to RIASEC profile codes (one-to-many: each occupation can have multiple RIASEC profiles)';
COMMENT ON COLUMN public.riasec_profiles.occupation_id IS 'Foreign key to occupations (CASCADE on delete)';
COMMENT ON COLUMN public.riasec_profiles.profile_code IS 'RIASEC Profile Code: SC, CIS, SCI, RSC, SEC, etc. (can be 1-4 characters)';
