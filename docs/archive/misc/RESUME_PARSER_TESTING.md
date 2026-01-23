# Resume Parser Testing Guide

## Overview
This guide will help you test the resume parser to ensure it's correctly extracting data from resumes and storing it in the JSONB format in Supabase.

## Prerequisites
1. ✅ Supabase project configured
2. ✅ OpenRouter API key (or OpenAI API key) configured
3. ✅ User authentication working
4. ✅ Students table with JSONB `profile` column

## Database Schema Verification

### Check Students Table Structure
Run this query in Supabase SQL Editor:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'students' AND table_schema = 'public';
```

Expected columns:
- `id` (uuid)
- `user_id` (uuid) - References auth.users
- `email` (text)
- `universityId` (text)
- `profile` (jsonb) ⭐ **This is where resume data is stored**
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### Check Profile JSONB Structure
```sql
-- View current profile data
SELECT 
  email,
  profile->>'name' as name,
  profile->>'email' as profile_email,
  jsonb_array_length(profile->'education') as education_count,
  jsonb_array_length(profile->'experience') as experience_count,
  jsonb_array_length(profile->'technicalSkills') as tech_skills_count
FROM students
WHERE email = 'your-email@example.com';
```

## Testing Process

### Method 1: Using the Test Mode (Recommended)

1. **Access the Test Mode**
   - Navigate to `http://localhost:5175/student/profile`
   - Click the "Test Mode" button next to "Upload Resume" button

2. **Upload a Resume**
   - Click "Click to upload resume"
   - Select a PDF or TXT file (max 5MB)
   - Click "Parse Resume"

3. **Verify Extracted Data**
   - Review the JSON output
   - Check for structure issues (if any)
   - Verify counts:
     - Education entries
     - Experience entries
     - Technical Skills
     - Certificates

4. **Save to Database**
   - Click "Save to Supabase (JSONB)"
   - Wait for success message

5. **Verify Database Storage**
   - Click "Fetch Current Database Data"
   - Review the JSONB profile column data
   - Ensure all fields are properly stored

### Method 2: Using the Regular Upload

1. **Navigate to Profile**
   - Go to `http://localhost:5175/student/profile`
   - Click "Upload Resume & Auto-Fill Profile"

2. **Upload Resume**
   - Select your resume file
   - Wait for parsing to complete
   - Review the extracted data preview

3. **Apply Changes**
   - Click "Apply to Profile"
   - Data will be automatically merged and saved

## Expected JSON Structure

The resume parser should extract data in this format:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "contact_number": "+1234567890",
  "age": "25",
  "date_of_birth": "1999-01-01",
  "college_school_name": "XYZ University",
  "university": "XYZ University",
  "registration_number": "REG123456",
  "district_name": "Sample District",
  "branch_field": "Computer Science",
  "trainer_name": "Dr. Smith",
  "nm_id": "NM123",
  "course": "B.Tech Computer Science",
  "training": [
    {
      "id": "1",
      "skill": "Python",
      "course": "Python Programming",
      "status": "completed",
      "trainer": "Instructor Name",
      "progress": 100
    }
  ],
  "education": [
    {
      "id": "1",
      "cgpa": "8.5",
      "level": "Bachelor's",
      "degree": "B.Tech",
      "status": "completed",
      "department": "Computer Science",
      "university": "XYZ University",
      "yearOfPassing": "2024"
    }
  ],
  "experience": [
    {
      "id": "1",
      "organization": "Tech Corp",
      "role": "Software Engineer",
      "duration": "2 years",
      "verified": false
    }
  ],
  "technicalSkills": [
    {
      "id": "1",
      "name": "JavaScript",
      "category": "Programming",
      "level": 4,
      "verified": false
    }
  ],
  "softSkills": [
    {
      "id": "1",
      "name": "Communication",
      "type": "communication",
      "level": 4,
      "description": "Strong verbal and written communication"
    }
  ],
  "certificates": [
    {
      "id": "1",
      "title": "AWS Certified Developer",
      "issuer": "Amazon",
      "level": "Professional",
      "issuedOn": "2024-01-15",
      "credentialId": "ABC123",
      "link": "https://example.com/cert",
      "description": "Cloud development certification"
    }
  ],
  "alternate_number": "+9876543210",
  "contact_number_dial_code": "+91",
  "skill": "Full Stack Development"
}
```

## Database Storage Verification

### Method 1: Using Supabase Dashboard
1. Go to Supabase Dashboard → Table Editor
2. Select `students` table
3. Find your record
4. Click on the `profile` column
5. Verify the JSONB data structure

### Method 2: Using SQL Query
```sql
-- Get formatted profile data
SELECT 
  email,
  jsonb_pretty(profile) as profile_data
