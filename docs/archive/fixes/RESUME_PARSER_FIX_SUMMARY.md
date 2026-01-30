# Resume Parser Fix - Structured Data Format

## Problem
When uploading a resume, all content was being dumped into a single field instead of being properly structured into separate arrays for education, experience, projects, certificates, skills, etc.

## Solution Implemented

### 1. Added OpenRouter API Support
- Added support for OpenRouter API (z-ai/glm-4.5-air:free model)
- Configured API key: `OPENROUTER_API_KEY` in `/app/.env`
- New parser function: `parseWithOpenRouter()`

### 2. Enhanced Data Structure
Updated the parser to include ALL required fields matching your expected format:

```json
{
  "name": "",
  "email": "",
  "contact_number": "",
  "age": "",
  "education": [...],
  "training": [...],
  "experience": [...],
  "projects": [...],      // ✅ ADDED
  "technicalSkills": [...],
  "softSkills": [...],
  "certificates": [...],  // ✅ ENHANCED
  "university": "",
  "imported_at": ""
}
```

### 3. Projects Array Structure
Each project now includes:
- `id`: Unique timestamp-based ID
- `title`: Project name
- `organization`: Company/organization name
- `duration`: Time period (e.g., "Jan 2024 – Mar 2024")
- `description`: Project description
- `technologies`, `techStack`, `tech`, `skills`: Arrays of technologies (all variations included for compatibility)
- `link`, `url`: Project website
- `github`: GitHub repository URL
- `demo`, `demoLink`: Demo/live site URL
- `status`: "Completed" or "ongoing"
- `enabled`: true
- `processing`: true

### 4. Certificates Array Structure
Each certificate now includes:
- `id`: Unique ID
- `title`: Certificate name
- `issuer`: Issuing organization
- `level`: "Professional", "Beginner", etc.
- `issuedOn`: Issue date
- `credentialId`: Credential/verification ID
- `link`: Certificate verification URL
- `description`: Certificate description
- `status`: "pending" or "verified"
- `enabled`: true
- `processing`: true

### 5. Metadata Enhancements
All array items now automatically include:
- `enabled: true` - Item is active
- `processing: true` - Item is being processed
- Unique timestamp-based IDs

### 6. AI Prompts Enhanced
Updated both Gemini and OpenRouter prompts with:
- Clear instructions to NOT dump all content into single fields
- Explicit field-by-field parsing requirements
- Examples of correct vs incorrect parsing
- Detailed structure for projects and certificates

### 7. Frontend Integration
Updated `ProfileEditSection.jsx` to:
- Import `updateProjects` and `updateCertificates` functions
- Handle projects and certificates data in `handleSave()`
- Save projects and certificates when parsing resume
- Merge projects data with existing profile data

## Files Modified

1. `/app/src/services/resumeParserService.js`
   - Added `parseWithOpenRouter()` function
   - Enhanced Gemini prompt with projects and certificates
   - Updated OpenAI prompt for better parsing
   - Added `processing: true` flag to all arrays in `addMetadata()`
   - Enhanced project fields (all tech field variations)
   - Added certificates with all required fields

2. `/app/src/components/Students/components/ProfileEditSection.jsx`
   - Added `updateProjects` and `updateCertificates` imports
   - Updated `handleSave()` to support projects and certificates
   - Enhanced `handleResumeDataExtracted()` to save projects and certificates

3. `/app/.env` (CREATED)
   - Added OpenRouter API key configuration

4. `/app/vite.config.ts`
   - Changed port from 5173 to 3000 for proper routing

## How to Use

1. **Upload Resume**: Click "Upload Resume & Auto-Fill Profile" button
2. **Select File**: Choose PDF, DOC, DOCX, or TXT file (max 5MB)
3. **Parse**: Click "Parse Resume" button
4. **Review**: Check the extracted data preview
5. **Auto-Save**: Data is automatically saved to all sections

## Expected Output Format

When you upload a resume, it will be parsed into this structure:

```json
{
  "name": "P.Durkadevid",
  "email": "durkadevidurkadevi43@gmail.com",
  "age": "19",
  "education": [
    {
      "id": 1760519343379,
      "degree": "B.Sc Botany",
      "university": "Bharathidasan University",
      "level": "Bachelor's",
      "status": "ongoing",
      "yearOfPassing": "2025",
      "cgpa": "8.9/10.0",
      "enabled": true,
      "processing": true
    }
  ],
  "experience": [
    {
      "id": 1761555063582,
      "role": "SDE-1",
      "organization": "ABC ltd",
      "duration": "Jan 2024 - Jan 2025",
      "verified": false,
      "enabled": true,
      "processing": true
    }
  ],
  "projects": [
    {
      "id": 1761560300449,
      "title": "AI-Based Career Counseling System",
      "organization": "SkillEco",
      "duration": "Jan 2024 – Mar 2024",
      "description": "Developed an AI-powered platform...",
      "technologies": ["React", "Node.js", "Express.js", "PostgreSQL", "OpenAI API"],
      "techStack": ["React", "Node.js", "Express.js", "PostgreSQL", "OpenAI API"],
      "tech": ["React", "Node.js", "Express.js", "PostgreSQL", "OpenAI API"],
      "skills": ["React", "Node.js", "Express.js", "PostgreSQL", "OpenAI API"],
      "link": "https://career-ai.skill-eco.io",
      "url": "https://career-ai.skill-eco.io",
      "github": "https://career-ai.skill-eco.io",
      "demo": "https://career-ai.skill-eco.io",
      "demoLink": "https://career-ai.skill-eco.io",
      "status": "Completed",
      "enabled": true,
      "processing": true
    }
  ],
  "certificates": [
    {
      "id": 1761559553784,
      "title": "Google Data Analytics Professional Certificate",
      "issuer": "Coursera",
      "level": "Professional",
      "issuedOn": "June 2024",
      "credentialId": "GDA-987654321",
      "link": "https://coursera.org/verify/GDA-987654321",
      "description": "Completed an 8-course specialization...",
      "status": "pending",
      "enabled": true,
      "processing": true
    }
  ],
  "technicalSkills": [
    {
      "id": 1760519604035,
      "name": "React",
      "category": "Frontend",
      "level": 3,
      "verified": false,
      "enabled": true,
      "processing": true
    }
  ],
  "softSkills": [
    {
      "id": 1760519503882,
      "name": "Communication",
      "type": "communication",
      "level": 4,
      "description": "Effective communication skills",
      "enabled": true,
      "processing": true
    }
  ],
  "training": [
    {
      "id": 1760519396772,
      "course": "Food Safety & Quality Management",
      "skill": "Shelf-life Evaluation",
      "status": "ongoing",
      "trainer": "Manimaran",
      "progress": 75,
      "enabled": true,
      "processing": true
    }
  ],
  "imported_at": "2025-10-15T08:18:39.571557"
}
```

## Testing

1. Access the app at the preview URL
2. Navigate to your profile
3. Click "Upload Resume & Auto-Fill Profile"
4. Upload a test resume
5. Verify that:
   - Name is extracted correctly (not the entire resume)
   - Education is in separate array items
   - Experience is in separate array items
   - Projects are extracted with tech stack
   - Certificates are extracted with credential IDs
   - Skills are categorized correctly

## Troubleshooting

### If parsing fails:
1. Check browser console for errors
2. Verify API key is loaded: Check `.env` file
3. Try the fallback parser (works without API key)

### If data is still in single field:
1. The AI may have failed - check console logs
2. Fallback parser will be used automatically
3. Manually edit the fields in the profile

### If projects/certificates are missing:
1. Make sure your resume has clear PROJECTS and CERTIFICATES sections
2. Use standard formatting (title, dates, descriptions)
3. The parser looks for keywords like "PROJECTS:", "CERTIFICATIONS:", etc.

## Notes

- The parser uses OpenRouter API by default (free tier)
- Fallback to regex-based parser if API fails
- All data includes `processing: true` flag for your workflow
- Tech stack is normalized across multiple field names for compatibility
- IDs are timestamp-based to ensure uniqueness
