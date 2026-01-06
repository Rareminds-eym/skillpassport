-- Run this script in your Supabase SQL Editor to set up the Library Management System

-- ============================================================================
-- LIBRARY MANAGEMENT SYSTEM SETUP
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LIBRARY BOOKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS library_books_college (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL, -- References colleges table for multi-tenancy
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT NOT NULL, -- Removed global UNIQUE constraint
  total_copies INTEGER NOT NULL DEFAULT 1,
  available_copies INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'all_issued', 'maintenance')),
  category TEXT,
  publisher TEXT,
  publication_year INTEGER,
  description TEXT,
  location_shelf TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure available copies never exceed total copies
  CONSTRAINT check_available_copies CHECK (available_copies >= 0 AND available_copies <= total_copies),
  -- Unique ISBN per college (same book can exist in different colleges)
  UNIQUE(college_id, isbn)
);

-- ============================================================================
-- LIBRARY BOOK ISSUES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS library_book_issues_college (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL, -- References colleges table for multi-tenancy
  book_id UUID REFERENCES library_books_college(id) ON DELETE CASCADE NOT NULL,
  student_id TEXT NOT NULL, -- References students(id) but as TEXT
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  class TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  return_date DATE,
  status TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue')),
  fine_amount DECIMAL(10,2) DEFAULT 0,
  fine_paid BOOLEAN DEFAULT FALSE,
  remarks TEXT,
  issued_by TEXT, -- Staff/Admin who issued the book
  returned_by TEXT, -- Staff/Admin who processed the return
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure return date is after issue date if provided
  CONSTRAINT check_return_date CHECK (return_date IS NULL OR return_date >= issue_date)
);

-- ============================================================================
-- LIBRARY SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS library_settings_college (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL, -- References colleges table for multi-tenancy
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique setting per college
  UNIQUE(college_id, setting_key)
);

-- Insert default library settings (will be updated in sample data section with college_id)
-- This is just the table creation, actual data insertion happens later with college_id

-- ============================================================================
-- LIBRARY CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS library_categories_college (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID NOT NULL, -- References colleges table for multi-tenancy
  name TEXT NOT NULL,
  description TEXT,
  color_code TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique category name per college
  UNIQUE(college_id, name)
);

-- Insert default categories (will be updated in sample data section with college_id)
-- This is just the table creation, actual data insertion happens later with college_id

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_library_books_college_college_id ON library_books_college(college_id);
CREATE INDEX IF NOT EXISTS idx_library_books_college_isbn ON library_books_college(college_id, isbn);
CREATE INDEX IF NOT EXISTS idx_library_books_college_title ON library_books_college(college_id, title);
CREATE INDEX IF NOT EXISTS idx_library_books_college_author ON library_books_college(college_id, author);
CREATE INDEX IF NOT EXISTS idx_library_books_college_status ON library_books_college(college_id, status);
CREATE INDEX IF NOT EXISTS idx_library_books_college_category ON library_books_college(college_id, category);

CREATE INDEX IF NOT EXISTS idx_library_book_issues_college_college_id ON library_book_issues_college(college_id);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_college_book_id ON library_book_issues_college(book_id);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_college_student_id ON library_book_issues_college(college_id, student_id);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_college_status ON library_book_issues_college(college_id, status);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_college_issue_date ON library_book_issues_college(college_id, issue_date);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_college_due_date ON library_book_issues_college(college_id, due_date);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_college_return_date ON library_book_issues_college(college_id, return_date);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_library_books_college_updated_at 
    BEFORE UPDATE ON library_books_college
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_book_issues_college_updated_at 
    BEFORE UPDATE ON library_book_issues_college
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_settings_college_updated_at 
    BEFORE UPDATE ON library_settings_college
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_categories_college_updated_at 
    BEFORE UPDATE ON library_categories_college
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR LIBRARY OPERATIONS
-- ============================================================================

