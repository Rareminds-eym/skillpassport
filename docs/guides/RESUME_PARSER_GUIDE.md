# Resume Parser Feature

## Overview
The Resume Parser feature allows students to upload their resume and automatically extract information to populate their profile. The system uses AI (Google Gemini or OpenAI) to intelligently parse resume content and map it to the appropriate database fields.

## Features
- 📄 Upload resume in PDF, DOC, DOCX, or TXT format
- 🤖 AI-powered intelligent data extraction using Google Gemini or OpenAI
- 🔄 Automatic mapping to profile structure
- 🔀 Smart merging with existing profile data (no duplicates)
- ✅ Preview extracted data before saving
- 💾 Direct database update for all profile sections

## Setup Instructions

### 1. Configure AI API Key

You need to add an AI API key to use the resume parsing feature. You can choose between:

**Option A: Google Gemini (Recommended - Free tier available)**
1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the API key
4. Add to your `.env` file:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

**Option B: OpenAI**
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the API key
4. Add to your `.env` file:
   ```
   VITE_OPENAI_API_KEY=your_api_key_here
   ```

### 2. Create .env File

If you don't have a `.env` file yet:
```bash
cp .env.example .env
```

Then edit `.env` and add your API key.

### 3. Restart Development Server

After adding the API key, restart your development server:
```bash
npm run dev
```

## How to Use

### For Students:

1. **Navigate to Profile Page**
   - Go to `/student/profile`

2. **Click "Upload Resume & Auto-Fill Profile"**
   - A modal will open

3. **Upload Your Resume**
   - Click the upload area or drag & drop your resume
   - Supported formats: PDF, DOC, DOCX, TXT
   - Max file size: 5MB

4. **Parse Resume**
   - Click "Parse Resume" button
   - Wait for AI to extract information (usually 5-10 seconds)

5. **Review Extracted Data**
   - Preview the extracted information
   - Data will be shown in a summary

6. **Data is Automatically Saved**
   - All extracted data is automatically saved to your profile
   - Existing data is preserved and merged intelligently
   - No duplicates will be created

## Data Mapping

The resume parser extracts and maps the following data:

### Personal Information
- Name
- Email
- Contact Number
- Age / Date of Birth
- College/School Name
- University
- Registration Number
- District Name
- Branch/Field
- Course

### Education
- Degree
- Department
- University
- Year of Passing
- CGPA
- Level (Bachelor's, Master's, etc.)
- Status (Ongoing/Completed)

### Experience
- Organization
- Role
- Duration
- Description
- Verification status

### Technical Skills
- Skill Name
- Category (Programming, Database, Framework, etc.)
- Proficiency Level (1-5)
- Verification status

### Soft Skills
- Skill Name
- Type (Language, Communication, Leadership, etc.)
- Proficiency Level
- Description

### Certificates
- Title
- Issuer
- Issue Date
- Credential ID
- Link
- Description

### Training/Courses
- Course Name
- Status (Ongoing/Completed)
- Progress (0-100%)
- Trainer Name
- Skill Area

## Fallback Mode

If no AI API key is configured, the system will use a basic fallback parser that extracts:
- Name (from first line)
- Email (using regex)
- Phone number (using regex)

**Note:** For best results, configure an AI API key.

## Technical Details

### Files Structure
```
src/
├── components/Students/components/
│   ├── ResumeParser.jsx           # Main resume upload UI component
│   └── ProfileEditSection.jsx     # Updated with resume parser integration
├── services/
│   └── resumeParserService.js     # Resume parsing logic and AI integration
```

### AI Prompt Structure

The system uses a structured JSON prompt that ensures consistent data extraction:

```javascript
{
  "name": "",
  "email": "",
  "contact_number": "",
  // ... all profile fields
  "education": [],
  "experience": [],
  "technicalSkills": [],
  "softSkills": [],
  "certificates": [],
  "training": []
}
```

### Data Merging Logic

The system intelligently merges parsed data with existing profile:
- **Personal fields**: New data overwrites only if existing is empty
- **Arrays (education, skills, etc.)**: Items are deduplicated based on key fields
- **No data loss**: Existing data is always preserved unless explicitly overwritten

## Database Integration

Parsed data is saved to the Supabase `students` table:
- Column: `profile` (JSONB)
- Structure matches the profile schema
- All updates are atomic and transactional
- Real-time updates via Supabase hooks

## Error Handling

The system handles:
- ✅ Invalid file formats
- ✅ File size limits
- ✅ AI API failures (falls back to basic parser)
- ✅ Network errors
- ✅ Database connection issues
- ✅ Malformed resume content

## Limitations

1. **PDF Parsing**: Current implementation has basic PDF text extraction. For better results:
   - Use TXT files for now, or
   - Implement backend PDF parsing with libraries like `pdf-parse`

2. **File Size**: Maximum 5MB per file

3. **AI API Costs**:
   - Google Gemini: Free tier available with generous limits
   - OpenAI: Paid service (minimal cost per request)

4. **Accuracy**: AI parsing accuracy depends on:
   - Resume format and structure
   - Clarity of information
   - Language used

## Future Enhancements

- [ ] Enhanced PDF parsing using pdf.js or backend processing
- [ ] Support for images in resumes (OCR)
- [ ] Multiple resume format templates
- [ ] Batch processing for multiple resumes
- [ ] Resume quality scoring
- [ ] Suggested improvements for resume
- [ ] Export functionality
- [ ] Resume versioning

## Troubleshooting

### "No AI API key configured" error
- Make sure you've added `VITE_GEMINI_API_KEY` or `VITE_OPENAI_API_KEY` to your `.env` file
- Restart your development server after adding the key

### "Failed to parse resume" error
- Check that your resume is in a supported format
- Try converting to TXT format for better results
- Ensure your resume has clear, readable text

### "File size too large" error
- Compress your resume to under 5MB
- Remove unnecessary images or formatting

### Database not updating
- Check that you're logged in
- Verify your Supabase connection
- Check browser console for errors

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify your API key is correctly configured
3. Test with a simple TXT resume first
4. Contact support if issues persist
