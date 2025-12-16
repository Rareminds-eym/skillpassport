-- =====================================================
-- COLLEGE DASHBOARD - LIBRARY MODULE TABLES
-- Library Management System
-- =====================================================
-- Created: December 2024
-- Purpose: Complete library management with book tracking
-- Dependencies: users, departments, programs
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. LIBRARY BOOKS TABLE
-- Purpose: Book catalog and inventory management
-- =====================================================
CREATE TABLE IF NOT EXISTS library_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Book Identification
  book_id TEXT UNIQUE NOT NULL, -- Custom book ID (e.g., LIB-2024-001)
  isbn TEXT UNIQUE, -- International Standard Book Number
  isbn13 TEXT,
  
  -- Book Details
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT NOT NULL,
  co_authors TEXT[], -- Array of co-authors
  publisher TEXT,
  edition TEXT,
  publication_year INTEGER,
  language TEXT DEFAULT 'English',
  
  -- Classification
  category TEXT NOT NULL, -- Fiction, Non-Fiction, Reference, etc.
  sub_category TEXT,
  subject TEXT,
  department_id UUID REFERENCES departments(id), -- Related department
  
  -- Physical Details
  pages INTEGER,
  binding_type TEXT CHECK (binding_type IN ('Hardcover', 'Paperback', 'Spiral', 'Leather')),
  dimensions TEXT, -- e.g., "8.5 x 11 inches"
  weight TEXT,
  
  -- Inventory
  total_copies INTEGER NOT NULL DEFAULT 1,
  available_copies INTEGER NOT NULL DEFAULT 1,
  issued_copies INTEGER GENERATED ALWAYS AS (total_copies - available_copies) STORED,
  damaged_copies INTEGER DEFAULT 0,
  lost_copies INTEGER DEFAULT 0,
  
  -- Location
  location TEXT NOT NULL, -- Shelf location (e.g., "A-12-3")
  rack_number TEXT,
  floor TEXT,
  section TEXT,
  
  -- Pricing
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'INR',
  
  -- Acquisition
  acquisition_date DATE,
  acquisition_type TEXT CHECK (acquisition_type IN ('Purchase', 'Donation', 'Exchange', 'Gift')),
  vendor_name TEXT,
  bill_number TEXT,
  
  -- Description & Keywords
  description TEXT,
  keywords TEXT[], -- Array of search keywords
  table_of_contents TEXT,
  
  -- Digital Resources
  cover_image_url TEXT,
  ebook_url TEXT,
  has_ebook BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'issued', 'reserved', 'maintenance', 'lost', 'damaged', 'withdrawn')),
  is_reference_only BOOLEAN DEFAULT FALSE, -- Cannot be issued
  is_popular BOOLEAN DEFAULT FALSE,
  
  -- Ratings & Reviews
  average_rating DECIMAL(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  -- Usage Statistics
  total_issues INTEGER DEFAULT 0,
  total_reservations INTEGER DEFAULT 0,
  last_issued_date DATE,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_copies CHECK (
    total_copies >= 0 AND 
    available_copies >= 0 AND 
    available_copies <= total_copies AND
    damaged_copies >= 0 AND
    lost_copies >= 0
  ),
  CONSTRAINT valid_rating CHECK (average_rating >= 0 AND average_rating <= 5),
  CONSTRAINT valid_year CHECK (publication_year IS NULL OR publication_year <= EXTRACT(YEAR FROM CURRENT_DATE))
);

-- Indexes for library_books
CREATE INDEX idx_library_books_book_id ON library_books(book_id);
CREATE INDEX idx_library_books_isbn ON library_books(isbn);
CREATE INDEX idx_library_books_title ON library_books USING gin(to_tsvector('english', title));
CREATE INDEX idx_library_books_author ON library_books USING gin(to_tsvector('english', author));
CREATE INDEX idx_library_books_category ON library_books(category);
CREATE INDEX idx_library_books_status ON library_books(status);
CREATE INDEX idx_library_books_department ON library_books(department_id);
CREATE INDEX idx_library_books_location ON library_books(location);
CREATE INDEX idx_library_books_available ON library_books(available_copies) WHERE available_copies > 0;

