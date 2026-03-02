-- Check all triggers on experience table
SELECT 
  tgname as trigger_name,
  tgenabled as enabled,
  proname as function_name,
  CASE 
    WHEN tgtype::int & 1 = 1 THEN 'ROW'
    ELSE 'STATEMENT'
  END as level,
  CASE 
    WHEN tgtype::int & 2 = 2 THEN 'BEFORE'
    WHEN tgtype::int & 64 = 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END as timing,
  CASE 
    WHEN tgtype::int & 4 = 4 THEN 'INSERT'
    WHEN tgtype::int & 8 = 8 THEN 'DELETE'
    WHEN tgtype::int & 16 = 16 THEN 'UPDATE'
    WHEN tgtype::int & 28 = 28 THEN 'INSERT OR UPDATE OR DELETE'
    ELSE 'MULTIPLE'
  END as event
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'experience'::regclass
  AND NOT tgisinternal
ORDER BY tgname;
