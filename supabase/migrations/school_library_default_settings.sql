-- Insert default library settings for all existing schools
-- This should be run after the school_library_management_schema.sql migration

-- Insert default settings for each school
INSERT INTO library_settings_school (school_id, setting_key, setting_value, description)
SELECT 
    s.id as school_id,
    'max_books_per_student' as setting_key,
    '3' as setting_value,
    'Maximum number of books a student can issue at once' as description
FROM schools s
WHERE NOT EXISTS (
    SELECT 1 FROM library_settings_school lss 
    WHERE lss.school_id = s.id AND lss.setting_key = 'max_books_per_student'
);

INSERT INTO library_settings_school (school_id, setting_key, setting_value, description)
SELECT 
    s.id as school_id,
    'default_loan_period_days' as setting_key,
    '14' as setting_value,
    'Default loan period in days' as description
FROM schools s
WHERE NOT EXISTS (
    SELECT 1 FROM library_settings_school lss 
    WHERE lss.school_id = s.id AND lss.setting_key = 'default_loan_period_days'
);

INSERT INTO library_settings_school (school_id, setting_key, setting_value, description)
SELECT 
    s.id as school_id,
    'fine_per_day' as setting_key,
    '10' as setting_value,
    'Fine amount per day for overdue books (in rupees)' as description
FROM schools s
WHERE NOT EXISTS (
    SELECT 1 FROM library_settings_school lss 
    WHERE lss.school_id = s.id AND lss.setting_key = 'fine_per_day'
);

INSERT INTO library_settings_school (school_id, setting_key, setting_value, description)
SELECT 
    s.id as school_id,
    'library_name' as setting_key,
    COALESCE(s.name || ' Library', 'School Library') as setting_value,
    'Name of the library' as description
FROM schools s
WHERE NOT EXISTS (
    SELECT 1 FROM library_settings_school lss 
    WHERE lss.school_id = s.id AND lss.setting_key = 'library_name'
);

INSERT INTO library_settings_school (school_id, setting_key, setting_value, description)
SELECT 
    s.id as school_id,
    'library_email' as setting_key,
    COALESCE(s.email, 'library@school.edu') as setting_value,
    'Library contact email' as description
FROM schools s
WHERE NOT EXISTS (
    SELECT 1 FROM library_settings_school lss 
    WHERE lss.school_id = s.id AND lss.setting_key = 'library_email'
);

INSERT INTO library_settings_school (school_id, setting_key, setting_value, description)
SELECT 
    s.id as school_id,
    'library_phone' as setting_key,
    COALESCE(s.contact_number, '+91-XXXXXXXXXX') as setting_value,
    'Library contact phone' as description
FROM schools s
WHERE NOT EXISTS (
    SELECT 1 FROM library_settings_school lss 
    WHERE lss.school_id = s.id AND lss.setting_key = 'library_phone'
);

-- Insert default categories for each school
INSERT INTO library_categories_school (school_id, name, description, color_code)
SELECT 
    s.id as school_id,
    'Academic' as name,
    'Academic textbooks and reference materials' as description,
    '#3B82F6' as color_code
FROM schools s
WHERE NOT EXISTS (
    SELECT 1 FROM library_categories_school lcs 
    WHERE lcs.school_id = s.id AND lcs.name = 'Academic'
);

INSERT INTO library_categories_school (school_id, name, description, color_code)
SELECT 
    s.id as school_id,
    'Fiction' as name,
    'Fiction books and novels' as description,
    '#10B981' as color_code
FROM schools s
WHERE NOT EXISTS (
    SELECT 1 FROM library_categories_school lcs 
    WHERE lcs.school_id = s.id AND lcs.name = 'Fiction'
);

INSERT INTO library_categories_school (school_id, name, description, color_code)
SELECT 
    s.id as school_id,
    'Non-Fiction' as name,
    'Non-fiction books and biographies' as description,
    '#F59E0B' as color_code
FROM schools s
WHERE NOT EXISTS (
    SELECT 1 FROM library_categories_school lcs 
    WHERE lcs.school_id = s.id AND lcs.name = 'Non-Fiction'
);

INSERT INTO library_categories_school (school_id, name, description, color_code)
SELECT 
    s.id as school_id,
    'Reference' as name,
    'Reference books and encyclopedias' as description,
    '#EF4444' as color_code
FROM schools s
WHERE NOT EXISTS (
    SELECT 1 FROM library_categories_school lcs 
    WHERE lcs.school_id = s.id AND lcs.name = 'Reference'
);

INSERT INTO library_categories_school (school_id, name, description, color_code)
SELECT 
    s.id as school_id,
    'Journals' as name,
    'Academic journals and periodicals' as description,
    '#8B5CF6' as color_code
FROM schools s
WHERE NOT EXISTS (
    SELECT 1 FROM library_categories_school lcs 
    WHERE lcs.school_id = s.id AND lcs.name = 'Journals'
);

INSERT INTO library_categories_school (school_id, name, description, color_code)
SELECT 
    s.id as school_id,
    'Digital' as name,
    'Digital resources and e-books' as description,
    '#06B6D4' as color_code
FROM schools s
WHERE NOT EXISTS (
    SELECT 1 FROM library_categories_school lcs 
    WHERE lcs.school_id = s.id AND lcs.name = 'Digital'
);

-- Log the number of schools that got default settings
DO $$
DECLARE
    school_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO school_count FROM schools;
    RAISE NOTICE 'Default library settings and categories created for % schools', school_count;
END $$;