BEGIN;
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'profile';
UPDATE public.skills SET source='lte' WHERE lte_skill_id IS NOT NULL AND source='profile';
CREATE INDEX IF NOT EXISTS skills_lte_source_lookup ON public.skills(learner_id,name) WHERE source='lte';
COMMIT;
