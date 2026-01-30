# Adaptive Session API Migration Plan

## Executive Summary

This plan addresses the **CORS/502 error** issue you're experiencing with the adaptive aptitude assessment by moving all session management logic from direct browser-to-Supabase calls to Cloudflare Pages Functions.

## Problem Statement

**Current Issue:**
```
Access to fetch at 'https://dpooleduinyyzxgrcwko.supabase.co/rest/v1/adaptive_aptitude_sessions' 
from origin 'http://localhost:8788' has been blocked by CORS policy
PATCH https://dpooleduinyyzxgrcwko.supabase.co/rest/v1/adaptive_aptitude_sessions 
net::ERR_FAILED 502 (Bad Gateway)
```

**Root Cause:**
- Frontend makes direct Supabase API calls from browser
- When Supabase returns 502 error, CORS headers are missing
- Browser blocks the request, breaking the assessment flow
- Users cannot complete assessments when Supabase has connectivity issues

## Solution Overview

**Move all session management to Cloudflare Pages Functions:**

### Benefits
✅ **Eliminates CORS issues** - All Supabase calls happen server-side  
✅ **Better error handling** - Server can retry failed requests gracefully  
✅ **Improved security** - No direct database access from browser  
✅ **Rate limiting** - Can add server-side rate limits  
✅ **Caching** - Can cache session data server-side  
✅ **Better monitoring** - Centralized logging and error tracking  
✅ **Consistent with existing architecture** - Follows patterns already used in User API, Career API, etc.

## Implementation Plan

### Phase 5: Adaptive Aptitude Session API (Week 6)

**24 new tasks (52-75)** organized into 8 sub-phases:

#### 5.1 Create API Structure (Tasks 52-53)
- Set up directory structure
- Copy type definitions
- **Copy AdaptiveEngine** (tier classification, difficulty adjustment, stop conditions)
- Copy helper functions (validation, converters, analytics)

#### 5.2 Session Management Endpoints (Tasks 54-56)
- **POST /initialize** - Initialize new test session
- **GET /next-question/:sessionId** - Get next question with dynamic generation
- **POST /submit-answer** - Submit answer and update session state

#### 5.3 Test Completion Endpoints (Tasks 57-59)
- **POST /complete/:sessionId** - Complete test and calculate results
- **GET /results/:sessionId** - Get test results
- **GET /results/student/:studentId** - Get all results for student

#### 5.4 Session Management Endpoints (Tasks 60-62)
- **GET /resume/:sessionId** - Resume in-progress test
- **GET /find-in-progress/:studentId** - Find in-progress session
- **POST /abandon/:sessionId** - Abandon session

#### 5.5 Router and Authentication (Tasks 63-64)
- Wire up all endpoints in router
- Add authentication to sensitive endpoints
- Add comprehensive error handling

#### 5.6 Frontend Refactor (Tasks 65-67)
- Create new API client service
- Update existing service to use API client
- Verify hooks still work

#### 5.7 Testing (Tasks 68-70)
- Test all API endpoints
- Test frontend integration end-to-end
- Test error handling and performance

#### 5.8 Cleanup and Documentation (Tasks 71-75)
- Remove old client-side Supabase calls
- Update type exports and imports
- Add API documentation
- Update frontend documentation
- Remove deprecated code

## API Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | /initialize | Start new test | Yes (student) |
| GET | /next-question/:sessionId | Get next question | No |
| POST | /submit-answer | Submit answer | Yes (session owner) |
| POST | /complete/:sessionId | Complete test | Yes (session owner) |
| GET | /results/:sessionId | Get results | Yes (session owner/admin) |
| GET | /results/student/:studentId | Get student results | Yes (student/admin) |
| GET | /resume/:sessionId | Resume test | No |
| GET | /find-in-progress/:studentId | Find in-progress | No |
| POST | /abandon/:sessionId | Abandon test | Yes (session owner) |

**Total: 9 new endpoints**

## Code Migration Strategy

### What Gets Moved
✅ All Supabase database operations  
✅ Session state management  
✅ Question generation coordination  
✅ Answer validation and scoring  
✅ Results calculation  
✅ Helper functions (validation, converters, analytics)  
✅ **AdaptiveEngine** (tier classification, difficulty adjustment, stop conditions)  
✅ Duplicate question validation logic  

### What Stays Client-Side
✅ React hooks (`useAdaptiveAptitude`)  
✅ UI components  
✅ Local state management  
✅ Type definitions (shared between client and server)  

