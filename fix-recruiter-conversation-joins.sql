-- Fix Recruiter Conversation JOINs
-- This will enable recruiters to see opportunity titles and company names in their conversation list

-- Step 1: Add unique constraints to enable foreign key relationships
-- (Required because foreign keys can only reference unique columns)

ALTER TABLE opportunities 
ADD CONSTRAINT opportunities_id_old_unique UNIQUE (id_old);

ALTER TABLE applied_jobs 
ADD CONSTRAINT applied_jobs_id_old_unique UNIQUE (id_old);

-- Step 2: Add foreign key constraints to enable Supabase JOINs
-- This tells Supabase how to relate conversations to opportunities and applications

ALTER TABLE conversations 
ADD CONSTRAINT conversations_opportunity_id_fkey 
FOREIGN KEY (opportunity_id) REFERENCES opportunities (id_old);

ALTER TABLE conversations 
ADD CONSTRAINT conversations_application_id_fkey 
FOREIGN KEY (application_id) REFERENCES applied_jobs (id_old);

-- Step 3: Verify the constraints were created successfully
SELECT 
    tc.constraint_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'conversations'
AND kcu.column_name IN ('opportunity_id', 'application_id');

-- Expected result: Should show 2 foreign key constraints
-- conversations_opportunity_id_fkey: opportunity_id -> opportunities(id_old)
-- conversations_application_id_fkey: application_id -> applied_jobs(id_old)