-- Function to automatically update book availability when issuing/returning
CREATE OR REPLACE FUNCTION update_book_availability_college()
RETURNS TRIGGER AS $$
BEGIN
    -- If inserting a new issue (book being issued)
    IF TG_OP = 'INSERT' AND NEW.status = 'issued' THEN
        UPDATE library_books_college 
        SET available_copies = available_copies - 1,
            status = CASE 
                WHEN available_copies - 1 = 0 THEN 'all_issued'
                ELSE 'available'
            END
        WHERE id = NEW.book_id AND college_id = NEW.college_id;
        
    -- If updating an issue (book being returned)
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'issued' AND NEW.status = 'returned' THEN
        UPDATE library_books_college 
        SET available_copies = available_copies + 1,
            status = 'available'
        WHERE id = NEW.book_id AND college_id = NEW.college_id;
        
    -- If deleting an issue record (cleanup)
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'issued' THEN
        UPDATE library_books_college 
        SET available_copies = available_copies + 1,
            status = 'available'
        WHERE id = OLD.book_id AND college_id = OLD.college_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger to automatically update book availability
CREATE TRIGGER trigger_update_book_availability_college
    AFTER INSERT OR UPDATE OR DELETE ON library_book_issues_college
    FOR EACH ROW EXECUTE FUNCTION update_book_availability_college();

-- Function to calculate fine for overdue books (college-specific settings)
CREATE OR REPLACE FUNCTION calculate_fine_college(p_college_id UUID, issue_date DATE, return_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    loan_period INTEGER;
    fine_per_day DECIMAL(10,2);
    due_date DATE;
    overdue_days INTEGER;
BEGIN
    -- Get library settings for specific college
    SELECT setting_value::INTEGER INTO loan_period 
    FROM library_settings_college 
    WHERE college_id = p_college_id AND setting_key = 'default_loan_period_days';
    
    SELECT setting_value::DECIMAL INTO fine_per_day 
    FROM library_settings_college 
    WHERE college_id = p_college_id AND setting_key = 'fine_per_day';
    
    -- Use default values if settings not found
    loan_period := COALESCE(loan_period, 14);
    fine_per_day := COALESCE(fine_per_day, 10);
    
    -- Calculate due date
    due_date := issue_date + (loan_period || ' days')::INTERVAL;
    
    -- Calculate overdue days
    overdue_days := GREATEST(0, return_date - due_date);
    
    -- Return fine amount
    RETURN overdue_days * fine_per_day;
END;
$$ language 'plpgsql';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE library_books_college ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_book_issues_college ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_settings_college ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_categories_college ENABLE ROW LEVEL SECURITY;

-- Policies for library_books_college (everyone can view, only admins can modify)
DROP POLICY IF EXISTS "Anyone can view library books" ON library_books_college;
CREATE POLICY "Anyone can view library books" ON library_books_college FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage library books" ON library_books_college;
CREATE POLICY "Only admins can manage library books" ON library_books_college FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND (
            auth.users.raw_user_meta_data->>'role' IN ('admin', 'college_admin', 'librarian')
            OR auth.users.email LIKE '%@admin.%'
        )
    )
);

-- Policies for library_book_issues_college
DROP POLICY IF EXISTS "Students can view their own book issues" ON library_book_issues_college;
CREATE POLICY "Students can view their own book issues" ON library_book_issues_college 
    FOR SELECT USING (auth.uid()::text = student_id);

DROP POLICY IF EXISTS "Admins can view all book issues" ON library_book_issues_college;
CREATE POLICY "Admins can view all book issues" ON library_book_issues_college 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (
                auth.users.raw_user_meta_data->>'role' IN ('admin', 'college_admin', 'librarian')
                OR auth.users.email LIKE '%@admin.%'
            )
        )
    );

DROP POLICY IF EXISTS "Only admins can manage book issues" ON library_book_issues_college;
CREATE POLICY "Only admins can manage book issues" ON library_book_issues_college FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND (
            auth.users.raw_user_meta_data->>'role' IN ('admin', 'college_admin', 'librarian')
            OR auth.users.email LIKE '%@admin.%'
        )
    )
);

