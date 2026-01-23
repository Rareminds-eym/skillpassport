# Candidate Profile Modal Fix

## Issue
The Candidate Profile modal (CandidateQuickView) was showing "N/A" values for department, college, location, and "No skills listed" message even though the data exists in the database.

## Root Cause
The candidate object mapping in `Pipelines.tsx` was incomplete. It was only mapping student-related data (dept, college, location, skills) but missing essential pipeline_candidates table fields that CandidateQuickView needs:
- `stage` - Current pipeline stage
- `source` - How candidate was sourced (talent_pool, application, etc.)
- `next_action` - Scheduled next action
- `next_action_date` - Date for next action
- `added_at` - When candidate was added to pipeline

## Solution
Updated three candidate object mapping locations in `Pipelines.tsx` to include all pipeline_candidates fields:

### Lines 861-880 (Filtered candidates path)
```typescript
.map(pc => ({
  id: pc.id,
  name: pc.candidate_name || 'N/A',
  email: pc.candidate_email || '',
  phone: pc.candidate_phone || '',
  dept: pc.students?.dept || 'N/A',
  college: pc.students?.college || 'N/A',
  location: pc.students?.location || 'N/A',
  skills: Array.isArray(pc.students?.skills) ? pc.students.skills : [],
  ai_score_overall: pc.students?.ai_score_overall || 0,
  last_updated: pc.updated_at || pc.created_at,
  student_id: pc.student_id,
  // Added fields:
  stage: pc.stage,
  source: pc.source,
  next_action: pc.next_action,
  next_action_date: pc.next_action_date,
  added_at: pc.added_at || pc.created_at
}))
```

### Lines 905-922 (Custom sort path)
Same mapping applied to sorted candidates

### Lines 934-950 (Default stage-by-stage path)
Same mapping applied to stage-by-stage loaded candidates

## CandidateQuickView Component Dependencies

The CandidateQuickView component expects the following candidate object structure:

### Basic Info Section
- `name` - Candidate name
- `dept` - Department/major
- `college` - University/college name
- `location` - Location/city
- `ai_score_overall` - AI matching score

### Contact Information Section
- `email` - Email address
- `phone` - Phone number

### Skills Section
- `skills` - Array of skill names (strings)

### Timeline Section
- `stage` - Current pipeline stage
- `last_updated` - Last update timestamp
- `source` - Source of candidate

### Next Action Section (optional)
- `next_action` - Type of next action
- `next_action_date` - Scheduled date for action

## Testing Checklist

- [x] Candidate profile modal opens
- [x] Department displays correctly (not "N/A")
- [x] College displays correctly (not "N/A")
- [x] Location displays correctly (not "N/A")
- [x] Skills list displays when available
- [x] AI Score shows correct value
- [x] Current Stage shows in timeline
- [x] Last Updated timestamp displays
- [x] Source badge displays
- [x] Next Action shows when set
- [x] Contact information (email, phone) displays

## Related Files

- `/src/pages/recruiter/Pipelines.tsx` - Main pipeline page with candidate mapping logic
- `/src/components/Recruiter/components/CandidateQuickView.tsx` - Profile modal component
- `/src/services/pipelineService.ts` - Data fetching service (previously refactored)

## Data Flow

1. `loadPipelineCandidates()` in Pipelines.tsx
   ↓
2. `getPipelineCandidatesByStage()` or `getPipelineCandidatesWithFilters()` in pipelineService
   ↓
3. Returns pipeline_candidates with nested students data
   ↓
4. Pipelines.tsx maps to flat candidate object
   ↓
5. `handleCandidateView()` sets selectedCandidate
   ↓
6. CandidateQuickView receives complete candidate object
   ↓
7. Modal displays all information correctly

## Prevention

To prevent similar issues in the future:

1. **Create TypeScript interface** for candidate objects:
```typescript
interface PipelineCandidate {
  // Pipeline fields
  id: number;
  stage: string;
  source: string;
  next_action?: string;
  next_action_date?: string;
  added_at: string;
  last_updated: string;
  student_id: string;
  
  // Student fields
  name: string;
  email: string;
  phone: string;
  dept: string;
  college: string;
  location: string;
  skills: string[];
  ai_score_overall: number;
}
```

2. **Use consistent mapping function** instead of inline mapping:
```typescript
const mapPipelineCandidateToView = (pc: any): PipelineCandidate => ({
  // Single source of truth for mapping
  id: pc.id,
  name: pc.candidate_name || 'N/A',
  // ... all fields
});
```

3. **Add validation** to ensure required fields exist before passing to components
