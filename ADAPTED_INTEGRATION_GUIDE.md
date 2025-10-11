# 🔄 ADAPTED INTEGRATION GUIDE

## Using Existing Supabase Students Table

Your Supabase already has a `students` table with the following structure:

```sql
students (
  id UUID PRIMARY KEY,
  userId UUID UNIQUE (FK → auth.users),
  universityId TEXT,
  profile JSONB,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)
```

This guide shows you how to use the **adapted integration** that works with this existing structure.

---

## 🎯 Key Difference

### Original Approach (Multiple Tables)
```
students table
├─ education table
├─ training table
├─ experience table
└─ skills table (etc.)
```

### Adapted Approach (JSONB in Single Table)
```
students table
└─ profile JSONB column
   ├─ education: []
   ├─ training: []
   ├─ experience: []
   └─ skills: [] (etc.)
```

---

## 📦 Adapted Files to Use

Use these **adapted** files instead of the original ones:

| Original File | Adapted File | Purpose |
|--------------|--------------|---------|
| `database/schema.sql` | `database/schema_adapted.sql` | SQL functions for JSONB |
| `src/services/studentService.js` | `src/services/studentServiceAdapted.js` | API calls |
| `src/hooks/useStudentData.js` | `src/hooks/useStudentDataAdapted.js` | React hook |
| `src/utils/dataMigration.js` | `src/utils/dataMigrationAdapted.js` | Migration |

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Adapted SQL (2 min)

1. Open Supabase SQL Editor
2. Copy content from `database/schema_adapted.sql`
3. Run the SQL

This creates:
- Helper functions for JSONB operations
- Indexes for better performance
- Row Level Security policies
- Updated trigger function

### Step 2: Update Your Code (1 min)

```jsx
// Use adapted imports
import { useStudentDataAdapted } from '../hooks/useStudentDataAdapted';

const Dashboard = () => {
  // Use userId from auth.users (UUID)
  const { userId } = useAuth(); // Get from your auth context
  
  const { studentData, loading } = useStudentDataAdapted(userId);

  // Rest of your code...
};
```

### Step 3: Migrate Data (1 min)

```jsx
import { migrateCurrentUserData } from '../utils/dataMigrationAdapted';

// Migrate for currently logged-in user
await migrateCurrentUserData('university-id-optional');
```

---

## 💻 Usage Examples

### 1. Basic Usage

```jsx
import { useStudentDataAdapted } from '../hooks/useStudentDataAdapted';

const StudentDashboard = () => {
  const { user } = useAuth(); // Your auth context
  
  const {
    studentData,
    loading,
    error,
    updateEducation,
    addTechnicalSkill
  } = useStudentDataAdapted(user?.id);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{studentData?.profile?.name}</h1>
      <p>Score: {studentData?.profile?.employabilityScore}</p>
      
      {/* Education list */}
      {studentData?.education.map(edu => (
        <div key={edu.id}>{edu.degree}</div>
      ))}
    </div>
  );
};
```

### 2. Update Profile

```jsx
import { updateStudentProfile } from '../services/studentServiceAdapted';

// Update basic info
await updateStudentProfile(userId, {
  employabilityScore: 95,
  cgpa: '9.5',
  photo: 'new-photo-url.jpg'
});
```

### 3. Add Education

```jsx
import { addEducation } from '../services/studentServiceAdapted';

await addEducation(userId, {
  degree: 'M.Tech Computer Science',
  university: 'MIT',
  yearOfPassing: '2026',
  cgpa: '9.0',
  level: "Master's",
  status: 'ongoing'
});
```

### 4. Update Array Item

```jsx
// Update education with id = 1
await updateEducation(userId, 1, {
  cgpa: '9.5',
  status: 'completed'
});
```

### 5. Delete Item

```jsx
// Delete education with id = 1
await deleteEducation(userId, 1);
```

---

## 🔧 Profile JSONB Structure

Your profile JSONB column stores data like this:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "department": "Computer Science",
  "employabilityScore": 85,
  "cgpa": "8.9",
  "yearOfPassing": "2025",
  
  "education": [
    {
      "id": 1,
      "degree": "B.Tech CS",
      "university": "MIT",
      "cgpa": "8.9",
      "status": "ongoing"
    }
  ],
  
  "training": [
    {
      "id": 1,
      "course": "Full Stack Dev",
      "progress": 80,
      "status": "ongoing"
    }
  ],
  
  "technicalSkills": [
    {
      "id": 1,
      "name": "React",
      "level": 4,
      "verified": true
    }
  ]
}
```

---

## 📊 API Functions

### Profile Operations
```javascript
// Get complete profile
getStudentProfile(userId)

// Update profile fields
updateStudentProfile(userId, { name: 'New Name', cgpa: '9.0' })

// Create new profile
createStudentProfile(userId, { name, email, department, ... })
```

### Education Operations
```javascript
getEducation(userId)
addEducation(userId, educationData)
updateEducation(userId, educationId, updates)
deleteEducation(userId, educationId)
```

### Similar for:
- Training: `getTraining()`, `addTraining()`, etc.
- Experience: `getExperience()`, `addExperience()`, etc.
- Technical Skills: `getTechnicalSkills()`, `addTechnicalSkill()`, etc.
- Soft Skills: `getSoftSkills()`, `addSoftSkill()`, etc.

### Complete Data
```javascript
// Get everything at once
getCompleteStudentData(userId)
```

---

## 🔄 Migration Tool

### Option 1: Use Auth User

```jsx
import { migrateCurrentUserData } from '../utils/dataMigrationAdapted';

