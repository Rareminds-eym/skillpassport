-- ============================================================================
-- Seed: Domains (shared taxonomy) — MUST load before any stream seed
-- ============================================================================
-- WHY: domain codes D01–D07 are a SINGLE shared taxonomy used by all streams
-- (education, hospitality, HR). Their occupations_context rows join on these codes.
-- The seed glob (./seed/*.sql) loads alphabetically, so the stream seeds
-- (seed_education_*, seed_hr_*) used to run before the domains existed and their
-- domain links silently resolved to nothing ("Unknown"). Defining the domains in
-- this seed_00_* file guarantees they exist first for every stream.
--
-- Idempotent: ON CONFLICT DO NOTHING so re-running or the hospitality seed's own
-- insert never errors.
-- ============================================================================

INSERT INTO public.domains (code, name) VALUES
  ('D01', 'Customer Service & Frontline Experience'),
  ('D02', 'Accommodation & Facilities Operations'),
  ('D03', 'Food, Beverage & Event Service Operations'),
  ('D04', 'Transport Movement & Passenger Operations'),
  ('D05', 'Travel Booking, Distribution & Agency Operations'),
  ('D06', 'Destination, Attraction & Cultural Experience Management'),
  ('D07', 'Safety, Compliance & Sustainable Tourism Governance')
ON CONFLICT DO NOTHING;
