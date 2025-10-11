# 🗺️ Integration Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     STUDENT DASHBOARD                        │
│                      (Dashboard.jsx)                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
                              ↓
        ┌─────────────────────────────────────────┐
        │   Connection Status Detection            │
        │   (useEffect + supabase.auth.getUser())  │
        └─────────────────────────────────────────┘
                              ↓
                              ↓
              ┌───────────────┴───────────────┐
              │                               │
         IS USER                         NOT LOGGED IN
        LOGGED IN?                             │
              │                                │
              ↓                                ↓
    ┌──────────────────┐            ┌──────────────────┐
    │  GREEN BANNER    │            │  YELLOW BANNER   │
    │  "Connected ✓"   │            │  "Mock Data"     │
    └──────────────────┘            └──────────────────┘
              │                                │
              ↓                                ↓
    ┌──────────────────┐            ┌──────────────────┐
    │ useStudentData   │            │ useStudentData   │
    │ Adapted Hook     │            │ Adapted Hook     │
    │ (userId passed)  │            │ (null userId)    │
    └──────────────────┘            └──────────────────┘
              │                                │
              ↓                                ↓
    ┌──────────────────┐            ┌──────────────────┐
    │ Load from        │            │ Load from        │
    │ SUPABASE         │            │ MOCK DATA        │
    │ (database)       │            │ (mockData.js)    │
    └──────────────────┘            └──────────────────┘
              │                                │
              ↓                                ↓
    ┌──────────────────┐            ┌──────────────────┐
    │ Display Data     │            │ Display Data     │
    │ + Save to DB     │            │ + Local State    │
    └──────────────────┘            └──────────────────┘
                                               │
                                               ↓
                                    ┌──────────────────┐
                                    │ "Migrate to      │
                                    │  Supabase"       │
                                    │  Button Shows    │
                                    └──────────────────┘
                                               │
                                               ↓
                                    ┌──────────────────┐
                                    │ User clicks      │
                                    │ Migration        │
                                    └──────────────────┘
                                               │
                                               ↓
                                    ┌──────────────────┐
                                    │ migrateCurrentUser│
                                    │ Data() runs      │
                                    └──────────────────┘
                                               │
                                               ↓
                                    ┌──────────────────┐
                                    │ Copy Mock Data   │
                                    │ to Supabase      │
                                    └──────────────────┘
                                               │
                                               ↓
                                    ┌──────────────────┐
                                    │ Auto Refresh     │
                                    │ Dashboard        │
                                    └──────────────────┘
                                               │
                                               ↓
                                    ┌──────────────────┐
                                    │ Now shows        │
                                    │ GREEN BANNER     │
                                    └──────────────────┘
```

---

## Data Flow Diagram

### Scenario 1: User NOT Logged In (Current State)

```
┌────────────┐
│  Browser   │
└─────┬──────┘
      │
      │ Navigate to Dashboard
      ↓
┌────────────────────────────────┐
│     Dashboard.jsx              │
│  ┌──────────────────────────┐  │
│  │ useEffect: Check Auth    │  │
│  │ → supabase.auth.getUser()│  │
│  │ → Returns null           │  │
│  └──────────────────────────┘  │
│           ↓                     │
│  ┌──────────────────────────┐  │
│  │ setCurrentUserId(null)   │  │
│  └──────────────────────────┘  │
└────────────┬───────────────────┘
             │
             ↓
┌────────────────────────────────┐
│ useStudentDataAdapted(null, true)│
│                                 │
│  userId = null                  │
│  fallbackToMock = true          │
└────────────┬───────────────────┘
             │
             ↓
┌────────────────────────────────┐
│  Hook Logic:                   │
│  if (!userId && fallbackToMock)│
│    → Load mockData.js          │
└────────────┬───────────────────┘
             │
             ↓
┌────────────────────────────────┐
│  Returns:                      │
│  {                             │
│    studentData: mockStudentData│
│    loading: false              │
│    error: null                 │
│  }                             │
└────────────┬───────────────────┘
             │
             ↓
