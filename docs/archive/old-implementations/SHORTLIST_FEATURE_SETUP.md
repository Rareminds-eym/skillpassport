# Shortlist Feature - Setup Guide

This guide explains how to set up and use the shortlist feature that connects the Talent Pool with the Shortlists page and Supabase database.

## 📋 Overview

The shortlist feature allows recruiters to:
- Browse candidates in the Talent Pool
- Add candidates to shortlists with a single click
- Manage multiple shortlists
- Share shortlists with expiring links
- Export shortlists to CSV/PDF
- Track export activities

## 🏗️ Architecture

### Database Schema

The feature uses three main tables in Supabase:

1. **`shortlists`** - Stores shortlist metadata
2. **`shortlist_candidates`** - Junction table for many-to-many relationship between shortlists and students
3. **`export_activities`** - Audit log for tracking exports

### Key Files Created/Modified

```
database/
  └── shortlists_schema.sql          # SQL schema for shortlist tables

src/
  ├── services/
  │   └── shortlistService.ts        # Service functions for shortlist operations
  └── pages/
      └── recruiter/
          ├── TalentPool.tsx         # Modified: Added shortlist modal
          └── Shortlists.tsx         # Modified: Uses real data from Supabase
```

## 🚀 Setup Instructions

### Step 1: Run the SQL Schema

1. Open your **Supabase Project Dashboard**
2. Navigate to **SQL Editor**
3. Open the file `database/shortlists_schema.sql`
4. Copy the entire SQL content
5. Paste it into the Supabase SQL Editor
6. Click **Run** to create all tables, indexes, and policies

This will create:
- ✅ `shortlists` table
- ✅ `shortlist_candidates` junction table
- ✅ `export_activities` table
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for automatic timestamp updates
- ✅ A view `shortlists_with_counts` for efficient querying

### Step 2: Verify Environment Variables

Ensure your `.env` file has the Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Install Dependencies (if needed)

The feature uses existing dependencies. Ensure you have:

```bash
npm install @supabase/supabase-js
```

### Step 4: Test the Feature

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the Talent Pool page** (recruiter dashboard)

3. **Create a shortlist:**
   - Go to the Shortlists page
   - Click "Create Shortlist"
   - Fill in the name, description, and tags
   - Click "Create"

4. **Add candidates to the shortlist:**
   - Go to the Talent Pool page
   - Click the "Shortlist" button on any candidate card (or in table view)
   - Select the shortlist from the dropdown
   - Click "Add to Shortlist"

5. **View your shortlist:**
   - Go back to the Shortlists page
   - You should see the candidate count updated
   - Click "View" to see candidates (currently shows an alert, can be expanded to a detail view)

## 🔧 Features Implemented

### 1. Add to Shortlist Modal (TalentPool.tsx)

- ✅ Modal appears when clicking "Shortlist" button
- ✅ Fetches all available shortlists
- ✅ Displays candidate counts for each shortlist
- ✅ Handles duplicate prevention (shows error if already in shortlist)
- ✅ Shows loading states
- ✅ Success notification after adding

### 2. Shortlist Service (shortlistService.ts)

All CRUD operations for shortlists:

```typescript
// Shortlist operations
getShortlists()                              // Get all shortlists with counts
getShortlistById(shortlistId)                // Get single shortlist
createShortlist(shortlistData)               // Create new shortlist
updateShortlist(shortlistId, updates)        // Update shortlist
deleteShortlist(shortlistId)                 // Delete shortlist

// Candidate operations
getShortlistCandidates(shortlistId)          // Get all candidates in shortlist
addCandidateToShortlist(shortlistId, studentId, addedBy, notes)
removeCandidateFromShortlist(shortlistId, studentId)
isStudentInShortlist(shortlistId, studentId) // Check if student is in shortlist
getShortlistsForStudent(studentId)           // Get all shortlists for a student
updateCandidateNotes(shortlistId, studentId, notes)

// Export operations
logExportActivity(exportData)                // Log export activity
getExportHistory(shortlistId)                // Get export history
```

### 3. Shortlists Page Updates (Shortlists.tsx)

- ✅ Fetches shortlists from Supabase instead of mock data
- ✅ Uses junction table for candidate relationships
- ✅ Displays accurate candidate counts
- ✅ Export functionality fetches real candidate data
- ✅ Share functionality updates database
- ✅ Delete functionality removes shortlist and all relationships

## 📊 Database Structure

### Shortlists Table

