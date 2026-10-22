-- DISPOSABLE DATABASE ONLY. Minimal prior-schema fixture, not a production migration.
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role BYPASSRLS; END IF;
END $$;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
CREATE TABLE public.learners(id uuid PRIMARY KEY, user_id uuid UNIQUE, name text, embedding extensions.vector(1536), updated_at timestamptz);
CREATE TABLE public.skills(id uuid PRIMARY KEY, learner_id uuid, name text);
CREATE TABLE public.certificates(id uuid PRIMARY KEY, learner_id uuid, enabled boolean, approval_status text, expiry_date date);
CREATE TABLE public.projects(id uuid PRIMARY KEY, learner_id uuid);
CREATE TABLE public.trainings(id uuid PRIMARY KEY, learner_id uuid);
CREATE TABLE public.course_enrollments(id uuid PRIMARY KEY, learner_id uuid);
CREATE TABLE public.opportunity_interactions(id uuid PRIMARY KEY, learner_id uuid, opportunity_id uuid, action text);
CREATE TABLE public.opportunities(id uuid PRIMARY KEY, title text, status text DEFAULT 'open', is_active boolean DEFAULT true,
  deadline timestamptz, posted_date timestamptz DEFAULT now(), created_at timestamptz DEFAULT now());
ALTER TABLE public.skills ADD COLUMN embedding extensions.vector(1536);
ALTER TABLE public.projects ADD COLUMN embedding extensions.vector(1536);
ALTER TABLE public.certificates ADD COLUMN embedding extensions.vector(1536);
ALTER TABLE public.opportunities ADD COLUMN embedding extensions.vector(1536), ADD COLUMN views_count integer;
CREATE FUNCTION public.get_cached_job_matches(uuid) RETURNS jsonb LANGUAGE sql SECURITY DEFINER AS $$SELECT NULL::jsonb$$;
CREATE FUNCTION public.save_job_matches_cache(uuid,jsonb,character varying) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$BEGIN RETURN; END$$;
CREATE FUNCTION public.is_job_matches_cache_valid(uuid) RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$SELECT true$$;
CREATE FUNCTION public.compute_learner_profile_hash(uuid) RETURNS text LANGUAGE sql SECURITY DEFINER AS $$SELECT 'fixture'::text$$;
CREATE FUNCTION public.match_opportunities_enhanced_v2(extensions.vector,uuid,uuid[],double precision,integer) RETURNS jsonb LANGUAGE sql AS $$SELECT '[]'::jsonb$$;