┌────────────────────────────────┐
│  Dashboard Renders:            │
│  ┌──────────────────────────┐  │
│  │ 🟡 Yellow Banner         │  │
│  │ "Using Mock Data"        │  │
│  │ [Migrate to Supabase]    │  │
│  └──────────────────────────┘  │
│                                │
│  📚 Education (from mock)      │
│  🎓 Training (from mock)       │
│  💼 Experience (from mock)     │
└────────────────────────────────┘
```

### Scenario 2: User Logged In (After Auth Setup)

```
┌────────────┐
│  Browser   │
└─────┬──────┘
      │
      │ User logged in via Supabase Auth
      ↓
┌────────────────────────────────┐
│     Dashboard.jsx              │
│  ┌──────────────────────────┐  │
│  │ useEffect: Check Auth    │  │
│  │ → supabase.auth.getUser()│  │
│  │ → Returns user object    │  │
│  └──────────────────────────┘  │
│           ↓                     │
│  ┌──────────────────────────┐  │
│  │ setCurrentUserId(user.id)│  │
│  └──────────────────────────┘  │
└────────────┬───────────────────┘
             │
             ↓
┌────────────────────────────────────┐
│ useStudentDataAdapted(userId, true)│
│                                    │
│  userId = "abc-123-def-456"        │
│  fallbackToMock = true             │
└────────────┬───────────────────────┘
             │
             ↓
┌────────────────────────────────┐
│  Hook Logic:                   │
│  if (userId)                   │
│    → Fetch from Supabase       │
└────────────┬───────────────────┘
             │
             ↓
┌────────────────────────────────┐
│  studentService.getStudent     │
│  Profile(userId)               │
│                                │
│  SELECT * FROM students        │
│  WHERE userId = 'abc-123...'   │
└────────────┬───────────────────┘
             │
             ↓
┌────────────────────────────────┐
│  Supabase Returns:             │
│  {                             │
│    id: "xyz-789",              │
│    userId: "abc-123",          │
│    profile: {                  │
│      education: [...],         │
│      training: [...],          │
│      ...                       │
│    }                           │
│  }                             │
└────────────┬───────────────────┘
             │
             ↓
┌────────────────────────────────┐
│  Hook Transforms Data:         │
│  {                             │
│    studentData: {              │
│      profile: {...},           │
│      education: [...],         │
│      training: [...],          │
│    },                          │
│    loading: false,             │
│    error: null                 │
│  }                             │
└────────────┬───────────────────┘
             │
             ↓
┌────────────────────────────────┐
│  Dashboard Renders:            │
│  ┌──────────────────────────┐  │
│  │ 🟢 Green Banner          │  │
│  │ "Connected to Supabase ✓"│  │
│  │ [Refresh]                │  │
│  └──────────────────────────┘  │
│                                │
│  📚 Education (from Supabase)  │
│  🎓 Training (from Supabase)   │
│  💼 Experience (from Supabase) │
└────────────────────────────────┘
```

---

## Edit Flow Diagram

### Scenario 3: User Edits Data (Connected to Supabase)

```
User clicks Edit → Modal Opens
         ↓
User changes data
         ↓
User clicks Save
         ↓
┌─────────────────────────────┐
│ handleSave(section, data)   │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│ 1. Update Local State       │
│    setUserData(newData)     │
│    → UI updates immediately │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│ 2. Check: Is Connected?     │
│    if (currentUserId &&     │
│        studentData?.profile)│
└────────┬────────────────────┘
         │
         ├─── NO → Stop (local only)
         │
         └─── YES → Continue
                   ↓
         ┌─────────────────────────────┐
         │ 3. Loop through data items  │
         │    for each item with id:   │
         └────────┬────────────────────┘
                  │
                  ↓
         ┌─────────────────────────────┐
         │ 4. Call update function     │
         │    switch (section):        │
         │      case 'education':      │
         │        updateEducation()    │
         │      case 'training':       │
         │        updateTraining()     │
         │      ... etc                │
         └────────┬────────────────────┘
                  │
                  ↓
         ┌─────────────────────────────┐
         │ studentService              │
         │ .updateEducation(id, data)  │
         └────────┬────────────────────┘
                  │
                  ↓
         ┌─────────────────────────────┐
         │ RPC to Supabase:            │
         │ update_profile_array_item   │
         │   (userId, 'education',     │
         │    itemId, itemData)        │
         └────────┬────────────────────┘
                  │
                  ↓
         ┌─────────────────────────────┐
         │ Supabase Updates JSONB:     │
         │ UPDATE students             │
         │ SET profile = jsonb_set(    │
         │   profile,                  │
         │   '{education, 0}',         │
         │   new_item_data             │
         │ )                           │
         │ WHERE userId = 'abc-123'    │
         └────────┬────────────────────┘
                  │
                  ↓
         ┌─────────────────────────────┐
         │ 5. Refresh from Database    │
         │    refresh()                │
         └────────┬────────────────────┘
                  │
                  ↓
         ┌─────────────────────────────┐
         │ 6. UI Updates with Fresh    │
         │    Data from Supabase       │
         └─────────────────────────────┘
