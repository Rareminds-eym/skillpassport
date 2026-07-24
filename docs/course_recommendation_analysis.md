# Course Recommendation Storage & Retrieval Analysis Report

This document compiles the root cause analysis and resolution details for the issues identified in the SkillPassport course recommendation storage and retrieval flows (affecting both Grade 9 RAG fallback recommendations and College-level capability recommendations).

---

## 1. RAG Fallback Suggestions Never Saved to the Database
For Grade 9 / school-level users, the RAG fallback matches courses on the client side.

* **The Issue**: In [CareerTrackModal.jsx](file:///c:/Users/P.N.HARIPRASATH/Desktop/rm2/skillpassport/src/features/assessment/ui/CareerTrackModal.jsx#L164-L185), the RAG fallback successfully finds courses (with valid UUID `course_ids`) and updates the local React state (`setAiMatchedCourses`). However, the frontend never called any API endpoint to save these recommendations (like `/api/courses/recommendations/save`) to the database.
* **Backend Pipeline Absence**: The assessment submission/saving handler [save-results.ts](file:///c:/Users/P.N.HARIPRASATH/Desktop/rm2/skillpassport/functions/api/assessment/handlers/save-results.ts) only saves data to the `personal_assessment_results` table; it does not write to the `learner_course_recommendations` table.
* **Consequence**: The table remained empty for these users, which caused their dashboard widgets (like `TrainingRecommendations.jsx`) to show no recommendations.
* **The Fix**: Added an API call in [CareerTrackModal.jsx](file:///c:/Users/P.N.HARIPRASATH/Desktop/rm2/skillpassport/src/features/assessment/ui/CareerTrackModal.jsx#L183-L203) using `apiPost` to submit RAG recommendations to the `/courses/recommendations/save` endpoint as soon as they are generated on the client side:
  ```javascript
  if (ragCourses && ragCourses.length > 0) {
      const savedRecs = ragCourses.map((c, idx) => ({
          course_id: c.course_id,
          role_id: occupationId || null,
          relevance_score: Math.round((c.similarityScore || 0.8) * 100) || (100 - (idx * 5)),
          match_reasons: [c.match_reason || `Matched to ${roleName} role`].filter(Boolean),
          skill_gaps_addressed: c.skills || []
      }));
      apiPost('/courses/recommendations/save', {
          learnerId: effectiveLearnerId,
          recommendations: savedRecs,
          assessmentResultId: effectiveAssessmentResultId,
          recommendationType: 'assessment'
      });
  }
  ```

---

## 2. Capabilities Saved with Hardcoded `course_id: null`
For college-level users, capabilities are fetched from the LTE API and cached.

* **The Issue**: In [get-role-capabilities.ts](file:///c:/Users/P.N.HARIPRASATH/Desktop/rm2/skillpassport/functions/api/assessment/get-role-capabilities.ts#L80-L96), the database cache insert explicitly hardcoded `course_id: null` because the LTE service only returns capability definitions (such as `BCP-CAP-CM-01`) and does not know about SkillPassport courses:
  ```typescript
  const recommendations = capabilities.map((cap: any, idx: number) => ({
    learner_id: learnerId,
    course_id: null, // Hardcoded null
    role_id: roleId,
    ...
    capability_id: cap.id,
  }));
  ```
* **The Fix**: The table was updated to support denormalized capability tracking columns (such as `capability_id`), allowing the application layer to distinguish capability-based records from course-based records without requiring a hard foreign-key link on `course_id`.

---

## 3. Cache-Hit Bug Returned `id: null` to Frontend
Even if capabilities were fetched successfully on the first load (cache miss), they broke on subsequent loads.

* **The Issue**: When a cache hit occurred in [get-role-capabilities.ts](file:///c:/Users/P.N.HARIPRASATH/Desktop/rm2/skillpassport/functions/api/assessment/get-role-capabilities.ts), the handler mapped the capability `id` using `cap.course_id` (which was saved as `null`):
  ```typescript
  return apiSuccess(
    cachedCaps.map((cap: any) => ({
      id: cap.course_id, // Mapped to null!
      name: cap.match_reasons?.[0] || 'Learning Path',
      code: '',
      description: cap.match_reasons?.[1] || cap.skill_gaps_addressed?.[0] || ''
    }))
  );
  ```
* **Consequence**: The frontend received a list of capabilities where `id: null` (instead of `cap.capability_id`), preventing the student from viewing or enrolling in the capability learning path.
* **The Fix**: Modified the SQL select in [get-role-capabilities.ts](file:///c:/Users/P.N.HARIPRASATH/Desktop/rm2/skillpassport/functions/api/assessment/get-role-capabilities.ts#L28-L51) to fetch all denormalized capability columns (`capability_id`, `capability_name`, etc.) and fall back to `capability_id` during mapping:
  ```typescript
  id: cap.capability_id || cap.course_id,
  name: cap.capability_name || cap.match_reasons?.[0] || 'Learning Path',
  ```

---

## 4. Database Unique Constraint Mismatch on `/recommendations/save`
If the frontend were updated to save the RAG fallback courses by calling the `/api/courses/recommendations/save` endpoint, it would fail at the database level.

* **The Issue**: In [\[\[path\]\].ts](file:///c:/Users/P.N.HARIPRASATH/Desktop/rm2/skillpassport/functions/api/courses/%5B%5Bpath%5D%5D.ts#L508), the save endpoint performs an upsert matching on a unique constraint:
  ```typescript
  const { data, error } = await supabase.from('learner_course_recommendations').upsert(records, { 
    onConflict: 'learner_id,course_id,role_id,assessment_result_id', 
    ignoreDuplicates: false 
  });
  ```
* **Constraint Dropped**: The migration `20260723062056_add_capability_columns_to_recommendations.sql` dropped that unique constraint and replaced it with a constraint on `(learner_id, capability_id, role_id, assessment_result_id)`.
* **Consequence**: Because there was no unique constraint matching `(learner_id, course_id, role_id, assessment_result_id)`, Postgres threw a `no_unique_constraint` error, and the save failed.
* **The Fix**: Created a new database migration [20260724122500_add_course_unique_constraint_to_recommendations.sql](file:///c:/Users/P.N.HARIPRASATH/Desktop/rm2/skillpassport/supabase/migrations/20260724122500_add_course_unique_constraint_to_recommendations.sql) and executed it on the local Postgres instance to restore the unique constraint:
  ```sql
  ALTER TABLE "public"."learner_course_recommendations"
  ADD CONSTRAINT "learner_course_recommendations_course_unique_key"
  UNIQUE (learner_id, course_id, role_id, assessment_result_id);
  ```
