-- Complete Library Management System Setup
-- Run this script in your Supabase SQL Editor to set up the entire library system

-- First, run the main schema
\i supabase/migrations/library_management_schema.sql

-- Then, insert sample data
\i supabase/migrations/library_sample_data.sql

-- Verify the setup
SELECT 'Library System Setup Complete!' as status;

-- Show summary statistics
SELECT 
    'Books' as table_name,
    COUNT(*) as record_count
FROM library_books
UNION ALL
SELECT 
    'Book Issues' as table_name,
    COUNT(*) as record_count
FROM library_book_issues
UNION ALL
SELECT 
    'Library Settings' as table_name,
    COUNT(*) as record_count
FROM library_settings
UNION ALL
SELECT 
    'Library Categories' as table_name,
    COUNT(*) as record_count
FROM library_categories;

-- Show current library statistics
SELECT * FROM library_stats;