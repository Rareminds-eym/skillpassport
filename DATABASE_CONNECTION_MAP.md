# Database Connection Visual Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           STUDENT DASHBOARD                              │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │  📚 Education    │  │  🎓 Training     │  │  💼 Experience   │     │
│  │  [Edit Button]   │  │  [Edit Button]   │  │  [Edit Button]   │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐                            │
│  │  ⚡ Tech Skills  │  │  💬 Soft Skills  │                            │
│  │  [Edit Button]   │  │  [Edit Button]   │                            │
│  └──────────────────┘  └──────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ useStudentDataByEmail(email)
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        PROFILE EDIT SECTION                              │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │  👤 Personal     │  │  📚 Education    │  │  🎓 Training     │     │
│  │  [Edit Button]   │  │  [Edit Button]   │  │  [Edit Button]   │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │  💼 Experience   │  │  💬 Soft Skills  │  │  ⚡ Tech Skills  │     │
│  │  [Edit Button]   │  │  [Edit Button]   │  │  [Edit Button]   │     │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ SAME HOOK!
                                  │ useStudentDataByEmail(email)
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      useStudentDataByEmail Hook                          │
│                      (src/hooks/useStudentDataByEmail.js)                │
│                                                                          │
│  Returns:                                                                │
│  • studentData { profile, education, training, experience, skills }      │
│  • updateProfile(data)                                                   │
│  • updateEducation(data)                                                 │
│  • updateTraining(data)                                                  │
│  • updateExperience(data)                                                │
│  • updateTechnicalSkills(data)                                           │
│  • updateSoftSkills(data)                                                │
│  • loading, error, refresh                                               │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Calls service functions
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                     Student Service Profile Layer                        │
│                  (src/services/studentServiceProfile.js)                 │
│                                                                          │
│  • getStudentByEmail(email)                                              │
│  • updateStudentByEmail(email, updates)      → profile.*                 │
│  • updateEducationByEmail(email, data)       → profile.education         │
│  • updateTrainingByEmail(email, data)        → profile.training          │
│  • updateExperienceByEmail(email, data)      → profile.experience        │
│  • updateTechnicalSkillsByEmail(email, data) → profile.technicalSkills   │
│  • updateSoftSkillsByEmail(email, data)      → profile.softSkills        │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ Executes Supabase queries
                                  │
                                  ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE DATABASE                               │
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        students TABLE                              │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │ id │ universityId │           profile (JSONB)                     │  │
│  ├────┼──────────────┼───────────────────────────────────────────────┤  │
│  │ 1  │     12       │  {                                            │  │
│  │    │              │    "name": "John Doe",                        │  │
│  │    │              │    "email": "john@example.com",               │  │
│  │    │              │    "phone": "+91 1234567890",                 │  │
│  │    │              │    "education": [                             │  │
│  │    │              │      {                                        │  │
│  │    │              │        "id": 1,                               │  │
│  │    │              │        "degree": "B.Tech",                    │  │
│  │    │              │        "university": "MIT",                   │  │
│  │    │              │        "cgpa": "9.2",                         │  │
│  │    │              │        "status": "ongoing"                    │  │
│  │    │              │      }                                        │  │
│  │    │              │    ],                                         │  │
│  │    │              │    "training": [                              │  │
│  │    │              │      {                                        │  │
│  │    │              │        "id": 1,                               │  │
│  │    │              │        "course": "Full Stack Dev",            │  │
│  │    │              │        "progress": 80,                        │  │
│  │    │              │        "status": "ongoing"                    │  │
│  │    │              │      }                                        │  │
│  │    │              │    ],                                         │  │
│  │    │              │    "experience": [                            │  │
│  │    │              │      {                                        │  │
│  │    │              │        "id": 1,                               │  │
│  │    │              │        "role": "Intern",                      │  │
│  │    │              │        "organization": "Google",              │  │
│  │    │              │        "duration": "3 months"                 │  │
│  │    │              │      }                                        │  │
│  │    │              │    ],                                         │  │
│  │    │              │    "technicalSkills": [                       │  │
│  │    │              │      {                                        │  │
│  │    │              │        "id": 1,                               │  │
│  │    │              │        "name": "React",                       │  │
│  │    │              │        "level": 4                             │  │
│  │    │              │      }                                        │  │
│  │    │              │    ],                                         │  │
│  │    │              │    "softSkills": [                            │  │
│  │    │              │      {                                        │  │
│  │    │              │        "id": 1,                               │  │
│  │    │              │        "name": "Communication",               │  │
│  │    │              │        "level": 5                             │  │
│  │    │              │      }                                        │  │
│  │    │              │    ]                                          │  │
│  │    │              │  }                                            │  │
│  └────┴──────────────┴───────────────────────────────────────────────┘  │
│                                                                          │
│  ◆ All data stored in ONE JSONB column                                  │
│  ◆ Flexible schema - can add fields without migration                   │
│  ◆ Efficient - single query gets all student data                       │
│  ◆ Atomic updates - all changes in one transaction                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Points:

1. **Both Dashboard and Profile Edit use the SAME hook** ✅
2. **Same service functions for all updates** ✅
3. **Same database table: `students`** ✅
4. **Same column: `profile` (JSONB)** ✅
5. **All student data in ONE place** ✅

## Data Flow Example:

```
User clicks "Edit Education" in Dashboard
    ↓
Modal opens with current education data from studentData.education
    ↓
User adds new degree "M.Tech from Stanford"
    ↓
Clicks Save
    ↓
handleSave('education', newEducationArray) is called
    ↓
updateEducation(newEducationArray) from hook
    ↓
updateEducationByEmail(email, newEducationArray) in service
    ↓
Finds student record by email
    ↓
Gets current profile JSONB
    ↓
Updates profile.education with new array
    ↓
Saves to Supabase: UPDATE students SET profile = {...} WHERE id = X
    ↓
Returns updated data
    ↓
Hook updates studentData state
    ↓
UI re-renders with new data
    ↓
New degree shows in Dashboard AND Profile Edit Section
```

## Same for ALL sections:
- Education → `profile.education`
- Training → `profile.training`
- Experience → `profile.experience`
- Technical Skills → `profile.technicalSkills`
- Soft Skills → `profile.softSkills`
- Personal Info → `profile.name`, `profile.email`, etc.

**Everything connected to the same database! No hardcoded data when logged in!** 🎉