-- =====================================================
-- 2. LIBRARY ISSUED BOOKS TABLE
-- Purpose: Track currently issued books
-- =====================================================
CREATE TABLE IF NOT EXISTS library_issued_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Book & Student Reference
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Student Details (denormalized for quick access)
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  class TEXT, -- Program/Year/Semester
  department_id UUID REFERENCES departments(id),
  academic_year TEXT NOT NULL,
  
  -- Issue Details
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  expected_return_date DATE GENERATED ALWAYS AS (issue_date + INTERVAL '14 days') STORED,
  
  -- Return Details
  return_date DATE,
  actual_return_date DATE,
  
  -- Fine Calculation
  days_overdue INTEGER DEFAULT 0,
  fine_per_day DECIMAL(10,2) DEFAULT 10.00,
  fine_amount DECIMAL(10,2) DEFAULT 0,
  fine_paid BOOLEAN DEFAULT FALSE,
  fine_paid_amount DECIMAL(10,2) DEFAULT 0,
  fine_waived BOOLEAN DEFAULT FALSE,
  fine_waiver_reason TEXT,
  
  -- Book Condition
  issue_condition TEXT DEFAULT 'good' CHECK (issue_condition IN ('excellent', 'good', 'fair', 'poor', 'damaged')),
  return_condition TEXT CHECK (return_condition IN ('excellent', 'good', 'fair', 'poor', 'damaged', 'lost')),
  damage_charges DECIMAL(10,2) DEFAULT 0,
  damage_description TEXT,
  
  -- Status
  status TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue', 'lost', 'renewed')),
  
  -- Renewal
  renewal_count INTEGER DEFAULT 0,
  max_renewals INTEGER DEFAULT 2,
  last_renewed_date DATE,
  
  -- Reminders
  reminder_sent_count INTEGER DEFAULT 0,
  last_reminder_sent_at TIMESTAMPTZ,
  
  -- Issued By
  issued_by UUID NOT NULL REFERENCES users(id), -- Librarian
  returned_to UUID REFERENCES users(id), -- Librarian who accepted return
  
  -- Remarks
  issue_remarks TEXT,
  return_remarks TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (due_date >= issue_date),
  CONSTRAINT valid_return_date CHECK (return_date IS NULL OR return_date >= issue_date),
  CONSTRAINT valid_renewal CHECK (renewal_count >= 0 AND renewal_count <= max_renewals),
  CONSTRAINT valid_fine CHECK (fine_paid_amount >= 0 AND fine_paid_amount <= fine_amount)
);

-- Indexes for library_issued_books
CREATE INDEX idx_library_issued_books_book ON library_issued_books(book_id);
CREATE INDEX idx_library_issued_books_student ON library_issued_books(student_id);
CREATE INDEX idx_library_issued_books_status ON library_issued_books(status);
CREATE INDEX idx_library_issued_books_due_date ON library_issued_books(due_date);
CREATE INDEX idx_library_issued_books_overdue ON library_issued_books(days_overdue) WHERE days_overdue > 0;
CREATE INDEX idx_library_issued_books_academic_year ON library_issued_books(academic_year);
CREATE INDEX idx_library_issued_books_department ON library_issued_books(department_id);

