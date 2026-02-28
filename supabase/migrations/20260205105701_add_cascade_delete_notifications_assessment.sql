-- Migration: Add CASCADE delete to notifications.assessment_id foreign key
-- When an assessment is deleted, related notifications are automatically deleted

-- Drop existing constraint if it exists
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notifications_assessment_id_fkey;

-- Recreate it with ON DELETE CASCADE
ALTER TABLE notifications 
ADD CONSTRAINT notifications_assessment_id_fkey 
FOREIGN KEY (assessment_id) 
REFERENCES personal_assessment_results(id) 
ON DELETE CASCADE;

-- Verify the constraint was created
-- Expected: on_delete_action should be 'CASCADE'
-- Action codes: 'a' = NO ACTION, 'r' = RESTRICT, 'c' = CASCADE, 'n' = SET NULL, 'd' = SET DEFAULT
-- SELECT 
--     conname AS constraint_name,
--     conrelid::regclass AS table_name,
--     confrelid::regclass AS referenced_table,
--     CASE confdeltype
--         WHEN 'a' THEN 'NO ACTION'
--         WHEN 'r' THEN 'RESTRICT'
--         WHEN 'c' THEN 'CASCADE'
--         WHEN 'n' THEN 'SET NULL'
--         WHEN 'd' THEN 'SET DEFAULT'
--     END AS on_delete_action
-- FROM pg_constraint
-- WHERE conname = 'notifications_assessment_id_fkey';
