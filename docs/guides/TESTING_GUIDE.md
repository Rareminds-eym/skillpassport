# Quick Start Guide - AI Job Alert Feature

## Prerequisites

Before testing the AI Job Alert feature, ensure you have:

1. **Supabase Project Setup**
   - Active Supabase project
   - `students` table with profile JSONB column
   - `opportunities` table (as per schema provided)
   
2. **Environment Variables**
   Update `/app/.env` with your credentials:
   ```bash
   VITE_SUPABASE_URL=your_actual_supabase_url
   VITE_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
   VITE_OPENAI_API_KEY=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
   ```

## Database Setup

### 1. Ensure opportunities table exists
The table should have these key fields:
```sql
- id (serial primary key)
- job_title (text)
- company_name (text)
- department (text)
- skills_required (jsonb)
- requirements (jsonb)
- responsibilities (jsonb)
- employment_type (text)
- location (text)
- mode (text)
- experience_level (text)
- experience_required (text)
- description (text)
- stipend_or_salary (text)
- deadline (timestamp)
- is_active (boolean)
- status (text)
```

### 2. Ensure students table has profile JSONB
The profile should contain:
```json
{
  "technicalSkills": [...],
  "softSkills": [...],
  "education": [...],
  "training": [...],
  "experience": [...],
  "projects": [...],
  "certificates": [...]
}
```

### 3. Disable RLS (for testing)
```sql
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
```

## Running the Application

### Option 1: Development Mode (Recommended for Testing)
```bash
cd /app
yarn dev
```
Access at: http://localhost:3000

### Option 2: Production Build
```bash
cd /app
yarn build
yarn preview --host 0.0.0.0 --port 3000
```

## Testing the Feature

### 1. Login as a Student
- Navigate to the login page
- Enter student email (must exist in `students` table)
- Login and go to Dashboard

### 2. View AI Job Matches
- Look for "Suggested Next Steps" section
- You should see:
  - "AI-matched job opportunities for you" subtitle
  - Loading spinner (while AI processes)
  - Top 3 matched jobs with:
    * Match score percentage
    * Job title and company
    * Employment type, location, deadline
    * "Why this matches" explanation
    * Key matching skills
    * Personalized recommendation
  - "Refresh Job Matches" button

### 3. Interact with Jobs
- **Click on a job card** → Opens application link in new tab
- **Click "Refresh Job Matches"** → Re-runs AI matching

### 4. Expected Behavior

**With Good Profile Data:**
- Shows 3 relevant job matches
- Match scores between 60-95%
- Specific reasons for each match
- Highlighted skills that align

**With Incomplete Profile:**
- May show fewer matches
- Lower match scores
- Suggestion to complete profile

**With No Opportunities:**
- Shows default suggestions
- Message: "No job matches found at the moment"

**On Error:**
- Red error box with clear message
- Check console logs for details

## Troubleshooting

### Issue: "No job matches found"
**Solutions:**
1. Check if opportunities exist in database:
   ```sql
   SELECT COUNT(*) FROM opportunities WHERE is_active = true;
   ```
2. Ensure student has profile data populated
3. Check console logs for errors

### Issue: "OpenAI API error"
**Solutions:**
1. Verify API key in `.env` file
2. Check if key is valid and has credits
3. Check network connectivity
4. Look for error details in browser console

### Issue: Loading spinner stuck
**Solutions:**
1. Check browser console for errors
2. Verify Supabase connection
3. Check if opportunities table is accessible
4. Test AI service manually:
   ```javascript
   import { matchJobsWithAI } from './services/aiJobMatchingService';
   // In browser console
   ```

### Issue: Match scores seem off
**Possible causes:**
- Student profile incomplete
- Opportunities lack detailed requirements
- Skills mismatch between profile and jobs
- AI interpreting differently

## Monitoring

### Console Logs
The feature logs extensively for debugging:
```javascript
🤖 AI Job Matching: Starting analysis...
📊 Student Profile: {...}
💼 Total Opportunities: X
🚀 Sending request to OpenAI...
✅ AI Response received: {...}
🎯 Matched Jobs: [...]
✨ Final Enriched Matches: [...]
```

### Network Tab
- Look for POST request to `https://openrouter.ai/api/v1/chat/completions`
- Check request payload and response
- Verify 200 OK status

## Sample Data for Testing

### Sample Student Profile
```json
{
  "name": "John Doe",
  "department": "Computer Science",
  "university": "Example University",
  "year_of_passing": "2025",
  "cgpa": "8.5",
  "profile": {
    "technicalSkills": [
      { "name": "React", "level": 4, "category": "Frontend" },
      { "name": "Node.js", "level": 3, "category": "Backend" },
      { "name": "Python", "level": 4, "category": "Programming" }
    ],
    "education": [
      {
        "degree": "B.Tech",
        "department": "Computer Science",
        "university": "Example University",
        "year_of_passing": "2025",
        "cgpa": "8.5"
      }
    ],
    "training": [
      {
        "course": "Full Stack Web Development",
        "status": "completed",
        "progress": 100
      }
    ]
  }
}
```

### Sample Opportunity
```json
{
  "job_title": "Frontend Developer Intern",
  "company_name": "Tech Corp",
  "department": "Computer Science",
  "employment_type": "Internship",
  "location": "Bangalore",
  "mode": "Hybrid",
  "skills_required": ["React", "JavaScript", "HTML", "CSS"],
  "requirements": ["Currently pursuing B.Tech in CS", "Knowledge of React"],
  "responsibilities": ["Build UI components", "Collaborate with team"],
  "description": "Looking for a passionate frontend developer...",
  "deadline": "2025-12-31",
  "is_active": true,
  "status": "published"
}
```

## Performance Notes

- AI matching takes 3-10 seconds depending on:
  - Number of opportunities
  - Complexity of profiles
  - OpenRouter API response time
  
- Matches are cached per session
- Refresh button re-runs full matching process

## Success Criteria

✅ Dashboard loads without errors
✅ "Suggested Next Steps" section visible
✅ AI job cards display with all details
✅ Match scores are realistic (60-95%)
✅ Explanations are specific and relevant
✅ Click on cards opens application links
✅ Refresh button works
✅ Loading and error states work properly

---

**Ready to Test!** 🚀

Follow the steps above to test the AI Job Alert feature. If you encounter any issues, check the troubleshooting section or review console logs for detailed error messages.