-- Policies for library_settings_college (only admins can manage)
DROP POLICY IF EXISTS "Admins can view library settings" ON library_settings_college;
CREATE POLICY "Admins can view library settings" ON library_settings_college FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND (
            auth.users.raw_user_meta_data->>'role' IN ('admin', 'college_admin', 'librarian')
            OR auth.users.email LIKE '%@admin.%'
        )
    )
);

DROP POLICY IF EXISTS "Only admins can manage library settings" ON library_settings_college;
CREATE POLICY "Only admins can manage library settings" ON library_settings_college FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND (
            auth.users.raw_user_meta_data->>'role' IN ('admin', 'college_admin', 'librarian')
            OR auth.users.email LIKE '%@admin.%'
        )
    )
);

-- Policies for library_categories_college
DROP POLICY IF EXISTS "Anyone can view library categories" ON library_categories_college;
CREATE POLICY "Anyone can view library categories" ON library_categories_college FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage library categories" ON library_categories_college;
CREATE POLICY "Only admins can manage library categories" ON library_categories_college FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND (
            auth.users.raw_user_meta_data->>'role' IN ('admin', 'college_admin', 'librarian')
            OR auth.users.email LIKE '%@admin.%'
        )
    )
);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for overdue books (college-specific)
CREATE OR REPLACE VIEW overdue_books_college AS
SELECT 
    lbi.*,
    lb.title,
    lb.author,
    lb.isbn,
    calculate_fine_college(lbi.college_id, lbi.issue_date, CURRENT_DATE) as current_fine,
    CURRENT_DATE - lbi.due_date as days_overdue
FROM library_book_issues_college lbi
JOIN library_books_college lb ON lbi.book_id = lb.id
WHERE lbi.status = 'issued' 
AND lbi.due_date < CURRENT_DATE;

-- View for library statistics (college-specific)
CREATE OR REPLACE VIEW library_stats_college AS
SELECT 
    college_id,
    (SELECT COUNT(*) FROM library_books_college WHERE library_books_college.college_id = main.college_id) as total_books,
    (SELECT SUM(total_copies) FROM library_books_college WHERE library_books_college.college_id = main.college_id) as total_copies,
    (SELECT SUM(available_copies) FROM library_books_college WHERE library_books_college.college_id = main.college_id) as available_copies,
    (SELECT COUNT(*) FROM library_book_issues_college WHERE library_book_issues_college.college_id = main.college_id AND status = 'issued') as currently_issued,
    (SELECT COUNT(*) FROM overdue_books_college WHERE overdue_books_college.college_id = main.college_id) as overdue_count,
    (SELECT COALESCE(SUM(current_fine), 0) FROM overdue_books_college WHERE overdue_books_college.college_id = main.college_id) as total_pending_fines
FROM (
    SELECT DISTINCT college_id FROM library_books_college
    UNION
    SELECT DISTINCT college_id FROM library_book_issues_college
) main;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Function to get or create default college for sample data
DO $$
DECLARE
    default_college_id UUID;
BEGIN
    -- Try to get an existing college, or create a default one
    SELECT id INTO default_college_id FROM colleges LIMIT 1;
    
    IF default_college_id IS NULL THEN
        -- Create a default college if none exists
        INSERT INTO colleges (name, code, address, phone, email, website, established_year, type, status)
        VALUES ('Sample College', 'SAMPLE001', 'Sample Address', '+91-1234567890', 'info@samplecollege.edu', 'www.samplecollege.edu', 2020, 'Engineering', 'active')
        RETURNING id INTO default_college_id;
    END IF;
    
    -- Store the college_id for use in sample data
    CREATE TEMP TABLE temp_college_id (college_id UUID);
    INSERT INTO temp_college_id VALUES (default_college_id);
END $$;

