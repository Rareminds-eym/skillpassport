-- Sample data for Library Management System
-- This script inserts sample books and categories for testing

-- Insert sample library books
INSERT INTO library_books (title, author, isbn, total_copies, available_copies, status, category, publisher, publication_year, description, location_shelf) VALUES
('Mathematics Grade 8', 'R.S. Sharma', '9781234567890', 5, 5, 'available', 'Academic', 'Academic Publishers', 2023, 'Comprehensive mathematics textbook for grade 8 students', 'A1-B2'),
('Science Grade 9', 'S. Gupta', '9789876543210', 3, 1, 'available', 'Academic', 'Science Publications', 2023, 'Complete science curriculum for grade 9', 'A2-B1'),
('English Grammar', 'L. Roy', '9781122334455', 4, 4, 'available', 'Academic', 'Language Press', 2022, 'Essential English grammar for students', 'B1-C2'),
('History of India', 'A. Singh', '9782233445566', 2, 2, 'available', 'Academic', 'Historical Books Ltd', 2023, 'Comprehensive Indian history textbook', 'C1-D1'),
('Geography Basics', 'M. Patel', '9783344556677', 6, 6, 'available', 'Academic', 'Geo Publications', 2023, 'Introduction to geography concepts', 'C2-D2'),
('Physics Grade 10', 'S. Kumar', '9784455667788', 3, 0, 'all_issued', 'Academic', 'Physics World', 2023, 'Advanced physics for grade 10 students', 'D1-E1'),
('Chemistry Grade 10', 'R. Das', '9785566778899', 5, 5, 'available', 'Academic', 'Chem Books', 2023, 'Organic and inorganic chemistry', 'D2-E2'),
('Biology Grade 9', 'N. Mehta', '9786677889900', 4, 4, 'available', 'Academic', 'Bio Science Press', 2022, 'Life sciences and biology fundamentals', 'E1-F1'),
('Computer Science Basics', 'V. Sharma', '9787788990011', 2, 2, 'available', 'Academic', 'Tech Publications', 2023, 'Introduction to computer programming', 'F1-G1'),
('Environmental Studies', 'P. Jain', '9788899001122', 3, 3, 'available', 'Academic', 'Green Earth Books', 2023, 'Environmental awareness and conservation', 'G1-H1'),
('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 2, 2, 'available', 'Fiction', 'Scribner', 1925, 'Classic American literature', 'H1-I1'),
('To Kill a Mockingbird', 'Harper Lee', '9780061120084', 3, 3, 'available', 'Fiction', 'J.B. Lippincott & Co.', 1960, 'Pulitzer Prize winning novel', 'H2-I2'),
('Data Structures and Algorithms', 'Thomas H. Cormen', '9780262033848', 2, 2, 'available', 'Reference', 'MIT Press', 2009, 'Comprehensive guide to algorithms', 'I1-J1'),
('Oxford English Dictionary', 'Oxford University Press', '9780198611868', 1, 1, 'available', 'Reference', 'Oxford University Press', 2020, 'Complete English dictionary', 'J1-K1'),
('Digital Marketing Handbook', 'Ryan Deiss', '9781119235590', 2, 2, 'available', 'Non-Fiction', 'Wiley', 2017, 'Modern digital marketing strategies', 'K1-L1')
ON CONFLICT (isbn) DO NOTHING;

-- Insert some sample book issues (for testing purposes)
-- Note: These will reference student IDs that should exist in your students table
-- You may need to adjust the student_id values based on your actual student data

-- First, let's create some sample students if they don't exist
-- (This assumes you have a students table with TEXT id field)
INSERT INTO students (id, name, university, department, email, phone, created_at, updated_at) VALUES
('STD-001', 'Aarav Kumar', 'Sample University', 'Computer Science', 'aarav@example.com', '+91-9876543210', NOW(), NOW()),
('STD-002', 'Diya Sharma', 'Sample University', 'Information Technology', 'diya@example.com', '+91-9876543211', NOW(), NOW()),
('STD-003', 'Rohan Patel', 'Sample University', 'Electronics', 'rohan@example.com', '+91-9876543212', NOW(), NOW()),
('STD-004', 'Isha Singh', 'Sample University', 'Mechanical', 'isha@example.com', '+91-9876543213', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Now insert some sample book issues
INSERT INTO library_book_issues (
    book_id, 
    student_id, 
    student_name, 
    roll_number, 
    class, 
    academic_year, 
    issue_date, 
    due_date, 
    status
) 
SELECT 
    lb.id,
    'STD-002',
    'Diya Sharma',
    '102',
    '9',
    '2024-25',
    '2025-01-15',
    '2025-01-29',
    'issued'
FROM library_books lb 
WHERE lb.title = 'Science Grade 9'
LIMIT 1;

INSERT INTO library_book_issues (
    book_id, 
    student_id, 
    student_name, 
    roll_number, 
    class, 
    academic_year, 
    issue_date, 
    due_date, 
    status
) 
SELECT 
    lb.id,
    'STD-004',
    'Isha Singh',
    '104',
    '10',
    '2024-25',
    '2025-01-10',
    '2025-01-24',
    'issued'
FROM library_books lb 
WHERE lb.title = 'Physics Grade 10'
LIMIT 1;

-- Insert a returned book record for history
INSERT INTO library_book_issues (
    book_id, 
    student_id, 
    student_name, 
    roll_number, 
    class, 
    academic_year, 
    issue_date, 
    due_date, 
    return_date,
    status,
    fine_amount
) 
SELECT 
    lb.id,
    'STD-001',
    'Aarav Kumar',
    '101',
    '8',
    '2024-25',
    '2025-01-05',
    '2025-01-19',
    '2025-01-18',
    'returned',
    0
FROM library_books lb 
WHERE lb.title = 'Mathematics Grade 8'
LIMIT 1;

-- Insert an overdue book record
INSERT INTO library_book_issues (
    book_id, 
    student_id, 
    student_name, 
    roll_number, 
    class, 
    academic_year, 
    issue_date, 
    due_date, 
    status
) 
SELECT 
    lb.id,
    'STD-003',
    'Rohan Patel',
    '103',
    '9',
    '2024-25',
    '2024-12-20',
    '2025-01-03',
    'issued'
FROM library_books lb 
WHERE lb.title = 'English Grammar'
LIMIT 1;

-- Update book availability based on issues
-- This will be handled automatically by the trigger, but let's ensure consistency
UPDATE library_books 
SET available_copies = total_copies - (
    SELECT COUNT(*) 
    FROM library_book_issues 
    WHERE library_book_issues.book_id = library_books.id 
    AND library_book_issues.status = 'issued'
);

UPDATE library_books 
SET status = CASE 
    WHEN available_copies = 0 THEN 'all_issued'
    ELSE 'available'
END;

-- Add some comments for documentation
COMMENT ON TABLE library_books IS 'Sample library books for testing the library management system';
COMMENT ON TABLE library_book_issues IS 'Sample book issues including active loans and returned books';