-- Fix College Messaging Receiver Type Inconsistency
-- This fixes the exact issue where student messages to college educators 
-- have receiver_type = "educator" instead of "college_educator"

-- First, let's see the current state
SELECT 
    sender_type,
    receiver_type,
    COUNT(*) as count
FROM messages 
WHERE conversation_id IN (
    SELECT id FROM conversations 
    WHERE conversation_type = 'student_college_educator'
)
GROUP BY sender_type, receiver_type
ORDER BY sender_type, receiver_type;

-- Fix the inconsistent receiver_type values
-- Update student messages that have receiver_type = "educator" to "college_educator"
UPDATE messages 
SET receiver_type = 'college_educator'
WHERE conversation_id IN (
    SELECT id FROM conversations 
    WHERE conversation_type = 'student_college_educator'
) 
AND sender_type = 'student' 
AND receiver_type = 'educator';

-- Verify the fix
SELECT 
    sender_type,
    receiver_type,
    COUNT(*) as count
FROM messages 
WHERE conversation_id IN (
    SELECT id FROM conversations 
    WHERE conversation_type = 'student_college_educator'
)
GROUP BY sender_type, receiver_type
ORDER BY sender_type, receiver_type;

-- Expected result after fix:
-- sender_type        | receiver_type      | count
-- student           | college_educator   | X
-- college_educator  | student           | Y