-- Insert default library settings for the college
INSERT INTO library_settings_college (college_id, setting_key, setting_value, description) 
SELECT 
    college_id,
    unnest(ARRAY['max_books_per_student', 'default_loan_period_days', 'fine_per_day', 'library_name', 'library_email', 'library_phone']),
    unnest(ARRAY['3', '14', '10', 'College Library', 'library@college.edu', '+91-XXXXXXXXXX']),
    unnest(ARRAY['Maximum number of books a student can issue at once', 'Default loan period in days', 'Fine amount per day for overdue books (in rupees)', 'Name of the library', 'Library contact email', 'Library contact phone'])
FROM temp_college_id
ON CONFLICT (college_id, setting_key) DO NOTHING;

-- Insert default categories for the college
INSERT INTO library_categories_college (college_id, name, description, color_code) 
SELECT 
    college_id,
    unnest(ARRAY['Academic', 'Fiction', 'Non-Fiction', 'Reference', 'Journals', 'Digital']),
    unnest(ARRAY['Academic textbooks and reference materials', 'Fiction books and novels', 'Non-fiction books and biographies', 'Reference books and encyclopedias', 'Academic journals and periodicals', 'Digital resources and e-books']),
    unnest(ARRAY['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'])
FROM temp_college_id
ON CONFLICT (college_id, name) DO NOTHING;

-- Insert sample library books for the college
INSERT INTO library_books_college (college_id, title, author, isbn, total_copies, available_copies, status, category, publisher, publication_year, description, location_shelf) 
SELECT 
    college_id,
    unnest(ARRAY['Mathematics Grade 8', 'Science Grade 9', 'English Grammar', 'History of India', 'Geography Basics', 'Physics Grade 10', 'Chemistry Grade 10', 'Biology Grade 9', 'Computer Science Basics', 'Environmental Studies']),
    unnest(ARRAY['R.S. Sharma', 'S. Gupta', 'L. Roy', 'A. Singh', 'M. Patel', 'S. Kumar', 'R. Das', 'N. Mehta', 'V. Sharma', 'P. Jain']),
    unnest(ARRAY['9781234567890', '9789876543210', '9781122334455', '9782233445566', '9783344556677', '9784455667788', '9785566778899', '9786677889900', '9787788990011', '9788899001122']),
    unnest(ARRAY[5, 3, 4, 2, 6, 3, 5, 4, 2, 3]),
    unnest(ARRAY[5, 3, 4, 2, 6, 3, 5, 4, 2, 3]),
    'available',
    'Academic',
    unnest(ARRAY['Academic Publishers', 'Science Publications', 'Language Press', 'Historical Books Ltd', 'Geo Publications', 'Physics World', 'Chem Books', 'Bio Science Press', 'Tech Publications', 'Green Earth Books']),
    unnest(ARRAY[2023, 2023, 2022, 2023, 2023, 2023, 2023, 2022, 2023, 2023]),
    unnest(ARRAY['Comprehensive mathematics textbook for grade 8 students', 'Complete science curriculum for grade 9', 'Essential English grammar for students', 'Comprehensive Indian history textbook', 'Introduction to geography concepts', 'Advanced physics for grade 10 students', 'Organic and inorganic chemistry', 'Life sciences and biology fundamentals', 'Introduction to computer programming', 'Environmental awareness and conservation']),
    unnest(ARRAY['A1-B2', 'A2-B1', 'B1-C2', 'C1-D1', 'C2-D2', 'D1-E1', 'D2-E2', 'E1-F1', 'F1-G1', 'G1-H1'])
FROM temp_college_id
ON CONFLICT (college_id, isbn) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show setup results
SELECT 'Library Management System Setup Complete!' as message;

-- Show table counts
SELECT 
    'Books' as table_name,
    COUNT(*) as record_count
FROM library_books_college
UNION ALL
SELECT 
    'Categories' as table_name,
    COUNT(*) as record_count
FROM library_categories_college
UNION ALL
SELECT 
    'Settings' as table_name,
    COUNT(*) as record_count
FROM library_settings_college;

-- Show library statistics for each college
SELECT 
    college_id,
    total_books,
    total_copies,
    available_copies,
    currently_issued,
    overdue_count,
    total_pending_fines
FROM library_stats_college;

-- Clean up temp table
DROP TABLE IF EXISTS temp_college_id;