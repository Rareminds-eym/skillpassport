# 🗂️ Table Usage Reference - Quick Lookup

## Where `opportunities` is Used

### Student-Facing Features:
1. **Job Listings** - Students browse available jobs
2. **Job Applications** - Students apply to opportunities
3. **AI Recommendations** - Matching students to opportunities
4. **Student Dashboard** - Showing recommended opportunities

### Database References:
```sql
-- Foreign Keys pointing TO opportunities:
applied_jobs.opportunity_id → opportunities.id

-- Foreign Keys pointing FROM opportunities:
opportunities.requisition_id → requisitions.id
```

### Code Files:
- `src/pages/student/*` - Student job browsing
- `src/services/OpportunitiesService.js` - Opportunity management
- `supabase/functions/recommend-opportunities/` - AI matching
- `applied_jobs` table - References opportunity_id

---

## Where `requisitions` is Used

### Recruiter-Facing Features:
1. **Pipeline Management** - Track candidates through hiring stages
2. **Requisition Creation** - Create hiring requests
3. **Candidate Tracking** - Monitor recruitment progress
4. **Pipeline Kanban Board** - Visual pipeline management

### Database References:
```sql
-- Foreign Keys pointing TO requisitions:
pipeline_candidates.requisition_id → requisitions.id
opportunities.requisition_id → requisitions.id

-- No foreign keys FROM requisitions
```

### Code Files:
- `src/pages/recruiter/Pipelines.tsx` - Main pipeline interface
- `src/pages/recruiter/ApplicantsList.tsx` - Creates requisitions on-the-fly
- `src/services/pipelineService.ts` - Pipeline candidate management
- `pipeline_candidates` table - References requisition_id

---

## Key Integration Points

### 1. Auto-Creation of Requisitions
**File:** `src/pages/recruiter/ApplicantsList.tsx` (Line ~216)
```javascript
// When candidate is moved to pipeline, auto-create requisition
requisitionId = `req_opp_${applicant.opportunity_id}`;
await supabase.from('requisitions').upsert({...});
```

### 2. Linking Opportunities to Requisitions
**File:** `src/pages/recruiter/ApplicantsList.tsx` (Line ~232)
```javascript
// Update opportunity with requisition_id
await supabase
  .from('opportunities')
  .update({ requisition_id: requisitionId })
  .eq('id', applicant.opportunity_id);
```

### 3. Loading Pipeline by Requisition
**File:** `src/pages/recruiter/Pipelines.tsx` & `src/services/pipelineService.ts`
```javascript
// Get pipeline candidates for a requisition
await supabase
  .from('pipeline_candidates')
  .select('*')
  .eq('requisition_id', selectedJob);
```

---

## Table Relationships Diagram

```
                    Student Flow
                    ════════════
                         
opportunities (students browse jobs)
     │
     │ student applies
     ↓
applied_jobs (student applications)
     │
     │ requisition_id bridge
     ↓
                         
                    Recruiter Flow
                    ══════════════
                         
requisitions (hiring requests)
     │
     │ candidate sourced/moved
     ↓
pipeline_candidates (track through stages)
```

---

## Usage Count

To see actual usage in your database, run this in browser console:

```javascript
async function showTableUsage() {
  const { data: opps } = await supabase.from('opportunities').select('id');
  const { data: reqs } = await supabase.from('requisitions').select('id');
  const { data: apps } = await supabase.from('applied_jobs').select('id');
  const { data: pipes } = await supabase.from('pipeline_candidates').select('id');
  
  console.log('📊 Table Usage:');
  console.log(`   opportunities: ${opps?.length || 0} records`);
  console.log(`   requisitions: ${reqs?.length || 0} records`);
  console.log(`   applied_jobs: ${apps?.length || 0} records (references opportunities)`);
  console.log(`   pipeline_candidates: ${pipes?.length || 0} records (references requisitions)`);
}
showTableUsage();
```

---

## Bottom Line

### ✅ DO NOT delete `opportunities` because:
- **Core student feature** - job browsing/applications
- **Referenced by** `applied_jobs` (foreign key)
- **Used heavily** in student-facing features

### ✅ DO NOT delete `requisitions` because:
- **Core recruiter feature** - pipeline management
- **Referenced by** `pipeline_candidates` (foreign key)
- **Used heavily** in recruiter-facing features

### ✅ Both tables work together:
- Opportunities = Student-facing job postings
- Requisitions = Recruiter-facing hiring requests
- Linked via `opportunities.requisition_id → requisitions.id`
- **Different purposes, both essential!**