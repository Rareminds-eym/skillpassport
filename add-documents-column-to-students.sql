-- Add documents column to students table
-- This will store document URLs in JSONB format similar to school_educators

-- Step 1: Add documents column to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]';

-- Step 2: Add comment for documentation
COMMENT ON COLUMN students.documents IS 'Student documents stored as JSONB array of objects with url, name, type, uploadedAt fields';

-- Step 3: Create index for better performance on documents queries
CREATE INDEX IF NOT EXISTS idx_students_documents ON students USING GIN (documents);

-- Step 4: Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'students'
AND column_name = 'documents';

-- Step 5: Show sample structure for documents
-- Documents should be stored as:
-- [
--   {
--     "url": "https://storage-api.workers.dev/document-access?key=students/filename.pdf",
--     "name": "Resume.pdf",
--     "type": "resume",
--     "uploadedAt": "2024-01-01T00:00:00Z",
--     "size": 1024000
--   },
--   {
--     "url": "https://storage-api.workers.dev/document-access?key=students/certificate.pdf", 
--     "name": "Certificate.pdf",
--     "type": "certificate",
--     "uploadedAt": "2024-01-01T00:00:00Z",
--     "size": 512000
--   }
-- ]

-- Step 6: Sample update to add a document (for testing)
-- UPDATE students 
-- SET documents = documents || '[{
--   "url": "https://storage-api.workers.dev/document-access?key=students/sample.pdf",
--   "name": "Sample Document.pdf", 
--   "type": "resume",
--   "uploadedAt": "2024-01-01T00:00:00Z",
--   "size": 1024000
-- }]'::jsonb
-- WHERE id = 'your-student-id';

-- Step 7: Query to check documents for a student
-- SELECT 
--   id,
--   name,
--   documents
-- FROM students 
-- WHERE id = 'your-student-id';