-- =====================================================
-- 3. LIBRARY HISTORY TABLE
-- Purpose: Complete borrow history for analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS library_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Book Details (denormalized)
  book_id UUID REFERENCES library_books(id) ON DELETE SET NULL,
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  book_isbn TEXT,
  book_category TEXT,
  
  -- Student Details (denormalized)
  student_id UUID REFERENCES users(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  email TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  program TEXT,
  semester TEXT,
  academic_year TEXT NOT NULL,
  
  -- Transaction Details
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  days_borrowed INTEGER DEFAULT 0,
  days_overdue INTEGER DEFAULT 0,
  
  -- Fine Details
  fine_amount DECIMAL(10,2) DEFAULT 0,
  fine_paid BOOLEAN DEFAULT FALSE,
  fine_waived BOOLEAN DEFAULT FALSE,
  
  -- Condition
  issue_condition TEXT,
  return_condition TEXT,
  damage_charges DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('returned', 'lost', 'damaged')),
  
  -- Renewal History
  renewal_count INTEGER DEFAULT 0,
  
  -- Staff Details
  issued_by UUID REFERENCES users(id),
  issued_by_name TEXT,
  returned_to UUID REFERENCES users(id),
  returned_to_name TEXT,
  
  -- Remarks
  remarks TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_history_dates CHECK (return_date IS NULL OR return_date >= issue_date)
);

-- Indexes for library_history
CREATE INDEX idx_library_history_book ON library_history(book_id);
CREATE INDEX idx_library_history_student ON library_history(student_id);
CREATE INDEX idx_library_history_issue_date ON library_history(issue_date);
CREATE INDEX idx_library_history_return_date ON library_history(return_date);
CREATE INDEX idx_library_history_status ON library_history(status);
CREATE INDEX idx_library_history_academic_year ON library_history(academic_year);
CREATE INDEX idx_library_history_department ON library_history(department_id);

-- =====================================================
-- 4. LIBRARY RESERVATIONS TABLE
-- Purpose: Book reservation system
-- =====================================================
CREATE TABLE IF NOT EXISTS library_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Book & Student
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  
  -- Reservation Details
  reserved_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  priority INTEGER DEFAULT 1, -- Queue position
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired', 'cancelled')),
  
  -- Fulfillment
  fulfilled_date DATE,
  issued_book_id UUID REFERENCES library_issued_books(id),
  
  -- Notification
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_reservation_dates CHECK (expiry_date >= reserved_date)
);

-- Indexes for library_reservations
CREATE INDEX idx_library_reservations_book ON library_reservations(book_id);
CREATE INDEX idx_library_reservations_student ON library_reservations(student_id);
CREATE INDEX idx_library_reservations_status ON library_reservations(status);
CREATE INDEX idx_library_reservations_priority ON library_reservations(priority);

-- Partial unique index: Only one active reservation per student per book
CREATE UNIQUE INDEX idx_library_reservations_unique_active 
  ON library_reservations(book_id, student_id) 
  WHERE status = 'active';

-- =====================================================
-- 5. LIBRARY REVIEWS TABLE
-- Purpose: Book reviews and ratings
-- =====================================================
CREATE TABLE IF NOT EXISTS library_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Book & Student
  book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  
  -- Review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  -- Status
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(book_id, student_id)
);

-- Indexes for library_reviews
CREATE INDEX idx_library_reviews_book ON library_reviews(book_id);
CREATE INDEX idx_library_reviews_student ON library_reviews(student_id);
CREATE INDEX idx_library_reviews_rating ON library_reviews(rating);
CREATE INDEX idx_library_reviews_approved ON library_reviews(is_approved);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE TRIGGER update_library_books_updated_at BEFORE UPDATE ON library_books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_issued_books_updated_at BEFORE UPDATE ON library_issued_books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_reservations_updated_at BEFORE UPDATE ON library_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_reviews_updated_at BEFORE UPDATE ON library_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Calculate fine and overdue days
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_library_fine()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate days overdue
  IF NEW.return_date IS NULL AND CURRENT_DATE > NEW.due_date THEN
    NEW.days_overdue := CURRENT_DATE - NEW.due_date;
  ELSIF NEW.return_date IS NOT NULL AND NEW.return_date > NEW.due_date THEN
    NEW.days_overdue := NEW.return_date - NEW.due_date;
  ELSE
    NEW.days_overdue := 0;
  END IF;
  
  -- Calculate fine amount
  NEW.fine_amount := NEW.days_overdue * NEW.fine_per_day;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_library_fine
BEFORE INSERT OR UPDATE ON library_issued_books
FOR EACH ROW
EXECUTE FUNCTION calculate_library_fine();

