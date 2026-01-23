@echo off
echo Deploying Library Management System...

echo.
echo 1. Creating library database schema...
supabase db reset --db-url "postgresql://postgres.wnqjqjqjqjqjqjqj:Aditya@2005@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" --file supabase/migrations/library_management_schema.sql

echo.
echo 2. Inserting sample library data...
supabase db reset --db-url "postgresql://postgres.wnqjqjqjqjqjqjqj:Aditya@2005@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" --file supabase/migrations/library_sample_data.sql

echo.
echo Library Management System deployed successfully!
echo.
echo You can now:
echo - Add books to the library
echo - Issue books to students
echo - Track returns and overdue books
echo - View library statistics
echo.
pause