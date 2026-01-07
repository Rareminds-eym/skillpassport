-- School Library Management System Database Schema
-- This migration creates all tables required for the school library management module

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SCHOOL LIBRARY BOOKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS library_books_school (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL, -- References schools table for multi-tenancy
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT NOT NULL,
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
  CONSTRAINT check_available_copies_school CHECK (available_copies >= 0 AND available_copies <= total_copies),
  -- Unique ISBN per school
  CONSTRAINT unique_isbn_per_school UNIQUE (school_id, isbn)
);

-- ============================================================================
-- SCHOOL LIBRARY BOOK ISSUES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS library_book_issues_school (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL, -- References schools table for multi-tenancy
  book_id UUID REFERENCES library_books_school(id) ON DELETE CASCADE NOT NULL,
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
  CONSTRAINT check_return_date_school CHECK (return_date IS NULL OR return_date >= issue_date)
);

-- ============================================================================
-- SCHOOL LIBRARY SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS library_settings_school (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL, -- References schools table for multi-tenancy
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique setting key per school
  CONSTRAINT unique_setting_per_school UNIQUE (school_id, setting_key)
);

-- ============================================================================
-- SCHOOL LIBRARY CATEGORIES TABLE (Optional - for book categorization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS library_categories_school (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL, -- References schools table for multi-tenancy
  name TEXT NOT NULL,
  description TEXT,
  color_code TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique category name per school
  CONSTRAINT unique_category_per_school UNIQUE (school_id, name)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_library_books_school_school_id ON library_books_school(school_id);
CREATE INDEX IF NOT EXISTS idx_library_books_school_isbn ON library_books_school(school_id, isbn);
CREATE INDEX IF NOT EXISTS idx_library_books_school_title ON library_books_school(school_id, title);
CREATE INDEX IF NOT EXISTS idx_library_books_school_author ON library_books_school(school_id, author);
CREATE INDEX IF NOT EXISTS idx_library_books_school_status ON library_books_school(school_id, status);
CREATE INDEX IF NOT EXISTS idx_library_books_school_category ON library_books_school(school_id, category);

CREATE INDEX IF NOT EXISTS idx_library_book_issues_school_school_id ON library_book_issues_school(school_id);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_school_book_id ON library_book_issues_school(book_id);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_school_student_id ON library_book_issues_school(student_id);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_school_status ON library_book_issues_school(school_id, status);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_school_issue_date ON library_book_issues_school(school_id, issue_date);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_school_due_date ON library_book_issues_school(school_id, due_date);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_school_return_date ON library_book_issues_school(school_id, return_date);

CREATE INDEX IF NOT EXISTS idx_library_settings_school_school_id ON library_settings_school(school_id);
CREATE INDEX IF NOT EXISTS idx_library_settings_school_key ON library_settings_school(school_id, setting_key);

CREATE INDEX IF NOT EXISTS idx_library_categories_school_school_id ON library_categories_school(school_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================
CREATE TRIGGER update_library_books_school_updated_at 
    BEFORE UPDATE ON library_books_school
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_book_issues_school_updated_at 
    BEFORE UPDATE ON library_book_issues_school
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_settings_school_updated_at 
    BEFORE UPDATE ON library_settings_school
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_categories_school_updated_at 
    BEFORE UPDATE ON library_categories_school
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR SCHOOL LIBRARY OPERATIONS
-- ============================================================================

-- Function to automatically update book availability when issuing/returning (School version)
CREATE OR REPLACE FUNCTION update_book_availability_school()
RETURNS TRIGGER AS $
BEGIN
    -- If inserting a new issue (book being issued)
    IF TG_OP = 'INSERT' AND NEW.status = 'issued' THEN
        UPDATE library_books_school 
        SET available_copies = available_copies - 1,
            status = CASE 
                WHEN available_copies - 1 = 0 THEN 'all_issued'
                ELSE 'available'
            END
        WHERE id = NEW.book_id AND school_id = NEW.school_id;
        
    -- If updating an issue (book being returned)
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'issued' AND NEW.status = 'returned' THEN
        UPDATE library_books_school 
        SET available_copies = available_copies + 1,
            status = 'available'
        WHERE id = NEW.book_id AND school_id = NEW.school_id;
        
    -- If deleting an issue record (cleanup)
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'issued' THEN
        UPDATE library_books_school 
        SET available_copies = available_copies + 1,
            status = 'available'
        WHERE id = OLD.book_id AND school_id = OLD.school_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$ language 'plpgsql';

-- Trigger to automatically update book availability (School version)
CREATE TRIGGER trigger_update_book_availability_school
    AFTER INSERT OR UPDATE OR DELETE ON library_book_issues_school
    FOR EACH ROW EXECUTE FUNCTION update_book_availability_school();

-- Function to calculate fine for overdue books (School version)
CREATE OR REPLACE FUNCTION calculate_fine_school(p_school_id UUID, issue_date DATE, return_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(10,2) AS $
DECLARE
    loan_period INTEGER;
    fine_per_day DECIMAL(10,2);
    due_date DATE;
    overdue_days INTEGER;
BEGIN
    -- Get library settings for this school
    SELECT setting_value::INTEGER INTO loan_period 
    FROM library_settings_school 
    WHERE school_id = p_school_id AND setting_key = 'default_loan_period_days';
    
    SELECT setting_value::DECIMAL INTO fine_per_day 
    FROM library_settings_school 
    WHERE school_id = p_school_id AND setting_key = 'fine_per_day';
    
    -- Use defaults if settings not found
    loan_period := COALESCE(loan_period, 14);
    fine_per_day := COALESCE(fine_per_day, 10);
    
    -- Calculate due date
    due_date := issue_date + (loan_period || ' days')::INTERVAL;
    
    -- Calculate overdue days
    overdue_days := GREATEST(0, return_date - due_date);
    
    -- Return fine amount
    RETURN overdue_days * fine_per_day;
END;
$ language 'plpgsql';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE library_books_school ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_book_issues_school ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_settings_school ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_categories_school ENABLE ROW LEVEL SECURITY;

-- Policies for library_books_school (school-specific access)
CREATE POLICY "School users can view their school's library books" ON library_books_school 
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM school_educators WHERE user_id = auth.uid()
            UNION
            SELECT id FROM schools WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "School admins can manage their school's library books" ON library_books_school 
    FOR ALL USING (
        school_id IN (
            SELECT school_id FROM school_educators WHERE user_id = auth.uid()
            UNION
            SELECT id FROM schools WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
        AND EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'school_admin', 'librarian')
        )
    );

-- Policies for library_book_issues_school
CREATE POLICY "School users can view their school's book issues" ON library_book_issues_school 
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM school_educators WHERE user_id = auth.uid()
            UNION
            SELECT id FROM schools WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "School admins can manage their school's book issues" ON library_book_issues_school 
    FOR ALL USING (
        school_id IN (
            SELECT school_id FROM school_educators WHERE user_id = auth.uid()
            UNION
            SELECT id FROM schools WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
        AND EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'school_admin', 'librarian')
        )
    );

-- Policies for library_settings_school
CREATE POLICY "School admins can view their school's library settings" ON library_settings_school 
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM school_educators WHERE user_id = auth.uid()
            UNION
            SELECT id FROM schools WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
        AND EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'school_admin', 'librarian')
        )
    );