const MigrateButton = () => {
  const handleMigrate = async () => {
    const result = await migrateCurrentUserData('university-123');
    if (result.success) {
      alert('Migration successful!');
    }
  };

  return <button onClick={handleMigrate}>Migrate My Data</button>;
};
```

### Option 2: Specific User

```jsx
import { runMigrationAdapted } from '../utils/dataMigrationAdapted';

await runMigrationAdapted(
  'user-uuid-here',
  'university-id-optional'
);
```

---

## 🎨 Component Example

```jsx
import React from 'react';
import { useStudentDataAdapted } from '../hooks/useStudentDataAdapted';
import { useAuth } from '../context/AuthContext';

const StudentProfile = () => {
  const { user } = useAuth();
  
  const {
    studentData,
    loading,
    error,
    updateProfile,
    addEducation,
    updateEducation,
    deleteEducation
  } = useStudentDataAdapted(user?.id);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const handleAddEducation = async () => {
    await addEducation({
      degree: 'New Degree',
      university: 'University Name',
      yearOfPassing: '2025',
      cgpa: '9.0',
      level: "Bachelor's",
      status: 'ongoing'
    });
  };

  const handleUpdateScore = async () => {
    await updateProfile({
      employabilityScore: 90
    });
  };

  return (
    <div>
      <h1>{studentData?.profile?.name}</h1>
      <p>Score: {studentData?.profile?.employabilityScore}%</p>
      <button onClick={handleUpdateScore}>Update Score</button>
      
      <h2>Education</h2>
      {studentData?.education?.map(edu => (
        <div key={edu.id}>
          <span>{edu.degree} - {edu.university}</span>
          <button onClick={() => deleteEducation(edu.id)}>Delete</button>
        </div>
      ))}
      
      <button onClick={handleAddEducation}>Add Education</button>
    </div>
  );
};

export default StudentProfile;
```

---

## 🔐 Authentication Integration

### With Supabase Auth

```jsx
import { useEffect, useState } from 'react';
import { supabase } from '../utils/api';
import { useStudentDataAdapted } from '../hooks/useStudentDataAdapted';

const Dashboard = () => {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const { studentData, loading } = useStudentDataAdapted(userId);

  // Your component code...
};
```

---

## 🗄️ Database Queries

### Direct JSONB Queries (if needed)

```sql
-- Get student by userId
SELECT * FROM students WHERE "userId" = 'user-uuid';

-- Update name in profile
UPDATE students 
SET profile = jsonb_set(profile, '{name}', '"New Name"')
WHERE "userId" = 'user-uuid';

-- Add education (using helper function)
SELECT add_to_profile_array(
  (SELECT id FROM students WHERE "userId" = 'user-uuid'),
  'education',
  '{"degree": "M.Tech", "university": "MIT"}'::jsonb
);

-- Update array item (using helper function)
SELECT update_profile_array_item(
  (SELECT id FROM students WHERE "userId" = 'user-uuid'),
  'education',
  1,  -- item id
  '{"cgpa": "9.5"}'::jsonb
);

-- Delete array item (using helper function)
SELECT delete_from_profile_array(
  (SELECT id FROM students WHERE "userId" = 'user-uuid'),
  'education',
  1  -- item id
);
```

---

## ✅ Advantages of JSONB Approach

1. **No Schema Changes** - Works with existing table
2. **Flexible** - Easy to add new fields
3. **Atomic Updates** - All data in one record
4. **Team Collaboration** - Others can work on different tables
5. **Simpler Queries** - One table to query
6. **Version Control** - Full profile history in one place

---

## 🐛 Troubleshooting

### Issue: "profile is undefined"
**Solution:** Initialize profile when creating student
```javascript
await createStudentProfile(userId, {
  name: 'John Doe',
  email: 'john@example.com',
  // ... other fields
});
```

### Issue: "Cannot read property of null"
**Solution:** Check if studentData exists before accessing
```jsx
{studentData?.profile?.name || 'No name'}
{studentData?.education?.map(...) || []}
```

### Issue: "Changes not reflecting"
**Solution:** Call `refresh()` after updates
```jsx
const { refresh } = useStudentDataAdapted(userId);
await updateEducation(userId, id, data);
refresh(); // Reload data
```

---

## 📖 File Reference

**SQL Functions:** `database/schema_adapted.sql`
**Service Layer:** `src/services/studentServiceAdapted.js`
**React Hook:** `src/hooks/useStudentDataAdapted.js`
**Migration:** `src/utils/dataMigrationAdapted.js`
**This Guide:** `ADAPTED_INTEGRATION_GUIDE.md`

---

## 🎉 Summary

You can now:
- ✅ Use existing `students` table
- ✅ Store all data in JSONB `profile` column
- ✅ Perform CRUD operations easily
- ✅ Work alongside team members on other tables
- ✅ Migrate mock data to database
- ✅ Integrate with authentication

**Start with:** Import `useStudentDataAdapted` and use `userId` from auth! 🚀
