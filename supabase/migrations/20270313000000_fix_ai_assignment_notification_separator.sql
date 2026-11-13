BEGIN;

-- Use an ASCII separator so Windows SQL imports cannot corrupt punctuation.
-- Preserve the notification function's existing allocation/result behavior.
DO $$
DECLARE definition text;
BEGIN
  definition := pg_get_functiondef('public.notify_saved_ai_assignment()'::regprocedure);
  definition := replace(definition, ' ??? due ', ' - due ');
  definition := replace(definition, ' ' || chr(8212) || ' due ', ' - due ');
  EXECUTE definition;
END $$;

-- Repair only the generated due-date separator, leaving question text alone.
UPDATE public.notifications
SET message = replace(
  replace(message, ' ??? due ', ' - due '),
  ' ' || chr(8212) || ' due ', ' - due '
)
WHERE type = 'assignment_assigned'
  AND event_key LIKE 'ai:assigned:%'
  AND (strpos(message, ' ??? due ') > 0
    OR strpos(message, ' ' || chr(8212) || ' due ') > 0);

COMMIT;