```

---

## Migration Flow Diagram

### Scenario 4: User Migrates Mock Data to Supabase

```
User sees Yellow Banner
         ↓
Clicks "Migrate to Supabase"
         ↓
┌─────────────────────────────┐
│ setShowMigration(true)      │
│ → Dialog appears            │
└────────┬────────────────────┘
         │
         ↓
User clicks "Start Migration"
         ↓
┌─────────────────────────────┐
│ handleMigrate()             │
│ setMigrating(true)          │
│ → Button shows spinner      │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│ migrateCurrentUserData()    │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│ 1. Get current user         │
│    supabase.auth.getUser()  │
└────────┬────────────────────┘
         │
         ├─── No user → Error
         │
         └─── Has user → Continue
                   ↓
         ┌─────────────────────────────┐
         │ 2. Check if student exists  │
         │    SELECT * FROM students   │
         │    WHERE userId = user.id   │
         └────────┬────────────────────┘
                  │
                  ├─── Exists → Skip to #4
                  │
                  └─── Not exists → #3
                           ↓
         ┌─────────────────────────────┐
         │ 3. Create student record    │
         │    INSERT INTO students     │
         │    (userId, universityId,   │
         │     profile)                │
         └────────┬────────────────────┘
                  │
                  ↓
         ┌─────────────────────────────┐
         │ 4. Build profile JSONB      │
         │    {                        │
         │      name: "...",           │
         │      email: "...",          │
         │      education: [...],      │
         │      training: [...],       │
         │      experience: [...],     │
         │      technicalSkills: [...],│
         │      softSkills: [...]      │
         │    }                        │
         └────────┬────────────────────┘
                  │
                  ↓
         ┌─────────────────────────────┐
         │ 5. Update student profile   │
         │    UPDATE students          │
         │    SET profile = {...}      │
         │    WHERE userId = user.id   │
         └────────┬────────────────────┘
                  │
                  ↓
         ┌─────────────────────────────┐
         │ 6. Return success           │
         │    { success: true }        │
         └────────┬────────────────────┘
                  │
                  ↓
┌─────────────────────────────┐
│ handleMigrate receives      │
│ success result              │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│ Show alert:                 │
│ "✅ Data migrated success!" │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│ refresh()                   │
│ → Reload from Supabase      │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│ setShowMigration(false)     │
│ → Hide dialog               │
└────────┬────────────────────┘
         │
         ↓
┌─────────────────────────────┐
│ Banner changes:             │
│ Yellow → Green              │
│ "Mock Data" → "Connected ✓" │
└─────────────────────────────┘
```

---

## File Architecture

```
src/
│
├── components/Students/
│   ├── components/
│   │   ├── Dashboard.jsx ←────────┐
│   │   │                          │ Imports
│   │   └── ProfileEditModals.jsx  │
│   │                               │
│   └── data/                       │
│       └── mockData.js ←───────────┤ Fallback Data
│                                   │
├── hooks/                          │
│   └── useStudentDataAdapted.js ←─┤ Main Hook
│                                   │
├── services/                       │
│   └── studentServiceAdapted.js ←─┤ API Layer
│                                   │
└── utils/                          │
    ├── api.js ←───────────────────┤ Supabase Client
    └── dataMigrationAdapted.js ←──┘ Migration Logic
