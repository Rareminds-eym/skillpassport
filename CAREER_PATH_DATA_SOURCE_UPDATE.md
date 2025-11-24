# Career Path Data Source Update

## Summary

Updated the career path generation system to properly read from **separate database tables** for each data type.

## What Was Changed

### 1. Updated `useAdminStudents` Hook (`src/hooks/useAdminStudents.ts`)

**Before:** The hook was fetching related data but not properly exposing it at the top level of the student object.

**After:** Now properly extracts and includes all related table data:

- ✅ **Skills** - from `skills` table (with name, type, level, description)
- ✅ **Certificates** - from `certificates` table (with title, issuer, level, credential_id, link)
- ✅ **Projects** - from `projects` table (with title, tech_stack, organization, demo_link)
- ✅ **Education** - from `education` table (with degree, department, university, cgpa)
- ✅ **Experience** - from `experience` table (with organization, role, duration)
- ✅ **Trainings** - from `trainings` table (with title, organization, duration)

### 2. Database Query

The hook fetches data using Supabase foreign key relationships:

```typescript
.select(`*,
  skills!skills_student_id_fkey(...),
  projects!projects_student_id_fkey(...),
  certificates!certificates_student_id_fkey(...),
  education!education_student_id_fkey(...),
  experience!experience_student_id_fkey(...),
  trainings!trainings_student_id_fkey(...)`)
```

### 3. Data Flow

```
Database Tables
    ↓
useAdminStudents Hook (fetches & joins)
    ↓
Student Object (with all related arrays)
    ↓
handleViewCareerPath (extracts & formats)
    ↓
AI Career Path Service (generates recommendations)
    ↓
Career Path Drawer (displays results)
```

## Career Path Fields Generated

Based on the data from separate tables, the AI generates:

1. **Current Level** - Assessed from skills and experience
2. **Career Goal** - Based on interests and department
3. **Career Readiness Score** - Overall assessment (0-100%)
4. **Strengths** - Derived from skills, certificates, projects
5. **Skill Gaps** - What's missing for target roles
6. **Recommended Career Path** - Step-by-step progression with:
   - Role titles and levels
   - Timeline for each step
   - Skills needed vs skills to gain
   - Learning resources
   - Salary ranges
7. **Alternative Career Directions** - Other possible paths
8. **Immediate Action Items** - What to do now
9. **Next Steps (This Month)** - Short-term goals

## Data Mapping

### From Database Tables → Career Path

| Database Table | Used For |
|---------------|----------|
| `skills` | Strengths, Current Level, Skills Needed |
| `certificates` | Strengths, Credibility Assessment |
| `projects` | Strengths, Practical Experience |
| `education` | Current Level, CGPA, Academic Background |
| `experience` | Current Level, Work History |
| `trainings` | Learning History, Skill Development |
| `interests` | Career Goal, Path Recommendations |

## Example Data Structure

```typescript
student = {
  id: "123",
  name: "John Doe",
  email: "john@example.com",
  dept: "Computer Science",
  college: "ABC University",
  
  // From separate tables:
  skills: [
    { name: "React", type: "technical", level: "intermediate" },
    { name: "Communication", type: "soft", level: "advanced" }
  ],
  certificates: [
    { title: "AWS Certified", issuer: "Amazon", level: "Associate" }
  ],
  projects: [
    { title: "E-commerce App", tech_stack: "React, Node.js" }
  ],
  education: [
    { degree: "B.Tech", department: "CSE", cgpa: 8.5 }
  ],
  experience: [
    { organization: "Tech Corp", role: "Intern", duration: "6 months" }
  ],
  trainings: [
    { title: "Full Stack Development", organization: "Udemy" }
  ]
}
```

## Debugging

Added console logs to verify data loading:

```javascript
console.log('Sample student data structure:', {
  hasSkills: Array.isArray(sample.skills) && sample.skills.length > 0,
  hasCertificates: Array.isArray(sample.certificates) && sample.certificates.length > 0,
  hasProjects: Array.isArray(sample.projects) && sample.projects.length > 0,
  hasEducation: Array.isArray(sample.education) && sample.education.length > 0,
  hasExperience: Array.isArray(sample.experience) && sample.experience.length > 0,
  hasTrainings: Array.isArray(sample.trainings) && sample.trainings.length > 0,
});
```

Check the browser console when loading the student list to verify data is being fetched from all tables.

## Testing

1. Open the Enrollment & Profiles page
2. Check browser console for "Sample student data structure" log
3. Click "Career" button on any student card
4. Verify the career path includes data from all tables
5. Use the chat feature to ask about specific certificates, skills, etc.

## Notes

- The system gracefully handles missing data (empty arrays)
- If the full query fails, it falls back to a simple query
- All related data is filtered by approval_status when available
- The AI generates realistic recommendations based on actual student data
