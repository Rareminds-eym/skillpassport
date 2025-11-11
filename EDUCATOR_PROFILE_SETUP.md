# Educator Profile Setup Guide

## Overview
This guide explains how to set up the educator profile feature that matches the educator dashboard design and fetches data from your existing Supabase `school_educators` table structure.

## Features Implemented

### 1. Educator Profile Page (`/educator/profile`)
- **Design**: Matches the educator dashboard layout with consistent styling
- **Data Source**: Fetches real data from your existing `school_educators`, `users`, and `schools` tables
- **Functionality**: 
  - View profile information (name, specialization, qualification, experience)
  - Edit profile details
  - Display statistics (total students, verified activities, pending reviews)
  - Responsive design

### 2. Navigation Integration
- **Header Update**: "My Profile" button now navigates to `/educator/profile`
- **Route Added**: New route `/educator/profile` in the routing system
- **Separation**: Profile and Settings are now separate menu items

### 3. Database Schema Integration
Works with your existing `school_educators` table structure:

```sql
school_educators (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  school_id uuid REFERENCES schools(id),
  employee_id varchar(50),
  specialization varchar(100),
  qualification varchar(255),
  experience_years integer,
  date_of_joining date,
  account_status varchar(20) DEFAULT 'active',
  metadata jsonb DEFAULT '{}'
)
```

#### Additional Enhancement File: `database/update_existing_schema_for_educators.sql`
Adds complementary tables and features:
- `student_activities` - Student activities for verification
- `mentor_notes` - Private educator notes about students
- Enhanced RLS policies for proper data access
- Useful views and indexes

## Setup Instructions

### 1. Database Setup
Since you already have the `school_educators` table, you only need to run the enhancement file:

```sql
-- Run the schema enhancements for your existing structure
-- Copy and paste the content from: database/update_existing_schema_for_educators.sql
```

This will:
- Ensure required fields exist in your `users` table
- Create complementary tables (`student_activities`, `mentor_notes`, `schools`)
- Add proper RLS policies
- Create useful views and indexes

### 2. Environment Variables
Ensure your `.env` file has the required Supabase configuration:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Authentication Setup
The profile page expects the educator to be authenticated through Supabase Auth. The educator's `auth.uid()` should match their record in the `educators` table.

## Usage

### Accessing the Profile
1. Navigate to `http://localhost:3000/educator/dashboard`
2. Click on the profile icon in the top-right corner
3. Select "My Profile" from the dropdown menu
4. You'll be redirected to `http://localhost:3000/educator/profile`

### Profile Features
- **View Mode**: Displays all profile information in a clean, dashboard-style layout
- **Edit Mode**: Click "Edit Profile" to modify information
- **Statistics**: Shows real-time data about students and activities
- **Responsive**: Works on desktop, tablet, and mobile devices

### Data Fields
The profile includes:
- **Basic Info**: Name, email, phone (from `users` table)
- **Professional**: Specialization, qualification, experience years, employee ID (from `school_educators` table)
- **School Info**: School name and details (from `schools` table)
- **Bio**: Stored in metadata JSONB field
- **Statistics**: Total students, verified activities, pending reviews
- **Timestamps**: Date of joining, account status

## Technical Details

### Component Structure
```
src/pages/educator/Profile.tsx
├── Profile Information Section
├── Contact Information
├── Professional Information  
├── Bio Section
├── Statistics Cards
└── Edit/Save Functionality
```

### Data Flow
1. **Load**: Fetches educator data from `school_educators` with joins to `users` and `schools` tables
2. **Stats**: Calculates statistics from related tables (`students`, `student_activities`)
3. **Edit**: Updates data in both `school_educators` and `users` tables as appropriate
4. **Real-time**: Reflects changes immediately

### Styling
- Uses Tailwind CSS for consistent styling
- Matches educator dashboard design patterns
- Heroicons for consistent iconography
- Responsive grid layouts

## Troubleshooting

### Common Issues

1. **Profile Not Found**
   - Ensure the educator record exists in the `school_educators` table
   - Check that `auth.uid()` matches the educator's `user_id`
   - Verify the user exists in the `users` table

2. **Permission Errors**
   - Verify RLS policies are correctly set up
   - Check Supabase authentication status

3. **Statistics Not Loading**
   - Ensure related tables (`students`, `student_activities`) exist
   - Check that `students.educator_id` references `school_educators.user_id`
   - Verify foreign key relationships are properly set up

### Database Verification
To verify the setup, run these queries in Supabase:

```sql
-- Check if school_educators table exists and has data
SELECT * FROM school_educators LIMIT 1;

-- Check if educator_id was added to students
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'students' AND column_name = 'educator_id';

-- Verify the educator_profiles view works
SELECT * FROM educator_profiles LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename IN ('school_educators', 'student_activities', 'mentor_notes');
```

## Next Steps

### Potential Enhancements
1. **Avatar Upload**: Add profile picture upload functionality
2. **Bulk Student Assignment**: Interface for assigning multiple students
3. **Activity Dashboard**: Dedicated page for managing student activities
4. **Notification System**: Real-time notifications for new activities
5. **Export Profile**: PDF export of educator profile

### Integration Points
- **Student Management**: Link to student assignment interface
- **Activity Verification**: Connect to activity review workflow
- **Analytics**: Integrate with educator analytics dashboard
- **Communication**: Link to student communication tools

## Files Modified/Created

### New Files
- `src/pages/educator/Profile.tsx` - Main profile component (updated for existing schema)
- `database/update_existing_schema_for_educators.sql` - Schema enhancements for existing structure
- `database/educators_table.sql` - Original custom schema (not needed with existing structure)
- `database/add_educator_reference_to_students.sql` - Original updates (not needed with existing structure)
- `EDUCATOR_PROFILE_SETUP.md` - This setup guide

### Modified Files
- `src/routes/AppRoutes.jsx` - Added profile route and import
- `src/components/educator/Header.tsx` - Updated navigation logic

The educator profile feature is now ready to use and provides a solid foundation for educator account management within the application.