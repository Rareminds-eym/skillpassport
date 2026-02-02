# Resume Parser - Rate Limit Handling & Fallback Strategy

## Understanding the 429 Error

The `429 (Too Many Requests)` error from OpenRouter API means:
- You've exceeded the free tier request limit
- The API is temporarily rate-limited
- This is expected with free API tiers

## How the Parser Handles Rate Limits

### **Automatic Fallback System** ✅

The resume parser has a **3-tier fallback strategy**:

```
1. OpenRouter API (z-ai/glm-4.5-air:free)
   ↓ (if rate limited or fails)
2. Gemini API (if VITE_GEMINI_API_KEY is set)
   ↓ (if fails)
3. Enhanced Regex Parser (NO API KEY NEEDED)
```

### **When Rate Limited (429 Error):**
1. ⚠️ OpenRouter returns 429 error
2. 🔄 System automatically catches the error
3. ✅ Falls back to **Enhanced Regex Parser**
4. 📄 Resume is parsed using pattern matching (no AI needed)

### **The Fallback Parser Still Works!**

Even without AI, the regex-based parser can extract:
- ✅ Name (from top of resume)
- ✅ Email and phone number
- ✅ Education (degrees, universities, years)
- ✅ Experience (job titles, companies, dates)
- ✅ Projects (with titles, descriptions, tech stack)
- ✅ Skills (technical and soft skills)
- ✅ Certificates (titles and issuers)

**All data is still structured properly into separate arrays!**

## Solutions for 429 Rate Limit

### Option 1: Wait and Retry (Free)
- OpenRouter free tier resets after some time
- Usually 1 minute to 1 hour depending on their limits
- The fallback parser works in the meantime

### Option 2: Use Gemini API (Free Alternative)
Add a Gemini API key to your `.env` file:
```env
VITE_GEMINI_API_KEY=your_gemini_key_here
```

**How to get a free Gemini API key:**
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key and add to `.env`
5. Restart the app

Gemini has a generous free tier (60 requests/minute).

### Option 3: Use OpenAI API (Paid)
Add an OpenAI API key:
```env
VITE_OPENAI_API_KEY=sk-your_openai_key_here
```

OpenAI GPT-3.5 is very affordable (~$0.0015 per resume).

### Option 4: Rely on Regex Parser (Always Works)
The enhanced regex parser is quite good at extracting:
- Standard resume formats
- Clear section headings (EDUCATION, EXPERIENCE, etc.)
- Common date patterns
- Email/phone patterns
- Bullet points and lists

**It works 100% offline and has no rate limits!**

## Current Configuration

Your `.env` file now has:
```env
# Supabase (for saving data)
VITE_SUPABASE_URL=https://dpooleduinyyzxgrcwko.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI APIs (for parsing resumes)
OPENROUTER_API_KEY=sk-or-v1-... (currently rate-limited)
# VITE_GEMINI_API_KEY=your_key_here (add for free AI parsing)
# VITE_OPENAI_API_KEY=your_key_here (add for paid AI parsing)
```

## Testing the Fallback Parser

Since you're currently rate-limited, the system will automatically use the regex parser.

**To test:**
1. Go to your profile
2. Click "Upload Resume & Auto-Fill Profile"
3. Upload a well-formatted resume (PDF or TXT)
4. Click "Parse Resume"
5. Check the browser console - you'll see:
   ```
   ⚠️ OpenRouter API rate limit reached. Using fallback parser...
   📄 Using ENHANCED fallback resume parser
   ✅ Fallback parsing complete
   ```

**Expected Results:**
- Data will still be parsed into separate arrays
- All fields will have `enabled: true` and `processing: true`
- Projects, education, experience, skills will be extracted
- Unique IDs will be generated

## Quality Comparison

| Feature | AI Parser | Regex Parser |
|---------|-----------|--------------|
| Name extraction | Excellent | Good |
| Contact info | Excellent | Excellent |
| Education | Excellent | Good |
| Experience | Excellent | Good |
| Projects | Excellent | Good |
| Skills | Excellent | Fair |
| Certificates | Excellent | Fair |
| Complex formats | Excellent | Fair |
| Non-standard resumes | Excellent | Limited |

## Recommendations

For best results:
1. **Add Gemini API key** (free, 60 req/min limit)
2. **Format your resume clearly** with section headings
3. Use standard sections: EDUCATION, EXPERIENCE, PROJECTS, SKILLS, CERTIFICATES
4. Use bullet points for descriptions
5. Include dates in standard formats (Jan 2024, 2024-01, etc.)

## Summary

✅ **Your resume parser is fully functional even with the 429 error**
✅ **Fallback parser extracts data into proper structure**
✅ **Supabase credentials are configured for data storage**
✅ **All metadata flags (enabled, processing) are added correctly**

The 429 error is not blocking - the parser will continue working with the regex fallback!