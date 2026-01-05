-- Library Management System Database Schema
-- This migration creates all tables required for the library management module

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- LIBRARY BOOKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS library_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE NOT NULL,
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
  CONSTRAINT check_available_copies CHECK (available_copies >= 0 AND available_copies <= total_copies)
);

-- ============================================================================
-- LIBRARY BOOK ISSUES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS library_book_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID REFERENCES library_books(id) ON DELETE CASCADE NOT NULL,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE NOT NULL,
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
CREATE TABLE IF NOT EXISTS library_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default library settings
INSERT INTO library_settings (setting_key, setting_value, description) VALUES
('max_books_per_student', '3', 'Maximum number of books a student can issue at once'),
('default_loan_period_days', '14', 'Default loan period in days'),
('fine_per_day', '10', 'Fine amount per day for overdue books (in rupees)'),
('library_name', 'College Library', 'Name of the library'),
('library_email', 'library@college.edu', 'Library contact email'),
('library_phone', '+91-XXXXXXXXXX', 'Library contact phone')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- LIBRARY CATEGORIES TABLE (Optional - for book categorization)
-- ============================================================================
CREATE TABLE IF NOT EXISTS library_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color_code TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO library_categories (name, description, color_code) VALUES
('Academic', 'Academic textbooks and reference materials', '#3B82F6'),
('Fiction', 'Fiction books and novels', '#10B981'),
('Non-Fiction', 'Non-fiction books and biographies', '#F59E0B'),
('Reference', 'Reference books and encyclopedias', '#EF4444'),
('Journals', 'Academic journals and periodicals', '#8B5CF6'),
('Digital', 'Digital resources and e-books', '#06B6D4')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_library_books_isbn ON library_books(isbn);
CREATE INDEX IF NOT EXISTS idx_library_books_title ON library_books(title);
CREATE INDEX IF NOT EXISTS idx_library_books_author ON library_books(author);
CREATE INDEX IF NOT EXISTS idx_library_books_status ON library_books(status);
CREATE INDEX IF NOT EXISTS idx_library_books_category ON library_books(category);

CREATE INDEX IF NOT EXISTS idx_library_book_issues_book_id ON library_book_issues(book_id);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_student_id ON library_book_issues(student_id);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_status ON library_book_issues(status);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_issue_date ON library_book_issues(issue_date);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_due_date ON library_book_issues(due_date);
CREATE INDEX IF NOT EXISTS idx_library_book_issues_return_date ON library_book_issues(return_date);

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

CREATE TRIGGER update_library_books_updated_at 
    BEFORE UPDATE ON library_books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_book_issues_updated_at 
    BEFORE UPDATE ON library_book_issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_settings_updated_at 
    BEFORE UPDATE ON library_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_categories_updated_at 
    BEFORE UPDATE ON library_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS FOR LIBRARY OPERATIONS
-- ============================================================================

-- Function to automatically update book availability when issuing/returning
CREATE OR REPLACE FUNCTION update_book_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- If inserting a new issue (book being issued)
    IF TG_OP = 'INSERT' AND NEW.status = 'issued' THEN
        UPDATE library_books 
        SET available_copies = available_copies - 1,
            status = CASE 
                WHEN available_copies - 1 = 0 THEN 'all_issued'
                ELSE 'available'
            END
        WHERE id = NEW.book_id;
        
    -- If updating an issue (book being returned)
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'issued' AND NEW.status = 'returned' THEN
        UPDATE library_books 
        SET available_copies = available_copies + 1,
            status = 'available'
        WHERE id = NEW.book_id;
        
    -- If deleting an issue record (cleanup)
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'issued' THEN
        UPDATE library_books 
        SET available_copies = available_copies + 1,
            status = 'available'
        WHERE id = OLD.book_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger to automatically update book availability
CREATE TRIGGER trigger_update_book_availability
    AFTER INSERT OR UPDATE OR DELETE ON library_book_issues
    FOR EACH ROW EXECUTE FUNCTION update_book_availability();

-- Function to calculate fine for overdue books
CREATE OR REPLACE FUNCTION calculate_fine(issue_date DATE, return_date DATE DEFAULT CURRENT_DATE)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    loan_period INTEGER;
    fine_per_day DECIMAL(10,2);
    due_date DATE;
    overdue_days INTEGER;
BEGIN
    -- Get library settings
    SELECT setting_value::INTEGER INTO loan_period 
    FROM library_settings WHERE setting_key = 'default_loan_period_days';
    
    SELECT setting_value::DECIMAL INTO fine_per_day 
    FROM library_settings WHERE setting_key = 'fine_per_day';
    
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
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_book_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_categories ENABLE ROW LEVEL SECURITY;

-- Policies for library_books (everyone can view, only admins can modify)
CREATE POLICY "Anyone can view library books" ON library_books FOR SELECT USING (true);
CREATE POLICY "Only admins can manage library books" ON library_books FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'college_admin', 'librarian')
    )
);

-- Policies for library_book_issues
CREATE POLICY "Students can view their own book issues" ON library_book_issues 
    FOR SELECT USING (auth.uid()::text = student_id);

CREATE POLICY "Admins can view all book issues" ON library_book_issues 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'college_admin', 'librarian')
        )
    );

CREATE POLICY "Only admins can manage book issues" ON library_book_issues FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'college_admin', 'librarian')
    )
);

-- Policies for library_settings (only admins can manage)
CREATE POLICY "Admins can view library settings" ON library_settings FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'college_admin', 'librarian')
    )
);

CREATE POLICY "Only admins can manage library settings" ON library_settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'college_admin', 'librarian')
    )
);

-- Policies for library_categories
CREATE POLICY "Anyone can view library categories" ON library_categories FOR SELECT USING (true);
CREATE POLICY "Only admins can manage library categories" ON library_categories FOR ALL USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' IN ('admin', 'college_admin', 'librarian')
    )
);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for overdue books
CREATE OR REPLACE VIEW overdue_books AS
SELECT 
    lbi.*,
    lb.title,
    lb.author,
    lb.isbn,
    calculate_fine(lbi.issue_date, CURRENT_DATE) as current_fine,
    CURRENT_DATE - lbi.due_date as days_overdue
FROM library_book_issues lbi
JOIN library_books lb ON lbi.book_id = lb.id
WHERE lbi.status = 'issued' 
AND lbi.due_date < CURRENT_DATE;

-- View for library statistics
CREATE OR REPLACE VIEW library_stats AS
SELECT 
    (SELECT COUNT(*) FROM library_books) as total_books,
    (SELECT SUM(total_copies) FROM library_books) as total_copies,
    (SELECT SUM(available_copies) FROM library_books) as available_copies,
    (SELECT COUNT(*) FROM library_book_issues WHERE status = 'issued') as currently_issued,
    (SELECT COUNT(*) FROM overdue_books) as overdue_count,
    (SELECT SUM(current_fine) FROM overdue_books) as total_pending_fines;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE library_books IS 'Master table for all books in the library';
COMMENT ON TABLE library_book_issues IS 'Track book issues and returns with student information';
COMMENT ON TABLE library_settings IS 'Configurable library settings and rules';
COMMENT ON TABLE library_categories IS 'Book categories for organization';

COMMENT ON FUNCTION calculate_fine IS 'Calculate fine amount for overdue books based on library settings';
COMMENT ON FUNCTION update_book_availability IS 'Automatically update book availability when books are issued/returned';

COMMENT ON VIEW overdue_books IS 'View showing all currently overdue books with calculated fines';
COMMENT ON VIEW library_stats IS 'View providing library statistics and metrics';