FROM students
WHERE email = 'your-email@example.com';
```

### Method 3: Check Specific Fields
```sql
-- Extract specific fields from JSONB
SELECT 
  email,
  profile->>'name' as name,
  profile->>'contact_number' as phone,
  profile->>'university' as university,
  profile->'education' as education_array,
  profile->'experience' as experience_array,
  profile->'technicalSkills' as skills_array,
  profile->>'resumeImportedAt' as import_timestamp
FROM students
WHERE email = 'your-email@example.com';
```

## Common Issues and Solutions

### Issue 1: AI Not Extracting Data
**Problem**: Parser returns empty or minimal data

**Solutions**:
- Check API key configuration in `.env`
- Verify resume text is readable (try with TXT file first)
- Check browser console for errors
- Ensure AI service (OpenRouter/OpenAI) is responding

### Issue 2: JSONB Structure Invalid
**Problem**: Data not storing correctly in database

**Solutions**:
```sql
-- Check if profile column is JSONB type
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' AND column_name = 'profile';

-- If not JSONB, alter the column
ALTER TABLE students 
ALTER COLUMN profile TYPE jsonb USING profile::jsonb;
```

### Issue 3: Data Not Saving
**Problem**: Upload succeeds but data doesn't appear in database

**Solutions**:
- Check RLS policies:
```sql
-- View RLS policies
SELECT * FROM pg_policies WHERE tablename = 'students';

-- Temporarily disable RLS for testing (NOT for production)
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
```

- Check user_id mapping:
```sql
-- Verify user exists and has student record
SELECT u.id, u.email, s.id as student_id, s.email as student_email
FROM auth.users u
LEFT JOIN students s ON s.user_id = u.id
WHERE u.email = 'your-email@example.com';
```

### Issue 4: Duplicate Data
**Problem**: Uploading resume multiple times creates duplicates

**Solution**: The current implementation merges data. To reset:
```sql
-- Reset profile for testing
UPDATE students
SET profile = '{}'::jsonb
WHERE email = 'your-email@example.com';
```

## Testing Checklist

- [ ] Resume file uploads successfully
- [ ] Text extraction works (console shows resume text)
- [ ] AI parsing completes without errors
- [ ] Extracted JSON matches expected structure
- [ ] All arrays are properly formatted
- [ ] Personal info fields are extracted (name, email, phone)
- [ ] Education array contains entries
- [ ] Experience array contains entries
- [ ] Skills are categorized correctly
- [ ] Data saves to Supabase without errors
- [ ] JSONB column stores data correctly
- [ ] Profile page displays updated information
- [ ] Re-uploading merges data (doesn't duplicate)
- [ ] Test Mode shows database data correctly

## Sample Test Resume

Create a file called `test-resume.txt`:

```
John Doe
Email: john.doe@example.com
Phone: +1-234-567-8900

EDUCATION
Bachelor of Technology in Computer Science
XYZ University, 2020-2024
CGPA: 8.5/10

EXPERIENCE
Software Engineer Intern
Tech Corporation, Jan 2023 - Jun 2023
- Developed web applications using React and Node.js
- Collaborated with cross-functional teams

TECHNICAL SKILLS
- Programming Languages: JavaScript, Python, Java
- Frameworks: React, Node.js, Express
- Databases: MongoDB, PostgreSQL
- Tools: Git, Docker, AWS

CERTIFICATIONS
AWS Certified Developer - Associate
Issued by: Amazon Web Services
Date: January 2024
Credential ID: ABC123456
```

## Debugging Tips

### Enable Detailed Logging
Check browser console for these logs:
- `📄 Resume text extracted:` - Confirms text extraction
- `🤖 AI parsed data:` - Shows AI response
- `💾 Saving to database...` - Database save attempt
- `✅ Data saved successfully:` - Successful save
- `❌ Save error:` - Error details

### Check Network Requests
1. Open DevTools → Network tab
2. Filter for "supabase"
3. Check PATCH/POST requests to students table
4. Verify request payload has correct JSONB structure

### Verify AI Response
Add this to console:
```javascript
// In ResumeParser.jsx, after parsing
console.log('Raw AI Response:', aiResponse);
console.log('Parsed JSON:', JSON.parse(aiResponse));
```

## Performance Benchmarks

- ✅ **File Upload**: < 1 second
- ✅ **Text Extraction**: < 2 seconds
- ✅ **AI Parsing**: 3-10 seconds (depends on API)
- ✅ **Database Save**: < 1 second
- ✅ **Total Process**: 5-15 seconds

## Next Steps After Testing

1. ✅ Confirm all data is properly stored in JSONB
2. ✅ Verify profile page displays the data correctly
3. ✅ Test with different resume formats (PDF, DOCX, TXT)
4. ✅ Test with resumes of varying complexity
5. ✅ Enable RLS policies for security
6. ✅ Add error handling for production use
7. ✅ Implement data validation before save
8. ✅ Add loading states and progress indicators

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase connection
3. Test API key with simple request
4. Review RLS policies
5. Check database logs in Supabase Dashboard

---

**Last Updated**: October 27, 2025
**Version**: 1.0.0
