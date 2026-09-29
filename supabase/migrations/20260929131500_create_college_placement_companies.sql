-- ============================================================================
-- Migration: Create dedicated college_placement_companies table
-- Purpose: Isolate college placement company registrations per college (multi-tenancy)
--          Prevents company registrations from leaking across different colleges.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."college_placement_companies" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "college_id" uuid NOT NULL,
    "name" character varying(255) NOT NULL,
    "code" character varying(50) NOT NULL,
    "industry" character varying(100),
    "companySize" character varying(50),
    "hqAddress" text,
    "hqCity" character varying(100),
    "hqState" character varying(100),
    "hqCountry" character varying(100) DEFAULT 'India'::character varying,
    "hqPincode" character varying(10),
    "phone" character varying(20),
    "email" character varying(255),
    "website" character varying(255),
    "establishedYear" integer,
    "contactPersonName" character varying(200),
    "contactPersonDesignation" character varying(100),
    "contactPersonEmail" character varying(255),
    "contactPersonPhone" character varying(20),
    "accountStatus" character varying(50) DEFAULT 'pending'::character varying,
    "approvalStatus" character varying(50) DEFAULT 'pending'::character varying,
    "approvedBy" uuid,
    "approvedAt" timestamp with time zone,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_by" uuid,
    "updated_by" uuid,
    "createdAt" timestamp with time zone DEFAULT now(),
    "updatedAt" timestamp with time zone DEFAULT now(),
    CONSTRAINT "college_placement_companies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "college_placement_companies_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE,
    CONSTRAINT "college_placement_companies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL,
    CONSTRAINT "college_placement_companies_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL,
    CONSTRAINT "college_placement_companies_unique_code_per_college" UNIQUE ("college_id", "code")
);

-- Comments for documentation
COMMENT ON TABLE "public"."college_placement_companies" IS 'Dedicated table for college placement cell company registrations and MoUs. Scoped strictly by college_id.';
COMMENT ON COLUMN "public"."college_placement_companies"."college_id" IS 'Foreign key referencing organizations(id). Ensures each college only accesses their own registered companies.';
COMMENT ON COLUMN "public"."college_placement_companies"."metadata" IS 'Stores MoU information, JD upload references, and placement drive special requirements.';

-- Performance Indexes
CREATE INDEX IF NOT EXISTS "idx_college_placement_companies_college_id" 
    ON "public"."college_placement_companies" ("college_id");

CREATE INDEX IF NOT EXISTS "idx_college_placement_companies_status" 
    ON "public"."college_placement_companies" ("college_id", "accountStatus");

CREATE INDEX IF NOT EXISTS "idx_college_placement_companies_name" 
    ON "public"."college_placement_companies" ("college_id", "name");

-- Grant permissions for roles
GRANT ALL ON TABLE "public"."college_placement_companies" TO "anon";
GRANT ALL ON TABLE "public"."college_placement_companies" TO "authenticated";
GRANT ALL ON TABLE "public"."college_placement_companies" TO "service_role";

