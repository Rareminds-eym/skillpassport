# Clubs & Activities - LocalStorage Integration

## Overview
Successfully integrated localStorage to sync club and competition data across Educator, School Admin, and Student dashboards with real-time updates using actual student data from Supabase.

## How It Works

### Data Storage
- **Clubs**: Stored in `localStorage` under key `skillpassport_clubs`
- **Competitions**: Stored in `localStorage` under key `skillpassport_competitions`
- **Student IDs**: Uses student email addresses as unique identifiers

### Educator Side (`src/pages/educator/SkillCurricular.tsx`)
- Loads clubs and competitions from localStorage on page load
- Fetches real students from Supabase `students` table
- Automatically saves to localStorage whenever clubs or competitions are updated
- When educators enroll/remove students from clubs, changes are immediately saved
- When educators create new clubs or competitions, they're persisted to localStorage
- **Search functionality**: Find students quickly by name, email, or grade

### School Admin Side (`src/pages/admin/schoolAdmin/SkillCurricular.tsx`)
- Same functionality as educator side
- Loads clubs and competitions from localStorage on page load
- Fetches real students from Supabase `students` table
- Full club and student management capabilities
- **Search functionality**: Find students quickly by name, email, or grade
- Shares the same data with educators and students

### Student Side (`src/pages/student/Clubs.jsx`)
- Loads clubs and competitions from localStorage on page load
- Uses logged-in student's email from `localStorage.getItem("userEmail")`
- Listens for storage changes from other tabs/windows
- Polls for updates every 2 seconds to catch same-tab changes
- Automatically refreshes the dashboard when educators/admins make changes
- Shows only clubs where the student's email is in the `members` array

## Key Features

### Real-time Sync
- Students see club enrollments immediately after educators/admins add them
- Works across browser tabs and windows
- Automatic refresh every 2 seconds ensures data stays current
- All three roles (Educator, School Admin, Student) share the same data

### Data Persistence
- All club and competition data persists across page refreshes
- New clubs created by educators/admins are immediately available to students
- Student enrollments are maintained across sessions
- Data syncs across all user roles automatically

### Student Search (Educator & School Admin)
- **Search bar** with icon and clear button
- **Real-time filtering** by name, email, or grade
- **Smart empty states** with helpful messages
- **Auto-clear** when modal closes
- Makes it easy to find and enroll students in large schools

### Real Student Data
- Fetches actual students from Supabase database
- Uses student email as unique identifier
- Displays student name, grade, and email
- Fallback to sample data if database fetch fails

## Testing

### Basic Flow
1. **Login as Student**: Login with a student account (email will be stored in localStorage as `userEmail`)
2. **Open Educator/Admin Dashboard**: Navigate to Skills & Co-Curricular page
3. **Enroll the Student**: 
   - Click "View" on any club
   - Use the search bar to find the student by name, email, or grade
   - Click "Add" to enroll the student
4. **Check Student View**: Switch to student tab - the club should appear in "My Clubs" within 2 seconds

### Testing Search Functionality
1. **Open student management drawer** (click "View" on any club)
2. **Type in search bar**:
   - Search by name: "Alice"
   - Search by email: "@example.com"
   - Search by grade: "10A"
3. **See filtered results** instantly
4. **Click X button** or close modal to clear search

### Testing Cross-Role Sync
1. **Open three browser tabs**:
   - Tab 1: Educator dashboard
   - Tab 2: School Admin dashboard
   - Tab 3: Student dashboard
2. **Create a club** in educator tab
3. **See it appear** in admin tab within 2 seconds
4. **Enroll student** in admin tab
5. **See it appear** in student tab within 2 seconds

## How Student Identification Works

### Student Side
- Uses `localStorage.getItem("userEmail")` to get the logged-in student's email
- The email is used as the student ID for club membership
- Automatically shows clubs where the student's email is in the `members` array

### Educator Side
- Fetches real students from Supabase `students` table
- Uses student email as the unique identifier
- Displays student name, grade, and email in the management interface
- When enrolling a student, their email is added to the club's `members` array

