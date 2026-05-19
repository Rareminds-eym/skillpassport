ALTER TABLE public.learners 
ADD COLUMN IF NOT EXISTS learner_type text NULL;

-- Create an index on learner_type for better query performance
CREATE INDEX IF NOT EXISTS idx_learners_learner_type 
ON public.learners USING btree (learner_type) 
TABLESPACE pg_default;