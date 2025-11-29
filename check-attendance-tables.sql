-- Check what attendance-related tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%attendance%'
ORDER BY table_name;

-- Also check for any student management tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%student%' OR table_name LIKE '%attendance%')
ORDER BY table_name;
