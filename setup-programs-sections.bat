@echo off
echo Applying Programs and Sections Migration...
supabase db push --file database/migrations/06_programs_sections_enhancement.sql
echo Migration complete!
pause