CREATE POLICY "School admins can manage their school's library settings" ON library_settings_school 
    FOR ALL USING (
        school_id IN (
            SELECT school_id FROM school_educators WHERE user_id = auth.uid()
            UNION
            SELECT id FROM schools WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
        AND EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'school_admin', 'librarian')
        )
    );

-- Policies for library_categories_school
CREATE POLICY "School users can view their school's library categories" ON library_categories_school 
    FOR SELECT USING (
        school_id IN (
            SELECT school_id FROM school_educators WHERE user_id = auth.uid()
            UNION
            SELECT id FROM schools WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

CREATE POLICY "School admins can manage their school's library categories" ON library_categories_school 
    FOR ALL USING (
        school_id IN (
            SELECT school_id FROM school_educators WHERE user_id = auth.uid()
            UNION
            SELECT id FROM schools WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
        AND EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'school_admin', 'librarian')
        )
    );

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for overdue books (School version)
CREATE OR REPLACE VIEW overdue_books_school AS
SELECT 
    lbi.*,
    lb.title,
    lb.author,
    lb.isbn,
    calculate_fine_school(lbi.school_id, lbi.issue_date, CURRENT_DATE) as current_fine,
    CURRENT_DATE - lbi.due_date as days_overdue
FROM library_book_issues_school lbi
JOIN library_books_school lb ON lbi.book_id = lb.id
WHERE lbi.status = 'issued' 
AND lbi.due_date < CURRENT_DATE;

-- View for library statistics (School version)
CREATE OR REPLACE VIEW library_stats_school AS
SELECT 
    school_id,
    (SELECT COUNT(*) FROM library_books_school lbs WHERE lbs.school_id = main.school_id) as total_books,
    (SELECT SUM(total_copies) FROM library_books_school lbs WHERE lbs.school_id = main.school_id) as total_copies,
    (SELECT SUM(available_copies) FROM library_books_school lbs WHERE lbs.school_id = main.school_id) as available_copies,
    (SELECT COUNT(*) FROM library_book_issues_school lbis WHERE lbis.school_id = main.school_id AND lbis.status = 'issued') as currently_issued,
    (SELECT COUNT(*) FROM overdue_books_school obs WHERE obs.school_id = main.school_id) as overdue_count,
    (SELECT SUM(current_fine) FROM overdue_books_school obs WHERE obs.school_id = main.school_id) as total_pending_fines
FROM (
    SELECT DISTINCT school_id FROM library_books_school
    UNION
    SELECT DISTINCT school_id FROM library_book_issues_school
) main;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE library_books_school IS 'Master table for all books in school libraries';
COMMENT ON TABLE library_book_issues_school IS 'Track book issues and returns with student information for schools';
COMMENT ON TABLE library_settings_school IS 'Configurable library settings and rules for schools';
COMMENT ON TABLE library_categories_school IS 'Book categories for organization in school libraries';

COMMENT ON FUNCTION calculate_fine_school IS 'Calculate fine amount for overdue books based on school library settings';
COMMENT ON FUNCTION update_book_availability_school IS 'Automatically update book availability when books are issued/returned in school libraries';

COMMENT ON VIEW overdue_books_school IS 'View showing all currently overdue books with calculated fines for schools';
COMMENT ON VIEW library_stats_school IS 'View providing library statistics and metrics for schools';