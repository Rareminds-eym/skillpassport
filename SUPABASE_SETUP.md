# Supabase Integration Guide for Skill Passport

This guide will help you connect your Student Dashboard to Supabase database.

## 📋 Prerequisites

- Supabase account and project setup
- Environment variables configured in `src/.env`:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## 🗄️ Database Setup

### Step 1: Create Database Tables

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `database/schema.sql`
4. Copy the entire SQL content
5. Paste it into the Supabase SQL Editor
6. Click **Run** to create all tables

This will create the following tables:
- `students` - Main student profile
- `education` - Education history
- `training` - Training courses
- `experience` - Work experience
- `technical_skills` - Technical skills
- `soft_skills` - Soft skills & languages
- `opportunities` - Job opportunities
- `recent_updates` - Activity feed
- `suggestions` - Personalized suggestions

### Step 2: Migrate Mock Data (Optional)

To populate your database with initial mock data:

1. Open your browser console in the app
2. Import and run the migration:

```javascript
import { runMigration } from './utils/dataMigration';

// Run migration for the default student
runMigration();

// Or run for a specific student ID
runMigration('your-student-id');
```

Or create a temporary migration component:

```jsx
// src/components/MigrationTool.jsx
import React from 'react';
import { runMigration } from '../utils/dataMigration';

const MigrationTool = () => {
  const handleMigrate = async () => {
    const result = await runMigration();
    if (result.success) {
      alert('Migration successful!');
    } else {
      alert('Migration failed: ' + result.error);
    }
  };

  return (
    <button onClick={handleMigrate}>
      Migrate Mock Data to Supabase
    </button>
  );
};

export default MigrationTool;
```

## 🔌 Using the Integration

### Option 1: Using the Custom Hook (Recommended)

Update your Dashboard component to use the `useStudentData` hook:

```jsx
import React from 'react';
import { useStudentData } from '../hooks/useStudentData';

const Dashboard = () => {
  const studentId = 'SP2024001'; // Get this from auth context
  
  const {
    studentData,
    loading,
    error,
    refresh,
    updateProfile,
    addEducation,
    updateEducation,
    deleteEducation,
    // ... other operations
  } = useStudentData(studentId, true); // true = fallback to mock data

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{studentData?.profile?.name}</h1>
      {/* Your dashboard components */}
    </div>
  );
};
```

### Option 2: Direct Service Calls

Import and use the service functions directly:

```jsx
import {
  getStudentProfile,
  updateStudentProfile,
  getEducation,
  addEducation
} from '../services/studentService';

// Fetch student profile
const { data, error } = await getStudentProfile('SP2024001');

// Update student profile
const result = await updateStudentProfile('SP2024001', {
  employability_score: 90
});

// Add education record
const newEdu = await addEducation({
  student_id: 'SP2024001',
  degree: 'M.Tech',
  university: 'MIT',
  year_of_passing: '2026',
  cgpa: '9.0'
});
```

## 📁 File Structure

```
src/
├── services/
│   └── studentService.js       # Supabase CRUD operations
├── hooks/
│   └── useStudentData.js       # Custom React hook
├── utils/
│   ├── api.js                  # Supabase client
│   └── dataMigration.js        # Migration utilities
└── components/
    └── Students/
        └── data/
            └── mockData.js      # Mock data (fallback)

database/
└── schema.sql                  # Database schema
```

## 🔐 Row Level Security (RLS)

The schema includes RLS policies that:
- Students can only view/edit their own data
- Everyone can view active opportunities
- Admins have full access (configure in Supabase)

To customize RLS policies:
1. Go to Supabase Dashboard → Authentication → Policies
2. Modify the policies for each table as needed

## 🔄 Data Synchronization

### Real-time Updates

To enable real-time updates, add this to your component:

```jsx
import { useEffect } from 'react';
import { supabase } from '../utils/api';

useEffect(() => {
  // Subscribe to changes
  const subscription = supabase
    .channel('student-changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'students',
        filter: `id=eq.${studentId}`
      }, 
      (payload) => {
        console.log('Change received!', payload);
        refresh(); // Refresh data
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [studentId]);
```

## 📊 Data Model Mapping

### Mock Data → Database Fields

| Mock Data | Database Field |
|-----------|---------------|
| `studentData.employabilityScore` | `students.employability_score` |
| `educationData[].yearOfPassing` | `education.year_of_passing` |
| `trainingData[].progress` | `training.progress` |
| `experienceData[].role` | `experience.role` |
| `technicalSkills[].name` | `technical_skills.name` |
| `softSkills[].type` | `soft_skills.type` |

## 🐛 Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the `schema.sql` file in Supabase SQL Editor

### Error: "permission denied"
- Check RLS policies in Supabase Dashboard
- Ensure student is authenticated
- Verify student_id matches authenticated user

### Data not showing
- Check browser console for errors
- Verify environment variables are loaded
- Test with mock data fallback: `useStudentData(studentId, true)`

### Migration fails
- Check if student ID already exists
- Verify all required fields are present
- Check Supabase logs in Dashboard

## 🚀 Next Steps

1. **Authentication Integration**: Connect with Supabase Auth to get the logged-in student's ID
2. **File Upload**: Implement profile photo and certificate uploads using Supabase Storage
3. **Search & Filters**: Add search functionality for opportunities
4. **Analytics**: Track student engagement and progress
5. **Notifications**: Implement push notifications for new opportunities

## 📝 Example Usage in Dashboard

```jsx
import React, { useState } from 'react';
import { useStudentData } from '../hooks/useStudentData';

const StudentDashboard = () => {
  const studentId = 'SP2024001'; // From auth context
  const [activeModal, setActiveModal] = useState(null);
  
  const {
    studentData,
    loading,
    error,
    updateEducation,
    addTechnicalSkill
  } = useStudentData(studentId);

  const handleEducationUpdate = async (educationId, updates) => {
    try {
      await updateEducation(educationId, updates);
      setActiveModal(null);
      // Data will auto-refresh
    } catch (err) {
      console.error('Failed to update education:', err);
    }
  };

  const handleAddSkill = async (skillData) => {
    try {
      await addTechnicalSkill(skillData);
      setActiveModal(null);
    } catch (err) {
      console.error('Failed to add skill:', err);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <ProfileSection profile={studentData?.profile} />
      <EducationSection 
        education={studentData?.education}
        onUpdate={handleEducationUpdate}
      />
      <SkillsSection 
        skills={studentData?.technicalSkills}
        onAdd={handleAddSkill}
      />
    </div>
  );
};

export default StudentDashboard;
```

## 🔗 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase React Guide](https://supabase.com/docs/guides/with-react)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