```

---

## Component Hierarchy

```
Dashboard
│
├── Connection Status Banner
│   ├── Loading State (Blue)
│   ├── Connected State (Green) + Refresh Button
│   ├── Mock Data State (Yellow) + Migration Button
│   └── Error State (Red)
│
├── Migration Dialog (Conditional)
│   ├── Explanation Text
│   ├── Start Migration Button
│   └── Cancel Button
│
├── Main Grid (3 columns)
│   │
│   ├── LEFT COLUMN
│   │   ├── Recent Updates Card
│   │   └── Suggestions Card
│   │
│   ├── MIDDLE COLUMN
│   │   ├── Education Section + Edit Button
│   │   ├── Training Section + Edit Button
│   │   └── Experience Section + Edit Button
│   │
│   └── RIGHT COLUMN
│       ├── Skills Section + Edit Button
│       ├── Opportunities Card
│       └── Profile Completion Card
│
└── Edit Modals (Conditional)
    ├── EducationEditModal
    ├── TrainingEditModal
    ├── ExperienceEditModal
    └── SkillsEditModal
```

---

## State Management Flow

```
Dashboard Component State:
┌─────────────────────────────────┐
│ activeModal: null | 'education' │
│                  | 'training'   │
│                  | 'experience' │
│                  | 'skills'     │
├─────────────────────────────────┤
│ currentUserId: UUID | null      │
├─────────────────────────────────┤
│ showMigration: boolean          │
├─────────────────────────────────┤
│ migrating: boolean              │
├─────────────────────────────────┤
│ userData: {                     │
│   education: [...],             │
│   training: [...],              │
│   experience: [...],            │
│   technicalSkills: [...],       │
│   softSkills: [...]             │
│ }                               │
└─────────────────────────────────┘

useStudentDataAdapted Hook State:
┌─────────────────────────────────┐
│ studentData: {                  │
│   profile: {...},               │
│   education: [...],             │
│   training: [...],              │
│   ...                           │
│ }                               │
├─────────────────────────────────┤
│ loading: boolean                │
├─────────────────────────────────┤
│ error: string | null            │
└─────────────────────────────────┘
```

---

## API Call Sequence

### Get Student Data:
```
useStudentDataAdapted
    ↓
studentService.getStudentProfile(userId)
    ↓
supabase
  .from('students')
  .select('*')
  .eq('userId', userId)
  .single()
    ↓
Returns: { id, userId, profile: {...} }
```

### Update Education:
```
updateEducation(itemId, newData)
    ↓
studentService.updateEducation(userId, itemId, newData)
    ↓
supabase.rpc('update_profile_array_item', {
  p_user_id: userId,
  p_array_name: 'education',
  p_item_id: itemId,
  p_item_data: newData
})
    ↓
SQL executes:
UPDATE students
SET profile = jsonb_set(profile, ...)
WHERE userId = userId
```

### Migration:
```
migrateCurrentUserData()
    ↓
1. supabase.auth.getUser()
    ↓
2. Check if student exists
    ↓
3. Create if not exists
    ↓
4. Build profile object from mockData
    ↓
5. UPDATE students SET profile = {...}
    ↓
Returns: { success: true }
```

---

## Security Flow

```
User Request
    ↓
Check Supabase Auth Token
    ↓
Row Level Security (RLS)
    ↓
    ├─── Authenticated + Owns Record → Allow
    │
    └─── Not Authenticated OR Not Owner → Deny
```

RLS Policies (Should be set in Supabase):
```sql
-- Allow users to read their own student record
CREATE POLICY "Users can view own student data"
  ON students FOR SELECT
  USING (auth.uid() = userId);

-- Allow users to update their own student record
CREATE POLICY "Users can update own student data"
  ON students FOR UPDATE
  USING (auth.uid() = userId);

-- Allow users to insert their own student record
CREATE POLICY "Users can insert own student data"
  ON students FOR INSERT
  WITH CHECK (auth.uid() = userId);
```

---

This architecture ensures:
- ✅ Seamless fallback to mock data
- ✅ Real-time sync with Supabase when connected
- ✅ Secure data access via RLS
- ✅ Easy migration path from mock to live data
- ✅ Optimistic UI updates
- ✅ Error handling at every level
