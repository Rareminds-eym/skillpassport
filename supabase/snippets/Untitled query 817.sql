SELECT
  routine_name
FROM information_schema.routines
WHERE routine_definition ILIKE '%sso_foreign%';