```sql
CREATE TABLE shortlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT,
  created_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  shared BOOLEAN DEFAULT false,
  share_link TEXT,
  share_expiry TIMESTAMP WITH TIME ZONE,
  watermark BOOLEAN DEFAULT false,
  include_pii BOOLEAN DEFAULT false,
  notify_on_access BOOLEAN DEFAULT false,
  tags TEXT[],
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Shortlist Candidates Table (Junction)

```sql
CREATE TABLE shortlist_candidates (
  id SERIAL PRIMARY KEY,
  shortlist_id TEXT REFERENCES shortlists(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE,
  added_by TEXT,
  notes TEXT,
  UNIQUE(shortlist_id, student_id)
);
```

### Export Activities Table

```sql
CREATE TABLE export_activities (
  id SERIAL PRIMARY KEY,
  shortlist_id TEXT REFERENCES shortlists(id) ON DELETE CASCADE,
  export_format TEXT NOT NULL,
  export_type TEXT NOT NULL,
  exported_at TIMESTAMP WITH TIME ZONE,
  exported_by TEXT,
  include_pii BOOLEAN DEFAULT false
);
```

## 🔐 Security (RLS Policies)

Row Level Security is enabled on all tables. The current policies allow authenticated users to perform all operations. You can customize these based on your authentication setup:

```sql
-- Example: Restrict to owner only
CREATE POLICY "Users can view their own shortlists" 
  ON shortlists FOR SELECT 
  USING (auth.uid()::text = created_by);
```

## 🎯 Usage Examples

### Adding a Candidate to a Shortlist

```typescript
import { addCandidateToShortlist } from '../../services/shortlistService';

const handleAddToShortlist = async (shortlistId, studentId) => {
  const { data, error } = await addCandidateToShortlist(
    shortlistId,
    studentId,
    'recruiter_123', // optional: who added them
    'Top performer'   // optional: notes
  );
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Candidate added successfully!');
  }
};
```

### Fetching Candidates in a Shortlist

```typescript
import { getShortlistCandidates } from '../../services/shortlistService';

const loadCandidates = async (shortlistId) => {
  const { data: candidates, error } = await getShortlistCandidates(shortlistId);
  
  if (!error) {
    console.log('Candidates:', candidates);
    // candidates will have full student details
  }
};
```

### Creating a New Shortlist

```typescript
import { createShortlist } from '../../services/shortlistService';

const createNewShortlist = async () => {
  const { data, error } = await createShortlist({
    id: `sl_${Date.now()}`,
    name: 'Q4 2024 Backend Engineers',
    description: 'Shortlist for backend engineering roles',
    tags: ['backend', 'engineering', 'q4-2024']
  });
  
  if (!error) {
    console.log('Shortlist created:', data);
  }
};
```

## 📈 Future Enhancements

Potential improvements to consider:

1. **Detailed Shortlist View**
   - Create a dedicated page to view all candidates in a shortlist
   - Add ability to remove candidates from shortlist
   - Add notes/comments per candidate

2. **Bulk Operations**
   - Add multiple candidates at once
   - Move candidates between shortlists
   - Duplicate shortlists

3. **Advanced Sharing**
   - Password-protected links
   - View tracking
   - Email notifications

4. **Better Export**
   - Rich PDF generation with branding
   - Excel format support
   - Custom field selection

5. **Analytics**
   - Track most shortlisted candidates
   - Shortlist conversion rates
   - Export analytics dashboard

## 🐛 Troubleshooting

### Error: "relation does not exist"
- Make sure you ran the `shortlists_schema.sql` file in Supabase SQL Editor
- Verify the tables were created in the correct schema (public)

### Error: "permission denied"
- Check RLS policies in Supabase Dashboard
- Ensure user is authenticated
- Verify the policies match your auth setup

### Candidates not showing
- Verify students exist in the `students` table
- Check that the junction table has the correct foreign keys
- Look for errors in browser console

### Duplicate entry error
- This is expected behavior - a student can only be in a shortlist once
- The UI should show an appropriate error message

## 📝 Testing Checklist

- [ ] Create a new shortlist
- [ ] Add candidates to shortlist from Talent Pool
- [ ] View shortlist with candidate count
- [ ] Try to add same candidate twice (should show error)
- [ ] Export shortlist to CSV
- [ ] Export shortlist to PDF
- [ ] Share shortlist with expiry date
- [ ] Delete shortlist (should remove all candidates)
- [ ] View shortlist candidates (click View button)

## 🔗 Related Documentation

- [Supabase Setup Guide](./SUPABASE_SETUP.md)
- [Main Database Schema](./database/schema.sql)
- [Shortlist Schema](./database/shortlists_schema.sql)

## 💡 Tips

1. **Performance**: The service functions use proper indexes for fast queries
2. **Data Integrity**: CASCADE delete ensures no orphaned records
3. **Flexibility**: The notes field allows custom metadata per candidate
4. **Scalability**: Junction table approach scales well with large datasets

---

**Need Help?** Check the browser console for detailed error messages, or review the Supabase dashboard logs.