### Migration Pattern
```
Before:
Browser → Supabase (direct) ❌ CORS issues

After:
Browser → Cloudflare Functions → Supabase ✅ No CORS issues
```

## Testing Strategy

### Local Testing (Week 6)
1. Start local server: `npm run pages:dev`
2. Test each endpoint individually
3. Test frontend integration end-to-end
4. Test error scenarios (Supabase failures, invalid data)
5. Test authentication and authorization
6. Test concurrent requests

### Integration Testing (Week 7)
1. Test complete assessment flow
2. Test session resumption
3. Test duplicate question prevention
4. Test difficulty adjustment
5. Test results calculation
6. Performance testing

## Updated Project Timeline

**Total Duration: 7 weeks (was 6)**

- **Week 1**: Preparation and shared utilities ✅ COMPLETE
- **Week 2**: User API (27 endpoints) ✅ COMPLETE
- **Week 3**: Storage API (14 endpoints) - NOT STARTED
- **Week 4-5**: AI APIs (11 endpoints) - PARTIALLY COMPLETE
- **Week 6**: Adaptive Session API (9 endpoints) + Cleanup - **NEW PHASE**
- **Week 7**: Testing and documentation

## Impact Analysis

### Files Modified
- **New files**: ~20 (handlers, utils, types, router, API client, documentation)
- **Modified files**: 3 (frontend service, hooks verification, cleanup)
- **Deleted code**: ~500 lines (old Supabase calls removed)
- **Total LOC**: ~2500 lines (mostly copied/refactored, not new)

### Breaking Changes
- ❌ **None** - Frontend API remains the same
- ✅ All existing code continues to work
- ✅ Backward compatible

### Deployment
- No database migrations required
- No environment variable changes needed
- Deploy Cloudflare Pages Functions
- Frontend automatically uses new API

## Risk Mitigation

### Risks
1. **Session state consistency** - Multiple concurrent requests
2. **Performance** - Additional network hop
3. **Testing complexity** - More integration points

### Mitigations
1. Use database transactions for state updates
2. Add caching for frequently accessed data
3. Comprehensive testing at each phase checkpoint
4. Gradual rollout with feature flag (optional)

## Success Criteria

✅ No CORS errors during assessment  
✅ Assessment completes successfully even with Supabase issues  
✅ All existing functionality works  
✅ Response times < 500ms for all endpoints  
✅ Proper error messages for all failure scenarios  
✅ 100% test coverage for new endpoints  
✅ **All old Supabase calls removed from frontend**  
✅ **Clean codebase with no deprecated code**  
✅ **Complete API documentation**  

## Checklist: Nothing Missed

### ✅ Core Functionality
- [x] All 9 session management functions covered
- [x] AdaptiveEngine copied (tier classification, difficulty adjustment, stop conditions)
- [x] All helper functions copied (validation, converters, analytics)
- [x] Question generation integration (calls existing API)
- [x] Authentication on sensitive endpoints
- [x] Error handling and retry logic

### ✅ Dependencies
- [x] AdaptiveEngine dependency identified and included
- [x] QuestionGeneratorService already uses Cloudflare Functions (no changes needed)
- [x] Type definitions shared between frontend and API
- [x] Supabase client properly configured in Functions

### ✅ Testing
- [x] API endpoint testing (Task 68)
- [x] Frontend integration testing (Task 69)
- [x] Performance and error handling testing (Task 70)
- [x] End-to-end testing in Phase 6

### ✅ Cleanup
- [x] Remove old Supabase calls (Task 71)
- [x] Update type exports (Task 72)
- [x] Add API documentation (Task 73)
- [x] Update frontend documentation (Task 74)
- [x] Remove deprecated code (Task 75)

### ✅ Documentation
- [x] API endpoint documentation
- [x] Request/response examples
- [x] Authentication requirements
- [x] Error codes and messages
- [x] Migration guide for developers

## Next Steps

1. **Review this plan** - Confirm it covers all requirements
2. **Approve the plan** - Give go-ahead to proceed
3. **Begin implementation** - Start with Task 52
4. **Test at checkpoints** - Verify each sub-phase works
5. **Complete Phase 5** - All 19 tasks done
6. **Move to Phase 6** - Final testing and documentation

## Questions for Review

1. Does this plan address the CORS/502 issue you're experiencing?
2. Are there any additional endpoints or functionality needed?
3. Should we add any additional authentication/authorization rules?
4. Are there any performance requirements we should consider?
5. Should we implement caching for any specific data?

---

**Ready to proceed?** The plan is comprehensive and follows the same patterns used in the existing User API and Career API implementations. All tasks are actionable and focused on coding activities.
