-- The API stores the authenticated users.id, including educators who have no
-- learners record. Keep the legacy column name for API/RLS compatibility.
BEGIN;

ALTER TABLE public.tutor_conversations
  DROP CONSTRAINT IF EXISTS tutor_conversations_learner_id_fkey1;

-- Allow reruns after this fix has already been applied manually.
-- The transaction restores and validates the constraint before committing.
ALTER TABLE public.tutor_conversations
  DROP CONSTRAINT IF EXISTS tutor_conversations_owner_user_fkey;

-- Preserve older conversations whose owner was a learner profile ID.
UPDATE public.tutor_conversations AS conversation
SET learner_id = learner.user_id
FROM public.learners AS learner
WHERE conversation.learner_id = learner.id
  AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = conversation.learner_id)
  AND EXISTS (SELECT 1 FROM public.users WHERE id = learner.user_id);

-- Validation deliberately fails (and rolls back) if an owner cannot be mapped.
ALTER TABLE public.tutor_conversations
  ADD CONSTRAINT tutor_conversations_owner_user_fkey
  FOREIGN KEY (learner_id) REFERENCES public.users(id);

COMMENT ON COLUMN public.tutor_conversations.learner_id IS
  'Authenticated users.id of the conversation owner; supports learners and educators.';

COMMIT;
