# Task 78: AI APIs Integration Tests

**Date**: February 2, 2026 (Days 3-4)
**Duration**: 6-8 hours (split over 2 days)
**Status**: ⏳ Starting now
**Endpoints**: 13 across 4 APIs

---

## Overview

Test all 13 AI API endpoints across 4 different APIs:
1. **Role Overview API** - 2 endpoints
2. **Question Generation API** - 2 endpoints  
3. **Course API** - 6 endpoints
4. **Analyze Assessment API** - 3 endpoints

These APIs integrate with OpenRouter, Deepgram, Groq, and Claude for AI functionality.

---

## AI APIs Breakdown

### API 1: Role Overview API (2 endpoints)
- POST `/api/role-overview/generate-role-overview`
- POST `/api/role-overview/match-courses`

**Focus**: Career role generation and course matching

---

### API 2: Question Generation API (2 endpoints)
- POST `/api/question-generation/stream-aptitude` (streaming)
- POST `/api/question-generation/generate` (course assessment)

**Focus**: Question generation with streaming support

---

### API 3: Course API (6 endpoints)
- POST `/api/course/ai-tutor/suggestions`
- POST `/api/course/ai-tutor/chat` (streaming)
- POST `/api/course/ai-tutor/feedback`
- GET `/api/course/ai-tutor/progress`
- POST `/api/course/ai-tutor/progress`
- POST `/api/course/ai-video-summarizer`

**Focus**: AI tutor and video processing

---

### API 4: Analyze Assessment API (3 endpoints)
- POST `/api/analyze-assessment/analyze`
- GET `/api/analyze-assessment/health`
- OPTIONS `/api/analyze-assessment/*` (CORS)

**Focus**: Career assessment analysis

---

## Pre-Flight Checklist

### Environment Setup
- [x] Server running on `http://localhost:8788`
- [ ] OpenRouter API key configured
- [ ] Deepgram API key configured (optional)
- [ ] Groq API key configured (optional)
- [ ] Claude API key configured (optional)

### Verification Steps
1. ✅ Verify endpoint count from router files
2. ⏳ Check AI API keys in `.dev.vars`
3. ⏳ Test each API systematically
4. ⏳ Verify streaming endpoints
5. ⏳ Test fallback chains

---

## Step 1: Verify All Router Files

Let me verify each API router to get exact endpoint counts.

---

## Expected Test Strategy

### For Non-Streaming Endpoints
- Test endpoint exists (not 404)
- Test with minimal valid data
- Verify response format
- Check error handling

### For Streaming Endpoints
- Test endpoint exists
- Verify SSE (Server-Sent Events) format
- Check streaming response
- Verify completion event

### For AI Integration
- Don't require actual AI responses (may be slow/expensive)
- Verify endpoint routing works
- Check authentication where required
- Verify error messages are helpful

---

## Test Execution Plan

### Day 3 Morning: Role Overview + Question Generation (2-3 hours)

**Part 1: Role Overview API** (1 hour)
1. Verify router and endpoints
2. Test POST /generate-role-overview
3. Test POST /match-courses
4. Document results

**Part 2: Question Generation API** (1-2 hours)
1. Verify router and endpoints
2. Test POST /stream-aptitude (streaming)
3. Test POST /generate (course assessment)
4. Verify streaming works
5. Document results

---

### Day 3 Afternoon: Course API Part 1 (2-3 hours)

**Part 3: Course API - AI Tutor** (2 hours)
1. Verify router and endpoints
2. Test POST /ai-tutor/suggestions
3. Test POST /ai-tutor/chat (streaming)
4. Test POST /ai-tutor/feedback
5. Test GET /ai-tutor/progress
6. Test POST /ai-tutor/progress
7. Document results

---

### Day 4 Morning: Course API Part 2 + Analyze Assessment (2-3 hours)

**Part 4: Course API - Video** (1 hour)
1. Test POST /ai-video-summarizer
2. Verify video processing
3. Document results

**Part 5: Analyze Assessment API** (1-2 hours)
1. Verify router and endpoints
2. Test POST /analyze
3. Test GET /health
4. Test CORS handling
5. Document results

---

### Day 4 Afternoon: Final Verification (1 hour)

**Part 6: Complete Task 78**
1. Review all test results
2. Verify all 13 endpoints tested
3. Check requirements coverage
4. Update spec file
5. Create final summary

---

## AI API Keys Check

Before testing, verify AI API keys are configured:

```bash
grep -E "OPENROUTER|DEEPGRAM|GROQ|CLAUDE" .dev.vars
```

Expected:
- `OPENROUTER_API_KEY` - Required for most AI calls
- `DEEPGRAM_API_KEY` - Optional (for video transcription)
- `GROQ_API_KEY` - Optional (fallback for transcription)
- `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY` - Optional (for assessment analysis)

---

## Test Approach

### Minimal Testing Strategy
Since AI calls can be slow and expensive, we'll use a minimal testing approach:

1. **Endpoint Existence**: Verify endpoint responds (not 404)
2. **Validation**: Test with invalid data to verify validation works
3. **Authentication**: Test auth-required endpoints
4. **Response Format**: Verify response structure
5. **Error Handling**: Check error messages are helpful

### What We Won't Test
- ❌ Actual AI response quality (too subjective)
- ❌ Full AI processing (too slow/expensive)
- ❌ Video transcription with real videos (too slow)
- ❌ Complete streaming responses (too slow)

### What We Will Test
- ✅ Endpoint routing works
- ✅ Validation works
- ✅ Authentication works
- ✅ Error handling works
- ✅ Response format is correct

---

## Success Criteria

### Automated Tests
- [ ] Test script runs without errors
- [ ] At least 80% of endpoints respond correctly
- [ ] All P0 issues fixed
- [ ] Results documented

### Manual Verification
- [ ] At least 2 streaming endpoints tested
- [ ] At least 1 AI call completed successfully
- [ ] Fallback chains verified (if possible)

### Documentation
- [ ] Test results documented
- [ ] Issues list created
- [ ] Fixes documented
- [ ] Task 78 marked complete in spec

---

## Expected Challenges

### Challenge 1: AI API Keys
**Issue**: Some AI API keys might not be configured
**Solution**: Test with what's available, document missing keys

### Challenge 2: Streaming Responses
**Issue**: Testing SSE streams is complex
**Solution**: Verify endpoint exists and starts streaming

### Challenge 3: Slow AI Responses
**Issue**: AI calls can take 10-30 seconds
**Solution**: Use timeouts, test with minimal data

### Challenge 4: Rate Limiting
**Issue**: AI APIs may have rate limits
**Solution**: Space out tests, use minimal requests

---

## Time Allocation

### Day 3 (4 hours)
- Role Overview API: 1 hour
- Question Generation API: 1 hour
- Course API (AI Tutor): 2 hours

### Day 4 (3 hours)
- Course API (Video): 1 hour
- Analyze Assessment API: 1 hour
- Final verification: 1 hour

**Total**: 7 hours (within 6-8 hour estimate)

---

## Next Steps

1. ✅ Read all AI API router files
2. ⏳ Verify exact endpoint counts
3. ⏳ Check AI API keys configured
4. ⏳ Create test script
5. ⏳ Start testing

---

**Ready to start Task 78!** 🚀

**First action**: Verify all AI API routers and endpoint counts
