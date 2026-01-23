# 📊 OPPORTUNITIES vs REQUISITIONS - Complete Analysis

## Overview

Your system uses **BOTH** tables with **different purposes**. They are **NOT duplicates** - they work together!

---

## 🔄 How They Work Together

```
┌─────────────────────────────────────────────────────────────────┐
│                         DATA FLOW                                │
└─────────────────────────────────────────────────────────────────┘

STUDENT SIDE                          RECRUITER SIDE
═══════════════                       ════════════════

1. Recruiter Posts Job
   ↓
   opportunities                      requisitions
   ┌─────────────────┐               ┌──────────────────┐
   │ id: 1           │               │ id: req_opp_1    │
   │ job_title       │←──link via────│ title            │
   │ description     │ requisition_id│ department       │
   │ location        │               │ status           │
   │ skills_required │               │ priority         │
   │ is_active       │               │ hiring_manager   │
   └─────────────────┘               └──────────────────┘
          ↓                                    ↓
2. Student Applies                   3. Candidate Enters Pipeline
   ↓                                    ↓
   applied_jobs                         pipeline_candidates
   ┌─────────────────┐                 ┌──────────────────┐
   │ student_id      │                 │ student_id       │
   │ opportunity_id →│ ─────maps to──→ │ requisition_id   │
   │ status: applied │                 │ stage: sourced   │
   │ applied_at      │                 │ status: active   │
   └─────────────────┘                 └──────────────────┘
```

---

## 📋 Table Purposes

### `opportunities` Table
**WHO USES IT:** Students  
**PURPOSE:** Browse and apply to jobs  
**WHAT IT STORES:**
- Job postings (what students see)
- Job descriptions, requirements
- Skills needed, location, salary
- Active/inactive status

**REFERENCED BY:**
- `applied_jobs.opportunity_id` → `opportunities.id`

**CODE FILES THAT USE IT:**
- Student job listings page
- Job application form
- Student dashboard (recommended jobs)
- AI matching system

---

### `requisitions` Table
**WHO USES IT:** Recruiters  
**PURPOSE:** Manage hiring pipeline  
**WHAT IT STORES:**
- Hiring requisitions (internal job reqs)
- Department, priority, status
- Hiring manager assignments
- Approval workflows

**REFERENCED BY:**
- `pipeline_candidates.requisition_id` → `requisitions.id`
- `opportunities.requisition_id` → `requisitions.id` (bridge)

**CODE FILES THAT USE IT:**
- Recruiter pipeline page (`Pipelines.tsx`)
- Pipeline management service
- Candidate tracking system

---

## 🔗 The Bridge

```sql
opportunities.requisition_id → requisitions.id
```

This **links student applications to recruiter pipeline**:

1. Student applies to `opportunity #123`
2. Your code auto-creates/links to `requisition "req_opp_123"`
3. When recruiter moves candidate to "Sourced", entry goes to `pipeline_candidates` with `requisition_id = "req_opp_123"`
4. Pipeline page loads candidates by `requisition_id`

---

## 📊 Current Usage Statistics

Run this in your browser console when app is loaded:

```javascript
// Check opportunities
const opps = await supabase.from('opportunities').select('*');
console.log('Opportunities:', opps.data?.length);

// Check requisitions
const reqs = await supabase.from('requisitions').select('*');
console.log('Requisitions:', reqs.data?.length);

// Check bridge
const linked = await supabase
  .from('opportunities')
  .select('id, requisition_id')
  .not('requisition_id', 'is', null);
console.log('Linked opportunities:', linked.data?.length);
```

---

## ⚠️ IMPORTANT: DO NOT DELETE EITHER TABLE

### ❌ If you delete `opportunities`:
- Students can't browse jobs ❌
- Student applications break ❌
- `applied_jobs` foreign key constraint fails ❌
- **ENTIRE STUDENT EXPERIENCE BREAKS** ❌

### ❌ If you delete `requisitions`:
- Recruiter pipeline breaks ❌
- Can't track candidates through stages ❌
- `pipeline_candidates` foreign key constraint fails ❌
- **ENTIRE RECRUITER PIPELINE BREAKS** ❌

---

## ✅ Recommendation

**KEEP BOTH TABLES** because:

1. **Different audiences:**
   - Students interact with `opportunities`
   - Recruiters interact with `requisitions`

2. **Different data models:**
   - Opportunities = job posting info (student-focused)
   - Requisitions = hiring workflow info (recruiter-focused)

3. **Already integrated:**
   - Your code automatically creates requisitions from opportunities
   - Bridge via `requisition_id` works fine
   - Both systems functional

4. **Industry standard:**
   - Many ATS systems separate job postings from requisitions
   - Allows different permissions (students vs recruiters)
   - Enables different workflows

---

## 🔧 What Your Code Currently Does

### In `ApplicantsList.tsx` (line 216):
```javascript
// When moving candidate to pipeline, creates requisition if doesn't exist
await supabase.from('requisitions').upsert({
  id: requisitionId,  // Format: req_opp_{opportunity_id}
  title: applicant.opportunity.job_title,
  ...
});
```

### In `Pipelines.tsx`:
```javascript
// Loads pipeline candidates by requisition_id
await supabase
  .from('pipeline_candidates')
  .select('*')
  .eq('requisition_id', selectedJob);  // selectedJob = requisition ID
```

---

## 📈 Summary

| Aspect | opportunities | requisitions |
|--------|---------------|--------------|
| **Primary Users** | Students | Recruiters |
| **Purpose** | Job browsing/applications | Pipeline management |
| **Related Table** | `applied_jobs` | `pipeline_candidates` |
| **Usage** | Heavy (student-facing) | Medium (recruiter-facing) |
| **Can Delete?** | ❌ NO | ❌ NO |
| **Linked?** | Yes, via `requisition_id` | Yes, from opportunities |

---

## 🎯 Action Items

✅ **Keep both tables**  
✅ **Ensure all opportunities have requisition_id** (auto-created by your code)  
✅ **Monitor the bridge** (opportunities.requisition_id → requisitions.id)  
❌ **Do NOT delete either table**