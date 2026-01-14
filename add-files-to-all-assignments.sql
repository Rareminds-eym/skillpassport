-- Add test instruction files to ALL existing college assignments
-- This will allow you to see the files immediately

UPDATE college_assignments
SET instruction_files = '[
  {
    "name": "Assignment_Instructions.pdf",
    "url": "https://pub-12345.r2.dev/college_assignments_tasks/test/test/instructions.pdf",
    "size": 245760,
    "type": "application/pdf"
  },
  {
    "name": "Grading_Rubric.docx",
    "url": "https://pub-12345.r2.dev/college_assignments_tasks/test/test/rubric.docx",
    "size": 102400,
    "type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  },
  {
    "name": "Sample_Data.xlsx",
    "url": "https://pub-12345.r2.dev/college_assignments_tasks/test/test/data.xlsx",
    "size": 51200,
    "type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  }
]'::jsonb
WHERE instruction_files IS NULL OR instruction_files = '[]'::jsonb;

-- Verify the update
SELECT 
    assignment_id,
    title,
    jsonb_array_length(instruction_files) as file_count,
    instruction_files
FROM 
    college_assignments
WHERE 
    instruction_files IS NOT NULL 
    AND jsonb_array_length(instruction_files) > 0
LIMIT 5;
