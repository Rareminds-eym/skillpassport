-- Local display correction for the production-seeded school identity.
BEGIN;
UPDATE public.organizations
SET name='Cambridge School, JP Nagar, Bengaluru'
WHERE id='0b2582eb-ff09-495f-ace4-0c2b73d36701'
  AND name IN ('Cambridge School', 'Cambridge School (0b2582eb-ff09-495f-ace4-0c2b73d36701)');
COMMIT;