-- =====================================================
-- TRIGGER: Calculate days borrowed for history
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_days_borrowed()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate days borrowed
  IF NEW.return_date IS NOT NULL THEN
    NEW.days_borrowed := NEW.return_date - NEW.issue_date;
  ELSE
    NEW.days_borrowed := CURRENT_DATE - NEW.issue_date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_days_borrowed
BEFORE INSERT OR UPDATE ON library_history
FOR EACH ROW
EXECUTE FUNCTION calculate_days_borrowed();

-- =====================================================
-- TRIGGER: Update book availability on issue
-- =====================================================
CREATE OR REPLACE FUNCTION update_book_availability_on_issue()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease available copies when book is issued
  UPDATE library_books 
  SET available_copies = available_copies - 1,
      total_issues = total_issues + 1,
      last_issued_date = NEW.issue_date
  WHERE id = NEW.book_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_book_on_issue
AFTER INSERT ON library_issued_books
FOR EACH ROW
EXECUTE FUNCTION update_book_availability_on_issue();

-- =====================================================
-- TRIGGER: Update book availability on return
-- =====================================================
CREATE OR REPLACE FUNCTION update_book_availability_on_return()
RETURNS TRIGGER AS $$
BEGIN
  -- Increase available copies when book is returned
  IF NEW.return_date IS NOT NULL AND OLD.return_date IS NULL THEN
    UPDATE library_books 
    SET available_copies = available_copies + 1
    WHERE id = NEW.book_id;
    
    -- Archive to history
    INSERT INTO library_history (
      book_id, book_title, book_author, book_isbn, book_category,
      student_id, student_name, roll_number, email, department_id, academic_year,
      issue_date, due_date, return_date, days_overdue,
      fine_amount, fine_paid, fine_waived,
      issue_condition, return_condition, damage_charges,
      status, renewal_count,
      issued_by, issued_by_name, returned_to, returned_to_name,
      remarks
    )
    SELECT 
      lb.id, lb.title, lb.author, lb.isbn, lb.category,
      NEW.student_id, NEW.student_name, NEW.roll_number, NEW.email, NEW.department_id, NEW.academic_year,
      NEW.issue_date, NEW.due_date, NEW.return_date, NEW.days_overdue,
      NEW.fine_amount, NEW.fine_paid, NEW.fine_waived,
      NEW.issue_condition, NEW.return_condition, NEW.damage_charges,
      NEW.status, NEW.renewal_count,
      NEW.issued_by, u1.name, NEW.returned_to, u2.name,
      NEW.return_remarks
    FROM library_books lb
    LEFT JOIN users u1 ON u1.id = NEW.issued_by
    LEFT JOIN users u2 ON u2.id = NEW.returned_to
    WHERE lb.id = NEW.book_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_book_on_return
AFTER UPDATE ON library_issued_books
FOR EACH ROW
EXECUTE FUNCTION update_book_availability_on_return();

-- =====================================================
-- TRIGGER: Update book rating
-- =====================================================
CREATE OR REPLACE FUNCTION update_book_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE library_books
  SET average_rating = (
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM library_reviews
    WHERE book_id = NEW.book_id AND is_approved = TRUE
  ),
  total_reviews = (
    SELECT COUNT(*)
    FROM library_reviews
    WHERE book_id = NEW.book_id AND is_approved = TRUE
  )
  WHERE id = NEW.book_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_book_rating
AFTER INSERT OR UPDATE ON library_reviews
FOR EACH ROW
WHEN (NEW.is_approved = TRUE)
EXECUTE FUNCTION update_book_rating();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE library_books IS 'Book catalog with inventory and location tracking';
COMMENT ON TABLE library_issued_books IS 'Currently issued books with fine calculation';
COMMENT ON TABLE library_history IS 'Complete borrow history for analytics and reporting';
COMMENT ON TABLE library_reservations IS 'Book reservation queue system';
COMMENT ON TABLE library_reviews IS 'Student book reviews and ratings';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
