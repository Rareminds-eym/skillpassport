# Backend Assessment API Setup

## What Was Created

A new backend API endpoint that proxies assessment generation requests to Claude AI, avoiding CORS issues.

## Files Created/Modified

1. ✅ **Backend/routes/assessment.js** - New assessment API route
2. ✅ **Backend/server.js** - Added assessment route registration
3. ✅ **src/services/assessmentGenerationService.js** - Updated to call backend API

## Setup Steps

### Step 1: Restart Backend Server

The backend needs to be restarted to load the new route.

**Option A: If backend is running in terminal**
1. Stop it (Ctrl+C)
2. Restart: `cd Backend && npm start`

**Option B: If using npm dev**
```bash
cd Backend
npm run dev
```

**Option C: Check if backend is running**
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001
```

### Step 2: Verify Backend URL

Your `.env` file has:
```env
VITE_API_URL=http://localhost:3001
```

Make sure backend is running on port 3001.

### Step 3: Test the API

Open browser console and run:
```javascript
fetch('http://localhost:3001/api/assessment/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    courseName: 'React Development',
    level: 'Intermediate',
    questionCount: 15
  })
})
.then(r => r.json())
.then(console.log);
```

### Step 4: Test Assessment UI

1. Clear cache: `localStorage.clear()`
2. Go to My Learning
3. Click Assessment on external course
4. Watch console logs

## Expected Flow

```
Frontend (Browser)
    ↓
    POST /api/assessment/generate
    ↓
Backend (Node.js)
    ↓
    POST https://api.anthropic.com/v1/messages
    ↓
Claude AI
    ↓
    Returns JSON questions
    ↓
Backend
    ↓
Frontend (Display questions)
```

## Console Logs

### Frontend
```
🎯 Generating assessment for: React Development Level: Intermediate
📡 Calling backend API: http://localhost:3001/api/assessment/generate
✅ Generated assessment: { course: "React Development", ... }
✅ Assessment validated successfully
```

### Backend
```
🎯 Generating assessment for: React Development Level: Intermediate
📡 Calling Claude AI API...
📝 Raw AI response received
✅ Assessment generated: { course: "React Development", questionCount: 15 }
```

## Troubleshooting

### Error: "Failed to fetch"
**Cause:** Backend is not running
**Solution:** Start backend server

### Error: "Claude API key not configured on server"
**Cause:** Backend can't find the API key
**Solution:** Make sure `.env` file is in the root directory (parent of Backend/)

### Error: "Network request failed"
**Cause:** Wrong backend URL
**Solution:** Check `VITE_API_URL` in `.env`

### Error: CORS
**Cause:** Backend CORS not configured
**Solution:** Backend already has `app.use(cors())` - should work

## API Endpoint Details

### POST /api/assessment/generate

**Request:**
```json
{
  "courseName": "React Development",
  "level": "Intermediate",
  "questionCount": 15
}
```

**Response:**
```json
{
  "course": "React Development",
  "level": "Intermediate",
  "total_questions": 15,
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "What is the purpose of useEffect?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "B",
      "skill_tag": "React Hooks"
    }
  ]
}
```

## Environment Variables

Backend needs access to:
```env
VITE_CLAUDE_API_KEY=sk-ant-api03-...
# or
CLAUDE_API_KEY=sk-ant-api03-...
```

The backend route checks both variables.

## Testing Checklist

- [ ] Backend server is running
- [ ] Backend accessible at http://localhost:3001
- [ ] API endpoint responds: http://localhost:3001/api/health
- [ ] Claude API key is in `.env` file
- [ ] Frontend cleared cache
- [ ] Assessment button visible on external courses
- [ ] Console shows backend API call
- [ ] Questions are generated successfully

## Quick Test Commands

```bash
# Test backend health
curl http://localhost:3001/api/health

# Test assessment API
curl -X POST http://localhost:3001/api/assessment/generate \
  -H "Content-Type: application/json" \
  -d '{"courseName":"React Development","level":"Intermediate","questionCount":15}'
```

## Summary

✅ Backend API created to proxy Claude AI calls
✅ Avoids CORS issues
✅ Frontend updated to use backend
✅ Same functionality, better architecture

**Next:** Restart backend and test!