### Data Structure
```javascript
// Club structure in localStorage
{
  club_id: "c1",
  name: "Robotics Club",
  members: ["student1@example.com", "student2@example.com"], // Student emails
  capacity: 30,
  // ... other fields
}
```

## Implementation Details

### Files Modified
1. **`src/pages/educator/SkillCurricular.tsx`**
   - Added localStorage integration
   - Added Supabase student fetching
   - Added search functionality in student drawer
   - Uses student email as unique identifier

2. **`src/pages/admin/schoolAdmin/SkillCurricular.tsx`**
   - Same features as educator page
   - Full feature parity for consistent experience
   - Shares data with educator and student pages

3. **`src/pages/student/Clubs.jsx`**
   - Reads from localStorage
   - Uses logged-in student's email
   - Auto-refreshes every 2 seconds
   - Shows only enrolled clubs

### Code Highlights

**Loading from localStorage:**
```javascript
const loadClubsFromStorage = () => {
    const stored = localStorage.getItem("skillpassport_clubs");
    if (stored) {
        return JSON.parse(stored);
    }
    return defaultClubs;
};
```

**Saving to localStorage:**
```javascript
useEffect(() => {
    localStorage.setItem("skillpassport_clubs", JSON.stringify(clubs));
}, [clubs]);
```

**Fetching Students:**
```javascript
const { data, error } = await supabase
    .from('students')
    .select('id, email, profile')
    .order('email');
```

**Search Filtering:**
```javascript
const filteredStudents = allStudents.filter((student) => {
    const query = studentSearchQuery.toLowerCase();
    return (
        student.name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        student.grade.toLowerCase().includes(query)
    );
});
```

## Future Enhancements
- Replace localStorage with Supabase database for production
- Add real-time subscriptions using Supabase Realtime
- Add notifications when students are enrolled in new clubs
- Add bulk student enrollment
- Add club attendance tracking
- Add competition results management
- Export student participation reports


## Quick Reference

### For Educators/School Admins

**Creating a Club:**
1. Click "Add Club" button
2. Fill in club details (name, category, description, capacity)
3. Click "Create Club"
4. Club is immediately available to all users

**Enrolling Students:**
1. Click "View" on any club card
2. Search for student by name, email, or grade
3. Click "Add" button next to student name
4. Student is immediately enrolled

**Removing Students:**
1. Click "View" on any club card
2. Find enrolled student (they have "Remove" button)
3. Click "Remove" button
4. Student is immediately removed

**Creating Competitions:**
1. Click "Add Competition" button
2. Fill in competition details
3. Select participating clubs
4. Click "Create Competition"

### For Students

**Viewing Your Clubs:**
1. Navigate to Clubs page
2. See all clubs you're enrolled in
3. View club details, meeting times, and activities
4. See upcoming events and achievements

**Dashboard Updates:**
- Clubs appear within 2 seconds of enrollment
- No refresh needed - automatic updates
- See club details, mentor, schedule, and activities

### Troubleshooting

**Students not appearing in search:**
- Ensure students are registered in the system
- Check Supabase connection
- Verify student has email in profile

**Clubs not syncing:**
- Check localStorage is enabled in browser
- Try refreshing the page
- Check browser console for errors

**Search not working:**
- Clear search and try again
- Check student data has name, email, and grade fields
- Verify search query is correct

### localStorage Keys

- `skillpassport_clubs` - All club data
- `skillpassport_competitions` - All competition data
- `userEmail` - Logged-in user's email (for students)

### Data Structure

**Club Object:**
```javascript
{
    club_id: "c1234567890",
    name: "Robotics Club",
    category: "robotics",
    description: "Build and program robots",
    capacity: 30,
    members: ["student1@example.com", "student2@example.com"],
    meetingDay: "Monday & Thursday",
    meetingTime: "4:00 PM - 6:00 PM",
    location: "Lab 101",
    mentor: "Dr. Sarah Johnson",
    avgAttendance: 85,
    upcomingActivities: [
        { title: "Workshop", date: "2025-12-01" }
    ]
}
```

**Student Object:**
```javascript
{
    id: "student@example.com",
    email: "student@example.com",
    name: "Alice Johnson",
    grade: "10A"
}
```
