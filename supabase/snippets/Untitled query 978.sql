-- Check what columns the FDW can see in the remote organizations table
SELECT * 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND table_schema = 'public';
