-- Check the constraint on mode field
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'attendance_records'::regclass
AND conname LIKE '%mode%';

-- Also check existing mode values
SELECT DISTINCT mode 
FROM attendance_records 
WHERE mode IS NOT NULL;
