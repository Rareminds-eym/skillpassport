# Opportunities Integration Setup Guide

## Step 1: Set up the Opportunities Table in Supabase

1. **Go to your Supabase Dashboard**
   - Open your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Opportunities Table Setup**
   - Copy the content from `database/opportunities_table_setup.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

   This will:
   - Create the opportunities table with the correct schema
   - Add indexes for better performance
   - Set up Row Level Security policies
   - Insert sample data including your TCS example

## Step 2: Verify the Environment Variables

Make sure your `.env` file in the root directory contains:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 3: Test the Integration

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the Student Dashboard:**
   - Go to `/student/dashboard`
   - Check the Opportunities section
   - You should see the opportunities loaded from Supabase instead of mock data

## Step 4: Verify Data Flow

The integration works as follows:

1. **useOpportunities Hook** (`src/hooks/useOpportunities.js`)
   - Fetches data from Supabase opportunities table
   - Handles loading states and errors
   - Provides filtering and matching capabilities

2. **OpportunitiesService** (`src/services/opportunitiesService.js`)
   - Contains all database interaction logic
   - Formats data for display
   - Handles skill matching

3. **Dashboard Component** (`src/pages/student/Dashboard.jsx`)
   - Uses the hook to get opportunities data
   - Displays opportunities with proper formatting
   - Shows loading states and error handling

## Database Schema

The opportunities table includes:

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| title | TEXT | Job/internship title |
| company_name | TEXT | Company name |
| company_logo | TEXT | URL to company logo |
| employment_type | TEXT | internship, full-time, part-time, contract |
| location | TEXT | Job location |
| mode | TEXT | onsite, remote, hybrid |
| stipend_or_salary | TEXT | Salary/stipend information |
| experience_required | TEXT | Required experience level |
| skills_required | JSONB | Array of required skills |
| description | TEXT | Job description |
| application_link | TEXT | URL to apply |
| deadline | TIMESTAMP | Application deadline |
| is_active | BOOLEAN | Whether the opportunity is active |

## Features Implemented

✅ **Real-time Data Loading**: Opportunities are fetched from Supabase
✅ **Loading States**: Shows spinner while loading data
✅ **Error Handling**: Displays error messages and retry button
✅ **Skill Matching**: Can match opportunities based on student skills
✅ **Rich Display**: Shows all opportunity details including:
   - Company name and logo
   - Employment type and work mode
   - Location and salary
   - Required skills (with highlighting)
   - Application deadline
   - Direct application links

✅ **Responsive Design**: Maintains the original dashboard styling
✅ **View All/Show Less**: Expandable list for many opportunities

## Troubleshooting

### If opportunities don't load:

1. **Check Console**: Look for error messages in browser console
2. **Verify Supabase Connection**: Check if VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
3. **Check RLS Policies**: Make sure Row Level Security allows reading
4. **Verify Table Exists**: Run `SELECT * FROM opportunities;` in Supabase SQL Editor

### If you see "No opportunities available":

1. Make sure you ran the setup SQL script
2. Check if sample data was inserted: `SELECT COUNT(*) FROM opportunities;`
3. Verify the opportunities are active: `SELECT * FROM opportunities WHERE is_active = true;`

## Adding More Opportunities

You can add more opportunities directly in Supabase or create an admin interface. Example:

```sql
INSERT INTO opportunities 
(title, company_name, employment_type, location, mode, stipend_or_salary, skills_required, description, application_link, deadline)
VALUES 
(
  'React Developer',
  'Your Company',
  'full-time',
  'Mumbai, India',
  'hybrid',
  '₹8 LPA',
  '["React", "Node.js", "MongoDB"]',
  'Build amazing web applications',
  'https://yourcompany.com/apply',
  '2025-12-31 23:59:00+05:30'
);
```

The dashboard will automatically pick up new opportunities!