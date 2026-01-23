@echo off
echo Setting up university_colleges table...

REM Run the SQL migration
psql -h db.xxxxxxxxxxxxxxxxxxxxxxxx.supabase.co -p 5432 -U postgres -d postgres -f create-university-colleges-table.sql

echo University colleges table setup complete!
echo.
echo Next steps:
echo 1. Update the university_id values in the university_colleges table to match actual universities
echo 2. Test the college registration page at http://localhost:3000/university-admin/colleges/registration
echo 3. Verify that colleges can be added from the organizations table
echo.
pause