@echo off
echo Setting up generated external assessment table...
echo.

REM Run the SQL migration
psql -h aws-0-ap-south-1.pooler.supabase.com -p 6543 -d postgres -U postgres.ztqxqxqxqxqxqxqx -f database/create_certificate_questions_table.sql

echo.
echo Setup complete!
pause
